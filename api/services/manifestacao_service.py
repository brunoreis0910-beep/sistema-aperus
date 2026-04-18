"""
manifestacao_service.py — Manifestação do Destinatário NF-e
==========================================================
Eventos suportados (cTpEvento):
  210210 — Ciência da Operação        (sem justificativa)
  210200 — Confirmação da Operação    (sem justificativa)
  210240 — Desconhecimento da Operação (sem justificativa)
  210220 — Operação não Realizada     (justificativa obrigatória, mín. 15 chars)

Webservice Nacional (cOrgao=91):
  Produção:    https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx
  Homologação: https://hom.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx

DistribuicaoDFe (consulta NF-es recebidas):
  Produção:    https://www.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx
  Homologação: https://hom.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx
"""

import base64
import hashlib
import logging
import os
import re
import time
from datetime import datetime, timezone

import requests
from lxml import etree
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.backends import default_backend

logger = logging.getLogger(__name__)

# ─── Namespaces ────────────────────────────────────────────────────────────
NS_NFE = "http://www.portalfiscal.inf.br/nfe"
NS_DS  = "http://www.w3.org/2000/09/xmldsig#"

# ─── Descrição dos eventos ─────────────────────────────────────────────────
DESCRICAO_EVENTO = {
    '210210': 'Ciencia da Operacao',
    '210200': 'Confirmacao da Operacao',
    '210240': 'Desconhecimento da Operacao',
    '210220': 'Operacao nao Realizada',
}

# ─── Webservices ──────────────────────────────────────────────────────────
URL_RECEPCAO_EVENTO = {
    '1': 'https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
    '2': 'https://hom.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
}
URL_DISTRIBUICAO_DFE = {
    '1': 'https://www.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
    '2': 'https://hom.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx',
}

# Código de UF para cUFAutor (necessário no DistDFeInt)
UF_CODIGO = {
    'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
    'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
    'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
    'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
    'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
    'SE': '28', 'TO': '17',
}


# ─── Carregamento do Certificado ─────────────────────────────────────────
def _carregar_cert_e_chave(empresa_config):
    """
    Retorna (cert_pem_bytes, key_pem_bytes, cert_der_b64)
    Suporta caminho de arquivo ou base64.
    """
    cert_content = empresa_config.certificado_digital
    senha = empresa_config.senha_certificado or ''

    if not cert_content:
        # Tenta arquivo local
        if os.path.exists('certificado.pfx'):
            with open('certificado.pfx', 'rb') as f:
                pfx_bytes = f.read()
        else:
            raise ValueError("Certificado Digital não configurado na empresa.")
    elif any([cert_content.startswith('/'), ':\\' in cert_content,
              cert_content.startswith('\\\\'), cert_content.startswith('~/')]):
        # É caminho de arquivo
        if not os.path.exists(cert_content):
            raise ValueError(f"Arquivo de certificado não encontrado: {cert_content}")
        with open(cert_content, 'rb') as f:
            pfx_bytes = f.read()
    else:
        # É base64
        clean = cert_content.strip()
        if ',' in clean and clean.startswith('data:'):
            clean = clean.split(',', 1)[1]
        clean = clean.replace('\n', '').replace('\r', '').replace(' ', '')
        pfx_bytes = base64.b64decode(clean)

    senha_bytes = senha.encode('utf-8') if isinstance(senha, str) else senha

    private_key, certificate, _ = pkcs12.load_key_and_certificates(
        pfx_bytes, senha_bytes, backend=default_backend()
    )

    cert_pem = certificate.public_bytes(serialization.Encoding.PEM)
    key_pem  = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    cert_der_b64 = base64.b64encode(
        certificate.public_bytes(serialization.Encoding.DER)
    ).decode('utf-8')

    return cert_pem, key_pem, cert_der_b64, private_key, certificate


# ─── Assinatura do Evento ────────────────────────────────────────────────
def _assinar_evento(xml_str: str, private_key, cert_der_b64: str, ref_id: str) -> str:
    """
    Assina o XML do evento usando RSA-SHA1 (padrão SEFAZ NF-e).
    Assina o elemento com Id=ref_id.
    """
    parser = etree.XMLParser(remove_blank_text=False)
    root = etree.fromstring(xml_str.encode('utf-8'), parser)

    # Localiza o infEvento que será assinado
    ns = {'nfe': NS_NFE}
    inf_evento = root.find('.//nfe:infEvento', ns)
    if inf_evento is None:
        raise ValueError("infEvento não encontrado no XML")

    # 1. Canonicalizar o elemento infEvento (C14N exclusivo)
    c14n = etree.tostring(inf_evento, method='c14n', exclusive=True)

    # 2. Digest SHA-1 do infEvento canonicalizado
    digest = hashlib.sha1(c14n).digest()
    digest_b64 = base64.b64encode(digest).decode('utf-8')

    # 3. Montar SignedInfo
    signed_info_xml = (
        f'<SignedInfo xmlns="{NS_DS}">'
        f'<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>'
        f'<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>'
        f'<Reference URI="#{ref_id}">'
        f'<Transforms>'
        f'<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>'
        f'<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>'
        f'</Transforms>'
        f'<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>'
        f'<DigestValue>{digest_b64}</DigestValue>'
        f'</Reference>'
        f'</SignedInfo>'
    )

    # 4. Canonicalizar SignedInfo
    si_root = etree.fromstring(signed_info_xml.encode('utf-8'))
    c14n_si = etree.tostring(si_root, method='c14n', exclusive=True)

    # 5. Assinar com RSA-SHA1
    signature_bytes = private_key.sign(c14n_si, padding.PKCS1v15(), hashes.SHA1())
    signature_b64 = base64.b64encode(signature_bytes).decode('utf-8')

    # 6. Montar bloco <Signature>
    signature_block = (
        f'<Signature xmlns="{NS_DS}">'
        f'{signed_info_xml}'
        f'<SignatureValue>{signature_b64}</SignatureValue>'
        f'<KeyInfo>'
        f'<X509Data>'
        f'<X509Certificate>{cert_der_b64}</X509Certificate>'
        f'</X509Data>'
        f'</KeyInfo>'
        f'</Signature>'
    )

    # 7. Inserir <Signature> dentro de <evento>, após <infEvento>
    evento_el = root.find('.//nfe:evento', ns)
    sig_el = etree.fromstring(signature_block.encode('utf-8'))
    evento_el.append(sig_el)

    return etree.tostring(root, encoding='unicode')


# ─── Montagem do XML do Evento ────────────────────────────────────────────
def _montar_xml_evento(cnpj: str, chave_nfe: str, tipo_evento: str,
                       n_seq: int, justificativa: str | None,
                       dh_evento: str, id_lote: str) -> tuple[str, str]:
    """
    Retorna (xml_str, ref_id) onde ref_id é o Id do infEvento.
    """
    descricao = DESCRICAO_EVENTO[tipo_evento]
    ref_id = f'ID{tipo_evento}{chave_nfe}{str(n_seq).zfill(2)}'

    det_evento = f'<descEvento>{descricao}</descEvento>'
    if tipo_evento == '210220':
        if not justificativa or len(justificativa.strip()) < 15:
            raise ValueError("Justificativa obrigatória para 'Operação não Realizada' (mínimo 15 caracteres)")
        det_evento += f'<xJust>{justificativa.strip()}</xJust>'

    xml = (
        f'<envEvento versao="1.00" xmlns="{NS_NFE}">'
        f'<idLote>{id_lote}</idLote>'
        f'<evento versao="1.00">'
        f'<infEvento Id="{ref_id}">'
        f'<cOrgao>91</cOrgao>'
        f'<tpAmb>__TPAMB__</tpAmb>'
        f'<CNPJ>{cnpj}</CNPJ>'
        f'<chNFe>{chave_nfe}</chNFe>'
        f'<dhEvento>{dh_evento}</dhEvento>'
        f'<tpEvento>{tipo_evento}</tpEvento>'
        f'<nSeqEvento>{n_seq}</nSeqEvento>'
        f'<verEvento>1.00</verEvento>'
        f'<detEvento versao="1.00">{det_evento}</detEvento>'
        f'</infEvento>'
        f'</evento>'
        f'</envEvento>'
    )
    return xml, ref_id


# ─── Envio SOAP para RecepcaoEvento ─────────────────────────────────────
def _enviar_evento_soap(xml_assinado: str, ambiente: str, cert_pem: bytes, key_pem: bytes) -> str:
    """Envolve o XML em envelope SOAP e envia para a SEFAZ. Retorna o XML de retorno."""
    # Remove declaração XML se presente
    xml_assinado = re.sub(r'<\?xml[^>]*\?>', '', xml_assinado).strip()

    soap = (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
        'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'
        '<soap12:Header>'
        '<nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">'
        '<versaoDados>1.00</versaoDados>'
        '<cUF>91</cUF>'
        '</nfeCabecMsg>'
        '</soap12:Header>'
        '<soap12:Body>'
        '<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">'
        f'{xml_assinado}'
        '</nfeDadosMsg>'
        '</soap12:Body>'
        '</soap12:Envelope>'
    )

    url = URL_RECEPCAO_EVENTO[ambiente]

    # Salva cert/key em arquivos temporários
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.pem', delete=False) as fc:
        fc.write(cert_pem)
        cert_tmp = fc.name
    with tempfile.NamedTemporaryFile(suffix='.pem', delete=False) as fk:
        fk.write(key_pem)
        key_tmp = fk.name

    SOAP_ACTION = 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento'
    try:
        resp = requests.post(
            url,
            data=soap.encode('utf-8'),
            headers={
                'Content-Type': f'application/soap+xml; charset=utf-8; action="{SOAP_ACTION}"',
            },
            cert=(cert_tmp, key_tmp),
            timeout=30,
            verify=False,
        )
        resp.raise_for_status()
        return resp.text
    finally:
        os.unlink(cert_tmp)
        os.unlink(key_tmp)


# ─── Parse da Resposta ────────────────────────────────────────────────────
def _parse_retorno_evento(xml_retorno: str) -> dict:
    """Extrai cStat, xMotivo, protocolo e dhRegEvento da resposta SEFAZ."""
    try:
        root = etree.fromstring(xml_retorno.encode('utf-8') if isinstance(xml_retorno, str) else xml_retorno)
    except Exception:
        return {'c_stat': '999', 'x_motivo': 'Erro ao parsear resposta', 'protocolo': None, 'dh_reg_evento': None}

    ns = {'nfe': NS_NFE}

    def _find(tag):
        el = root.find(f'.//{{{NS_NFE}}}{tag}')
        return el.text if el is not None else None

    return {
        'c_stat': _find('cStat'),
        'x_motivo': _find('xMotivo'),
        'protocolo': _find('nProt'),
        'dh_reg_evento': _find('dhRegEvento'),
    }


# ─── SOAP para DistribuicaoDFe ────────────────────────────────────────────
def _enviar_dist_dfe_soap(xml_dist: str, ambiente: str, cert_pem: bytes, key_pem: bytes) -> str:
    soap = (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
        'xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'
        '<soap12:Body>'
        '<nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">'
        '<nfeDadosMsg>'
        f'{xml_dist}'
        '</nfeDadosMsg>'
        '</nfeDistDFeInteresse>'
        '</soap12:Body>'
        '</soap12:Envelope>'
    )

    url = URL_DISTRIBUICAO_DFE[ambiente]

    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.pem', delete=False) as fc:
        fc.write(cert_pem)
        cert_tmp = fc.name
    with tempfile.NamedTemporaryFile(suffix='.pem', delete=False) as fk:
        fk.write(key_pem)
        key_tmp = fk.name

    SOAP_ACTION = 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse'
    try:
        resp = requests.post(
            url,
            data=soap.encode('utf-8'),
            headers={
                'Content-Type': f'application/soap+xml; charset=utf-8; action="{SOAP_ACTION}"',
            },
            cert=(cert_tmp, key_tmp),
            timeout=60,
            verify=False,
        )
        resp.raise_for_status()
        return resp.text
    finally:
        os.unlink(cert_tmp)
        os.unlink(key_tmp)


# ─── Classe Principal ─────────────────────────────────────────────────────
class ManifestacaoService:
    """
    Fachada principal para manifestação do destinatário.

    Uso:
        svc = ManifestacaoService(empresa_config)
        resultado = svc.manifestar(chave_nfe, '210200')
        nfes = svc.consultar_nfes_recebidas()
    """

    def __init__(self, empresa_config):
        self.empresa = empresa_config
        self.cnpj = (empresa_config.cpf_cnpj or '').replace('.', '').replace('/', '').replace('-', '')
        self.ambiente = str(empresa_config.ambiente_nfe or '2')
        self.uf = empresa_config.estado or 'MG'
        self.c_uf = UF_CODIGO.get(self.uf, '31')

        self.cert_pem, self.key_pem, self.cert_der_b64, self.private_key, self.certificate = \
            _carregar_cert_e_chave(empresa_config)

    def manifestar(self, chave_nfe: str, tipo_evento: str,
                   justificativa: str = None, n_seq: int = 1) -> dict:
        """
        Envia evento de manifestação para a SEFAZ.

        Returns dict com:
          sucesso (bool), c_stat, x_motivo, protocolo, dh_reg_evento,
          xml_evento, xml_retorno
        """
        if tipo_evento not in DESCRICAO_EVENTO:
            raise ValueError(f"tipo_evento inválido: {tipo_evento}. Use: {list(DESCRICAO_EVENTO.keys())}")

        if len(chave_nfe) != 44 or not chave_nfe.isdigit():
            raise ValueError(f"Chave NF-e inválida (deve ter 44 dígitos): {chave_nfe}")

        # Data/hora do evento no formato SEFAZ
        agora = datetime.now(tz=timezone.utc).astimezone()
        dh_evento = agora.strftime('%Y-%m-%dT%H:%M:%S') + agora.strftime('%z')[:3] + ':' + agora.strftime('%z')[3:]

        id_lote = str(int(time.time()))

        # Monta XML do evento
        xml_str, ref_id = _montar_xml_evento(
            cnpj=self.cnpj,
            chave_nfe=chave_nfe,
            tipo_evento=tipo_evento,
            n_seq=n_seq,
            justificativa=justificativa,
            dh_evento=dh_evento,
            id_lote=id_lote,
        )
        xml_str = xml_str.replace('__TPAMB__', self.ambiente)

        # Assina o XML
        xml_assinado = _assinar_evento(xml_str, self.private_key, self.cert_der_b64, ref_id)

        # Envia para SEFAZ
        try:
            xml_retorno = _enviar_evento_soap(xml_assinado, self.ambiente, self.cert_pem, self.key_pem)
        except Exception as exc:
            logger.exception("Erro ao enviar evento para SEFAZ")
            return {
                'sucesso': False,
                'c_stat': '999',
                'x_motivo': f'Erro de comunicação: {exc}',
                'protocolo': None,
                'dh_reg_evento': None,
                'xml_evento': xml_assinado,
                'xml_retorno': '',
            }

        retorno = _parse_retorno_evento(xml_retorno)
        # 135 = Evento registrado e vinculado a NF-e
        # 136 = Evento registrado, mas NF-e não encontrada na base
        sucesso = retorno['c_stat'] in ('135', '136')

        return {
            'sucesso': sucesso,
            **retorno,
            'xml_evento': xml_assinado,
            'xml_retorno': xml_retorno,
        }

    def consultar_nfes_recebidas(self, ult_nsu: str = '000000000000000') -> dict:
        """
        Consulta NF-es recebidas pelo destinatário via DistribuicaoDFe.

        Returns dict com:
          sucesso (bool), nfes (list), ult_nsu, max_nsu, x_motivo
        """
        xml_dist = (
            f'<distDFeInt xmlns="{NS_NFE}" versao="1.01">'
            f'<tpAmb>{self.ambiente}</tpAmb>'
            f'<cUFAutor>{self.c_uf}</cUFAutor>'
            f'<CNPJ>{self.cnpj}</CNPJ>'
            f'<distNSU>'
            f'<ultNSU>{ult_nsu.zfill(15)}</ultNSU>'
            f'</distNSU>'
            f'</distDFeInt>'
        )

        try:
            xml_retorno = _enviar_dist_dfe_soap(xml_dist, self.ambiente, self.cert_pem, self.key_pem)
        except Exception as exc:
            logger.exception("Erro ao consultar DistribuicaoDFe")
            return {
                'sucesso': False,
                'nfes': [],
                'ult_nsu': ult_nsu,
                'max_nsu': '',
                'x_motivo': f'Erro de comunicação: {exc}',
            }

        return self._parse_dist_dfe(xml_retorno)

    def _parse_dist_dfe(self, xml_retorno: str) -> dict:
        """Faz parse da resposta do DistribuicaoDFe e extrai lista de NF-es."""
        nfes = []
        try:
            root = etree.fromstring(xml_retorno.encode('utf-8') if isinstance(xml_retorno, str) else xml_retorno)

            def _find(tag):
                el = root.find(f'.//{{{NS_NFE}}}{tag}')
                return el.text if el is not None else None

            c_stat   = _find('cStat') or ''
            x_motivo = _find('xMotivo') or ''
            ult_nsu  = _find('ultNSU') or ''
            max_nsu  = _find('maxNSU') or ''

            sucesso = c_stat in ('137', '138')  # 137=ok c/docs, 138=ok sem docs

            # Iterar sobre docZip
            for doc_zip in root.findall(f'.//{{{NS_NFE}}}docZip'):
                nsu   = doc_zip.get('NSU', '')
                schema = doc_zip.get('schema', '')
                conteudo_b64 = doc_zip.text or ''

                nfe_info = self._extrair_info_nfe(conteudo_b64, schema, nsu)
                if nfe_info:
                    nfes.append(nfe_info)

            return {
                'sucesso': sucesso,
                'c_stat': c_stat,
                'x_motivo': x_motivo,
                'nfes': nfes,
                'ult_nsu': ult_nsu,
                'max_nsu': max_nsu,
            }

        except Exception as exc:
            logger.exception("Erro ao fazer parse do DistribuicaoDFe")
            return {
                'sucesso': False,
                'nfes': [],
                'ult_nsu': '',
                'max_nsu': '',
                'x_motivo': f'Erro ao processar resposta: {exc}',
            }

    def _extrair_info_nfe(self, conteudo_b64: str, schema: str, nsu: str) -> dict | None:
        """Descomprime e extrai informações básicas de uma NF-e ou resEvento."""
        import gzip
        try:
            raw = base64.b64decode(conteudo_b64)
            try:
                xml_bytes = gzip.decompress(raw)
            except Exception:
                xml_bytes = raw

            xml_str = xml_bytes.decode('utf-8', errors='replace')
            root = etree.fromstring(xml_bytes)

            ns = {'nfe': NS_NFE}

            if 'resNFe' in schema:
                # Resumo da NF-e
                chave   = root.find('.//nfe:chNFe', ns)
                emit    = root.find('.//nfe:xNome', ns)
                valor   = root.find('.//nfe:vNF', ns)
                dh_emi  = root.find('.//nfe:dhEmi', ns)
                c_sit   = root.find('.//nfe:cSitNFe', ns)
                n_nf    = root.find('.//nfe:nNF', ns)
                serie   = root.find('.//nfe:serie', ns)
                cnpj_e  = root.find('.//nfe:CNPJ', ns)
                ind_sit = c_sit.text if c_sit is not None else ''
                situacao_map = {
                    '1': 'Autorizada',
                    '2': 'Cancelada',
                    '3': 'Inutilizada',
                }
                return {
                    'nsu': nsu,
                    'schema': schema,
                    'chave_nfe': chave.text if chave is not None else '',
                    'emitente_nome': emit.text if emit is not None else '',
                    'emitente_cnpj': cnpj_e.text if cnpj_e is not None else '',
                    'valor_nfe': float(valor.text) if valor is not None else 0,
                    'data_emissao': dh_emi.text[:10] if dh_emi is not None else '',
                    'numero_nfe': n_nf.text if n_nf is not None else '',
                    'serie': serie.text if serie is not None else '',
                    'situacao': situacao_map.get(ind_sit, ind_sit),
                    'xml': xml_str,
                }
            elif 'procNFe' in schema or 'NFe' in schema:
                # NF-e completa
                inf_nfe = root.find('.//{http://www.portalfiscal.inf.br/nfe}infNFe')
                if inf_nfe is None:
                    return None
                chave = inf_nfe.get('Id', '').replace('NFe', '')
                emit  = inf_nfe.find('.//nfe:emit', ns)
                total = inf_nfe.find('.//nfe:total/nfe:ICMSTot', ns)
                ide   = inf_nfe.find('.//nfe:ide', ns)
                return {
                    'nsu': nsu,
                    'schema': schema,
                    'chave_nfe': chave,
                    'emitente_nome': (emit.find('nfe:xNome', ns).text if emit is not None and emit.find('nfe:xNome', ns) is not None else ''),
                    'emitente_cnpj': (emit.find('nfe:CNPJ', ns).text if emit is not None and emit.find('nfe:CNPJ', ns) is not None else ''),
                    'valor_nfe': float(total.find('nfe:vNF', ns).text) if total is not None and total.find('nfe:vNF', ns) is not None else 0,
                    'data_emissao': (ide.find('nfe:dhEmi', ns).text[:10] if ide is not None and ide.find('nfe:dhEmi', ns) is not None else ''),
                    'numero_nfe': (ide.find('nfe:nNF', ns).text if ide is not None and ide.find('nfe:nNF', ns) is not None else ''),
                    'serie': (ide.find('nfe:serie', ns).text if ide is not None and ide.find('nfe:serie', ns) is not None else ''),
                    'situacao': 'Autorizada',
                    'xml': xml_str,
                }
        except Exception as exc:
            logger.warning(f"Erro ao extrair info da NF-e (NSU={nsu}): {exc}")
        return None
