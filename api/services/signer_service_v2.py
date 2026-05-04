"""
Sistema de Assinatura XML para NFC-e - VERSÃO 2.0
Usa signxml para Inclusive C14N correto (compatível com SEFAZ MG)
"""

import base64
import hashlib
import io
import re
from lxml import etree
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
from cryptography import x509
import logging

logger = logging.getLogger(__name__)

# signxml: biblioteca de XML Signature correta para SEFAZ
# Monkey-patch para permitir SHA1 (SEFAZ usa SHA1 legado)
from signxml import XMLSigner as _XMLSigner, methods as _signxml_methods
from signxml.algorithms import SignatureMethod as _SigMethod, DigestAlgorithm as _DigestAlg, CanonicalizationMethod as _C14NMethod
_XMLSigner.check_deprecated_methods = lambda self: None


class XMLSignerV2:
    """Assinador XML que replica exatamente o formato aprovado pelo SEFAZ"""
    
    def __init__(self, cert_path, cert_password):
        self.cert_path = cert_path
        self.cert_password = cert_password
        self._load_certificate()
    
    def _load_certificate(self):
        """Carrega certificado e chave privada (suporta arquivo ou Data URI)"""
        try:
            # Verifica se é Data URI (formato: data:application/x-pkcs12;base64,DADOS)
            if self.cert_path.startswith('data:application/x-pkcs12;base64,'):
                logger.info("Certificado em formato Data URI (base64)")
                # Remove o prefixo e decodifica base64
                base64_data = self.cert_path.split(',', 1)[1]
                cert_data = base64.b64decode(base64_data)
            else:
                # É um caminho de arquivo
                logger.info(f"Carregando certificado de arquivo: {self.cert_path}")
                with open(self.cert_path, 'rb') as f:
                    cert_data = f.read()
            
            # Carrega o certificado A1 (.pfx)
            from cryptography.hazmat.primitives.serialization import pkcs12
            
            private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
                cert_data,
                self.cert_password.encode() if isinstance(self.cert_password, str) else self.cert_password,
                backend=default_backend()
            )
            
            self.private_key = private_key
            self.certificate = certificate
            
            # Converte certificado para string base64
            cert_pem = certificate.public_bytes(serialization.Encoding.DER)
            self.cert_base64 = base64.b64encode(cert_pem).decode('utf-8')
            
            logger.info(f"Certificado carregado: {certificate.subject}")
            
        except Exception as e:
            logger.exception(f"Erro ao carregar certificado: {e}")
            raise
    
    def sign_xml(self, xml_string, parent_tag='infNFe'):
        """
        Assina XML usando signxml com Inclusive C14N correto (SEFAZ MG).

        Args:
            xml_string: XML a ser assinado
            parent_tag: Tag do elemento a ser assinado (default: infNFe)

        Returns:
            XML assinado como string
        """
        try:
            logger.info("=== Iniciando assinatura V2 via signxml ===")

            # Remove declaração XML se existir
            clean_xml = xml_string
            if '?>' in clean_xml:
                clean_xml = clean_xml.split('?>', 1)[1].strip()

            # Parse XML preservando estrutura original
            parser = etree.XMLParser(
                remove_blank_text=False,
                remove_comments=False,
                strip_cdata=False
            )
            root = etree.fromstring(clean_xml.encode('utf-8'), parser=parser)

            # Localiza o elemento a ser assinado
            NFE_NS = 'http://www.portalfiscal.inf.br/nfe'
            target = root.find(f'.//{{{NFE_NS}}}{parent_tag}')
            if target is None:
                target = root.find(f'.//{parent_tag}')
            if target is None:
                raise ValueError(f"Elemento {parent_tag} não encontrado no XML")

            element_id = target.get('Id')
            if not element_id:
                raise ValueError(f"Elemento {parent_tag} não possui atributo Id")

            logger.info(f"Elemento encontrado: {element_id}")

            # Converte certificado para PEM (signxml precisa de PEM ou objeto crypto)
            cert_pem = self.certificate.public_bytes(serialization.Encoding.PEM)

            # Instancia o signer signxml (SHA1 necessário para SEFAZ legado)
            signer = _XMLSigner(
                method=_signxml_methods.enveloped,
                signature_algorithm=_SigMethod.RSA_SHA1,
                digest_algorithm=_DigestAlg.SHA1,
                c14n_algorithm=_C14NMethod.CANONICAL_XML_1_0,
            )

            # Assina o XML - signxml insere <Signature> após infNFe dentro de NFe
            signed_root = signer.sign(
                root,
                key=self.private_key,
                cert=cert_pem,
                reference_uri='#' + element_id,
            )

            # Serializa para string
            result = '<?xml version="1.0" encoding="UTF-8"?>' + etree.tostring(
                signed_root, encoding='unicode', method='xml'
            )

            logger.info("XML assinado com sucesso (V2 via signxml)")
            return result

        except Exception as e:
            logger.exception(f"Erro ao assinar XML (V2): {e}")
            raise

    def _calculate_digest(self, element):
        """Calcula DigestValue do elemento usando C14N"""
        buffer = io.BytesIO()
        etree.ElementTree(element).write_c14n(buffer)
        canonical_bytes = buffer.getvalue()
        
        digest = hashlib.sha1(canonical_bytes).digest()
        return base64.b64encode(digest).decode('utf-8')
    
    def _calculate_signature_value_from_string(self, signed_info_str):
        """
        Calcula SignatureValue de uma STRING SignedInfo.
        
        Para garantir canonização correta: inserir SignedInfo dentro de Signature
        com namespace xmldsig, parsear, canonizar, assinar.
        """
        DS_NS = 'http://www.w3.org/2000/09/xmldsig#'
        
        # Criar documento Signature com o SignedInfo
        full_sig_str = f'<Signature xmlns="{DS_NS}">{signed_info_str}</Signature>'
        
        # Parse
        parser = etree.XMLParser(remove_blank_text=False)
        sig_elem = etree.fromstring(full_sig_str.encode('utf-8'), parser=parser)
        signed_info_elem = sig_elem.find(f'{{{DS_NS}}}SignedInfo')
        
        # Canonizar
        buffer = io.BytesIO()
        etree.ElementTree(signed_info_elem).write_c14n(buffer, exclusive=False)
        canonical_bytes = buffer.getvalue()
        
        logger.debug(f"SignedInfo canonizado (tamanho): {len(canonical_bytes)} bytes")
        logger.debug(f"SignedInfo canonizado (hex primeiros 100): {canonical_bytes[:100].hex()}")
        
        # Assinar
        signature_bytes = self.private_key.sign(canonical_bytes, padding.PKCS1v15(), hashes.SHA1())
        return base64.b64encode(signature_bytes).decode('utf-8')




def sign_nfce_xml(xml_string, cert_path, cert_password):
    """
    Função helper para assinar NFCe
    
    Args:
        xml_string: XML da NFCe a ser assinada
        cert_path: Caminho do certificado .pfx
        cert_password: Senha do certificado
    
    Returns:
        XML assinado como string
    """
    signer = XMLSignerV2(cert_path, cert_password)
    return signer.sign_xml(xml_string, parent_tag='infNFe')
