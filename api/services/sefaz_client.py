import requests
import logging
import os
from .signer_service import SignerService

logger = logging.getLogger(__name__)

class SefazService:
    # URLs for MG (Minas Gerais)
    URLS_NFCE = {
        'MG': {
            '2': { # Homologacao
                'NfeAutorizacao': 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
                'NfeRetAutorizacao': 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeRetAutorizacao4',
                'NfeRecepcaoEvento': 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeRecepcaoEvento4',
                'NfeConsultaProtocolo': 'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4'
            },
            '1': { # Producao
                'NfeAutorizacao': 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
                'NfeRetAutorizacao': 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeRetAutorizacao4',
                'NfeRecepcaoEvento': 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeRecepcaoEvento4',
                'NfeConsultaProtocolo': 'https://nfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4'
            }
        }
    }
    
    URLS_NFE = {
        'MG': {
            '2': { # Homologacao
                'NfeAutorizacao': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
                'NfeRetAutorizacao': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
                'NfeRecepcaoEvento': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4',
                'NfeConsultaProtocolo': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4'
            },
            '1': { # Producao
                'NfeAutorizacao': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
                'NfeRetAutorizacao': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
                'NfeRecepcaoEvento': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4',
                'NfeConsultaProtocolo': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4'
            }
        }
    }

    def __init__(self, empresa_config, modelo='65'):
        self.config = empresa_config
        self.modelo = str(modelo)
        self.uf = self.config.estado or 'MG'
        
        # Determine environment depending on Model
        if self.modelo == '55':
             self.ambiente = self.config.ambiente_nfe or '2'
             self.urls = self.URLS_NFE
        else:
             self.ambiente = self.config.ambiente_nfce or '2'
             self.urls = self.URLS_NFCE
        
        # Load Certificate Service
        cert_content = self.config.certificado_digital
        cert_password = self.config.senha_certificado
        
        # Estratégia 1: Se está vazio, buscar arquivo local
        if not cert_content or cert_content.strip() == '':
            local_pfx = "certificado.pfx"
            if os.path.exists(local_pfx):
                logger.info(f"✓ Usando certificado do arquivo local: {local_pfx}")
                self.signer = SignerService(local_pfx, cert_password)
                self.cert_path, self.key_path = self.signer.get_cert_key_pem()
                return
            else:
                raise ValueError("Certificado Digital não configurado. Configure no Django Admin > Empresa Config.")
        
        # Estratégia 2: Verificar se é um caminho de arquivo Windows/Linux
        # Caminhos do Windows: começam com C:\ ou contém :\
        # Caminhos do Linux: começam com / ou ~/
        is_file_path = (
            cert_content.startswith('/') or  # Linux/Mac absolute
            cert_content.startswith('~/') or  # Linux/Mac home
            ':\\' in cert_content or  # Windows (C:\, D:\)
            cert_content.startswith('\\\\')  # Windows network path (\\servidor\)
        )
        
        if is_file_path:
            logger.info(f"Certificado identificado como CAMINHO DE ARQUIVO: {cert_content}")
            if os.path.exists(cert_content):
                logger.info(f"✓ Arquivo encontrado e será carregado: {cert_content}")
                self.signer = SignerService(cert_content, cert_password)
                self.cert_path, self.key_path = self.signer.get_cert_key_pem()
                return
            else:
                raise ValueError(
                    f"❌ ERRO: Caminho do certificado não encontrado!\n"
                    f"Caminho configurado: {cert_content}\n\n"
                    f"Verifique:\n"
                    f"  1. O arquivo existe nesse caminho?\n"
                    f"  2. O caminho está correto (ex: C:\\Certificados\\certificado.pfx)?\n"
                    f"  3. O sistema tem permissão para acessar esse arquivo?"
                )
        
        # Estratégia 3: Não é caminho, então assume que é base64
        logger.info("Certificado identificado como BASE64 (do banco de dados)")
        logger.info(f"  Tamanho: {len(cert_content)} caracteres")
        self.signer = SignerService(cert_content, cert_password)
        self.cert_path, self.key_path = self.signer.get_cert_key_pem()

    def __del__(self):
        # Cleanup temp files
        if hasattr(self, 'cert_path') and os.path.exists(self.cert_path):
            try: os.unlink(self.cert_path)
            except: pass
        if hasattr(self, 'key_path') and os.path.exists(self.key_path):
            try: os.unlink(self.key_path)
            except: pass

    def enviar_nfce(self, assinado_xml):
        """
        Envelopa e envia o XML assinado (enviNFe) para a SEFAZ
        """
        url = self.urls.get(self.uf, {}).get(self.ambiente, {}).get('NfeAutorizacao')
        if not url:
            raise ValueError(f"URL NFeAutorizacao não encontrada para {self.uf} ambiente {self.ambiente} modelo {self.modelo}")
            
        # 1. Envelopar (SOAP)
        # ACBr já entrega o XML puro ou envelopado? O SignerService retorna o NFe assinado.
        # Precisamos colocar dentro de <enviNFe> e depois envelopar em SOAP.
        
        # Build enviNFe
        # idLote hardcoded or timestamp
        import time
        id_lote = str(int(time.time()))
        
        # NFe deve ser string pura do XML assinado
        
        # 0. Remover BOM se existir (CRITICO: Fazer isso ANTES de regex)
        assinado_xml = assinado_xml.replace('\ufeff', '')

        # 1. Remover declaração xml se existir <?xml...?> de forma robusta
        # Remover ANY xml declaration encontrada (para evitar múltiplas)
        import re
        assinado_xml = re.sub(r'<\?xml[^>]*\?>', '', assinado_xml, flags=re.IGNORECASE).strip()
        
        # Limpar espaços em branco extras no inicio que podem quebrar o SOAP
        assinado_xml = assinado_xml.strip()

        # indSinc=1 (Sincrono).
        # Erro 452 indica que lotes pequenos exigem Sincrono.
        ind_sinc = '1'
        
        envi_nfe = f"""<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>{id_lote}</idLote><indSinc>{ind_sinc}</indSinc>{assinado_xml}</enviNFe>"""
        
        soap_request = f"""<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      <versaoDados>4.00</versaoDados>
      <cUF>31</cUF> 
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      {envi_nfe}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>"""

        headers = {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote', # Às vezes ignorado no SOAP 1.2
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' # Corrige erro "AccessDenied" em alguns WAFs da SEFAZ
        }
        
        try:
            # Debug: Salvar request para análise
            try:
                debug_dir = r"C:\XML_NFCe\Debug"
                os.makedirs(debug_dir, exist_ok=True)
                with open(os.path.join(debug_dir, "LAST_SOAP_REQUEST.xml"), "w", encoding="utf-8") as f:
                    f.write(soap_request)
                logger.info(f"SOAP Request salvo em: {debug_dir}\\LAST_SOAP_REQUEST.xml")
            except:
                pass
            
            response = requests.post(
                url, 
                data=soap_request.encode('utf-8'), 
                headers=headers, 
                cert=(self.cert_path, self.key_path),
                timeout=30,
                verify=False # Em homologacao as vezes falta cadeia
            )
            
            # Debug: Salvar response para análise
            try:
                with open(os.path.join(debug_dir, "LAST_SOAP_RESPONSE.xml"), "w", encoding="utf-8") as f:
                    f.write(response.text)
                logger.info(f"SOAP Response salvo em: {debug_dir}\\LAST_SOAP_RESPONSE.xml")
            except:
                pass
            
            # Tratar erro AccessDenied (WAF/Firewall)
            if "AccessDenied" in response.text:
                logger.error("SEFAZ Retornou AccessDenied. Provavel bloqueio de IP ou User-Agent.")
                return {'sucesso': False, 'mensagem': "Erro SEFAZ: Acesso Negado (AccessDenied). Bloqueio de Segurança/Firewall na SEFAZ.", 'raw': response.text}

            # Debug Response se houver erro
            if response.status_code != 200:
                logger.error(f"SEFAZ Erro {response.status_code}: {response.text}")

            response.raise_for_status()
            return self._parse_response(response.text)
            
        except requests.exceptions.SSLError as e:
            logger.error(f"Erro SSL SEFAZ: {e}")
            return {'sucesso': False, 'mensagem': f"Erro de Certificado/Conexão Segura: {str(e)}"}
        except Exception as e:
            logger.error(f"Erro Conexão SEFAZ: {e}")
            return {'sucesso': False, 'mensagem': f"Erro ao conectar SEFAZ: {str(e)}"}

    def consultar_nfe(self, chave_acesso):
        """
        Consulta status da NFe na SEFAZ (NfeConsultaProtocolo)
        """
        url = self.urls.get(self.uf, {}).get(self.ambiente, {}).get('NfeConsultaProtocolo')
        if not url:
            logger.error("URL Consulta Protocolo não encontrada")
            return {"sucesso": False, "mensagem": "URL de Consulta não configurada"}

        cons_sit = f"""<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>{self.ambiente}</tpAmb><xServ>CONSULTAR</xServ><chNFe>{chave_acesso}</chNFe></consSitNFe>"""

        soap_body = f"""<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">
      <cUF>31</cUF>
      <versaoDados>4.00</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">
      {cons_sit}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>""" 

        headers = {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF'
        }
        
        try:
            response = requests.post(
                url, 
                data=soap_body.encode('utf-8'), 
                headers=headers, 
                cert=(self.cert_path, self.key_path),
                timeout=15,
                verify=False
            )
            
            # Simple Parse
            import re
            cstat_match = re.search(r'<cStat>(\d+)</cStat>', response.text)
            xmotivo_match = re.search(r'<xMotivo>([^<]+)</xMotivo>', response.text)
            prot_match = re.search(r'<nProt>(\d+)</nProt>', response.text)
            dig_match = re.search(r'<digVal>([^<]+)</digVal>', response.text)
            
            cstat = cstat_match.group(1) if cstat_match else '0'
            xmotivo = xmotivo_match.group(1) if xmotivo_match else 'Erro Parse'
            nprot = prot_match.group(1) if prot_match else None
            digVal = dig_match.group(1) if dig_match else None
            
            return {
                "sucesso": True,
                "cStat": cstat,
                "xMotivo": xmotivo,
                "nProt": nprot,
                "digVal": digVal,
                "xml_retorno": response.text
            }
            
        except Exception as e:
            logger.error(f"Erro ao consultar NFe: {e}")
            return {"sucesso": False, "mensagem": str(e)}

    def _parse_response(self, xml_resp):
        """
        Interpreta retorno SOAP da SEFAZ
        """
        # Extrair nfeResultMsg
        # Pode usar lxml ou regex simples dado a complexidade do envelope
        
        try:
            from lxml import etree
            # Remover namespaces para facilitar busca
            parser = etree.XMLParser(recover=True)
            root = etree.fromstring(xml_resp.encode('utf-8'), parser=parser)
            
            # Remove namespaces
            for elem in root.getiterator():
                if not hasattr(elem.tag, 'find'): continue
                i = elem.tag.find('}')
                if i >= 0:
                    elem.tag = elem.tag[i+1:]
            
            # Buscar retEnviNFe
            ret = root.find('.//retEnviNFe')
            if ret is None:
                # Tenta buscar por Fault (erro SOAP)
                fault = root.find('.//Fault') or root.find('.//faultstring')
                if fault is not None:
                    fault_msg = fault.text if hasattr(fault, 'text') else etree.tostring(fault, encoding='unicode')
                    logger.error(f"SOAP Fault: {fault_msg}")
                    return {'sucesso': False, 'mensagem': f'Erro SOAP: {fault_msg}', 'raw': xml_resp}
                
                return {'sucesso': False, 'mensagem': 'Retorno inválido da SEFAZ (tag retEnviNFe não encontrada)', 'raw': xml_resp}
                
            cStat = ret.findtext('cStat')
            xMotivo = ret.findtext('xMotivo')
            
            logger.info(f"SEFAZ cStat={cStat} xMotivo={xMotivo}")
            
            # Se cStat indica erro de schema/validação, captura detalhes
            if cStat in ['215', '216', '217', '218', '402', '539']:  # Códigos de erro de schema
                # Tenta extrair mais detalhes
                detalhes = []
                for elem in ret.iter():
                    if elem.text and len(elem.text.strip()) > 0 and elem.tag not in ['cStat', 'xMotivo']:
                        detalhes.append(f"{elem.tag}={elem.text}")
                
                msg_detalhada = f"Rejeição: {xMotivo}"
                if detalhes:
                    msg_detalhada += f" | Detalhes: {', '.join(detalhes[:5])}"
                
                logger.error(f"Erro Schema XML: {msg_detalhada}")
                return {'sucesso': False, 'mensagem': msg_detalhada, 'cStat': cStat, 'raw': xml_resp}
            
            if cStat == '104': # Lote Processado (Síncrono)
                # Buscar protNFe
                prot = ret.find('.//protNFe')
                if prot is not None:
                    infProt = prot.find('infProt')
                    cStatProt = infProt.findtext('cStat')
                    xMotivoProt = infProt.findtext('xMotivo')
                    nProt = infProt.findtext('nProt')
                    chNFe = infProt.findtext('chNFe')
                    
                    if cStatProt in ['100', '150']: # Autorizado
                        return {
                            'sucesso': True,
                            'cStat': cStatProt,
                            'xMotivo': xMotivoProt,
                            'protocolo': nProt,
                            'chave': chNFe,
                            'xml_retorno': xml_resp
                        }
                    else:
                        return {
                            'sucesso': False,
                            'cStat': cStatProt,
                            'mensagem': f"Rejeição: {xMotivoProt}",
                            'xMotivo': xMotivoProt
                        }
            
            return {'sucesso': False, 'mensagem': f"Status Lote: {cStat} - {xMotivo}", 'cStat': cStat}

        except Exception as e:
            return {'sucesso': False, 'mensagem': f"Erro ao ler XML retorno: {str(e)}"}

    def enviar_evento(self, xml_evento_assinado, chave_nfe):
        """
        Envia evento (CCe, Cancelamento, etc) para SEFAZ via NFeRecepcaoEvento.
        
        Args:
            xml_evento_assinado: XML do evento já assinado
            chave_nfe: Chave da NFe para log
            
        Returns:
            dict: {'sucesso': bool, 'mensagem': str, 'protocolo': str (se sucesso)}
        """
        import re
        import time
        
        url = self.urls.get(self.uf, {}).get(self.ambiente, {}).get('NfeRecepcaoEvento')
        if not url:
            return {'sucesso': False, 'mensagem': f'URL NFeRecepcaoEvento não encontrada para {self.uf} ambiente {self.ambiente}'}
        
        # Remover declaração XML se existir
        xml_evento_assinado = re.sub(r'<\?xml[^>]*\?>', '', xml_evento_assinado, flags=re.IGNORECASE).strip()
        
        # Gerar ID do lote
        id_lote = str(int(time.time()))
        
        # Envelope envEvento - sem espaços/newlines entre tags (evita erro 588)
        xml_evento_assinado = xml_evento_assinado.strip()
        env_evento = f'<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00"><idLote>{id_lote}</idLote>{xml_evento_assinado}</envEvento>'
        
        # Envelope SOAP - nfeDadosMsg sem whitespace interno (evita erro 588)
        soap_request = (
            '<?xml version="1.0" encoding="utf-8"?>'
            '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'
            '<soap12:Header>'
            '<nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">'
            '<cUF>31</cUF>'
            '<versaoDados>1.00</versaoDados>'
            '</nfeCabecMsg>'
            '</soap12:Header>'
            '<soap12:Body>'
            f'<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">{env_evento}</nfeDadosMsg>'
            '</soap12:Body>'
            '</soap12:Envelope>'
        )
        
        headers = {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento',
            'User-Agent': 'Mozilla/5.0'
        }
        
        try:
            # Debug: Salvar request
            try:
                debug_dir = r"C:\XML_NFCe\Debug"
                os.makedirs(debug_dir, exist_ok=True)
                with open(os.path.join(debug_dir, "LAST_EVENTO_REQUEST.xml"), "w", encoding="utf-8") as f:
                    f.write(soap_request)
                logger.info(f"SOAP Request evento salvo em: {debug_dir}")
            except:
                pass
            
            response = requests.post(
                url,
                data=soap_request.encode('utf-8'),
                headers=headers,
                cert=(self.cert_path, self.key_path),
                timeout=30,
                verify=False
            )
            
            # Debug: Salvar response
            try:
                with open(os.path.join(debug_dir, "LAST_EVENTO_RESPONSE.xml"), "w", encoding="utf-8") as f:
                    f.write(response.text)
            except:
                pass
            
            logger.info(f"Resposta SEFAZ evento: status={response.status_code}")
            
            # Parse response
            # cStat externo = status do lote (128 = Lote processado)
            # cStat interno (dentro de retEvento/infEvento) = status do evento individual (135/136 = Registrado)
            cstat_all = re.findall(r'<cStat>(\d+)</cStat>', response.text)
            xmotivo_all = re.findall(r'<xMotivo>([^<]+)</xMotivo>', response.text)
            nprot_match = re.search(r'<nProt>(\d+)</nProt>', response.text)

            cstat = cstat_all[0] if cstat_all else '0'
            # O xMotivo do evento interno (se houver) é mais descritivo
            xmotivo = xmotivo_all[-1] if xmotivo_all else 'Erro parse resposta'
            nprot = nprot_match.group(1) if nprot_match else None

            # cStat do evento interno (segundo cStat, se houver)
            cstat_inner = cstat_all[1] if len(cstat_all) > 1 else cstat

            logger.info(f"Evento cStat={cstat} cStat_inner={cstat_inner} xMotivo={xmotivo} nProt={nprot}")

            # Códigos de sucesso para eventos:
            # 128 = Lote de evento processado (outer) — NÃO é sucesso por si só
            # 135 = Evento registrado e vinculado a NF-e (inner) → sucesso
            # 136 = Evento registrado, mas não vinculado a NF-e → sucesso
            # CORREÇÃO: só considerar sucesso quando o evento INTERNO (inner) foi aceito (135 ou 136)
            # outer cStat=128 com inner cStat=297/etc ainda é REJEIÇÃO
            if cstat_inner in ['135', '136']:
                return {
                    'sucesso': True,
                    'cStat': cstat_inner,
                    'xMotivo': xmotivo,
                    'protocolo': nprot,
                    'xml_retorno': response.text
                }
            else:
                # Inclui tanto o cStat externo quanto o interno na mensagem de erro
                motivo_det = f"Lote: {cstat}/{xmotivo_all[0] if xmotivo_all else '?'} | Evento: {cstat_inner}/{xmotivo}" if len(cstat_all) > 1 else f"{cstat}/{xmotivo}"
                return {
                    'sucesso': False,
                    'cStat': cstat_inner,
                    'mensagem': f"Rejeição evento {cstat_inner}: {xmotivo} (outer: {cstat})",
                    'xMotivo': xmotivo,
                    'xml_retorno': response.text
                }
                
        except requests.exceptions.SSLError as e:
            logger.error(f"Erro SSL ao enviar evento: {e}")
            return {'sucesso': False, 'mensagem': f"Erro de Certificado/SSL: {str(e)}"}
        except Exception as e:
            logger.error(f"Erro ao enviar evento: {e}")
            return {'sucesso': False, 'mensagem': f"Erro ao conectar SEFAZ: {str(e)}"}
            
