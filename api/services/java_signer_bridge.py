"""
Bridge para usar assinador Java em ambiente Python
"""
import os
import subprocess
import tempfile
import base64
import logging

logger = logging.getLogger(__name__)

class JavaXmlSigner:
    """Assinador XML usando Java (mais confiável para NFe)"""
    
    def __init__(self, certificate_data, certificate_password):
        """
        Args:
            certificate_data: Dados do certificado (base64 ou caminho)
            certificate_password: Senha do certificado
        """
        self.certificate_password = certificate_password
        
        # Decodificar certificado se for Data URI
        if isinstance(certificate_data, str) and certificate_data.startswith('data:'):
            cert_data = certificate_data.split(',', 1)[1]
            self.cert_bytes = base64.b64decode(cert_data)
        elif isinstance(certificate_data, str) and os.path.isfile(certificate_data):
            with open(certificate_data, 'rb') as f:
                self.cert_bytes = f.read()
        else:
            # Assumir que já são bytes
            self.cert_bytes = certificate_data if isinstance(certificate_data, bytes) else base64.b64decode(certificate_data)
        
        # Localizar XmlSigner.class
        self.java_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'java_signer'
        )
        self.signer_class = os.path.join(self.java_dir, 'XmlSigner.class')
        
        if not os.path.exists(self.signer_class):
            raise FileNotFoundError(
                f"XmlSigner.class não encontrado em {self.java_dir}. "
                "Execute: cd java_signer && javac XmlSigner.java"
            )
    
    def sign_xml(self, xml_string):
        """
        Assina XML usando Java
        
        Args:
            xml_string: XML não assinado
            
        Returns:
            XML assinado como string
        """
        # Criar arquivos temporários
        with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False, encoding='utf-8') as f_xml:
            f_xml.write(xml_string)
            xml_file = f_xml.name
        
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.pfx', delete=False) as f_cert:
            f_cert.write(self.cert_bytes)
            cert_file = f_cert.name
        
        output_file = tempfile.mktemp(suffix='_signed.xml')
        
        try:
            # Executar Java
            cmd = [
                'java',
                '-cp', self.java_dir,
                'XmlSigner',
                xml_file,
                cert_file,
                self.certificate_password,
                output_file
            ]
            
            logger.info(f"Executando assinador Java: {' '.join(cmd[:-1])} ****")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                logger.error(f"Erro Java stderr: {result.stderr}")
                raise Exception(f"Falha ao assinar com Java: {result.stderr}")
            
            # Ler XML assinado
            if not os.path.exists(output_file):
                raise Exception(f"Arquivo de saída não foi criado: {output_file}")
            
            with open(output_file, 'r', encoding='utf-8') as f:
                signed_xml = f.read()
            
            logger.info("[OK] XML assinado com sucesso usando Java")
            return signed_xml
            
        finally:
            # Limpar arquivos temporários
            for f in [xml_file, cert_file, output_file]:
                try:
                    if os.path.exists(f):
                        os.unlink(f)
                except:
                    pass


def sign_nfce_xml_java(xml_string, cert_data, cert_password):
    """
    Função helper para assinar NFC-e com Java
    
    Args:
        xml_string: XML não assinado
        cert_data: Certificado (base64, Data URI ou caminho)
        cert_password: Senha do certificado
        
    Returns:
        XML assinado
    """
    signer = JavaXmlSigner(cert_data, cert_password)
    return signer.sign_xml(xml_string)
