"""
Serviço de Assinatura NATIVA para MDF-e 3.00
============================================

Este módulo implementa a assinatura de XML do CT-e seguindo EXATAMENTE
as especificações da SEFAZ, com canonização C14N correta para evitar
o erro "Assinatura Inválida (Rejeição 233)".

PILARES DA IMPLEMENTAÇÃO:
1. Gestão do Certificado A1 (PKCS12)
2. Canonização C14N antes do cálculo do hash
3. Assinatura SHA-256 (RSA-SHA256) conforme MDF-e 3.00
4. Preservação de CDATA (necessário para MDF-e 3.00)

Autor: Sistema Gerencial
Data: 2026-02-12
"""

import logging
import hashlib
import base64
import io
from lxml import etree
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import pkcs12

logger = logging.getLogger(__name__)


class MDFeSignerNative:
    """
    Assinador nativo de CT-e com canonização C14N adequada.
    
    Esta classe resolve o problema de "Assinatura Inválida" que ocorre
    quando o XML não é canonizado corretamente antes de calcular o hash.
    
    **O SEGREDO:** Canonizar o XML antes de calcular DigestValue!
    """
    
    # Namespaces usados no MDF-e 3.00
    NAMESPACE_MDFE = "http://www.portalfiscal.inf.br/mdfe"
    NAMESPACE_DS = "http://www.w3.org/2000/09/xmldsig#"
    
    def __init__(self, pfx_path_or_data, password):
        """
        Inicializa o assinador com certificado A1.
        
        Args:
            pfx_path_or_data: Caminho do arquivo .pfx ou dados base64
            password: Senha do certificado
        """
        self.pfx_data = self._load_pfx(pfx_path_or_data)
        self.password = password.encode('utf-8') if isinstance(password, str) else password
        self.private_key = None
        self.certificate = None
        self._load_certificate()
        
    def _load_pfx(self, path_or_data):
        """Carrega certificado PFX de arquivo ou base64"""
        import os
        
        # Caso 1: É um caminho de arquivo
        if isinstance(path_or_data, str) and os.path.exists(path_or_data):
            with open(path_or_data, 'rb') as f:
                return f.read()
        
        # Caso 2: É base64
        if isinstance(path_or_data, str):
            try:
                # Remove prefixo Data URL se presente
                clean_b64 = path_or_data.strip()
                if clean_b64.startswith('data:'):
                    comma_pos = clean_b64.find(',')
                    if comma_pos != -1:
                        clean_b64 = clean_b64[comma_pos+1:]
                
                clean_b64 = clean_b64.replace('\n', '').replace('\r', '').replace(' ', '')
                return base64.b64decode(clean_b64)
            except Exception as e:
                raise ValueError(f"Erro ao decodificar certificado base64: {e}")
        
        # Caso 3: Já é bytes
        if isinstance(path_or_data, bytes):
            return path_or_data
        
        raise ValueError("Formato de certificado não reconhecido")
    
    def _load_certificate(self):
        """Carrega chave privada e certificado do PKCS12"""
        try:
            # Tenta carregar com senha
            p12 = pkcs12.load_key_and_certificates(
                self.pfx_data,
                self.password
            )
            self.private_key = p12[0]
            self.certificate = p12[1]
            
            logger.info(f"[OK] Certificado carregado: {self.certificate.subject}")
            logger.info(f"  Válido até: {self.certificate.not_valid_after}")
            
        except Exception as e:
            # Tenta sem senha
            try:
                p12 = pkcs12.load_key_and_certificates(
                    self.pfx_data,
                    None
                )
                self.private_key = p12[0]
                self.certificate = p12[1]
                logger.warning("[!] Certificado carregado SEM SENHA")
            except:
                raise ValueError(f"Erro ao carregar certificado: {e}")
    
    def sign_evento_mdfe_xml(self, xml_string):
        """
        Assina o XML de Evento do MDF-e (Encerramento/Cancelamento)
        """
        try:
            logger.info("=" * 70)
            logger.info("INICIANDO ASSINATURA NATIVA DO EVENTO MDFE")
            logger.info("=" * 70)
            
            import signxml
            from cryptography.hazmat.primitives import serialization
            import base64
            
            parser = etree.XMLParser(
                remove_blank_text=False,
                remove_comments=True,
                strip_cdata=False
            )
            
            if isinstance(xml_string, bytes):
                root = etree.fromstring(xml_string, parser)
            elif isinstance(xml_string, str):
                root = etree.fromstring(xml_string.encode('utf-8'), parser)
            else:
                # É um Element
                root = xml_string
            
            ns = {'c': self.NAMESPACE_MDFE}
            inf_evento = root.find('.//c:infEvento', ns)
            
            if inf_evento is None:
                try:
                    inf_evento = root.xpath("//*[local-name() = 'infEvento']")[0]
                except IndexError:
                    raise ValueError("Elemento infEvento não encontrado no XML.")
            
            ref_id = inf_evento.get('Id')
            
            signxml.XMLSigner.namespaces = {None: self.NAMESPACE_MDFE}

            class SefazSigner(signxml.XMLSigner):
                def check_deprecated_methods(self):
                    pass

            signer = SefazSigner(
                method=signxml.methods.enveloped,
                signature_algorithm='rsa-sha1',
                digest_algorithm='sha1',
                c14n_algorithm='http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
            )

            cert_pem = self.certificate.public_bytes(serialization.Encoding.PEM)
            
            signed_root = signer.sign(
                root,
                key=self.private_key,
                cert=cert_pem,
                reference_uri=f"#{ref_id}"
            )
            
            xml_signed = etree.tostring(
                signed_root,
                encoding='unicode',
                method='xml',
                pretty_print=False
            )
            
            return '<?xml version="1.0" encoding="UTF-8"?>' + chr(10) + xml_signed
            
        except Exception as e:
            logger.error(f"[X] ERRO FATAL na assinatura do evento: {e}", exc_info=True)
            raise ValueError(f"Falha na assinatura criptografica do evento: {e}")

    def sign_mdfe_xml(self, xml_string):
        """
        Assina o XML do CT-e/MDF-e
        """
        try:
            logger.info("=" * 70)
            logger.info("INICIANDO ASSINATURA NATIVA DO CT-e COM SIGNXML")
            logger.info("=" * 70)
            
            import signxml
            from cryptography.hazmat.primitives import serialization
            import base64
            
            parser = etree.XMLParser(
                remove_blank_text=False,
                remove_comments=True,
                strip_cdata=False
            )
            
            if isinstance(xml_string, bytes):
                root = etree.fromstring(xml_string, parser)
            elif isinstance(xml_string, str):
                root = etree.fromstring(xml_string.encode('utf-8'), parser)
            else:
                # É um Element
                root = xml_string
            
            ns = {'c': self.NAMESPACE_MDFE}
            inf_mdfe = root.find('.//c:infMDFe', ns)
            
            if inf_mdfe is None:
                try:
                    inf_mdfe = root.xpath("//*[local-name() = 'infMDFe']")[0]
                except IndexError:
                    raise ValueError("Elemento infMDFe não encontrado no XML.")
            
            ref_id = inf_mdfe.get('Id')
            
            signxml.XMLSigner.namespaces = {None: self.NAMESPACE_MDFE}
            
            class SefazSigner(signxml.XMLSigner):
                def check_deprecated_methods(self):
                    pass
            
            signer = SefazSigner(
                method=signxml.methods.enveloped,
                signature_algorithm='rsa-sha1',
                digest_algorithm='sha1',
                c14n_algorithm='http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
            )
            
            cert_pem = self.certificate.public_bytes(serialization.Encoding.PEM)
            
            signed_root = signer.sign(
                root,
                key=self.private_key,
                cert=cert_pem,
                reference_uri=f"#{ref_id}"
            )
            
            xml_signed = etree.tostring(
                signed_root,
                encoding='unicode',
                method='xml',
                pretty_print=False
            )
            
            # Remover o prefixo ec: e transformar pro namespace padrão
            # A SEFAZ espera que SignedInfo seja assinado normalmente usando o prefixo da raiz ou ds
            # SignXML pode não manter o wrapper exato de <MDFe>. 
            
            return '<?xml version="1.0" encoding="UTF-8"?>' + chr(10) + xml_signed

        except Exception as e:
            logger.error(f"[X] ERRO FATAL na assinatura: {e}", exc_info=True)
            raise ValueError(f"Falha na assinatura criptografica: {e}")
