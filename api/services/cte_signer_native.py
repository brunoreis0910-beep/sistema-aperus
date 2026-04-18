"""
Serviço de Assinatura NATIVA para CT-e 4.00
============================================

Este módulo implementa a assinatura de XML do CT-e seguindo EXATAMENTE
as especificações da SEFAZ, com canonização C14N correta para evitar
o erro "Assinatura Inválida (Rejeição 233)".

PILARES DA IMPLEMENTAÇÃO:
1. Gestão do Certificado A1 (PKCS12)
2. Canonização C14N antes do cálculo do hash
3. Assinatura SHA-256 (RSA-SHA256) conforme CT-e 4.00
4. Preservação de CDATA (necessário para CT-e 4.00)

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


class CTeSignerNative:
    """
    Assinador nativo de CT-e com canonização C14N adequada.
    
    Esta classe resolve o problema de "Assinatura Inválida" que ocorre
    quando o XML não é canonizado corretamente antes de calcular o hash.
    
    **O SEGREDO:** Canonizar o XML antes de calcular DigestValue!
    """
    
    # Namespaces usados no CT-e 4.00
    NAMESPACE_CTE = "http://www.portalfiscal.inf.br/cte"
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
    
    def sign_cte_xml(self, xml_string):
        """
        Assina o XML do CT-e seguindo o padrão SEFAZ.
        
        **ETAPAS CRÍTICAS:**
        1. Parse do XML preservando CDATA
        2. Localiza tag <infCte Id="CTe...">
        3. **CANONIZA** o elemento infCte (C14N)
        4. Calcula SHA-256 do XML canonizado → DigestValue
        5. Monta estrutura <Signature>
        6. **CANONIZA** o <SignedInfo>
        7. Assina com chave privada (RSA-SHA256) → SignatureValue
        8. Insere <Signature> após </infCte>
        
        Args:
            xml_string: XML do CT-e (string ou bytes)
            
        Returns:
            XML assinado como string
        """
        try:
            logger.info("=" * 70)
            logger.info("INICIANDO ASSINATURA NATIVA DO CT-e")
            logger.info("=" * 70)
            
            # 1. Parse XML SEM remover espaços (preserva CDATA)
            parser = etree.XMLParser(
                remove_blank_text=False,  # Preserva espaços
                remove_comments=True,      # Remove comentários
                strip_cdata=False          # **CRÍTICO**: Preserva CDATA do QRCode
            )
            
            if isinstance(xml_string, bytes):
                root = etree.fromstring(xml_string, parser)
            else:
                root = etree.fromstring(xml_string.encode('utf-8'), parser)
            
            logger.info("[OK] XML parseado com sucesso")
            
            # 2. Localizar tag infCte
            ns = {'c': self.NAMESPACE_CTE}
            inf_cte = root.find('.//c:infCte', ns)
            
            if inf_cte is None:
                # Tenta sem namespace (fallback)
                inf_cte = root.xpath("//*[local-name() = 'infCte']")[0]
            
            if inf_cte is None:
                raise ValueError("Tag <infCte> não encontrada no XML")
            
            # Pegar o Id (ex: "CTe31260212345678901234570000000000011234567890")
            ref_id = inf_cte.get('Id')
            if not ref_id:
                raise ValueError("Atributo Id não encontrado em <infCte>")
            
            logger.info(f"[OK] Tag infCte encontrada: Id={ref_id}")
            
            # 3. **CANONIZAÇÃO C14N** do elemento infCte
            # Este é o segredo! A SEFAZ valida o hash do XML canonizado
            logger.info("[TOOL] Canonizando <infCte> (C14N)...")
            
            c14n_buffer = io.BytesIO()
            etree.ElementTree(inf_cte).write_c14n(c14n_buffer)
            inf_cte_c14n = c14n_buffer.getvalue()
            
            logger.info(f"[OK] Canonização completa: {len(inf_cte_c14n)} bytes")
            logger.debug(f"  Primeiros 200 bytes: {inf_cte_c14n[:200]}")
            
            # 4. Calcular DigestValue (SHA-1 do XML canonizado)
            logger.info("[TOOL] Calculando DigestValue (SHA-256)...")

            digest_bytes = hashlib.sha256(inf_cte_c14n).digest()
            digest_value = base64.b64encode(digest_bytes).decode('ascii')

            logger.info(f"[OK] DigestValue calculado: {digest_value}")
            
            # 5. Construir estrutura <Signature>
            logger.info("[TOOL] Construindo estrutura <Signature>...")
            
            # Namespace: APENAS o padrão (sem prefixo ds:)
            sig = etree.Element(
                f'{{{self.NAMESPACE_DS}}}Signature',
                nsmap={None: self.NAMESPACE_DS}  # Namespace padrão
            )
            
            # <SignedInfo>
            signed_info = etree.SubElement(sig, f'{{{self.NAMESPACE_DS}}}SignedInfo')
            
            # <CanonicalizationMethod>
            c14n_method = etree.SubElement(signed_info, f'{{{self.NAMESPACE_DS}}}CanonicalizationMethod')
            c14n_method.set('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
            
            # <SignatureMethod>
            sig_method = etree.SubElement(signed_info, f'{{{self.NAMESPACE_DS}}}SignatureMethod')
            sig_method.set('Algorithm', 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256')
            
            # <Reference>
            reference = etree.SubElement(signed_info, f'{{{self.NAMESPACE_DS}}}Reference')
            reference.set('URI', f'#{ref_id}')
            
            # <Transforms>
            transforms = etree.SubElement(reference, f'{{{self.NAMESPACE_DS}}}Transforms')
            
            # Enveloped Signature
            transform1 = etree.SubElement(transforms, f'{{{self.NAMESPACE_DS}}}Transform')
            transform1.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature')
            
            # C14N
            transform2 = etree.SubElement(transforms, f'{{{self.NAMESPACE_DS}}}Transform')
            transform2.set('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
            
            # <DigestMethod>
            digest_method = etree.SubElement(reference, f'{{{self.NAMESPACE_DS}}}DigestMethod')
            digest_method.set('Algorithm', 'http://www.w3.org/2001/04/xmlenc#sha256')
            
            # <DigestValue>
            digest_elem = etree.SubElement(reference, f'{{{self.NAMESPACE_DS}}}DigestValue')
            digest_elem.text = digest_value
            
            logger.info("[OK] Estrutura <SignedInfo> montada")
            
            # 6. **CANONIZAR** o <SignedInfo>
            logger.info("[TOOL] Canonizando <SignedInfo> (C14N)...")
            
            si_c14n_buffer = io.BytesIO()
            etree.ElementTree(signed_info).write_c14n(si_c14n_buffer)
            signed_info_c14n = si_c14n_buffer.getvalue()
            
            logger.info(f"[OK] SignedInfo canonizado: {len(signed_info_c14n)} bytes")
            logger.debug(f"  Primeiros 200 bytes: {signed_info_c14n[:200]}")
            
            # 7. Assinar com chave privada RSA-SHA1
            logger.info("[TOOL] Assinando com chave privada (RSA-SHA256)...")

            signature_bytes = self.private_key.sign(
                signed_info_c14n,
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            signature_value = base64.b64encode(signature_bytes).decode('ascii')
            
            logger.info(f"[OK] SignatureValue calculado: {len(signature_value)} caracteres")
            logger.debug(f"  SignatureValue: {signature_value[:100]}...")
            
            # <SignatureValue>
            sig_value_elem = etree.SubElement(sig, f'{{{self.NAMESPACE_DS}}}SignatureValue')
            sig_value_elem.text = signature_value
            
            # 8. <KeyInfo> com certificado X509
            logger.info("[TOOL] Adicionando certificado X509...")
            
            key_info = etree.SubElement(sig, f'{{{self.NAMESPACE_DS}}}KeyInfo')
            x509_data = etree.SubElement(key_info, f'{{{self.NAMESPACE_DS}}}X509Data')
            x509_cert = etree.SubElement(x509_data, f'{{{self.NAMESPACE_DS}}}X509Certificate')
            
            # Pegar conteúdo do certificado (sem header/footer PEM)
            cert_pem = self.certificate.public_bytes(serialization.Encoding.PEM).decode('ascii')
            cert_lines = cert_pem.split('\n')
            cert_content = ''.join(cert_lines[1:-2])  # Remove BEGIN/END
            x509_cert.text = cert_content
            
            logger.info("[OK] Certificado X509 adicionado")
            
            # 9. Inserir <Signature> no XML
            # A assinatura DEVE ser filha do elemento raiz <CTe>, após <infCte>
            logger.info("[TOOL] Inserindo <Signature> no XML...")
            
            # root é o elemento <CTe>
            root.append(sig)
            
            logger.info("[OK] <Signature> inserida após <infCte>")
            
            # 10. Serializar XML com CDATA preservado
            # **IMPORTANTE**: Usar method='xml' para manter CDATA
            # (write_c14n remove CDATA, causando rejeição 225)
            xml_signed = etree.tostring(
                root,
                encoding='unicode',
                method='xml',
                pretty_print=False  # Sem formatação extra
            )
            
            # Adicionar declaração XML se não houver
            if not xml_signed.startswith('<?xml'):
                xml_signed = '<?xml version="1.0" encoding="UTF-8"?>' + xml_signed
            
            logger.info("=" * 70)
            logger.info("[OK] ASSINATURA CONCLUÍDA COM SUCESSO!")
            logger.info("=" * 70)
            logger.info(f"Tamanho do XML assinado: {len(xml_signed)} caracteres")
            
            return xml_signed
            
        except Exception as e:
            logger.error("=" * 70)
            logger.error("[ERROR] ERRO NA ASSINATURA")
            logger.error("=" * 70)
            logger.exception(f"Detalhes: {e}")
            raise
    
    def get_cert_key_pem(self):
        """
        Retorna caminhos temporários para certificado e chave em formato PEM.
        Necessário para requests.post(cert=(cert_pem, key_pem))
        
        Returns:
            Tuple (caminho_cert.pem, caminho_key.pem)
        """
        import tempfile
        
        # Exportar certificado para PEM
        cert_pem_data = self.certificate.public_bytes(
            encoding=serialization.Encoding.PEM
        )
        
        # Exportar chave privada para PEM
        key_pem_data = self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        # Criar arquivos temporários
        cert_file = tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pem')
        cert_file.write(cert_pem_data)
        cert_file.close()
        
        key_file = tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pem')
        key_file.write(key_pem_data)
        key_file.close()
        
        logger.info(f"[OK] Certificado PEM: {cert_file.name}")
        logger.info(f"[OK] Chave PEM: {key_file.name}")
        
        return cert_file.name, key_file.name


def test_signer():
    """
    Função de teste para validar o assinador.
    Execute via Django shell ou script de teste.
    """
    from api.models import EmpresaConfig
    
    empresa = EmpresaConfig.get_ativa()
    if not empresa:
        print("❌ Empresa não configurada")
        return
    
    print("\n" + "=" * 70)
    print("TESTE DE ASSINATURA CT-e NATIVA")
    print("=" * 70)
    
    # Criar assinador
    signer = CTeSignerNative(
        empresa.certificado_digital,
        empresa.senha_certificado
    )
    
    # XML de teste (simplificado)
    xml_test = f'''<?xml version="1.0" encoding="UTF-8"?>
<CTe xmlns="http://www.portalfiscal.inf.br/cte">
    <infCte Id="CTe31260212345678901234570000000000011234567890" versao="4.00">
        <ide>
            <cUF>31</cUF>
            <cCT>12345678</cCT>
            <CFOP>5353</CFOP>
            <natOp>PRESTACAO DE SERVICO DE TRANSPORTE</natOp>
            <mod>57</mod>
            <serie>1</serie>
            <nCT>1</nCT>
            <dhEmi>2026-02-12T10:00:00-03:00</dhEmi>
            <tpImp>1</tpImp>
            <tpEmis>1</tpEmis>
            <cDV>0</cDV>
            <tpAmb>2</tpAmb>
            <tpCTe>0</tpCTe>
            <procEmi>0</procEmi>
            <verProc>3.0</verProc>
            <cMunEnv>3148103</cMunEnv>
            <xMunEnv>PATROCINIO</xMunEnv>
            <UFEnv>MG</UFEnv>
            <modal>01</modal>
            <tpServ>0</tpServ>
            <cMunIni>3148103</cMunIni>
            <xMunIni>PATROCINIO</xMunIni>
            <UFIni>MG</UFIni>
            <cMunFim>3148103</cMunFim>
            <xMunFim>PATROCINIO</xMunFim>
            <UFFim>MG</UFFim>
            <retira>1</retira>
            <indIEToma>1</indIEToma>
        </ide>
    </infCte>
</CTe>'''
    
    try:
        xml_signed = signer.sign_cte_xml(xml_test)
        
        print("\n✅ TESTE CONCLUÍDO COM SUCESSO!")
        print(f"\nTamanho do XML assinado: {len(xml_signed)} caracteres")
        print("\nPrimeiros 500 caracteres:")
        print(xml_signed[:500])
        
        # Verificar se tem Signature
        if '<Signature' in xml_signed and '<DigestValue>' in xml_signed:
            print("\n✓ Tags de assinatura encontradas")
        else:
            print("\n❌ Tags de assinatura NÃO encontradas")
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    print("Execute via Django shell ou script de teste")
