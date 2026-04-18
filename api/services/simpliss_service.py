import logging
import requests
from datetime import datetime
from decimal import Decimal
from lxml import etree
from api.models import EmpresaConfig, OrdemServico
from api.services.signer_service import SignerService

logger = logging.getLogger(__name__)

class SimplISSService:
    """
    Serviço para emissão de NFS-e via SimplISS (Padrão ABRASF 2.04)
    Usado por municípios como Patrocínio/MG
    """
    
    # URLs SimplISS Patrocínio (padrão SimplISS Web)
    URL_PRODUCAO = "https://patrocinio.simplissweb.com.br/nfseserv.asmx"
    URL_HOMOLOGACAO = "https://homologacao.simplissweb.com.br/nfseserv.asmx"
    
    def __init__(self):
        self.config = EmpresaConfig.get_ativa()
        if not self.config:
            raise Exception("Configurações da empresa não encontradas.")
        
        self.ambiente = getattr(self.config, 'ambiente_nfse', '2')
        self.base_url = self.URL_PRODUCAO if self.ambiente == '1' else self.URL_HOMOLOGACAO
        
    def emitir_rps(self, ordem_servico: OrdemServico):
        """
        Emite NFS-e via SimplISS usando o método RecepcionarLoteRps
        """
        try:
            # 1. Construir XML do RPS
            rps_xml = self._construir_rps(ordem_servico)
            
            # 2. Construir Lote
            lote_xml = self._construir_lote_rps([rps_xml])
            
            # 3. Assinar Lote
            signer = SignerService(self.config.certificado_digital, self.config.senha_certificado)
            lote_assinado = signer.sign_xml(lote_xml, 'LoteRps')
            
            # 4. Construir Envelope SOAP
            soap_envelope = self._construir_soap_envelope(lote_assinado, 'RecepcionarLoteRps')
            
            # 5. Enviar
            logger.info(f"Enviando RPS para SimplISS: {self.base_url}")
            response = requests.post(
                self.base_url,
                data=soap_envelope.encode('utf-8'),
                headers={
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': 'http://www.abrasf.org.br/nfse.xsd/RecepcionarLoteRps'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return self._processar_resposta(response, ordem_servico)
            else:
                raise Exception(f"Erro HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            logger.error(f"Erro ao emitir RPS: {e}")
            raise
    
    def _construir_rps(self, os_obj: OrdemServico):
        """Constrói o XML do RPS (Recibo Provisório de Serviços) - ABRASF 2.04"""
        
        ns = "http://www.abrasf.org.br/nfse.xsd"
        rps = etree.Element("{%s}Rps" % ns, nsmap={None: ns})
        
        # InfDeclaracaoPrestacaoServico
        inf_rps = etree.SubElement(rps, "InfDeclaracaoPrestacaoServico")
        
        # Identificação RPS
        ident_rps = etree.SubElement(inf_rps, "IdentificacaoRps")
        etree.SubElement(ident_rps, "Numero").text = str(os_obj.id_os)
        etree.SubElement(ident_rps, "Serie").text = "OS"
        etree.SubElement(ident_rps, "Tipo").text = "1"  # 1-RPS
        
        # Data Emissão
        etree.SubElement(inf_rps, "DataEmissao").text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        
        # Prestador
        prestador = etree.SubElement(inf_rps, "Prestador")
        cpf_cnpj_prest = etree.SubElement(prestador, "CpfCnpj")
        cnpj_prest = self._limpar_doc(self.config.cpf_cnpj)
        if len(cnpj_prest) == 14:
            etree.SubElement(cpf_cnpj_prest, "Cnpj").text = cnpj_prest
        else:
            etree.SubElement(cpf_cnpj_prest, "Cpf").text = cnpj_prest
        
        # Inscrição Municipal (Opcional para alguns municípios)
        if self.config.inscricao_municipal:
            etree.SubElement(prestador, "InscricaoMunicipal").text = self.config.inscricao_municipal
        
        # Tomador
        if os_obj.id_cliente:
            tomador = etree.SubElement(inf_rps, "Tomador")
            cpf_cnpj_tom = etree.SubElement(tomador, "CpfCnpj")
            doc_tom = self._limpar_doc(os_obj.id_cliente.cpf_cnpj)
            if len(doc_tom) > 11:
                etree.SubElement(cpf_cnpj_tom, "Cnpj").text = doc_tom
            else:
                etree.SubElement(cpf_cnpj_tom, "Cpf").text = doc_tom
            
            etree.SubElement(tomador, "RazaoSocial").text = os_obj.id_cliente.nome_razao_social[:115]
            
            # Endereço Tomador
            if os_obj.id_cliente.endereco:
                end_tom = etree.SubElement(tomador, "Endereco")
                etree.SubElement(end_tom, "Endereco").text = os_obj.id_cliente.endereco[:125]
                etree.SubElement(end_tom, "Numero").text = (os_obj.id_cliente.numero or "SN")[:10]
                etree.SubElement(end_tom, "Bairro").text = (os_obj.id_cliente.bairro or "")[:60]
                etree.SubElement(end_tom, "CodigoMunicipio").text = "3148103"  # Patrocínio
                etree.SubElement(end_tom, "Uf").text = "MG"
                etree.SubElement(end_tom, "Cep").text = self._limpar_doc(os_obj.id_cliente.cep or "38740000")
        
        # Serviço
        servico = etree.SubElement(inf_rps, "Servico")
        valores = etree.SubElement(servico, "Valores")
        
        etree.SubElement(valores, "ValorServicos").text = f"{os_obj.valor_total_servicos:.2f}"
        etree.SubElement(valores, "ValorDeducoes").text = "0.00"
        etree.SubElement(valores, "ValorPis").text = "0.00"
        etree.SubElement(valores, "ValorCofins").text = "0.00"
        etree.SubElement(valores, "ValorInss").text = "0.00"
        etree.SubElement(valores, "ValorIr").text = "0.00"
        etree.SubElement(valores, "ValorCsll").text = "0.00"
        
        # ISS
        etree.SubElement(valores, "IssRetido").text = "2"  # 2-Não Retido
        etree.SubElement(valores, "ValorIss").text = "0.00"
        
        etree.SubElement(valores, "BaseCalculo").text = f"{os_obj.valor_total_servicos:.2f}"
        etree.SubElement(valores, "Aliquota").text = "0.00"
        etree.SubElement(valores, "ValorLiquidoNfse").text = f"{os_obj.valor_total_servicos:.2f}"
        
        # Item Lista Serviço
        etree.SubElement(servico, "ItemListaServico").text = "01.07"
        
        etree.SubElement(servico, "CodigoMunicipio").text = "3148103"
        
        # Discriminação
        descricao = "; ".join([i.descricao_servico for i in os_obj.itens_servicos.all()])
        etree.SubElement(servico, "Discriminacao").text = descricao[:2000]
        
        etree.SubElement(servico, "CodigoMunicipio").text = "3148103"
        
        return rps
    
    def _construir_lote_rps(self, lista_rps):
        """Constrói o Lote de RPS"""
        ns = "http://www.abrasf.org.br/nfse.xsd"
        lote = etree.Element("{%s}EnviarLoteRpsEnvio" % ns, nsmap={None: ns})
        
        lote_rps = etree.SubElement(lote, "LoteRps")
        lote_rps.set("Id", f"LOTE{datetime.now().strftime('%Y%m%d%H%M%S')}")
        
        etree.SubElement(lote_rps, "NumeroLote").text = datetime.now().strftime('%Y%m%d%H%M%S')
        
        cnpj = self._limpar_doc(self.config.cpf_cnpj)
        cpf_cnpj = etree.SubElement(lote_rps, "CpfCnpj")
        if len(cnpj) == 14:
            etree.SubElement(cpf_cnpj, "Cnpj").text = cnpj
        else:
            etree.SubElement(cpf_cnpj, "Cpf").text = cnpj
        
        if self.config.inscricao_municipal:
            etree.SubElement(lote_rps, "InscricaoMunicipal").text = self.config.inscricao_municipal
        
        etree.SubElement(lote_rps, "QuantidadeRps").text = str(len(lista_rps))
        
        lista_rps_elem = etree.SubElement(lote_rps, "ListaRps")
        for rps in lista_rps:
            lista_rps_elem.append(rps)
        
        return lote
    
    def _construir_soap_envelope(self, conteudo_xml, metodo):
        """Constrói o envelope SOAP para SimplISS"""
        if isinstance(conteudo_xml, etree._Element):
            conteudo_str = etree.tostring(conteudo_xml, encoding='unicode', method='xml')
        else:
            conteudo_str = conteudo_xml
        
        # Remove declaração XML se houver
        if conteudo_str.startswith('<?xml'):
            conteudo_str = conteudo_str.split('?>', 1)[1].strip()
        
        envelope = f'''<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <{metodo} xmlns="http://www.abrasf.org.br/nfse.xsd">
      <nfseCabecMsg><![CDATA[<?xml version="1.0" encoding="utf-8"?><cabecalho versao="2.04" xmlns="http://www.abrasf.org.br/nfse.xsd"><versaoDados>2.04</versaoDados></cabecalho>]]></nfseCabecMsg>
      <nfseDadosMsg><![CDATA[{conteudo_str}]]></nfseDadosMsg>
    </{metodo}>
  </soap:Body>
</soap:Envelope>'''
        
        return envelope
    
    def _processar_resposta(self, response, os_obj):
        """Processa a resposta SOAP da SimplISS"""
        try:
            # Parse SOAP Response
            root = etree.fromstring(response.content)
            
            # Namespaces SOAP
            ns = {
                'soap': 'http://schemas.xmlsoap.org/soap/envelope/',
                'nfse': 'http://www.abrasf.org.br/nfse.xsd'
            }
            
            # Procurar por mensagens de erro
            mensagens = root.xpath('//nfse:ListaMensagemRetorno/nfse:MensagemRetorno', namespaces=ns)
            if mensagens:
                erros = []
                for msg in mensagens:
                    codigo = msg.find('nfse:Codigo', namespaces=ns)
                    mensagem = msg.find('nfse:Mensagem', namespaces=ns)
                    if codigo is not None and mensagem is not None:
                        erros.append(f"{codigo.text}: {mensagem.text}")
                
                if erros:
                    raise Exception("Erros na validação: " + "; ".join(erros))
            
            # Procurar NFS-e gerada
            comp_nfse = root.xpath('//nfse:CompNfse/nfse:Nfse/nfse:InfNfse', namespaces=ns)
            if comp_nfse:
                inf_nfse = comp_nfse[0]
                
                numero = inf_nfse.find('nfse:Numero', namespaces=ns)
                chave = inf_nfse.find('nfse:CodigoVerificacao', namespaces=ns)
                data_emissao = inf_nfse.find('nfse:DataEmissao', namespaces=ns)
                
                # Atualizar OS
                if numero is not None:
                    os_obj.numero_nfse = numero.text
                if chave is not None:
                    os_obj.chave_nfse = chave.text
                    
                os_obj.status_nfse = 'Autorizada'
                os_obj.data_emissao_nfse = datetime.now()
                os_obj.save(update_fields=['numero_nfse', 'chave_nfse', 'status_nfse', 'data_emissao_nfse'])
                
                logger.info(f"NFS-e {numero.text if numero is not None else 'N/A'} emitida com sucesso!")
                
                return {
                    'success': True,
                    'numero': numero.text if numero is not None else None,
                    'chave': chave.text if chave is not None else None,
                    'mensagem': 'NFS-e emitida com sucesso'
                }
            
            # Se chegou aqui, não encontrou nem erro nem sucesso claro
            logger.warning(f"Resposta ambígua da SimplISS: {response.text[:500]}")
            return {
                'success': False,
                'mensagem': 'Resposta não reconhecida do webservice',
                'xml': response.text
            }
            
        except etree.XMLSyntaxError as e:
            logger.error(f"Erro ao parsear resposta XML: {e}")
            raise Exception(f"Resposta inválida do webservice: {e}")
    
    def _limpar_doc(self, doc):
        """Remove formatação de CPF/CNPJ"""
        if not doc:
            return ""
        import re
        return re.sub(r'[^0-9]', '', str(doc))
