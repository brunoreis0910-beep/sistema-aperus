import gzip
import base64
import logging
import re
import tempfile
import os
import requests
from datetime import datetime, timezone, timedelta
from lxml import etree
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding, PrivateFormat, NoEncryption

from django.db import transaction

from api.models import EmpresaConfig, OrdemServico, OsItensServico

logger = logging.getLogger(__name__)

NFSE_NS = "http://www.sped.fazenda.gov.br/nfse"
DPS_VERSAO = "1.01"
VER_APLIC = "SistemaGerencial_v1.0"
# Série para emissão com aplicativo próprio (faixa 00001-49999)
SERIE_DPS = "00001"


class SimplISSRestService:
    """
    Serviço para emissão de NFS-e via SimplISS REST API — Padrão Nacional SEFIN.

    Manual de referência: Manual de Integração do Contribuinte v1.00 (Outubro/2025)

    Endpoints:
        POST  /nfse                          — Emissão síncrona
        GET   /nfse/{chaveAcesso}            — Consulta por chave
        POST  /nfse/{chaveAcesso}/eventos    — Cancelamento
        GET   /nfse/{chaveAcesso}/eventos    — Consulta eventos

    Comunicação:
        - TLS 1.2 com autenticação mútua (certificado A1 ICP-Brasil)
        - Mensagens: JSON
        - Documento DPS: XML assinado XMLDSIG, compactado GZip, codificado base64
    """

    URL_PRODUCAO = "https://nfsepatrocinio.simplissweb.com.br"
    URL_HOMOLOGACAO = "https://producaorestrita.simplissweb.com.br"

    def __init__(self):
        self.config = EmpresaConfig.get_ativa()
        if not self.config:
            raise Exception("Configurações da empresa não encontradas.")

        self.ambiente = getattr(self.config, 'ambiente_nfse', '2')
        self.base_url = self.URL_PRODUCAO if self.ambiente == '1' else self.URL_HOMOLOGACAO
        self._cert_files = None  # arquivos PEM temporários para TLS mútuo

    # ------------------------------------------------------------------
    # INTERFACE PÚBLICA
    # ------------------------------------------------------------------

    def emitir_nfse(self, ordem_servico: OrdemServico) -> dict:
        """Emite NFS-e para a Ordem de Serviço informada."""
        try:
            numero_dps = self._proximo_numero_dps(ordem_servico)
            # Persistir numero_dps e serie_dps antes de enviar (garante rastreabilidade)
            serie_cfg = re.sub(r'\D', '', getattr(self.config, 'serie_dps', '') or '') or SERIE_DPS
            ordem_servico.numero_dps = numero_dps
            ordem_servico.serie_dps = serie_cfg.zfill(5)
            ordem_servico.save(update_fields=['numero_dps', 'serie_dps'])

            xml_dps = self._construir_xml_dps(ordem_servico, numero_dps)
            xml_assinado = self._assinar_xml(xml_dps)
            xml_gz_b64 = self._gzip_b64(xml_assinado)

            payload = {"xmlDPS": xml_gz_b64}
            endpoint = f"{self.base_url}/nfse"

            logger.info(f"[SimplISS] Emitindo NFS-e OS#{ordem_servico.id_os} → {endpoint}")
            response = self._post(endpoint, payload)

            if response.status_code in (200, 201):
                return self._processar_sucesso(response, ordem_servico)
            else:
                return self._processar_erro(response)

        except Exception as e:
            logger.error(f"[SimplISS] Erro ao emitir NFS-e: {e}", exc_info=True)
            return {'sucesso': False, 'mensagem': str(e)}
        finally:
            self._limpar_cert_files()

    def consultar_nfse(self, chave_acesso: str) -> dict:
        """Consulta NFS-e pela chave de acesso."""
        endpoint = f"{self.base_url}/nfse/{chave_acesso}"
        try:
            response = self._get(endpoint)
            if response.status_code == 200:
                return {'sucesso': True, 'dados': response.json()}
            return self._processar_erro(response)
        except Exception as e:
            return {'sucesso': False, 'mensagem': str(e)}
        finally:
            self._limpar_cert_files()

    def cancelar_nfse(self, chave_acesso: str, motivo: str, codigo_motivo: int = 1) -> dict:
        """
        Cancela NFS-e registrando evento 101101.
        codigo_motivo: 1=Erro na emissão, 2=Serviço não prestado, etc.
        """
        try:
            xml_evt = self._construir_xml_evento_cancelamento(chave_acesso, motivo, codigo_motivo)
            xml_assinado = self._assinar_xml(xml_evt)
            xml_gz_b64 = self._gzip_b64(xml_assinado)

            payload = {"xmlEvento": xml_gz_b64}
            endpoint = f"{self.base_url}/nfse/{chave_acesso}/eventos"

            response = self._post(endpoint, payload)
            if response.status_code in (200, 201):
                return {'sucesso': True, 'mensagem': 'NFS-e cancelada com sucesso', 'dados': response.json()}
            return self._processar_erro(response)
        except Exception as e:
            return {'sucesso': False, 'mensagem': str(e)}
        finally:
            self._limpar_cert_files()

    def consultar_eventos(self, chave_acesso: str) -> dict:
        """Consulta todos os eventos vinculados a uma NFS-e."""
        endpoint = f"{self.base_url}/nfse/{chave_acesso}/eventos"
        try:
            response = self._get(endpoint)
            if response.status_code == 200:
                return {'sucesso': True, 'dados': response.json()}
            return self._processar_erro(response)
        except Exception as e:
            return {'sucesso': False, 'mensagem': str(e)}
        finally:
            self._limpar_cert_files()

    # ------------------------------------------------------------------
    # CONSTRUÇÃO DO XML DPS
    # ------------------------------------------------------------------

    def _construir_xml_dps(self, os: OrdemServico, numero_dps: int) -> bytes:
        """
        Constrói o XML da DPS conforme leiaute SEFIN Nacional v1.01.

        Referência: ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe_Simpliss — Planilha LEIAUTE DPS_NFS-e
        e XML_Exemplo.xml fornecido pela SimplISS.
        """
        cfg = self.config
        cnpj = re.sub(r'\D', '', cfg.cpf_cnpj or '')
        im = re.sub(r'\D', '', cfg.inscricao_municipal or '')
        cep_empresa = re.sub(r'\D', '', cfg.cep or '')
        cod_mun = re.sub(r'\D', '', getattr(cfg, 'codigo_municipio_ibge', '3148103') or '3148103')

        # Tipo de inscrição: 2=CNPJ, 1=CPF
        tipo_insc = '2' if len(cnpj) == 14 else '1'
        insc_padded = cnpj.zfill(14)  # 14 dígitos (CPF preenchido com zeros à esquerda)

        serie_cfg = re.sub(r'\D', '', getattr(self.config, 'serie_dps', '') or '') or SERIE_DPS
        serie_padded = serie_cfg.zfill(5)
        ndps_padded = str(numero_dps).zfill(15)

        # Id: "DPS" + cLocEmi(7) + TipoInscricao(1) + Inscricao(14) + Serie(5) + nDPS(15)
        dps_id = f"DPS{cod_mun}{tipo_insc}{insc_padded}{serie_padded}{ndps_padded}"

        agora = datetime.now(tz=timezone(timedelta(hours=-3)))
        dh_emi = agora.strftime('%Y-%m-%dT%H:%M:%S-03:00')
        d_compet = agora.strftime('%Y-%m-%d')
        tp_amb = self.ambiente  # '1'=Produção, '2'=Homologação

        cliente = os.id_cliente
        cnpj_cpf_cli = re.sub(r'\D', '', cliente.cpf_cnpj or '')
        cod_mun_cli = re.sub(r'\D', '', getattr(cliente, 'codigo_municipio_ibge', '') or '') or cod_mun
        cep_cli = re.sub(r'\D', '', cliente.cep or '') or '00000000'

        itens = OsItensServico.objects.filter(id_os=os)
        desc_servico = "; ".join(
            str(item.descricao_servico or '') for item in itens if item.descricao_servico
        ) or "Serviços prestados"
        desc_servico = desc_servico[:150]  # máx 150 chars para xDescServ

        valor_servico = float(getattr(os, 'valor_total_servicos', None) or os.valor_total_os or 0)
        aliquota_iss = 2.00  # a ser configurado por município/item de serviço

        # Código de tribut. nacional padrão: 010401 (serviços de manutenção/reparo - LC 116)
        ctrib_nac = '010401'
        # NBS padrão: 115011000 (serviços de manutenção e reparo)
        cnbs = '115011000'

        nsmap = {None: NFSE_NS}
        DPS = etree.Element('DPS', nsmap=nsmap)
        DPS.set('versao', DPS_VERSAO)

        infDPS = etree.SubElement(DPS, 'infDPS')
        infDPS.set('Id', dps_id)

        self._el(infDPS, 'tpAmb', tp_amb)
        self._el(infDPS, 'dhEmi', dh_emi)
        self._el(infDPS, 'verAplic', VER_APLIC)
        self._el(infDPS, 'serie', serie_padded)
        self._el(infDPS, 'nDPS', ndps_padded)
        self._el(infDPS, 'dCompet', d_compet)
        self._el(infDPS, 'tpEmit', '1')  # 1=Prestador
        self._el(infDPS, 'cLocEmi', cod_mun)

        # Prestador
        prest = etree.SubElement(infDPS, 'prest')
        self._el(prest, 'CNPJ', cnpj)
        if im:
            self._el(prest, 'IM', im)
        if cfg.telefone:
            fone = re.sub(r'\D', '', cfg.telefone)[:11]
            self._el(prest, 'fone', fone)
        if cfg.email:
            self._el(prest, 'email', cfg.email[:80])

        # Regime tributário do prestador
        regime = getattr(cfg, 'regime_tributario', 'SIMPLES') or 'SIMPLES'
        op_simp_nac = '1'  # 1=Fora Simples Nacional
        if regime == 'SIMPLES':
            op_simp_nac = '3'  # 3=Optante Simples Nacional Exceto MEI
        elif regime == 'MEI':
            op_simp_nac = '2'  # 2=MEI
        regTrib = etree.SubElement(prest, 'regTrib')
        self._el(regTrib, 'opSimpNac', op_simp_nac)
        self._el(regTrib, 'regEspTrib', '0')  # 0=Sem regime especial

        # Tomador
        toma = etree.SubElement(infDPS, 'toma')
        if len(cnpj_cpf_cli) == 14:
            self._el(toma, 'CNPJ', cnpj_cpf_cli)
        elif len(cnpj_cpf_cli) == 11:
            self._el(toma, 'CPF', cnpj_cpf_cli)
        self._el(toma, 'xNome', (cliente.nome_razao_social or 'CONSUMIDOR')[:150])

        end_toma = etree.SubElement(toma, 'end')
        endNac = etree.SubElement(end_toma, 'endNac')
        self._el(endNac, 'cMun', cod_mun_cli)
        self._el(endNac, 'CEP', cep_cli.zfill(8))
        self._el(end_toma, 'xLgr', (cliente.endereco or 'Não informado')[:255])
        self._el(end_toma, 'nro', (cliente.numero or 'S/N')[:60])
        if cliente.bairro:
            self._el(end_toma, 'xBairro', cliente.bairro[:60])

        if cliente.email:
            self._el(toma, 'email', cliente.email[:80])

        # Serviço
        serv = etree.SubElement(infDPS, 'serv')
        locPrest = etree.SubElement(serv, 'locPrest')
        self._el(locPrest, 'cLocPrestacao', cod_mun)

        cServ = etree.SubElement(serv, 'cServ')
        self._el(cServ, 'cTribNac', ctrib_nac)
        self._el(cServ, 'cTribMun', '000')
        self._el(cServ, 'xDescServ', desc_servico)
        self._el(cServ, 'cNBS', cnbs)

        # Valores
        valores = etree.SubElement(infDPS, 'valores')
        vServPrest = etree.SubElement(valores, 'vServPrest')
        self._el(vServPrest, 'vServ', f'{valor_servico:.2f}')

        trib = etree.SubElement(valores, 'trib')
        tribMun = etree.SubElement(trib, 'tribMun')
        self._el(tribMun, 'tribISSQN', '1')   # 1=Operação tributável
        self._el(tribMun, 'tpRetISSQN', '1')  # 1=Sem retenção
        self._el(tribMun, 'pAliq', f'{aliquota_iss:.2f}')

        totTrib = etree.SubElement(trib, 'totTrib')
        self._el(totTrib, 'indTotTrib', '0')  # 0=Não informado

        # IBS/CBS (Reforma Tributária — obrigatório conforme ANEXO VI v1.01)
        IBSCBS = etree.SubElement(infDPS, 'IBSCBS')
        self._el(IBSCBS, 'finNFSe', '0')    # 0=NFS-e Normal
        self._el(IBSCBS, 'indFinal', '0')   # 0=Normal
        self._el(IBSCBS, 'cIndOp', '100501')  # Operação de serviço
        self._el(IBSCBS, 'indDest', '0')    # 0=Não se aplica

        valores_ibs = etree.SubElement(IBSCBS, 'valores')
        trib_ibs = etree.SubElement(valores_ibs, 'trib')
        gIBSCBS = etree.SubElement(trib_ibs, 'gIBSCBS')
        self._el(gIBSCBS, 'CST', '000')           # 000=Tributado integralmente
        self._el(gIBSCBS, 'cClassTrib', '000001')  # Classificação padrão

        return etree.tostring(DPS, encoding='unicode', xml_declaration=False).encode('utf-8')

    def _construir_xml_evento_cancelamento(
        self, chave_acesso: str, motivo: str, codigo_motivo: int
    ) -> bytes:
        """Constrói o XML do Pedido de Registro de Evento de Cancelamento (101101)."""
        nsmap = {None: NFSE_NS}
        pedReg = etree.Element('pedRegEvento', nsmap=nsmap)
        pedReg.set('versao', DPS_VERSAO)

        infEvento = etree.SubElement(pedReg, 'infPedRegEvento')
        evt_id = f"EVT{chave_acesso}"
        infEvento.set('Id', evt_id)

        agora = datetime.now(tz=timezone(timedelta(hours=-3)))
        self._el(infEvento, 'dhEmi', agora.strftime('%Y-%m-%dT%H:%M:%S-03:00'))
        self._el(infEvento, 'verAplic', VER_APLIC)
        self._el(infEvento, 'tpAmb', self.ambiente)
        self._el(infEvento, 'tpEvento', '101101')  # Cancelamento
        self._el(infEvento, 'nSeqEvento', '1')
        self._el(infEvento, 'chNFSe', chave_acesso)

        detEvento = etree.SubElement(infEvento, 'detEvento')
        self._el(detEvento, 'cMotivo', str(codigo_motivo))
        self._el(detEvento, 'xMotivo', motivo[:255])

        return etree.tostring(pedReg, encoding='unicode', xml_declaration=False).encode('utf-8')

    # ------------------------------------------------------------------
    # ASSINATURA DIGITAL E COMPACTAÇÃO
    # ------------------------------------------------------------------

    def _assinar_xml(self, xml_bytes: bytes) -> bytes:
        """
        Assina o XML com o certificado A1 usando XMLDSIG.
        Detecta automaticamente a tag-alvo: infDPS (DPS) ou infPedRegEvento (cancelamento).
        """
        from api.services.signer_service import SignerService

        # Detectar qual elemento possui Id para determinar a tag de assinatura
        parser = etree.XMLParser(remove_blank_text=False, remove_comments=True)
        root = etree.fromstring(xml_bytes, parser)
        parent_tag = 'infDPS'  # padrão
        for candidate in ('infDPS', 'infPedRegEvento'):
            found = root.xpath(f"//*[local-name() = '{candidate}']")
            if found and found[0].get('Id'):
                parent_tag = candidate
                break

        signer = SignerService(self.config.certificado_digital, self.config.senha_certificado)
        xml_assinado = signer.sign_xml(xml_bytes, parent_tag)
        if isinstance(xml_assinado, bytes):
            return xml_assinado
        if hasattr(xml_assinado, 'tag'):
            return etree.tostring(xml_assinado, encoding='unicode').encode('utf-8')
        return str(xml_assinado).encode('utf-8')

    def _gzip_b64(self, xml_bytes: bytes) -> str:
        """Compacta o XML com GZip e codifica em base64 conforme especificação."""
        compressed = gzip.compress(xml_bytes)
        return base64.b64encode(compressed).decode('ascii')

    # ------------------------------------------------------------------
    # REQUISIÇÕES HTTP COM TLS MÚTUO
    # ------------------------------------------------------------------

    def _obter_cert_pem_files(self):
        """
        Extrai chave privada e certificado do PFX e grava em arquivos
        temporários PEM para uso no TLS mútuo via requests.
        Retorna (cert_path, key_path).
        """
        if self._cert_files:
            return self._cert_files

        pfx_data = self._carregar_pfx_bytes()
        senha = (self.config.senha_certificado or '').encode('utf-8')

        private_key, cert, _ = pkcs12.load_key_and_certificates(pfx_data, senha)

        cert_pem = cert.public_bytes(Encoding.PEM)
        key_pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption())

        cert_file = tempfile.NamedTemporaryFile(delete=False, suffix='_cert.pem')
        cert_file.write(cert_pem)
        cert_file.close()

        key_file = tempfile.NamedTemporaryFile(delete=False, suffix='_key.pem')
        key_file.write(key_pem)
        key_file.close()

        self._cert_files = (cert_file.name, key_file.name)
        return self._cert_files

    def _limpar_cert_files(self):
        """Remove os arquivos PEM temporários."""
        if self._cert_files:
            for path in self._cert_files:
                try:
                    os.unlink(path)
                except Exception:
                    pass
            self._cert_files = None

    def _carregar_pfx_bytes(self) -> bytes:
        """Carrega os bytes do PFX a partir de arquivo ou base64."""
        src = self.config.certificado_digital
        if not src:
            raise Exception("Certificado digital não configurado.")
        if isinstance(src, str) and os.path.exists(src):
            with open(src, 'rb') as f:
                return f.read()
        if isinstance(src, str):
            clean = src.strip()
            if clean.startswith('data:'):
                clean = clean[clean.find(',') + 1:]
            return base64.b64decode(clean.replace('\n', '').replace('\r', ''))
        if isinstance(src, bytes):
            return src
        raise Exception("Formato do certificado digital não reconhecido.")

    def _get_session(self) -> requests.Session:
        """Retorna session com TLS mútuo configurado."""
        cert_path, key_path = self._obter_cert_pem_files()
        session = requests.Session()
        session.cert = (cert_path, key_path)
        session.verify = False  # SimplISS usa certificado próprio; desabilitar apenas se necessário
        session.headers.update({'Content-Type': 'application/json', 'Accept': 'application/json'})
        return session

    def _post(self, url: str, payload: dict) -> requests.Response:
        session = self._get_session()
        return session.post(url, json=payload, timeout=60)

    def _get(self, url: str) -> requests.Response:
        session = self._get_session()
        return session.get(url, timeout=30)

    # ------------------------------------------------------------------
    # PROCESSAMENTO DE RESPOSTAS
    # ------------------------------------------------------------------

    def _processar_sucesso(self, response: requests.Response, os: OrdemServico) -> dict:
        """
        Processa resposta 200/201 da API.
        A API retorna JSON com LoteDFe contendo o XML NFS-e em GZip+base64.
        """
        try:
            data = response.json()

            # Descompactar XML NFS-e retornado (LoteDFe)
            xml_nfse_b64 = (
                data.get('xmlNFSe') or data.get('xmlNfse')
                or data.get('arquivo') or data.get('xml') or ''
            )
            numero_nfse = str(data.get('numero') or data.get('numeroNFSe') or data.get('numeroNfse') or '')
            chave_nfse = str(data.get('chaveAcesso') or data.get('chave') or data.get('codigoVerificacao') or '')

            # Tenta extrair número e chave do XML retornado caso não venham direto
            if xml_nfse_b64 and (not numero_nfse or not chave_nfse):
                try:
                    xml_bytes = gzip.decompress(base64.b64decode(xml_nfse_b64))
                    root = etree.fromstring(xml_bytes)
                    ns = {'n': NFSE_NS}
                    if not numero_nfse:
                        el = root.find('.//{%s}nNFSe' % NFSE_NS) or root.find('.//{%s}numero' % NFSE_NS)
                        if el is not None:
                            numero_nfse = el.text or ''
                    if not chave_nfse:
                        el = root.find('.//{%s}chNFSe' % NFSE_NS) or root.find('.//{%s}chaveAcesso' % NFSE_NS)
                        if el is not None:
                            chave_nfse = el.text or ''
                except Exception as ex:
                    logger.warning(f"[SimplISS] Não foi possível parsear XML retornado: {ex}")

            if numero_nfse or chave_nfse:
                os.numero_nfse = numero_nfse
                os.chave_nfse = chave_nfse
                os.status_nfse = 'Autorizada'
                os.data_emissao_nfse = datetime.now()
                os.save(update_fields=['numero_nfse', 'chave_nfse', 'status_nfse', 'data_emissao_nfse'])
                logger.info(f"[SimplISS] NFS-e emitida: número={numero_nfse}, chave={chave_nfse}")
                return {
                    'sucesso': True,
                    'numero_nfse': numero_nfse,
                    'chave_nfse': chave_nfse,
                    'mensagem': 'NFS-e emitida com sucesso',
                    'dados_completos': data,
                }

            # Resposta OK mas sem número identificável — salvar dados brutos e sinalizar
            logger.warning(f"[SimplISS] Resposta OK mas sem número NFS-e: {data}")
            os.status_nfse = 'Processando'
            os.save(update_fields=['status_nfse'])
            return {
                'sucesso': True,
                'mensagem': 'NFS-e em processamento — aguardar confirmação',
                'dados_completos': data,
            }

        except Exception as e:
            logger.error(f"[SimplISS] Erro ao processar resposta de sucesso: {e}")
            return {'sucesso': False, 'mensagem': f'Erro ao processar resposta: {e}'}

    def _processar_erro(self, response: requests.Response) -> dict:
        """Processa resposta de erro da API."""
        try:
            data = response.json()
            mensagem = (
                data.get('mensagem') or data.get('message')
                or data.get('error') or data.get('titulo')
                or f'Erro HTTP {response.status_code}'
            )
            erros = data.get('erros') or data.get('errors') or []
            logger.error(f"[SimplISS] Erro {response.status_code}: {mensagem} — {erros}")
            return {
                'sucesso': False,
                'mensagem': mensagem,
                'erros': erros,
                'status_code': response.status_code,
            }
        except Exception:
            return {
                'sucesso': False,
                'mensagem': f'Erro HTTP {response.status_code}: {response.text[:300]}',
                'status_code': response.status_code,
            }

    # ------------------------------------------------------------------
    # UTILITÁRIOS
    # ------------------------------------------------------------------

    @staticmethod
    def _el(parent: etree._Element, tag: str, text: str) -> etree._Element:
        el = etree.SubElement(parent, tag)
        el.text = text
        return el

    def _proximo_numero_dps(self, os: OrdemServico) -> int:
        """
        Retorna o número DPS da OS.
        Se já possui numero_dps (re-emissão), reutiliza o mesmo número.
        Caso contrário, incrementa atomicamente o contador no EmpresaConfig.
        """
        if os.numero_dps:
            return int(os.numero_dps)
        with transaction.atomic():
            cfg = EmpresaConfig.objects.select_for_update().get(pk=self.config.pk)
            proximo = (cfg.ultimo_numero_dps or 0) + 1
            cfg.ultimo_numero_dps = proximo
            cfg.save(update_fields=['ultimo_numero_dps'])
            self.config.ultimo_numero_dps = proximo
        return proximo
