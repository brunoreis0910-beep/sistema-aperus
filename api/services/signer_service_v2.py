"""
Sistema de Assinatura XML para NFC-e - VERSÃO 2.0
Replicação EXATA do formato que funciona no SEFAZ MG
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
        Assina XML replicando EXATAMENTE o formato que funciona
        
        Args:
            xml_string: XML a ser assinado
            parent_tag: Tag do elemento a ser assinado (default: infNFe)
        
        Returns:
            XML assinado como string
        """
        try:
            logger.info(f"=== Iniciando assinatura V2 (formato exato SEFAZ) ===")
            
            # Parse XML SEM remover whitespace (preserva estrutura original)
            parser = etree.XMLParser(
                remove_blank_text=False,
                remove_comments=False,
                strip_cdata=False
            )
            root = etree.fromstring(xml_string.encode('utf-8'), parser=parser)
            
            # Localiza o elemento a ser assinado
            nsmap = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
            target = root.find(f'.//{{{nsmap["nfe"]}}}{parent_tag}')
            
            if target is None:
                target = root.find(f'.//{parent_tag}')
            
            if target is None:
                raise ValueError(f"Elemento {parent_tag} não encontrado no XML")
            
            # Obtém o ID
            element_id = target.get('Id')
            if not element_id:
                raise ValueError(f"Elemento {parent_tag} não possui atributo Id")
            
            logger.info(f"Elemento encontrado: {element_id}")
            
            # === PASSO 1: Calcular DigestValue ===
            # Calculate DigestValue using EXACT C14N
            # CRITICAL: Use tostring with method='c14n' to canonize in context
            digest_bytes_c14n = etree.tostring(target, method='c14n')
            digest_bytes = hashlib.sha1(digest_bytes_c14n).digest()
            digest_value = base64.b64encode(digest_bytes).decode('ascii')
            
            logger.info(f"DigestValue calculado: {digest_value}")
            logger.debug(f"XML canonicalizado (primeiros 200 bytes): {digest_bytes_c14n[:200]}")
            
            # === PASSO 2: Build Signature structure ===
            NS_DS = 'http://www.w3.org/2000/09/xmldsig#'
            # FIX: Use ONLY default namespace to match Valid XML (Authorized NFe)
            sig = etree.Element(f'{{{NS_DS}}}Signature', nsmap={None: NS_DS})
            
            # SignedInfo
            si = etree.SubElement(sig, f'{{{NS_DS}}}SignedInfo')
            
            cm = etree.SubElement(si, f'{{{NS_DS}}}CanonicalizationMethod')
            cm.set('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
            
            sm = etree.SubElement(si, f'{{{NS_DS}}}SignatureMethod')
            sm.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1')
            
            ref = etree.SubElement(si, f'{{{NS_DS}}}Reference')
            ref.set('URI', f'#{element_id}')
            
            transforms = etree.SubElement(ref, f'{{{NS_DS}}}Transforms')
            t1 = etree.SubElement(transforms, f'{{{NS_DS}}}Transform')
            t1.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature')
            t2 = etree.SubElement(transforms, f'{{{NS_DS}}}Transform')
            t2.set('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
            
            dm = etree.SubElement(ref, f'{{{NS_DS}}}DigestMethod')
            dm.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#sha1')
            
            dv = etree.SubElement(ref, f'{{{NS_DS}}}DigestValue')
            dv.text = digest_value
            
            # Format base64 with line breaks every 76 chars - RFC 2045 MIME standard
            # SEFAZ expects this formatting in SignatureValue and X509Certificate
            # Use \r (real CR) instead of &#13; string - lxml will serialize it correctly
            def format_base64_with_linebreaks(b64_string, line_length=76):
                """Add CR line breaks to base64 string every line_length characters"""
                lines = []
                for i in range(0, len(b64_string), line_length):
                    lines.append(b64_string[i:i+line_length])
                return '\r\n'.join(lines)  # Use real CRLF - lxml serializes as &#13;&#10;
            
            # === PASSO 3: Create placeholder SignatureValue (will be replaced) ===
            # We need to insert the Signature into the document BEFORE calculating SignatureValue
            # because C14N of SignedInfo depends on its position in the namespace context
            sv = etree.SubElement(sig, f'{{{NS_DS}}}SignatureValue')
            sv.text = ''  # Placeholder
            
            # KeyInfo
            ki = etree.SubElement(sig, f'{{{NS_DS}}}KeyInfo')
            x509data = etree.SubElement(ki, f'{{{NS_DS}}}X509Data')
            x509cert = etree.SubElement(x509data, f'{{{NS_DS}}}X509Certificate')
            x509cert.text = format_base64_with_linebreaks(self.cert_base64)
            
            # === PASSO 4: CRITICAL - Insert Signature into document BEFORE calculating SignatureValue ===
            # This ensures SignedInfo C14N is computed in the correct namespace context
            # (inside <Signature xmlns="..."> inside <NFe xmlns="...">)
            # If we calculate C14N when SignedInfo is standalone, xmlns="" attributes won't appear
            # and SEFAZ validation will fail with "Assinatura difere do calculado"
            destination = target.getparent()
            if destination is None:
                destination = root
                
            destination.append(sig)
            logger.debug("Signature inserida no documento (antes de calcular SignatureValue)")
            
            # === PASSO 5: NOW calculate SignatureValue with correct namespace context ===
            # CRITICAL: Use tostring with method='c14n' to canonize the element IN ITS CONTEXT
            # DO NOT use etree.ElementTree(si).write_c14n() as it creates a temporary tree and loses context!
            si_c14n = etree.tostring(si, method='c14n')
            
            logger.debug(f"SignedInfo C14N (primeiros 200 bytes): {si_c14n[:200]}")
            logger.debug(f"SignedInfo C14N (tamanho total): {len(si_c14n)} bytes")
            
            sig_bytes = self.private_key.sign(si_c14n, padding.PKCS1v15(), hashes.SHA1())
            signature_value = base64.b64encode(sig_bytes).decode('ascii')
            
            logger.info(f"SignatureValue calculado (primeiros 50 chars): {signature_value[:50]}...")
            
            # === PASSO 6: Update SignatureValue with actual signature ===
            sv.text = format_base64_with_linebreaks(signature_value)
            
            # Serialize using tostring to PRESERVE structure
            result = etree.tostring(root, encoding='unicode', method='xml')
            
            if not result.startswith('<?xml'):
                result = '<?xml version="1.0" encoding="UTF-8"?>' + result
            
            logger.info("XML assinado com sucesso (V2 - FIX SignedInfo C14N context)")
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
