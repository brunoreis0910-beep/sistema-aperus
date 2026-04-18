import logging
import base64
import os
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from signxml import XMLSigner, methods
from lxml import etree

logger = logging.getLogger(__name__)


class NFeSigner(XMLSigner):
    """
    Versão customizada do XMLSigner que permite SHA-1.
    Necessário pois a SEFAZ exige SHA-1 para NF-e versão 4.00,
    embora SHA-1 não seja mais considerado seguro.
    """
    def check_deprecated_methods(self):
        """
        Override para permitir SHA-1 conforme exigido pela SEFAZ.
        A SEFAZ ainda usa SHA-1 no schema da NF-e versão 4.00.
        """
        if "SHA1" in self.sign_alg.name or "SHA1" in self.digest_alg.name:
            logger.warning("⚠ Usando SHA-1 conforme exigido pela SEFAZ (NF-e 4.00)")
        # Não lança exceção - permite SHA-1


class SignerService:
    def __init__(self, pfx_path_or_data, password):
        self.pfx_data = self._load_pfx(pfx_path_or_data)
        self.password = password.encode('utf-8') if password else b''
        self.private_key = None
        self.certificate = None
        self._ensure_legacy_crypto()  # Habilita SHA-1 em OpenSSL 3+
        self._load_crypto()

    def _load_pfx(self, path_or_data):
        """Carrega certificado PFX de arquivo ou base64"""
        # Caso 1: É um caminho de arquivo
        if isinstance(path_or_data, str) and os.path.exists(path_or_data):
            logger.info(f"Carregando certificado do arquivo: {path_or_data}")
            with open(path_or_data, 'rb') as f:
                pfx_bytes = f.read()
                logger.info(f"[OK] Arquivo lido: {len(pfx_bytes)} bytes")
                
                # Diagnóstico detalhado
                if len(pfx_bytes) >= 20:
                    logger.info(f"  Primeiros 20 bytes (hex): {pfx_bytes[:20].hex()}")
                    # Verifica se parece texto (ASCII imprimível)
                    try:
                        sample = pfx_bytes[:100].decode('ascii')
                        if any(c in sample for c in ['\n', '\r', ' ', '=']):
                            logger.warning(f"⚠ ALERTA: Arquivo parece conter texto, não binário!")
                            logger.warning(f"  Amostra: {sample[:50]}...")
                    except:
                        pass  # É binário, OK
                
                # Validar header PKCS12
                if len(pfx_bytes) >= 2:
                    header = pfx_bytes[:2].hex()
                    if not header.startswith('30'):
                        logger.error(f"✗ ERRO: Header inválido para PKCS12: {header}")
                        logger.error(f"  Esperado: 30xx (ASN.1 SEQUENCE)")
                        logger.error(f"  Arquivo: {path_or_data}")
                        logger.error(f"  Tamanho: {len(pfx_bytes)} bytes")
                        logger.error("")
                        logger.error("Possíveis causas:")
                        logger.error("  1. Arquivo não é .PFX/.P12 (pode ser .PEM, .CRT, .CER)")
                        logger.error("  2. Arquivo está corrompido")
                        logger.error("  3. Foi salvo em formato texto em vez de binário")
                        logger.error("")
                        logger.error("Solução: Use um certificado PKCS12 válido (.pfx ou .p12)")
                        raise ValueError(f"Arquivo não é um PKCS12 válido (header: {header}, esperado: 30xx)")
                
                return pfx_bytes
        
        # Caso 2: É base64 (string)
        if isinstance(path_or_data, str):
            try:
                logger.info("Tentando decodificar certificado base64...")
                logger.info(f"  Tamanho da string recebida: {len(path_or_data)} caracteres")
                logger.info(f"  Primeiros 50 chars: {path_or_data[:50]}...")
                
                # Remove prefixo Data URL se presente (ex: data:application/x-pkcs12;base64,)
                clean_b64 = path_or_data.strip()
                
                if clean_b64.startswith('data:'):
                    logger.info("  Detectado prefixo Data URL (data:...)")
                    # Encontrar onde começa o base64 (após a vírgula)
                    comma_pos = clean_b64.find(',')
                    if comma_pos != -1:
                        prefix = clean_b64[:comma_pos+1]
                        clean_b64 = clean_b64[comma_pos+1:]
                        logger.info(f"  Removido prefixo: '{prefix}'")
                        logger.info(f"  Tamanho após remoção: {len(clean_b64)} caracteres")
                
                # Remove espaços/quebras de linha
                clean_b64 = clean_b64.replace('\n', '').replace('\r', '').replace(' ', '')
                
                # Verifica se parece base64 válido
                if not clean_b64 or len(clean_b64) < 100:
                    raise ValueError(f"String base64 muito curta ({len(clean_b64)} chars) - provavelmente inválida")
                
                # Verifica caracteres inválidos
                import string
                valid_chars = string.ascii_letters + string.digits + '+/='
                invalid_chars = [c for c in clean_b64[:100] if c not in valid_chars]
                if invalid_chars:
                    logger.warning(f"⚠ Caracteres inválidos no base64: {invalid_chars}")
                
                pfx_bytes = base64.b64decode(clean_b64)
                logger.info(f"Certificado decodificado: {len(pfx_bytes)} bytes")
                logger.info(f"  Primeiros 20 bytes (hex): {pfx_bytes[:20].hex()}")
                
                # Verificar header PKCS12 (deve começar com 30 82 ou 30 80)
                if len(pfx_bytes) >= 2:
                    header = pfx_bytes[:2].hex()
                    if not header.startswith('30'):
                        logger.error(f"ERRO: Header inválido para PKCS12: {header}")
                        logger.error("  Esperado: 30xx (ASN.1 SEQUENCE)")
                        logger.error(f"  String decodificada: {len(pfx_bytes)} bytes")
                        logger.error("")
                        logger.error("Possíveis causas:")
                        logger.error("  1. O base64 não é de um certificado PKCS12")
                        logger.error("  2. Pode ser certificado PEM (texto) em vez de PFX (binário)")
                        logger.error("  3. String base64 inválida ou corrompida")
                        logger.error("")
                        logger.error("Solução: Configure um certificado PKCS12 válido (.pfx)")
                        raise ValueError(f"Arquivo não é um PKCS12 válido (header: {header}, esperado: 30xx)")
                    else:
                        logger.info(f"Header PKCS12 válido: {header}")
                
                return pfx_bytes
                
            except base64.binascii.Error as e:
                logger.error(f"✗ Falha ao decodificar base64: {e}")
                logger.error(f"  String recebida não é base64 válido")
                logger.error(f"  Primeiros 100 chars: {path_or_data[:100]}")
                raise ValueError(f"Certificado inválido: não é base64 válido - {e}")
            except Exception as e:
                logger.error(f"✗ Erro ao processar certificado: {e}")
                raise ValueError(f"Certificado inválido: não é arquivo nem base64 válido - {e}")
        
        # Caso 3: Já é bytes
        if isinstance(path_or_data, bytes):
            logger.info(f"Certificado já está em formato bytes ({len(path_or_data)} bytes)")
            logger.info(f"  Header: {path_or_data[:4].hex()}")
            return path_or_data
        
        raise ValueError(f"Formato de certificado não reconhecido: {type(path_or_data)}")

    def _ensure_legacy_crypto(self):
        """
        Habilita SHA-1 através do OpenSSL Legacy Provider.
        Necessário em ambientes com OpenSSL 3+ (Windows/Linux modernos).
        """
        import sys
        import ctypes
        from ctypes.util import find_library
        
        try:
            # Define o arquivo de configuração do OpenSSL que habilita legacy provider
            # Este arquivo força SHA-1 a funcionar mesmo no OpenSSL 3+
            config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'openssl_legacy.cnf')
            if os.path.exists(config_path):
                os.environ['OPENSSL_CONF'] = config_path
                logger.info(f"[OK] OpenSSL configurado para usar: {config_path}")
            else:
                # Limpa qualquer config que bloqueie SHA-1
                os.environ['OPENSSL_CONF'] = ''
                logger.warning(f"⚠ Arquivo de config não encontrado: {config_path}")
            
            # Tenta carregar a DLL do OpenSSL
            lib = None
            lib_names = [
                'libcrypto-3-x64.dll', 
                'libcrypto-3.dll', 
                'libcrypto-1_1-x64.dll',
                'libcrypto-1_1.dll',
                'libeay32.dll'
            ]
            
            for name in lib_names:
                try:
                    lib = ctypes.CDLL(name)
                    logger.info(f"[OK] OpenSSL carregado: {name}")
                    break 
                except Exception as e:
                    continue
                
            if not lib:
                # Busca genérica no sistema
                found = find_library('libcrypto') or find_library('crypto')
                if found:
                    try: 
                        lib = ctypes.CDLL(found)
                        logger.info(f"✓ OpenSSL carregado: {found}")
                    except: 
                        pass
            
            # Se conseguiu carregar a lib, tenta carregar os providers
            if lib:
                # Verifica se tem a nova API do OpenSSL 3.0
                if hasattr(lib, 'OSSL_PROVIDER_load'):
                    lib.OSSL_PROVIDER_load.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
                    lib.OSSL_PROVIDER_load.restype = ctypes.c_void_p
                    
                    # Load default provider primeiro
                    default = lib.OSSL_PROVIDER_load(None, b"default")
                    # Load Legacy provider para SHA-1
                    legacy = lib.OSSL_PROVIDER_load(None, b"legacy")
                    
                    if legacy and default:
                        logger.info("✓ OpenSSL Legacy Provider carregado (SHA-1 habilitado)")
                        return True
                    else:
                        logger.warning("[WARN] Falha ao carregar OpenSSL Legacy Provider via OSSL_PROVIDER_load")
                        
                # Tenta API alternativa (try_load)
                elif hasattr(lib, 'OSSL_PROVIDER_try_load'):
                    lib.OSSL_PROVIDER_try_load.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
                    lib.OSSL_PROVIDER_try_load.restype = ctypes.c_void_p
                    
                    default = lib.OSSL_PROVIDER_try_load(None, b"default")
                    legacy = lib.OSSL_PROVIDER_try_load(None, b"legacy")
                    
                    if legacy:
                        logger.info("✓ OpenSSL Legacy Provider carregado (SHA-1 habilitado)")
                        return True
                    else:
                        logger.warning("⚠ Falha ao carregar OpenSSL Legacy Provider via try_load")
                else:
                    logger.info("✓ OpenSSL 1.1 detectado (SHA-1 já suportado nativamente)")
                    return True
            else:
                logger.warning("⚠ Biblioteca OpenSSL não encontrada - usando config file apenas")
                    
        except Exception as e:
            logger.error(f"Erro ao habilitar Legacy Crypto: {e}", exc_info=True)
            
        # Retorna True mesmo se falhar - a config via arquivo pode ser suficiente
        return True

    def _load_crypto(self):
        """Carrega chave privada e certificado do arquivo PKCS12"""
        erros = []
        
        try:
            logger.info(f"Tentando carregar certificado PKCS12 ({len(self.pfx_data)} bytes)")
            logger.info(f"Senha fornecida: {'***' if self.password else '(vazia)'} ({len(self.password)} bytes)")
            
            # Verificar se os primeiros bytes parecem um PFX válido
            if len(self.pfx_data) < 10:
                raise ValueError(f"Arquivo muito pequeno ({len(self.pfx_data)} bytes) - provavelmente inválido")
            
            # PFX deve começar com bytes específicos
            header = self.pfx_data[:2]
            logger.info(f"Header do arquivo: {header.hex()}")
            
            # Tentativa 1: Senha como fornecida (bytes)
            try:
                logger.info("Tentativa 1: Carregando com senha fornecida...")
                p12 = pkcs12.load_key_and_certificates(
                    self.pfx_data,
                    self.password
                )
                self.private_key = p12[0]
                self.certificate = p12[1]
                self.additional_certs = p12[2]
                
                logger.info(f"[OK] Certificado carregado com sucesso!")
                logger.info(f"  - Subject: {self.certificate.subject}")
                logger.info(f"  - Valid until: {self.certificate.not_valid_after}")
                return
            except Exception as e1:
                erro_msg = f"Tentativa 1: {type(e1).__name__}: {str(e1)}"
                logger.warning(erro_msg)
                erros.append(erro_msg)
            
            # Tentativa 2: Senha vazia (alguns certificados não tem senha)
            try:
                logger.info("Tentativa 2: Carregando sem senha...")
                p12 = pkcs12.load_key_and_certificates(
                    self.pfx_data,
                    None
                )
                self.private_key = p12[0]
                self.certificate = p12[1]
                self.additional_certs = p12[2]
                
                logger.info(f"✓ Certificado carregado com sucesso (sem senha)!")
                logger.warning("⚠ O certificado não tem senha! Configure senha vazia no banco.")
                return
            except Exception as e2:
                erro_msg = f"Tentativa 2: {type(e2).__name__}: {str(e2)}"
                logger.warning(erro_msg)
                erros.append(erro_msg)
            
            # Tentativa 3: Senha como string (não bytes)
            if self.password:
                try:
                    logger.info("Tentativa 3: Carregando com senha como string...")
                    # Tenta decodificar senha para string primeiro
                    if isinstance(self.password, bytes):
                        senha_str = self.password.decode('utf-8')
                    else:
                        senha_str = self.password
                    
                    p12 = pkcs12.load_key_and_certificates(
                        self.pfx_data,
                        senha_str.encode('utf-8')
                    )
                    self.private_key = p12[0]
                    self.certificate = p12[1]
                    self.additional_certs = p12[2]
                    
                    logger.info(f"✓ Certificado carregado com sucesso!")
                    return
                except Exception as e3:
                    erro_msg = f"Tentativa 3: {type(e3).__name__}: {str(e3)}"
                    logger.warning(erro_msg)
                    erros.append(erro_msg)
            
            # Todas as tentativas falharam - mostrar todos os erros
            logger.error("=" * 60)
            logger.error("TODAS AS TENTATIVAS FALHARAM:")
            for i, erro in enumerate(erros, 1):
                logger.error(f"  {i}. {erro}")
            logger.error("=" * 60)
            
            # Análise do erro para dar dica específica
            primeiro_erro = erros[0] if erros else ""
            mensagem_erro = ""
            
            if "Could not deserialize PKCS12" in primeiro_erro:
                mensagem_erro = (
                    "❌ ERRO: SENHA INCORRETA ou ARQUIVO CORROMPIDO\n\n"
                    "O erro 'Could not deserialize PKCS12' indica que:\n"
                    "  1. A SENHA está INCORRETA (causa mais comum)\n"
                    "  2. O arquivo PFX/PKCS12 está corrompido ou incompleto\n\n"
                    "SOLUÇÃO:\n"
                    "  → Verifique a senha do certificado no banco de dados\n"
                    "  → Se salvou como base64, certifique-se que não foi truncado\n"
                    "  → Teste importar o certificado manualmente no Windows\n"
                    "  → Se funcionar, a senha que você usou é a correta!"
                )
            elif "header" in primeiro_erro.lower():
                mensagem_erro = (
                    "❌ ERRO: ARQUIVO NÃO É UM PFX VÁLIDO\n\n"
                    "O arquivo não tem o formato PKCS12 correto.\n"
                    "Certifique-se que:\n"
                    "  1. É um arquivo .pfx ou .p12 genuíno\n"
                    "  2. O base64 no banco não está corrompido\n"
                    "  3. Não é outro tipo de arquivo (CER, PEM, etc.)"
                )
            else:
                mensagem_erro = "Erro desconhecido ao carregar certificado."
            
            logger.error(mensagem_erro)
            
            raise ValueError(mensagem_erro + f"\n\nDetalhes técnicos: {primeiro_erro}")
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Erro inesperado ao carregar certificado: {e}", exc_info=True)
            raise ValueError(f"Erro ao carregar certificado: {e}")
            raise

    def sign_xml(self, xml_input, parent_tag='infNFe'):
        """
        Assina XML seguindo EXATAMENTE o padrão SEFAZ NF-e 4.00.
        Abordagem manual ultra-conservadora para garantir compatibilidade.
        """
        try:
            from lxml import etree
            import hashlib
            import base64
            
            # Parse input - SEM remove_blank_text para preservar exatamente o conteúdo
            # strip_cdata=False protege o CDATA do QRCode (CTe 4.00)
            parser = etree.XMLParser(remove_blank_text=False, remove_comments=True, strip_cdata=False)
            if isinstance(xml_input, etree._Element):
                root = xml_input
            elif isinstance(xml_input, bytes):
                root = etree.fromstring(xml_input, parser)
            else:
                root = etree.fromstring(xml_input.encode('utf-8'), parser)
            
            # Find target element
            ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
            target = root.find(f'.//nfe:{parent_tag}', ns)
            if target is None:
                target = root.xpath(f"//*[local-name() = '{parent_tag}']")[0]
            
            ref_uri = target.get('Id')
            if not ref_uri:
                raise ValueError(f"Atributo Id não encontrado em {parent_tag}")
            
            # Calculate DigestValue using EXACT C14N
            import io
            digest_buffer = io.BytesIO()
            etree.ElementTree(target).write_c14n(digest_buffer)
            digest_bytes = hashlib.sha1(digest_buffer.getvalue()).digest()
            digest_b64 = base64.b64encode(digest_bytes).decode('ascii')
            
            logger.info(f"DigestValue calculado: {digest_b64}")
            
            # Build Signature structure
            NS_DS = 'http://www.w3.org/2000/09/xmldsig#'
            # FIX: Use ONLY default namespace to match Valid XML (Authorized CTe)
            # Valid XML: <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
            sig = etree.Element(f'{{{NS_DS}}}Signature', nsmap={None: NS_DS})
            
            # SignedInfo
            si = etree.SubElement(sig, f'{{{NS_DS}}}SignedInfo')
            
            cm = etree.SubElement(si, f'{{{NS_DS}}}CanonicalizationMethod')
            cm.set('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
            
            sm = etree.SubElement(si, f'{{{NS_DS}}}SignatureMethod')
            sm.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1')
            
            ref = etree.SubElement(si, f'{{{NS_DS}}}Reference')
            ref.set('URI', f'#{ref_uri}')
            
            transforms = etree.SubElement(ref, f'{{{NS_DS}}}Transforms')
            t1 = etree.SubElement(transforms, f'{{{NS_DS}}}Transform')
            t1.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature')
            t2 = etree.SubElement(transforms, f'{{{NS_DS}}}Transform')
            t2.set('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
            
            dm = etree.SubElement(ref, f'{{{NS_DS}}}DigestMethod')
            dm.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#sha1')
            
            dv = etree.SubElement(ref, f'{{{NS_DS}}}DigestValue')
            dv.text = digest_b64
            
            # Calculate SignatureValue
            # FIX: same lxml xmlns="" bug affects SignedInfo C14N when si is sub-element.
            # Serialize si to string, re-parse as standalone root, compute C14N.
            si_xml_str = etree.tostring(si, encoding='unicode', method='xml')
            si_standalone = etree.fromstring(si_xml_str.encode('utf-8'), parser)
            si_buffer = io.BytesIO()
            etree.ElementTree(si_standalone).write_c14n(si_buffer)
            si_c14n = si_buffer.getvalue()
            
            logger.debug(f"SignedInfo C14N (primeiros 100 bytes): {si_c14n[:100]}")
            
            sig_bytes = self.private_key.sign(si_c14n, padding.PKCS1v15(), hashes.SHA1())
            sig_b64 = base64.b64encode(sig_bytes).decode('ascii')
            
            sv = etree.SubElement(sig, f'{{{NS_DS}}}SignatureValue')
            sv.text = sig_b64
            
            # KeyInfo
            ki = etree.SubElement(sig, f'{{{NS_DS}}}KeyInfo')
            x509data = etree.SubElement(ki, f'{{{NS_DS}}}X509Data')
            x509cert = etree.SubElement(x509data, f'{{{NS_DS}}}X509Certificate')
            
            cert_pem = self.certificate.public_bytes(serialization.Encoding.PEM).decode('ascii')
            cert_clean = ''.join(cert_pem.split('\n')[1:-2])
            x509cert.text = cert_clean
            
            # Find destination element and append signature
            # Enveloped signature: Signature is sibling of the signed element (target)
            destination = target.getparent()
            if destination is None:
                destination = root
                
            destination.append(sig)
            
            # Serialize using tostring to PRESERVE CDATA in infCTeSupl
            # C14N strips CDATA, which causes Rejeicao 225 in CTe 4.00
            result = etree.tostring(root, encoding='unicode', method='xml')
            
            if not result.startswith('<?xml'):
                result = '<?xml version="1.0" encoding="UTF-8"?>' + result
            
            logger.info("XML assinado (metodo manual + tostring)")
            return result
        
        except Exception as e:
            logger.exception(f"Erro ao assinar XML: {e}")
            raise
    
    def _sign_xml_manual(self, xml_input, parent_tag='infNFe'):
        """
        Assina o XML usando o algoritmo padrao da SEFAZ (RSA-SHA1).
        Aceita xml_input como string, bytes ou lxml Element.
        """
        try:
            # 1. Normalizar entrada para lxml Element
            if hasattr(xml_input, 'tag'): # Checks if it's an Element
                root = xml_input
            elif isinstance(xml_input, bytes):
                root = etree.fromstring(xml_input)
            else:
                # String
                root = etree.fromstring(xml_input.encode('utf-8'))

            # Force default namespace to avoid prefixes in NFe
            # SAFE STRATEGY: Ensure root has the correct default namespace
            try:
                 if root.nsmap.get(None) != 'http://www.portalfiscal.inf.br/nfe':
                     # If generic element or missing ns, we might want to let lxml handle it
                     # or set it if it's the right tag.
                     pass 
            except:
                 pass
            
            # Update raw_xml for later use in string insertion
            # Preserve original whitespace as much as possible by using the input if it was string
            # But we need 'raw_xml' to match 'root' structure if we modified it.
            # Here we haven't modified 'root' effectively in the safe strategy.
            raw_xml = etree.tostring(root, encoding='utf-8').decode('utf-8')

            # --- PHANTOM SIGNING STRATEGY (SEFAZ COMPATIBLE) ---
            # SEFAZ envelopes the NFe in a SOAP message. When using Inclusive C14N (required by standard),
            # the SignedInfo element inherits namespaces from the SOAP Envelope.
            # Use 'Phantom Namespaces' to simulate this environment during signature generation.
            
            logger.info("Usando estratégia de assinatura PHANTOM (Simulação de Envelope SOAP)")

            # Define namespaces
            NS_DS = "http://www.w3.org/2000/09/xmldsig#"
            NS_NFE = "http://www.portalfiscal.inf.br/nfe"
            NS_SOAP_ENV = "http://www.w3.org/2003/05/soap-envelope"
            NS_NFE_AUT = "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"

            target_elem = None
            
            # Estratégia 1: Tenta namespace da NFe (Padrão antigo)
            ns_nfe = {'ns': 'http://www.portalfiscal.inf.br/nfe'}
            target_elem = root.find(f'.//ns:{parent_tag}', namespaces=ns_nfe)

            # Estratégia 2: Se falhar, busca por local-name (Funciona para NFSe Nacional e outros namespaces)
            if target_elem is None:
                # XPath para encontrar tag com nome específico ignorando namespace
                found = root.xpath(f"//*[local-name() = '{parent_tag}']")
                if found:
                    target_elem = found[0]

            if target_elem is None:
                raise ValueError(f"Tag '{parent_tag}' não encontrada para assinatura.")
                
            inf_id = target_elem.get('Id')
            if not inf_id:
                 raise ValueError(f"Tag '{parent_tag}' não possui atributo 'Id' (necessário para referência URI).")

            # Helper para criar elementos
            def ds_elem(tag, parent=None):
                tag_name = f"{{{NS_DS}}}{tag}"
                if parent is not None:
                    return etree.SubElement(parent, tag_name)
                return etree.Element(tag_name, nsmap={None: NS_DS})

            # --- STRATEGY: DIRTY CALCULATION / CLEAN TRANSMISSION ---
            # Solução definitiva para Rejeição 297, 215, 452.
            # Problema: A assinatura (Hash) exige os namespaces do SOAP (Contexto).
            # Mas o Schema NFe (Validação) rejeita esses namespaces no XML enviado.
            # Solução: 
            # 1. Criar uma cópia "Suja" do XML com os namespaces injetados na tag NFe.
            # 2. Calcular o Digest e a Assinatura sobre essa cópia Suja (Match com SEFAZ).
            # 3. Pegar apenas o bloco <Signature> gerado.
            # 4. Inserir esse bloco no XML "Limpo" original.
            # 5. Enviar o XML Limpo.

            logger.info("Usando estratégia DIRTY CALCULATION / CLEAN TRANSMISSION")

            # Definition names
            NS_DS = "http://www.w3.org/2000/09/xmldsig#"
            NS_SOAP12 = "http://www.w3.org/2003/05/soap-envelope"
            NS_XSI = "http://www.w3.org/2001/XMLSchema-instance"
            NS_XSD = "http://www.w3.org/2001/XMLSchema"
            
            import re

            # 1. PREPARE DIRTY XML (Used for Digest Calculation)
            # The previous strategy injected SOAP namespaces here, but as verified with user's successful XML,
            # the NFe signature should be self-contained and NOT include external SOAP namespaces.
            # Using raw_xml directly ensures the Hash matches what is sent.
            dirty_xml = raw_xml
            
            # 2. PARSE DIRTY XML 
            # Use remove_blank_text=True for clean canonical serialization
            parser = etree.XMLParser(remove_blank_text=True, remove_comments=True)
            root_dirty = etree.fromstring(dirty_xml.encode('utf-8'), parser)
            
            # 3. HELPERS
            def ds_elem(tag, parent=None, text=None):
                # NO PREFIX (Default Namespace) to match Authorized XML
                e = etree.Element(f"{{http://www.w3.org/2000/09/xmldsig#}}{tag}", nsmap={None: "http://www.w3.org/2000/09/xmldsig#"})
                if text: e.text = text
                if parent is not None: parent.append(e)
                return e

            # 4. FIND TARGET (in Dirty Tree)
            target_elem = None
            found = root_dirty.xpath(f"//*[local-name() = '{parent_tag}']")
            if found: target_elem = found[0]
            
            if target_elem is None: raise ValueError(f"Tag '{parent_tag}' não encontrada.")
            inf_id = target_elem.get('Id')

            # 5. CALCULATE DIGEST (On Dirty Tree)
            # Use write_c14n for consistent canonization
            import io
            buf_target = io.BytesIO()
            etree.ElementTree(target_elem).write_c14n(buf_target, exclusive=False)
            c14n_target = buf_target.getvalue()
            
            logger.info("✓ Digest calculado com write_c14n (Inclusive C14N)")

            digest = hashes.Hash(hashes.SHA1())
            digest.update(c14n_target)
            digest_val = base64.b64encode(digest.finalize()).decode('utf-8')
            
            # 6. BUILD SIGNATURE OBJECT (In Dirty Tree context)
            signature = ds_elem("Signature")
            
            # Where to append in dirty tree?
            dirty_insertion_point = None
            if root_dirty.tag.endswith('NFe'): dirty_insertion_point = root_dirty
            else:
                nfes = root_dirty.xpath(f"//*[local-name() = 'NFe']")
                if nfes: dirty_insertion_point = nfes[0]
                else: dirty_insertion_point = root_dirty
            
            # Match Authorization XML: Signature comes AFTER infCte, usually.
            # But commonly Signature is appended to root (CTe).
            # The structure in authorized XML is CTe -> infCte, infCTeSupl, Signature.
            # Here we append to dirty_insertion_point (likely CTe).
            
            dirty_insertion_point.append(signature)

            # Build Structure
            signed_info = ds_elem("SignedInfo", signature)
            
            can_method = ds_elem("CanonicalizationMethod", signed_info)
            # Standard C14N
            can_method.set("Algorithm", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315")
            
            sig_method = ds_elem("SignatureMethod", signed_info)
            sig_method.set("Algorithm", "http://www.w3.org/2000/09/xmldsig#rsa-sha1")
            
            ref = ds_elem("Reference", signed_info)
            ref.set("URI", f"#{inf_id}")
            
            tr = ds_elem("Transforms", ref)
            t1 = ds_elem("Transform", tr)
            t1.set("Algorithm", "http://www.w3.org/2000/09/xmldsig#enveloped-signature")
            t2 = ds_elem("Transform", tr)
            # Standard C14N
            t2.set("Algorithm", "http://www.w3.org/TR/2001/REC-xml-c14n-20010315")
            
            dm = ds_elem("DigestMethod", ref)
            dm.set("Algorithm", "http://www.w3.org/2000/09/xmldsig#sha1")

            
            dv = ds_elem("DigestValue", ref)
            dv.text = digest_val
            
            # 7. SIGN (On Dirty Tree)
            # CRITICAL: Use write_c14n for proper canonization
            import io
            buf_si = io.BytesIO()
            etree.ElementTree(signed_info).write_c14n(buf_si, exclusive=False)
            c14n_si = buf_si.getvalue()
            
            logger.debug(f"SignedInfo C14N sample: {c14n_si[:150]}")

            sig_bytes = self.private_key.sign(c14n_si, padding.PKCS1v15(), hashes.SHA1())
            sig_val = base64.b64encode(sig_bytes).decode('utf-8')

            
            sv = ds_elem("SignatureValue", signature)
            sv.text = sig_val

            ki = ds_elem("KeyInfo", signature)
            xd = ds_elem("X509Data", ki)
            xc = ds_elem("X509Certificate", xd)
            
            cert_bytes = self.certificate.public_bytes(serialization.Encoding.PEM)
            cert_str = cert_bytes.decode('utf-8')
            clean_cert = "".join(cert_str.splitlines()[1:-1])
            xc.text = clean_cert

            # 8. EXTRACT CLEAN SIGNATURE & MERGE
            # Now we have the valid Signature BLOCK inside root_dirty.
            # We want to extract this block and put it into the CLEAN XML.
            
            # Extract Signature as string
            sig_str = etree.tostring(signature, encoding='unicode')
            
            # Sanitization: Ensure the Signature block itself doesn't carry the dirty namespaces 
            # if lxml decided to redeclare them locally.
            sig_str = sig_str.replace(f' xmlns:soap12="{NS_SOAP12}"', '')
            sig_str = sig_str.replace(f' xmlns:xsd="{NS_XSD}"', '')
            sig_str = sig_str.replace(f' xmlns:xsi="{NS_XSI}"', '')
            
            # Since we switched to no-prefix, we don't need to strip 'ds:' but check for other artifacts
            # Also, lxml might add xmlns="" if parent has xmlns. 
            # Ideally, the Signature element ALREADY has xmlns="http://www.w3.org/2000/09/xmldsig#" set in ds_elem
            
            # Compact
            sig_str = sig_str.replace('\n', '').strip()
            
            # 9. SERIALIZE FINAL XML
            # Use exclusive=False, method='c14n' to ensure clean output
            # This produces the canonical form expected by SEFAZ and guarantees attribute order matches the hash
            import io
            buf_final = io.BytesIO()
            etree.ElementTree(root_dirty).write_c14n(buf_final, exclusive=False)
            final_xml_bytes = buf_final.getvalue()
            
            final_xml = final_xml_bytes.decode('utf-8')

            # Ensure header (Standard behavior for XML files, though caller might strip it)
            if not final_xml.startswith('<?xml'):
                final_xml = '<?xml version="1.0" encoding="UTF-8"?>' + final_xml

            return final_xml

        except Exception as e:
            logger.exception("Erro fatal ao assinar XML")
            raise

    def get_cert_key_pem(self):
        """Returns (cert_pem_path, key_pem_path) for requests"""
        import tempfile
        
        cert_pem = self.certificate.public_bytes(serialization.Encoding.PEM)
        key_pem = self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        tf_cert = tempfile.NamedTemporaryFile(delete=False, suffix='.pem')
        tf_cert.write(cert_pem)
        tf_cert.close()
        
        tf_key = tempfile.NamedTemporaryFile(delete=False, suffix='.key')
        tf_key.write(key_pem)
        tf_key.close()
        
        return tf_cert.name, tf_key.name

    def sign_evento(self, xml_evento, id_evento):
        """
        Assina XML de evento (CCe, Cancelamento, etc) seguindo padrão SEFAZ.
        Similar ao sign_xml, mas para eventos.
        
        Args:
            xml_evento: XML do evento (string)
            id_evento: ID do evento para referência na assinatura
            
        Returns:
            str: XML assinado
        """
        try:
            import hashlib
            import io
            
            # Parse XML
            parser = etree.XMLParser(remove_blank_text=False, remove_comments=True)
            root = etree.fromstring(xml_evento.encode('utf-8'), parser)
            
            # Find target element (infEvento)
            ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
            target = root.find('.//nfe:infEvento', ns)
            if target is None:
                target = root.xpath("//*[local-name() = 'infEvento']")[0]
            
            ref_uri = target.get('Id')
            if not ref_uri:
                raise ValueError("Atributo Id não encontrado em infEvento")
            
            # Calculate DigestValue
            # FIX: lxml's write_c14n adds spurious xmlns="" on grandchild elements when
            # the target is still connected to a parent tree (sub-element).
            # Solution: serialize target to string (correct, no xmlns=""), re-parse as
            # standalone root, then compute C14N from the standalone element.
            target_xml_str = etree.tostring(target, encoding='unicode', method='xml')
            target_standalone = etree.fromstring(target_xml_str.encode('utf-8'), parser)
            digest_buffer = io.BytesIO()
            etree.ElementTree(target_standalone).write_c14n(digest_buffer)
            digest_bytes = hashlib.sha1(digest_buffer.getvalue()).digest()
            digest_b64 = base64.b64encode(digest_bytes).decode('ascii')
            
            logger.info(f"DigestValue evento calculado: {digest_b64[:20]}...")
            
            # Build Signature structure
            NS_DS = 'http://www.w3.org/2000/09/xmldsig#'
            sig = etree.Element(f'{{{NS_DS}}}Signature', nsmap={None: NS_DS})
            
            # SignedInfo
            si = etree.SubElement(sig, f'{{{NS_DS}}}SignedInfo')
            
            cm = etree.SubElement(si, f'{{{NS_DS}}}CanonicalizationMethod')
            cm.set('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
            
            sm = etree.SubElement(si, f'{{{NS_DS}}}SignatureMethod')
            sm.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1')
            
            ref = etree.SubElement(si, f'{{{NS_DS}}}Reference')
            ref.set('URI', f'#{ref_uri}')
            
            transforms = etree.SubElement(ref, f'{{{NS_DS}}}Transforms')
            t1 = etree.SubElement(transforms, f'{{{NS_DS}}}Transform')
            t1.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature')
            t2 = etree.SubElement(transforms, f'{{{NS_DS}}}Transform')
            t2.set('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315')
            
            dm = etree.SubElement(ref, f'{{{NS_DS}}}DigestMethod')
            dm.set('Algorithm', 'http://www.w3.org/2000/09/xmldsig#sha1')
            
            dv = etree.SubElement(ref, f'{{{NS_DS}}}DigestValue')
            dv.text = digest_b64
            
            # Calculate SignatureValue
            # FIX: same lxml xmlns="" bug affects SignedInfo C14N when si is sub-element.
            # Serialize si to string, re-parse as standalone root, compute C14N.
            si_xml_str = etree.tostring(si, encoding='unicode', method='xml')
            si_standalone = etree.fromstring(si_xml_str.encode('utf-8'), parser)
            si_buffer = io.BytesIO()
            etree.ElementTree(si_standalone).write_c14n(si_buffer)
            si_c14n = si_buffer.getvalue()
            
            sig_bytes = self.private_key.sign(si_c14n, padding.PKCS1v15(), hashes.SHA1())
            sig_b64 = base64.b64encode(sig_bytes).decode('ascii')
            
            sv = etree.SubElement(sig, f'{{{NS_DS}}}SignatureValue')
            sv.text = sig_b64
            
            # KeyInfo
            ki = etree.SubElement(sig, f'{{{NS_DS}}}KeyInfo')
            x509data = etree.SubElement(ki, f'{{{NS_DS}}}X509Data')
            x509cert = etree.SubElement(x509data, f'{{{NS_DS}}}X509Certificate')
            
            cert_pem = self.certificate.public_bytes(serialization.Encoding.PEM).decode('ascii')
            cert_clean = ''.join(cert_pem.split('\n')[1:-2])
            x509cert.text = cert_clean
            
            # Append signature to evento
            root.append(sig)
            
            # Serialize
            result = etree.tostring(root, encoding='unicode', method='xml')
            
            if not result.startswith('<?xml'):
                result = '<?xml version="1.0" encoding="UTF-8"?>' + result
            
            logger.info("Evento assinado com sucesso")
            return result
        
        except Exception as e:
            logger.exception(f"Erro ao assinar evento: {e}")
            raise
