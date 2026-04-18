import logging
import os
from datetime import datetime

# Native Imports
# Imports moved to inside methods to handle missing dependencies gracefully

logger = logging.getLogger(__name__)

class NFCeService:
    def __init__(self):
        pass

    def cancelar_nfce(self, venda_obj, justificativa):
        """
        Cancela uma NFC-e emitida enviando evento de cancelamento (tpEvento=110111) via SEFAZ nativo.
        """
        if not venda_obj.chave_nfe:
            return {"sucesso": False, "mensagem": "Venda não possui Chave NFC-e para cancelar."}

        protocolo = venda_obj.protocolo_nfe or ''
        if not protocolo:
            return {"sucesso": False, "mensagem": "Protocolo de autorização não encontrado. Não é possível cancelar sem o protocolo."}

        try:
            import xml.sax.saxutils as saxutils
            from api.models import EmpresaConfig
            from .sefaz_client import SefazService

            config = EmpresaConfig.get_ativa()
            if not config:
                return {"sucesso": False, "mensagem": "Configuração da empresa não encontrada."}

            chave_nfe = venda_obj.chave_nfe
            cnpj = "".join(filter(str.isdigit, config.cpf_cnpj or ''))
            ambiente = config.ambiente_nfce or '2'
            uf_cod = chave_nfe[:2]
            just_escaped = saxutils.escape(justificativa[:255])
            dh_evento = datetime.now().strftime('%Y-%m-%dT%H:%M:%S-03:00')
            tp_evento = '110111'
            id_evento = f"ID{tp_evento}{chave_nfe}01"

            xml_evento = (
                f'<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">'
                f'<infEvento Id="{id_evento}">'
                f'<cOrgao>{uf_cod}</cOrgao>'
                f'<tpAmb>{ambiente}</tpAmb>'
                f'<CNPJ>{cnpj}</CNPJ>'
                f'<chNFe>{chave_nfe}</chNFe>'
                f'<dhEvento>{dh_evento}</dhEvento>'
                f'<tpEvento>{tp_evento}</tpEvento>'
                f'<nSeqEvento>1</nSeqEvento>'
                f'<verEvento>1.00</verEvento>'
                f'<detEvento versao="1.00">'
                f'<descEvento>Cancelamento</descEvento>'
                f'<nProt>{protocolo}</nProt>'
                f'<xJust>{just_escaped}</xJust>'
                f'</detEvento>'
                f'</infEvento>'
                f'</evento>'
            )

            sefaz = SefazService(config, modelo='65')
            xml_assinado = sefaz.signer.sign_evento(xml_evento, id_evento)
            resultado = sefaz.enviar_evento(xml_assinado, chave_nfe)

            if resultado.get('sucesso'):
                venda_obj.status_nfe = 'CANCELADA'
                venda_obj.save()
                return {"sucesso": True, "mensagem": "NFC-e Cancelada com Sucesso!", "protocolo": resultado.get('protocolo')}
            else:
                return {"sucesso": False, "mensagem": f"Erro Cancelamento: {resultado.get('mensagem', 'Erro desconhecido')}"}

        except Exception as e:
            logger.error(f"Erro ao cancelar NFC-e nativa: {e}")
            return {"sucesso": False, "mensagem": f"Erro ao cancelar: {str(e)}"}

    def inutilizar_numeracao(self, venda_obj, justificativa):
        """
        Inutilização de numeração NFC-e via SEFAZ nativo (NFeInutilizacao4).
        """
        try:
            import xml.sax.saxutils as saxutils
            import requests
            from api.models import EmpresaConfig
            from .sefaz_client import SefazService

            config = EmpresaConfig.get_ativa()
            if not config:
                return {"sucesso": False, "mensagem": "Configuração da empresa não encontrada."}

            cnpj = "".join(filter(str.isdigit, config.cpf_cnpj or ''))
            ambiente = config.ambiente_nfce or '2'
            uf_ibge = config.estado or 'MG'
            uf_cod_map = {'AC':'12','AL':'27','AM':'13','AP':'16','BA':'29','CE':'23','DF':'53',
                          'ES':'32','GO':'52','MA':'21','MG':'31','MS':'50','MT':'51','PA':'15',
                          'PB':'25','PE':'26','PI':'22','PR':'41','RJ':'33','RN':'24','RO':'11',
                          'RR':'14','RS':'43','SC':'42','SE':'28','SP':'35','TO':'17'}
            c_uf = uf_cod_map.get(uf_ibge, '31')
            ano = str(datetime.now().year)[2:]
            modelo = '65'
            serie = str(venda_obj.serie_nfe or '1')
            numero = str(venda_obj.numero_nfe or venda_obj.pk)
            just_escaped = saxutils.escape(justificativa[:255])
            id_inut = f"ID{c_uf}{ano}{cnpj}{modelo}{serie.zfill(3)}{numero.zfill(9)}{numero.zfill(9)}"

            xml_inut = (
                f'<inutNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">'
                f'<infInut Id="{id_inut}">'
                f'<tpAmb>{ambiente}</tpAmb>'
                f'<cUF>{c_uf}</cUF>'
                f'<ano>{ano}</ano>'
                f'<CNPJ>{cnpj}</CNPJ>'
                f'<mod>{modelo}</mod>'
                f'<serie>{serie}</serie>'
                f'<nNFIni>{numero}</nNFIni>'
                f'<nNFFin>{numero}</nNFFin>'
                f'<xJust>{just_escaped}</xJust>'
                f'</infInut>'
                f'</inutNFe>'
            )

            sefaz = SefazService(config, modelo='65')
            xml_assinado = sefaz.signer.sign_inutilizacao(xml_inut, id_inut)

            urls_inut = {
                'MG': {'1': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
                        '2': 'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4'},
            }
            url = urls_inut.get(uf_ibge, urls_inut['MG']).get(ambiente, urls_inut['MG']['2'])

            soap = (
                '<?xml version="1.0" encoding="utf-8"?>'
                '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'
                '<soap12:Header>'
                '<nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4">'
                f'<cUF>{c_uf}</cUF><versaoDados>4.00</versaoDados>'
                '</nfeCabecMsg>'
                '</soap12:Header>'
                '<soap12:Body>'
                f'<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4">{xml_assinado}</nfeDadosMsg>'
                '</soap12:Body>'
                '</soap12:Envelope>'
            )
            headers = {'Content-Type': 'application/soap+xml; charset=utf-8',
                       'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4/nfeInutilizacaoNF'}
            resp = requests.post(url, data=soap.encode('utf-8'), headers=headers,
                                 cert=(sefaz.cert_path, sefaz.key_path), timeout=30, verify=False)

            import re
            cstat_list = re.findall(r'<cStat>(\d+)</cStat>', resp.text)
            xmot_list = re.findall(r'<xMotivo>([^<]+)</xMotivo>', resp.text)
            cstat = cstat_list[0] if cstat_list else '0'
            xmot = xmot_list[0] if xmot_list else 'Erro'

            if cstat == '102':
                venda_obj.status_nfe = 'INUTILIZADA'
                venda_obj.save()
                return {"sucesso": True, "mensagem": "Numeração NFC-e Inutilizada com Sucesso!"}
            else:
                return {"sucesso": False, "mensagem": f"Erro Inutilização (cStat {cstat}): {xmot}"}

        except Exception as e:
            logger.error(f"Erro ao inutilizar NFC-e nativa: {e}")
            return {"sucesso": False, "mensagem": f"Erro ao inutilizar: {str(e)}"}

    def emitir_nfce(self, venda_obj, empresa_obj=None):
        """
        Generates and Emits NFC-e for a specific sale.
        Tries NATIVE method first. If fails or Config missing, allows fallback to ACBr?
        User requested Native-Only preference.
        """
        if not venda_obj:
            return {"sucesso": False, "mensagem": "Venda inválida"}

        # Fetch Config if not passed
        from api.models import Venda, EmpresaConfig
        if not empresa_obj:
            config = EmpresaConfig.get_ativa()
            
            # Validate Max Value without Client
            valor_maximo = config.valor_maximo_nfce if config else 10000.00
            cliente_identificado = False
            if venda_obj.id_cliente and venda_obj.id_cliente.cpf_cnpj:
                cliente_identificado = True
            
            if not cliente_identificado and venda_obj.valor_total > valor_maximo:
                return {"sucesso": False, "mensagem": f"Venda acima de R$ {valor_maximo} exige identificação do cliente (CPF/CNPJ)."}

            empresa_obj = config

        if not empresa_obj:
            return {"sucesso": False, "mensagem": "Dados da empresa não configurados."}

        # --- NATIVE METHOD ---
        # Checks if certificate is configured to try native (DB or Local File)
        has_local_cert = os.path.exists("certificado.pfx")
        
        if empresa_obj.certificado_digital or has_local_cert:
            logger.info("Tentando emissão via Componente Nativo Python (Sem ACBr)...")
            try:
                return self._emitir_nativa(venda_obj, empresa_obj)
            except Exception as e:
                logger.error(f"Falha na emissão nativa: {e}")
                return {"sucesso": False, "mensagem": f"Erro Emissão Nativa: {str(e)}"}
        
        # --- DEVELOPMENT / SIMULATION MODE (IF NO CERTIFICATE) ---
        # Se estiver em homologação e não tiver certificado, SIMULA a emissão para não travar testes
        if empresa_obj.ambiente_nfce == '2': # Homologação
            logger.warning("[DEV] Simulando Emissão de NFC-e (Sem Certificado)")
            
            # Gera XML sem assinatura
            try:
                # Import local para evitar erro se nao tiver dependencias instaladas (embora instalamos agora)
                try: 
                    from .nfe_xml_builder import NfeXmlBuilder
                except ImportError:
                    return {"sucesso": False, "mensagem": "Erro Simulação: 'lxml' ou 'signxml' não instalados."}

                builder = NfeXmlBuilder(venda_obj, empresa_obj)
                xml_content = builder.build_xml()
                
                # Simula retorno de sucesso SEFAZ
                import random
                chave_simulada = f"312301{empresa_obj.cpf_cnpj}650010000000011{random.randint(10000000,99999999)}"
                protocolo_simulado = f"13123{random.randint(100000000,999999999)}"
                
                venda_obj.status_nfe = 'EMITIDA'
                venda_obj.chave_nfe = chave_simulada
                venda_obj.protocolo_nfe = protocolo_simulado
                venda_obj.numero_nfe = venda_obj.id_venda
                venda_obj.xml_nfe = xml_content # Salva o XML não assinado mesmo
                venda_obj.save()
                
                return {
                    "sucesso": True, 
                    "mensagem": "NFC-e EMITIDA (SIMULAÇÃO - SEM CERTIFICADO)", 
                    "chave": chave_simulada, 
                    "protocolo": protocolo_simulado,
                    "simulacao": True
                }
            except Exception as e:
                logger.error(f"Erro na simulação: {e}")

        return {"sucesso": False, "mensagem": "Certificado Digital não configurado para emissão de NFC-e."}

    def _emitir_nativa(self, venda, empresa):
        """
        Implementation of Native Issuance using NfeXmlBuilder + SignerService + SefazClient
        """
        try:
            # Import modules locally to capture specific ImportErrors
            try:
                from .nfe_xml_builder import NfeXmlBuilder
                from .sefaz_client import SefazService
                from .signer_service_v2 import XMLSignerV2
            except ImportError as e:
                import sys
                raise ImportError(f"Dependência faltando: {e}. Executável: {sys.executable}")

            # 0. Define sequencial se nao existir baseado na Operacao
            if not venda.numero_nfe and venda.id_operacao:
                 try:
                     op_seq = venda.id_operacao
                     if op_seq.id_numeracao_id:
                         try:
                             venda.numero_nfe = int(op_seq.id_numeracao.numeracao)
                         except (ValueError, TypeError):
                             venda.numero_nfe = op_seq.proximo_numero_nf
                     else:
                         venda.numero_nfe = op_seq.proximo_numero_nf
                     if op_seq.serie_nf:
                         venda.serie_nfe = op_seq.serie_nf
                 except:
                     pass

            # 1. Build XML
            builder = NfeXmlBuilder(venda, empresa)
            xml_unsigned = builder.build_xml()
            
            # 2. Sign - USANDO JAVA (mais confiável)
            from api.services.java_signer_bridge import JavaXmlSigner
            try:
                signer_java = JavaXmlSigner(empresa.certificado_digital, empresa.senha_certificado)
                xml_signed = signer_java.sign_xml(xml_unsigned)
                # logger with checkmark removed
                logger.info("Assinatura realizada com Java")
            except FileNotFoundError as e:
                # Fallback para Python se Java não disponível
                logger.warning(f"Java signer não disponível: {e}. Usando Python fallback.")
                from api.services.signer_service_v2 import XMLSignerV2
                signer_v2 = XMLSignerV2(empresa.certificado_digital, empresa.senha_certificado)
                xml_signed = signer_v2.sign_xml(xml_unsigned, parent_tag='infNFe')
            
            # Inicializa SefazService para envio
            sefaz = SefazService(empresa)
            
            # --- POST-SIGNATURE CHECKS ---
            # O sistema agora gera o QR Code V2.00 (p=...) no Builder (antes de assinar).
            # Isso garante que a integridade do XML seja mantida.
            # A estratégia de Dirty/Clean no signer preserva o conteudo original (incluindo CDATA se houvesse, mas V2.0 nao usa).
            
            # (Validacao antiga removida pois <qrCode>http agora é o correto)
                
            # Log debug
            logger.info("Assinatura concluida. QR Code mantido conforme gerado no Builder.")
            
            # --- DEBUG: Save Signed XML ---
            try:
                debug_dir = r"C:\XML_NFCe"
                if not os.path.exists(debug_dir): os.makedirs(debug_dir)
                with open(os.path.join(debug_dir, "DEBUG_LAST_SIGNED.xml"), "w", encoding="utf-8") as f:
                    f.write(xml_signed)
            except Exception as e:
                logger.error(f"Failed to save debug XML: {e}")
            # ------------------------------
            
            # (REMOVIDO: Lógica antiga de correção de CDATA foi removida para evitar conflitos com V2.0)
            
            # 3. Transmitir
            try:
                result = sefaz.enviar_nfce(xml_signed)
            except Exception as e_conn:
                logger.warning(f"Falha na conexão com SEFAZ: {e_conn}. Tentando Contingência Off-line.")
                return self._emitir_offline_fallback(venda, empresa, xml_unsigned, str(e_conn))
            
            if result.get('sucesso'):
                # --- Montagem do XML de Distribuição (nfeProc) ---
                # O retorno da SEFAZ é um SOAP Envelope. Precisamos extrair apenas o protNFe
                # e juntar com o XML Assinado original.
                xml_distribuicao = result.get('xml_retorno', xml_signed) # Fallback inicial
                
                try:
                    import re
                    soap_xml_retorno = result.get('xml_retorno', '')
                    
                    # Busca protNFe (Ignora namespace no regex mas captura o bloco todo)
                    # Padrão flexivel: <(\w+:)?protNFe.*?</(\w+:)?protNFe>
                    match_prot = re.search(r'(<(\w+:)?protNFe.*?</(\w+:)?protNFe>)', soap_xml_retorno, re.DOTALL)
                    
                    if match_prot:
                        prot_xml = match_prot.group(1)
                        
                        # Verifica se o prot_xml tem o namespace correto se foi extraido de um soap com prefixo
                        # Se tiver prefixo (ex: ns2:protNFe), idealmente limpar, mas SOAP da SEFAZ geralmente retorna limpo no body ou com prefixo no envelope
                        # O snippet do usuario mostra: <protNFe versao="4.00">
                        
                        # Limpa cabeçalho do XML assinado se tiver
                        xml_nfe_clean = xml_signed
                        if '<?xml' in xml_nfe_clean:
                            xml_nfe_clean = xml_nfe_clean.split('?>', 1)[1].strip()
                        
                        # Monta estrutura final nfeProc
                        xml_distribuicao = f'<?xml version="1.0" encoding="UTF-8"?><nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">{xml_nfe_clean}{prot_xml}</nfeProc>'
                        logger.info("XML de Distribuição (nfeProc) montado com sucesso.")
                    else:
                        logger.warning("Não foi possível extrair protNFe para montar nfeProc. Salvando retorno bruto.")
                        
                except Exception as e_xml:
                    logger.error(f"Erro ao montar XML de distribuição: {e_xml}")

                
                # Extrair QR Code do XML para enviar ao frontend (impressão)
                import re
                
                # Tenta primeiro com CDATA
                qr_pattern = r'<qrCode><!\[CDATA\[(.*?)\]\]></qrCode>'
                qr_match = re.search(qr_pattern, xml_signed, re.DOTALL)
                
                if not qr_match:
                    # Tenta sem CDATA
                    qr_pattern = r'<qrCode>([^<]+)</qrCode>'
                    qr_match = re.search(qr_pattern, xml_signed)
                
                if qr_match:
                    result['qrcode'] = qr_match.group(1)
                    logger.info(f"✓ QR Code extraído com sucesso: {result['qrcode'][:80]}...")
                else:
                    logger.warning("⚠ QR Code NÃO encontrado no XML assinado!")
                    # Salvar parte do XML para debug
                    if '<infNFeSupl' in xml_signed:
                        idx = xml_signed.find('<infNFeSupl')
                        logger.debug(f"infNFeSupl encontrado: {xml_signed[idx:idx+300]}")
                
                # URL de Consulta
                result['url_consulta'] = builder.url_consulta_chave if hasattr(builder, 'url_consulta_chave') else 'portalsped.fazenda.mg.gov.br/portalnfce'
                
                # Número e Série da NFCe
                result['numero'] = venda.numero_nfe
                result['serie'] = venda.serie_nfe or '1'
                
                # Incrementa sequencial da operacao
                if venda.id_operacao:
                    try:
                        # Atualiza o proximo numero
                        op = venda.id_operacao
                        # Se o numero usado foi o atual da operacao, incrementa
                        if op.proximo_numero_nf == venda.numero_nfe: 
                            op.proximo_numero_nf += 1
                            op.save()
                        if op.id_numeracao_id:
                            try:
                                num_obj = op.id_numeracao
                                num_obj.numeracao = str(int(num_obj.numeracao) + 1)
                                num_obj.save()
                            except Exception as e_num:
                                logger.error(f"Erro ao incrementar numeracao: {e_num}")
                    except Exception as e:
                        logger.error(f"Erro ao incrementar operacao: {e}")

                venda.status_nfe = 'EMITIDA'
                venda.chave_nfe = result.get('chave')
                venda.protocolo_nfe = result.get('protocolo')
                venda.xml_nfe = xml_distribuicao  # Salva o XML de Distribuição montado
                venda.qrcode_nfe = result.get('qrcode', '')  # Salvar QR Code
                venda.mensagem_nfe = "Emitida com sucesso"
                venda.save()
                return result
            else:
                venda.status_nfe = 'ERRO'
                venda.xml_nfe = xml_signed
                venda.mensagem_nfe = result.get('mensagem', 'Erro desconhecido na SEFAZ')
                venda.save()
                return result

        except Exception as e:
            # Capture error in native method too if something raises here
            try:
                venda.status_nfe = 'ERRO'
                venda.mensagem_nfe = str(e)
                venda.save()
            except: pass
            raise e

    def _emitir_offline_fallback(self, venda, empresa, xml_unsigned, error_msg):
        """
        Gera o XML em modo de Contingência Off-line (tpEmis=9).
        Deve ser usado quando a conexão com a SEFAZ falha.
        """
        try:
            logger.info("Gerando XML em Contingência Off-line...")
            
            # 1. Modificar XML para tpEmis=9 e adicionar dhCont/xJust
            # O XML ainda não está assinado, então podemos manipular strings simples
            # Estrutura esperada: <ide>...<tpEmis>1</tpEmis>...</ide>
            # Nova estrutura: <ide>...<tpEmis>9</tpEmis><dhCont>AAAA-MM-DDTHH:MM:SS-03:00</dhCont><xJust>...</xJust>...</ide>
            
            dh_cont = datetime.now().strftime('%Y-%m-%dT%H:%M:%S-03:00')
            justificativa = "Falha de comunicacao com a SEFAZ"
            
            replacement = f"<tpEmis>9</tpEmis><dhCont>{dh_cont}</dhCont><xJust>{justificativa}</xJust>"
            
            if "<tpEmis>1</tpEmis>" in xml_unsigned:
                xml_offline = xml_unsigned.replace("<tpEmis>1</tpEmis>", replacement)
            else:
                return {"sucesso": False, "mensagem": "Falha na Contingência: Tag tpEmis não encontrada no XML."}

            # 2. Assinar XML Off-line com SIGNER V2
            try:
                # Import local
                from .signer_service_v2 import XMLSignerV2
                signer_v2 = XMLSignerV2(empresa.certificado_digital, empresa.senha_certificado)
                xml_signed = signer_v2.sign_xml(xml_offline, parent_tag='infNFe')
            except Exception as e:
                return {"sucesso": False, "mensagem": f"Erro ao assinar Contingência: {e}"}

            # 3. Salvar Venda (QR Code V2.0 NÃO usa CDATA)
            # Extrair QR Code
            qrcode = ""
            qr_match = re.search(r'<qrCode>(https://[^<]+)</qrCode>', xml_signed)
            if qr_match:
                qrcode = qr_match.group(1)

            # Extrair Chave (está no atributo ID da tag infNFe)
            chave = ""
            try:
                # ID="NFe312..."
                id_match = re.search(r'Id="NFe([0-9]+)"', xml_signed)
                if id_match:
                    chave = id_match.group(1)
            except: pass

            venda.status_nfe = 'CONTINGENCIA' # Novo Status
            venda.chave_nfe = chave
            venda.xml_nfe = xml_signed
            venda.qrcode_nfe = qrcode
            venda.protocolo_nfe = "" # Em contingência não tem protocolo imediato
            
            # Incrementa sequencial da operacao (pois consumiu um numero)
            if venda.id_operacao:
                 try:
                     op = venda.id_operacao
                     if op.proximo_numero_nf == venda.numero_nfe: 
                         op.proximo_numero_nf += 1
                         op.save()
                     if op.id_numeracao_id:
                         try:
                             num_obj = op.id_numeracao
                             num_obj.numeracao = str(int(num_obj.numeracao) + 1)
                             num_obj.save()
                         except Exception as e_num:
                             logger.error(f"Erro ao incrementar numeracao: {e_num}")
                 except: pass

            venda.save()

            return {
                "sucesso": True, 
                "mensagem": "NFC-e emitida em CONTINGÊNCIA OFF-LINE. A nota foi gerada e pode ser impressa, mas deve ser transmitida quando a conexão retornar.",
                "chave": chave,
                "qrcode": qrcode,
                "xml_retorno": xml_signed,
                "contingencia": True,
                "status": "CONTINGENCIA"
            }

        except Exception as e:
            logger.error(f"Erro fatal na contingência: {e}")
            return {"sucesso": False, "mensagem": f"Erro ao gerar contingência: {str(e)}"}

    def _adicionar_qrcode(self, xml_signed, empresa, url_qrcode):
        from lxml import etree
        import hashlib
        import base64
        
        # Remove prefixo xml se houver
        if xml_signed.startswith('<?xml'):
            try:
                # Localiza o inicio da tag NFe
                start = xml_signed.find('<NFe')
                if start >= 0:
                    xml_signed = xml_signed[start:]
            except: pass

        root = etree.fromstring(xml_signed.encode('utf-8'))
        
        # 1. Namespaces
        ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe', 'ds': 'http://www.w3.org/2000/09/xmldsig#'}
        
        # 2. Extract Info
        infNFe = root.find('.//nfe:infNFe', ns)
        signature = root.find('.//ds:Signature', ns)
        digest_value = root.find('.//ds:DigestValue', ns).text
        
        if infNFe is None or signature is None:
            return xml_signed # Não consegue estruturar

        # 3. Parameters
        # chNFe
        inf_id = infNFe.get('Id')
        chNFe = inf_id[3:] if inf_id.startswith('NFe') else inf_id 
        
        # nVersao (Versão do QR Code: 2.00)
        nVersao = "2"
        
        # tpAmb
        tpAmb = infNFe.find('.//nfe:tpAmb', ns).text
        
        # cIdToken / CSC (ID do CSC - 6 dígitos)
        csc_id = str(empresa.csc_token_id or "1")
        if len(csc_id) < 6:
            csc_id = csc_id.zfill(6)

        csc_token = empresa.csc_token_codigo or ""
        
        # String concatenation for Version 2.0 (Online)
        # chNFe|nVersao|tpAmb|cIdToken
        params_base = f"{chNFe}|{nVersao}|{tpAmb}|{csc_id}"
        
        # SHA1 Hash of (params_base + csc_token)
        # Concatena, aplica SHA1 e converte para minúsculas
        sha1 = hashlib.sha1((params_base + csc_token).encode('utf-8')).hexdigest().lower()
        
        # Final URL
        # [URL_SEFAZ]?p=params_base|hash
        qr_code_url = f"{url_qrcode}?p={params_base}|{sha1}"
        
        # 4. Create infNFeSupl
        supl_xml = f"""<infNFeSupl xmlns="http://www.portalfiscal.inf.br/nfe"><qrCode><![CDATA[{qr_code_url}]]></qrCode><urlChave>{url_qrcode}</urlChave></infNFeSupl>"""
        
        supl_elem = etree.fromstring(supl_xml)
        
        # 5. Insert (Sequence: infNFe, infNFeSupl, Signature)
        # REFACTOR: Insert via String Manipulation to avoid LXML re-serialization breaking the signature
        
        try:
            # Construct the exact string for infNFeSupl
            qr_xml_block = f'<infNFeSupl xmlns="http://www.portalfiscal.inf.br/nfe"><qrCode><![CDATA[{qr_code_url}]]></qrCode><urlChave>{url_qrcode}</urlChave></infNFeSupl>'
            
            # Find insertion point: After </infNFe> and before <Signature
            # We assume standard formatting from previous step
            
            # First, check if infNFeSupl already exists (e.g. from previous run) and remove it
            # Using regex to find <infNFeSupl ... </infNFeSupl> is safer
            import re
            
            # Remove existing infNFeSupl if any
            xml_final = re.sub(r'<infNFeSupl.*?</infNFeSupl>', '', xml_signed, flags=re.DOTALL)
            
            # Insert new block
            # Look for the end of infNFe. 
            # Pattern: </(\w+:)?infNFe>
            # We want to insert AFTER this tag.
            
            match = re.search(r'</(\w+:)?infNFe>', xml_final)
            if match:
                end_pos = match.end()
                xml_final = xml_final[:end_pos] + qr_xml_block + xml_final[end_pos:]
            else:
                # If not found, maybe invalid XML, but fallback to lxml serialization if needed (risky)
                # Or append before Signature
                sig_pos = xml_final.find('<Signature')
                if sig_pos == -1: sig_pos = xml_final.find('<ds:Signature')
                
                if sig_pos >= 0:
                     xml_final = xml_final[:sig_pos] + qr_xml_block + xml_final[sig_pos:]
                else:
                     # Fallback to appending to root? (Likely wrong but better than crash)
                     # Try to insert before </NFe>
                     nfe_end = xml_final.rfind('</') # Find last closing tag (likely NFe)
                     if nfe_end > 0:
                         xml_final = xml_final[:nfe_end] + qr_xml_block + xml_final[nfe_end:]
                     else:
                         return etree.tostring(root, encoding='utf-8').decode('utf-8') # Give up and use old way
            
            return xml_final
            
        except Exception as e:
            logger.error(f"Erro ao inserir QR Code via manipulação de string: {e}")
            # Fallback to old LXML method if string manipulation failed
            supl_elem = etree.fromstring(supl_xml)
            for supl in root.findall('.//nfe:infNFeSupl', ns): root.remove(supl)
            try:
                sig_index = root.index(signature)
                root.insert(sig_index, supl_elem)
            except ValueError:
                root.append(supl_elem)
            return etree.tostring(root, encoding='utf-8').decode('utf-8')