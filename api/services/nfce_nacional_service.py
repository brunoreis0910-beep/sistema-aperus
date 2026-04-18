import logging
import json
import requests
import tempfile
import os
import base64
import uuid
import gzip
import io
from lxml import etree
from datetime import datetime
from decimal import Decimal
from django.conf import settings
from api.models import EmpresaConfig, OrdemServico, OsItensServico
from api.services.signer_service import SignerService
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption

logger = logging.getLogger(__name__)

class NFSeNacionalService:
    # URLs Base - ADN Recepção (e não Contribuintes)
    URL_PRODUCAO = "https://adn.nfse.gov.br" 
    URL_HOMOLOGACAO = "https://adn.producaorestrita.nfse.gov.br"
    
    def __init__(self):
        # Carregar configurações da empresa (EmpresaConfig e não UserParametros)
        self.config = EmpresaConfig.get_ativa()
        if not self.config:
            raise Exception("Configurações da empresa (EmpresaConfig) não encontradas.")
            
        # Prioriza ambiente_nfse, fallback para ambiente_nfce se não existir (compatibilidade)
        self.ambiente = getattr(self.config, 'ambiente_nfse', None) or self.config.ambiente_nfce 
        
        self.base_url_prod = "https://adn.nfse.gov.br"
        self.base_url_homolog = "https://adn.producaorestrita.nfse.gov.br"
        
        self.base_url = self.base_url_prod if self.ambiente == '1' else self.base_url_homolog
        
        # Carregar certificado para Sessão SSL mútua
        self.cert_file = None
        self.key_file = None
        self._load_certificates()

    def _load_certificates(self):
        """
        Extrai certificado e chave do PFX armazenado no banco para arquivos temporários
        para serem usados pela biblioteca requests.
        """
        if not self.config.certificado_digital:
            raise Exception("Certificado digital não configurado.")
            
        password = self.config.senha_certificado or ""
        
        # Usar SignerService para carregar o PFX (ele já trata base64 vs arquivo)
        signer = SignerService(self.config.certificado_digital, password)
        
        if not signer.private_key or not signer.certificate:
             # Se o SignerService não carregou (pois ele foca em XMLSigner), carregamos manualmente via crypto
             from cryptography.hazmat.primitives.serialization import pkcs12
             pfx_data = signer.pfx_data
             
             private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
                pfx_data, 
                password.encode('utf-8') if password else None
             )
             signer.private_key = private_key
             signer.certificate = certificate

        # Salvar em arquivos temporários
        # Certificado
        self.cert_fd, self.cert_path = tempfile.mkstemp(suffix='.pem')
        with os.fdopen(self.cert_fd, 'wb') as f:
            f.write(signer.certificate.public_bytes(Encoding.PEM))
            
        # Chave Privada
        self.key_fd, self.key_path = tempfile.mkstemp(suffix='.pem')
        with os.fdopen(self.key_fd, 'wb') as f:
            f.write(signer.private_key.private_bytes(
                Encoding.PEM,
                PrivateFormat.TraditionalOpenSSL,
                NoEncryption()
            ))

    def __del__(self):
        # Limpar arquivos temporários
        if hasattr(self, 'cert_path') and os.path.exists(self.cert_path):
            try: os.unlink(self.cert_path)
            except: pass
        if hasattr(self, 'key_path') and os.path.exists(self.key_path):
            try: os.unlink(self.key_path)
            except: pass

    def emitir_dps(self, ordem_servico: OrdemServico):
        """
        Gera o XML da DPS, assina, compacta (GZIP) e envia para a API Nacional (Endpoint /DFe).
        """
        # 1. Gerar XML Assinado
        dps_xml = self._construir_xml_dps(ordem_servico)
        signer = SignerService(self.config.certificado_digital, self.config.senha_certificado)
        xml_str = signer.sign_xml(dps_xml, 'infDPS') # XML string assinado (UTF-8 bytes decoded to str usually, or direct bytes)
        
        # Garantir que xml_str seja bytes pra compressão
        if isinstance(xml_str, str):
            xml_bytes = xml_str.encode('utf-8')
        else:
            xml_bytes = xml_str

        # 2. Enviar para API REST SNNFSe
        # Endpoint: POST /nfse
        # Homolog: https://adn.producaorestrita.nfse.gov.br
        # Produção: https://adn.nfse.gov.br
        
        url = f"{self.base_url}/nfse"
        
        # Header Content-Type: application/xml
        logger.info(f"Tentando emitir DPS em: {url}")
        
        try:
            # Envia XML Puro Assinado
            response = requests.post(
                url,
                data=xml_bytes,
                cert=(self.cert_path, self.key_path),
                timeout=30,
                headers={"Content-Type": "application/xml; charset=utf-8"}
            )
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"SUCESSO NA ROTA: {url}")
                if response.status_code == 202: # "Accepted", mas nao autorizado imediatemente (assincrono)
                      # TODO: Obter Location ou ID do lote para consulta
                      logger.info(f"Resposta 202 ACCEPTED. Cabeçalhos: {response.headers}")
                      
                return self._processar_sucesso(response, ordem_servico)
            
            # Se der erro, tenta processar a resposta de erro
            logger.warning(f"Erro na emissão ({response.status_code}): {response.text}")
            return self._processar_erro(response)
                
        except Exception as e:
            logger.error(f"Erro de conexão em {url}: {e}")
            raise Exception(f"Erro ao conectar na NFS-e Nacional: {e}")

    def _construir_xml_dps(self, os_obj: OrdemServico):
        """
        Monta a estrutura XML da Declaração de Prestação de Serviço (DPS)
        Padrão Nacional SNNFSe
        """
        from lxml import etree
        
        # Namespaces
        ns_map = {
            None: "http://www.sped.fazenda.gov.br/nfse", 
            "ds": "http://www.w3.org/2000/09/xmldsig#"
        }
        
        root = etree.Element("DPS", nsmap=ns_map)
        root.set("versao", "1.00")
        
        # Dados do Emitente
        cnpj_emitente = self._limpar_doc(self.config.cpf_cnpj or "00000000000000").zfill(14)
        
        # Série e Número
        serie_cf = getattr(self.config, 'serie_dps', '1') or '1'
        serie = serie_cf.strip() # Ajustado para remover zfill excessivo na construcao numerica
        
        last_num = getattr(self.config, 'ultimo_numero_dps', 0) or 0
        current_num = int(last_num) + 1
        
        self.numero_dps_atual = current_num 
        numero_dps_str = str(current_num).zfill(15) 
        
        # ID único da DPS
        # Formato ID: DPS + CNPJ (14) + Série (5) + Número (15)
        id_dps = f"DPS{cnpj_emitente}{serie.zfill(5)}{numero_dps_str}"
        
        inf_dps = etree.SubElement(root, "infDPS", Id=id_dps)
        inf_dps.set("versao", "1.00")
        
        # Ambiente (1-Producao, 2-Homologacao)
        amb = etree.SubElement(inf_dps, "tpAmb")
        amb.text = "2" if self.ambiente != '1' else "1"
        
        # Emissão
        dh_emi = etree.SubElement(inf_dps, "dhEmi")
        dh_emi.text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

        ver_aplic = etree.SubElement(inf_dps, "verAplic")
        ver_aplic.text = "1.0.0"

        # Série e Número da DPS (Elementos Obrigatórios)
        etree.SubElement(inf_dps, "serie").text = serie.lstrip('0') or '1' # Numerico 1..99999
        etree.SubElement(inf_dps, "nDPS").text = str(current_num)

        d_compet = etree.SubElement(inf_dps, "dCompet")
        d_compet.text = datetime.now().strftime("%Y-%m-%d")
        
        # Tipo de emissão (1-Normal)
        etree.SubElement(inf_dps, "tpEmis").text = "1"

        # Identificação da DPS
        prest = etree.SubElement(inf_dps, "prest")
        etree.SubElement(prest, "CNPJ").text = cnpj_emitente
        
        # Tomador
        tom = etree.SubElement(inf_dps, "tom")
        if os_obj.id_cliente:
             doc_cliente = self._limpar_doc(os_obj.id_cliente.cpf_cnpj)
             if len(doc_cliente) > 11:
                etree.SubElement(tom, "CNPJ").text = doc_cliente
             else:
                etree.SubElement(tom, "CPF").text = doc_cliente
             
             if os_obj.id_cliente.nome_razao_social:
                 etree.SubElement(tom, "xNome").text = os_obj.id_cliente.nome_razao_social[:60]
             
             # Endereço Tomador (Opcional mas recomendado)
             end_tom = etree.SubElement(tom, "end")
             etree.SubElement(end_tom, "xLgr").text = (os_obj.id_cliente.endereco or "Nao Informado")[:60]
             etree.SubElement(end_tom, "nro").text = (os_obj.id_cliente.numero or "S/N")[:10]
             etree.SubElement(end_tom, "xBairro").text = (os_obj.id_cliente.bairro or "Centro")[:60]
             # Código Mun IBGE Tomador
             c_mun_tom = self._limpar_doc(getattr(os_obj.id_cliente, 'codigo_municipio_ibge', ''))
             if not c_mun_tom:
                 c_mun_tom = getattr(self.config, 'codigo_municipio_ibge', '3550308') # Fallback para municipio do prestador
             etree.SubElement(end_tom, "cMun").text = c_mun_tom
             etree.SubElement(end_tom, "UF").text = (os_obj.id_cliente.estado or "SP")[:2]
             etree.SubElement(end_tom, "CEP").text = self._limpar_doc(os_obj.id_cliente.cep or "00000000")

        else:
             # Consumidor Final (Sem identificação) - Pode não ser permitido em NFS-e dependendo do valor
             pass

        # Serviço
        serv = etree.SubElement(inf_dps, "serv") # REMOVIDO nsmap duplicado se nao necessário
        
        # Item Lista Serviço (LC 116) - 
        # IMPORTANTE: A API Nacional valida rigorosamente o código do serviço versus trib.
        # Ex: 01.07
        c_serv_lc116 = "01.07"
        c_serv_elem = etree.SubElement(serv, "cServ")
        
        # Tributação Municipal (ISSQN)
        # SNNFSe v1.00 - cLocIncid (Local Incidencia) dentro de "serv" ou "tribut"?
        # Schema v1.00: 
        # <serv>
        #   <cServ>
        #   <xDescServ>
        # </serv>
        # <valores>
        #   <vServ>
        #   <tribut>
        #     <pAliq>
        #     <tpRetISS>
        #     <cMun> (Local da Incidência - OBRIGATÓRIO na maioria dos casos)
        #   </tribut>
        # </valores>
        
        c_serv_elem.text = etree.CDATA(self._formatar_item_lista(c_serv_lc116))

        x_desc = etree.SubElement(serv, "xDescServ")
        # Concatena descrição dos itens
        descricoes = [i.descricao_servico for i in os_obj.itens_servicos.all()]
        texto_desc = "; ".join(descricoes)[:1000] or "Serviços Prestados"
        x_desc.text = etree.CDATA(texto_desc)

        # Valores
        valores = etree.SubElement(inf_dps, "valores")
        v_serv = etree.SubElement(valores, "vServ")
        v_serv.text = f"{os_obj.valor_total_servicos:.2f}"
        
        # Tributação Municipal (ISSQN)
        tribut = etree.SubElement(valores, "tribut")
        
        # <pAliq> - Alíquota
        etree.SubElement(tribut, "pAliq").text = "0.00" 
        
        # <tpRetISS> - 1:Retido, 2:Não Retido
        etree.SubElement(tribut, "tpRetISS").text = "2" 

        # <cMun> - Local da Incidência do ISS (Obrigatório)
        c_mun_prestador = self._limpar_doc(getattr(self.config, 'codigo_municipio_ibge', '3148103')) # Default Patrocínio (3148103)
        etree.SubElement(tribut, "cMun").text = c_mun_prestador
        
        return root

    def _limpar_doc(self, doc):
        if not doc: return ""
        import re
        return re.sub(r'[^0-9]', '', str(doc))

    def _formatar_item_lista(self, codigo):
        # Remove pontos e formata
        if not codigo: return "01.07"
        limpo = self._limpar_doc(codigo)
        # Formato esperado: XX.XX
        if len(limpo) >= 4:
             return f"{limpo[:2]}.{limpo[2:]}"
        return "01.07"

    def _processar_sucesso(self, response, os_obj):
        # Salvar o novo número se foi gerado nesta emissão
        if hasattr(self, 'numero_dps_atual') and self.numero_dps_atual:
             try:
                 # Recarregar config para evitar conflitos de concorrencia simples
                 self.config.refresh_from_db()
                 if self.numero_dps_atual > (self.config.ultimo_numero_dps or 0):
                    self.config.ultimo_numero_dps = self.numero_dps_atual
                    self.config.save(update_fields=['ultimo_numero_dps'])
             except Exception as e:
                 logger.error(f"Erro ao atualizar ultimo_numero_dps: {e}")
                 
        resposta = response.json()
        
        try:
            logger.info(f"Resposta bruta da API NFS-e: {json.dumps(resposta)[:2000]}") # Limitado para nao estourar

            # --- ATUALIZAÇÃO DA OS ---
            # Mapeamento campos comuns de retorno (ajustar conforme API real)
            chave = resposta.get('chave') or resposta.get('chaveAcesso') or resposta.get('chvAcesso')
            numero = resposta.get('numero') or resposta.get('nNFSe') or resposta.get('numeroNFSe')
            xml_dist = resposta.get('xml_nfe') or resposta.get('xml') or resposta.get('xml_distribuicao')
            
            # Se não encontrar nos campos principais, procure em 'nfse' ou 'infNFSe'
            if not chave and 'nfse' in resposta:
                nfse_node = resposta.get('nfse') or {}
                if isinstance(nfse_node, dict):
                    chave = nfse_node.get('chave')
                    numero = nfse_node.get('numero')
            
            # Se ainda não encontrou e resposta for lista (caso API retorne lista de notas)
            if not chave and isinstance(resposta, list) and len(resposta) > 0:
                item = resposta[0]
                if isinstance(item, dict):
                    chave = item.get('chave')
                    numero = item.get('numero')

            updated_fields = []
            
            # Validação mais rigorosa: Só autoriza se tiver chave válida (50 chars) ou status explícito
            # Evita falsos positivos com códigos de erro numéricos
            is_authorized = False
            
            if chave and len(str(chave)) >= 40:
                is_authorized = True
            elif numero and resposta.get('status') in ['Autorizada', 'Processado', 'Sucesso']:
                is_authorized = True
            elif chave or numero:
                # Caso ambíguo: vamos logar e assumir sucesso SE não tiver indícios de erro
                if 'erro' not in resposta and 'mensagem' not in resposta:
                     is_authorized = True
            
            # Atualiza Chave
            if chave:
                os_obj.chave_nfse = chave
                updated_fields.append('chave_nfse')
            
            # Atualiza Número
            if numero:
                os_obj.numero_nfse = str(numero)
                updated_fields.append('numero_nfse')
            
            # Atualiza URL/XML (Se receber URL, salva URL. Se XML, poderia salvar arquivo e linkar, mas por ora salva raw se der)
            link_xml = resposta.get('link_xml') or resposta.get('url_xml')
            if link_xml:
                 os_obj.xml_url = link_xml
                 updated_fields.append('xml_url')
            
            # Salva número DPS usado na emissão
            if hasattr(self, 'numero_dps_atual') and self.numero_dps_atual:
                os_obj.numero_dps = self.numero_dps_atual
                updated_fields.append('numero_dps')
                
            # Define Status e Data sempre que sucesso
            # CORREÇÃO: Apenas marcar como Autorizada se a validação passar
            if is_authorized:
                os_obj.status_nfse = 'Autorizada'
                updated_fields.append('status_nfse')
                
                if not os_obj.data_emissao_nfse:
                    os_obj.data_emissao_nfse = datetime.now()
                    updated_fields.append('data_emissao_nfse')
            else:
                logger.warning(f"Resposta 200/201 mas sem confirmação clara de autorização na OS {os_obj.id_os}. Resposta: {json.dumps(resposta)}")
                # Se não autorizado, mas sem erro explícito, talvez "Em Processamento"?
                if not os_obj.status_nfse or os_obj.status_nfse == 'Erro':
                     os_obj.status_nfse = 'Em Processamento'
                     updated_fields.append('status_nfse')
                
            # Salva na OS
            if updated_fields:
                os_obj.save(update_fields=updated_fields)
                if chave:
                    logger.info(f"OS {os_obj.id_os} atualizada com dados da NFS-e. Chave: {os_obj.chave_nfse}")

            # --- LOG DE AUDITORIA ---
            try:
                from api.models import LogAuditoria
                LogAuditoria.objects.create(
                    usuario="SISTEMA API",
                    tipo_acao="TRANSMITIR_NFSE",
                    tabela="ordem_servico",
                    registro_id=os_obj.id_os,
                    descricao=f"NFS-e Emitida. Chave: {os_obj.chave_nfse or 'N/A'}",
                    dados_novos=json.dumps(resposta)[:4000] # Salva JSON do retorno
                )
            except Exception as log_err:
                logger.error(f"Falha ao criar log de auditoria: {log_err}")

        except Exception as e:
            logger.error(f"Erro ao processar dados de sucesso na OS {os_obj.id_os}: {e}")
            # RE-RAISE: Não esconder erro de processamento, pois se falhar ao salvar, o status fica inconsistente
            raise Exception(f"Erro ao processar retorno da NFS-e: {e}")
            
        return resposta

    def _processar_erro(self, response):
        try:
            erro_json = response.json()
            msg = erro_json.get('mensagem') or erro_json.get('error') or response.text
        except:
            msg = response.text
        raise Exception(f"Erro API NFS-e ({response.status_code}): {msg}")

    def _limpar_doc(self, doc):
        if not doc: return ""
        return doc.replace(".", "").replace("-", "").replace("/", "")
