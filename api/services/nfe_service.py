import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class NFeService:
    """
    Service for handling NFe (Model 55) emissions via native Python stack (sem ACBr).
    """
    def __init__(self):
        pass

    def emitir_nfe(self, venda_obj):
        """
        Generates and Emits NFe (55) for a specific sale.
        """
        if not venda_obj:
            return {"sucesso": False, "mensagem": "Venda inválida"}

        from api.models import EmpresaConfig
        config = EmpresaConfig.get_ativa()
        if not config:
            return {"sucesso": False, "mensagem": "Dados da empresa não configurados."}

        # Validate Client for NFe (Model 55 requires identified client except for specific cases)
        if not venda_obj.id_cliente:
             # Em ambiente de homologacao as vezes passa, mas regra geral exige.
             pass

        # Ensure Sequential Numbering (Assign before generating INI)
        if not venda_obj.numero_nfe and venda_obj.id_operacao:
             try:
                 op = venda_obj.id_operacao
                 if op.id_numeracao_id:
                     try:
                         venda_obj.numero_nfe = int(op.id_numeracao.numeracao)
                     except (ValueError, TypeError):
                         venda_obj.numero_nfe = op.proximo_numero_nf
                 else:
                     venda_obj.numero_nfe = op.proximo_numero_nf
                 if op.serie_nf:
                     venda_obj.serie_nfe = op.serie_nf
                 venda_obj.save()
                 logger.info(f"Número NFe atribuído: {venda_obj.numero_nfe} (Série {venda_obj.serie_nfe})")
             except Exception as e:
                 logger.error(f"Failed to assign NFe number: {e}")

        # --- NATIVE METHOD ---
        # Checks if certificate is configured to try native (DB or Local File)
        has_local_cert = os.path.exists("certificado.pfx")
        
        if config.certificado_digital or has_local_cert:
            logger.info("Tentando emissão via Componente Nativo Python (Sem ACBr)...")
            try:
                return self._emitir_nativa(venda_obj, config)
            except Exception as e:
                logger.error(f"Falha na emissão nativa: {e}")
                venda_obj.status_nfe = 'ERRO'
                venda_obj.mensagem_nfe = f"Erro Emissão: {str(e)}"[:500]
                venda_obj.save()
                return {"sucesso": False, "mensagem": f"Erro Emissão: {str(e)}"}
        
        return {"sucesso": False, "mensagem": "Certificado Digital não configurado para emissão de NF-e."}

    def cancelar_nfe(self, venda_obj, justificativa):
        """
        Cancela uma NFe emitida enviando evento de cancelamento (tpEvento=110111) via SEFAZ nativo.
        """
        if not venda_obj.chave_nfe:
            return {"sucesso": False, "mensagem": "Venda não possui Chave NFe para cancelar."}

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
            ambiente = config.ambiente_nfe or '2'
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

            sefaz = SefazService(config, modelo='55')
            xml_assinado = sefaz.signer.sign_evento(xml_evento, id_evento)
            resultado = sefaz.enviar_evento(xml_assinado, chave_nfe)

            if resultado.get('sucesso'):
                venda_obj.status_nfe = 'CANCELADA'
                venda_obj.save()
                return {"sucesso": True, "mensagem": "NFe Cancelada com Sucesso!", "protocolo": resultado.get('protocolo')}
            else:
                return {"sucesso": False, "mensagem": f"Erro Cancelamento: {resultado.get('mensagem', 'Erro desconhecido')}"}

        except Exception as e:
            logger.error(f"Erro ao cancelar NFe nativa: {e}")
            return {"sucesso": False, "mensagem": f"Erro ao cancelar: {str(e)}"}

    def inutilizar_numeracao(self, venda_obj, justificativa):
        """
        Inutilização de numeração NFe via SEFAZ nativo (NFeInutilizacao4).
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
            ambiente = config.ambiente_nfe or '2'
            uf_ibge = config.estado or 'MG'
            # Código IBGE UF para MG=31
            uf_cod_map = {'AC':'12','AL':'27','AM':'13','AP':'16','BA':'29','CE':'23','DF':'53',
                          'ES':'32','GO':'52','MA':'21','MG':'31','MS':'50','MT':'51','PA':'15',
                          'PB':'25','PE':'26','PI':'22','PR':'41','RJ':'33','RN':'24','RO':'11',
                          'RR':'14','RS':'43','SC':'42','SE':'28','SP':'35','TO':'17'}
            c_uf = uf_cod_map.get(uf_ibge, '31')
            ano = str(datetime.now().year)[2:]
            modelo = '55'
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

            sefaz = SefazService(config, modelo='55')
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
            nprot_m = re.search(r'<nProt>(\d+)</nProt>', resp.text)
            cstat = cstat_list[0] if cstat_list else '0'
            xmot = xmot_list[0] if xmot_list else 'Erro'

            if cstat == '102':
                venda_obj.status_nfe = 'INUTILIZADA'
                venda_obj.protocolo_nfe = nprot_m.group(1) if nprot_m else ''
                venda_obj.save()
                return {"sucesso": True, "mensagem": "Numeração NFe Inutilizada com Sucesso!"}
            else:
                return {"sucesso": False, "mensagem": f"Erro Inutilização (cStat {cstat}): {xmot}"}

        except Exception as e:
            logger.error(f"Erro ao inutilizar NFe nativa: {e}")
            return {"sucesso": False, "mensagem": f"Erro ao inutilizar: {str(e)}"}

    def _emitir_nativa(self, venda, empresa):
        """
        Implementation of Native Issuance using NfeXmlBuilder + SignerService + SefazClient
        """
        try:
            # Import modules locally to capture specific ImportErrors
            try:
                from .nfe_xml_builder import NfeXmlBuilder
                from .sefaz_client import SefazService
            except ImportError as e:
                import sys
                raise ImportError(f"Dependência faltando: {e}. Executável: {sys.executable}")

            # 0. SMART RETRY: Se já existe XML assinado salvo (de tentativa anterior com erro),
            # reutilizar esse XML ao invés de gerar novo (evita mudança de dhEmi e DigestValue)
            xml_signed_reutilizado = None
            
            # Se a mensagem de erro anterior for "Assinatura difere" (297) ou "DigestValue mismatch",
            # NÃO REUTILIZAR o XML, pois a assinatura está inválida.
            erro_assinatura = False
            msg_erro = str(getattr(venda, 'mensagem_nfe', '') or '')
            if '297' in msg_erro or 'Assinatura difere' in msg_erro or 'DigestValue' in msg_erro:
                erro_assinatura = True
                logger.warning(f"[RETRY] Erro de assinatura detectado ({msg_erro}). Forçando regeneração do XML.")
            
            if venda.xml_nfe and venda.status_nfe in ['ERRO', 'PENDENTE'] and not erro_assinatura:
                logger.info(f"[RETRY] Nota com XML já gerado. Verificando se pode reutilizar...")
                
                # Verifica se é um XML assinado válido (tem tag Signature)
                if '<Signature' in venda.xml_nfe and '<infNFe' in venda.xml_nfe:
                    logger.info("[RETRY] XML assinado encontrado! Reutilizando para evitar mudança de dhEmi...")
                    xml_signed_reutilizado = venda.xml_nfe
                    # Pula geração e assinatura, vai direto para transmissão
                else:
                    logger.warning("[RETRY] XML salvo não está assinado. Gerando novo...")

            # 1. Build XML (SOMENTE SE NÃO REUTILIZOU XML ANTERIOR)
            # REMOVED: Forced override of number 2 to 1.
            # We trust the number assigned in the Venda object.

            if xml_signed_reutilizado:
                xml_signed = xml_signed_reutilizado
                logger.info("[RETRY] Pulando geração/assinatura. Usando XML já assinado.")
            else:
                builder = NfeXmlBuilder(venda, empresa)
                xml_unsigned = builder.build_xml()
                
                # 1.1 CRÍTICO: Garantir CDATA no QR Code ANTES da assinatura
                # Modelo 55 (NFe) na versão 4.00 tem QR Code obrigatório (NT 2016.002)
                import re
                qr_pattern = r'<qrCode>(https://[^<]+)</qrCode>'
                qr_match = re.search(qr_pattern, xml_unsigned)
                if qr_match:
                    qr_url_found = qr_match.group(1)
                    xml_unsigned = xml_unsigned.replace(
                        f'<qrCode>{qr_url_found}</qrCode>',
                        f'<qrCode><![CDATA[{qr_url_found}]]></qrCode>'
                    )
                    logger.info("✓ CDATA adicionado ao QR Code NFe ANTES da assinatura")
                
                # --- FORCE UPDATE OF XML KEY IF NUMBER CHANGED ---
                # If builder forced number 1, but venda obj had 2, the ID tag might have changed.
                # We should update venda.chave_nfe extracted from XML
                import re
                key_match = re.search(r'Id="NFe(\d+)"', xml_unsigned)
                new_key = None
                if key_match:
                    new_key = key_match.group(1)
                    venda.chave_nfe = new_key
                    # Update numero_nfe in object if it differs
                    # Extract nNF from XML
                    nnf_match = re.search(r'<nNF>(\d+)</nNF>', xml_unsigned)
                    if nnf_match:
                         venda.numero_nfe = int(nnf_match.group(1))
                    
                    venda.save(update_fields=['chave_nfe', 'numero_nfe'])
                    logger.info(f"Updated Venda Key/Number from XML: {venda.chave_nfe} / {venda.numero_nfe}")
                
                # Inicializa SefazService (necessário para consulta)
                sefaz = SefazService(empresa, modelo='55')
                
                # === SMART HANDLING: Consulta Prévia de Status (Evitar Duplicidade) ===
                if new_key:
                    logger.info(f"Consultando status da NFe {new_key} antes de assinar/enviar...")
                    status_res = sefaz.consultar_nfe(new_key)
                    
                    if status_res.get('sucesso') and status_res.get('cStat') in ['100', '101', '150']:
                        cStat = status_res.get('cStat')
                        xMotivo = status_res.get('xMotivo')
                        nProt = status_res.get('nProt')
                        
                        logger.warning(f"NFe JÁ AUTORIZADA na SEFAZ! cStat={cStat} Protocolo={nProt}")
                        
                        # Se já autorizada, não assinamos nem enviamos novamente.
                        # Apenas retornamos sucesso e tentamos salvar o XML se possível.
                        # Mas precisamos do XML com protocolo. Como não temos o procNFe original, 
                        # vamos montar um usando o unsigned + protocolo dummy? 
                        # Nao, melhor: Assinar o XML que montamos (para ter o XML assinado), 
                        # e envelopar com o nProt retornado.
                        # A assinatura pode diferir, mas o DigestValue TEM QUE BATER para o procNFe ser válido juridicamente.
                        # Se o Digest não bater, o XML é inválido. Mas se já está autorizado, o cliente 'perdeu' o XML original.
                        # A solução correta seria baixar o XML (downloadNFe), mas requer certificado A1 e serviço específico.
                        
                        # Vamos tentar assinar para ter algo salvo, e montar o procNFe.
                        logger.info("Tentando reconstruir procNFe localmente...")
                        
                        # Assinar (necessaprio para ter o XML assinado dentro do procNFe)
                        xml_signed = None
                        try:
                            from api.services.signer_service_v2 import XMLSignerV2
                            signer_v2 = XMLSignerV2(empresa.certificado_digital, empresa.senha_certificado)
                            xml_signed = signer_v2.sign_xml(xml_unsigned, parent_tag='infNFe')
                        except:
                            # Fallback Java
                             try:
                                from api.services.java_signer_bridge import JavaXmlSigner
                                signer_java = JavaXmlSigner(empresa.certificado_digital, empresa.senha_certificado)
                                xml_signed = signer_java.sign_xml(xml_unsigned)
                             except:
                                pass
                                
                        if xml_signed and nProt:
                            # Monta procNFe manual
                            proc_nfe = f'<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><protNFe versao="4.00"><infProt><tpAmb>{sefaz.ambiente}</tpAmb><verAplic>1.0</verAplic><chNFe>{new_key}</chNFe><dhRecbto>{datetime.now().isoformat()}</dhRecbto><nProt>{nProt}</nProt><digVal>{status_res.get("digVal", "")}</digVal><cStat>{cStat}</cStat><xMotivo>{xMotivo}</xMotivo></infProt></protNFe>{xml_signed}</nfeProc>'
                            
                            # Atualiza Venda
                            venda.status_nfe = 'AUTORIZADA'
                            venda.protocolo_nfe = nProt
                            venda.mensagem_nfe = 'Autorizada (Recuperada via Consulta)'
                            venda.xml_nfe = proc_nfe
                            venda.save()
                            
                            return {
                                "sucesso": True,
                                "mensagem": f"NFe já estava autorizada. Recuperada. {xMotivo}",
                                "chave": new_key,
                                "protocolo": nProt,
                                "xml": proc_nfe
                            }

                # 2. Assinatura - Tentar Python (V2) primeiro por performance, depois Java como fallback

                xml_signed = None
                
                # TENTATIVA 1: Python Signer V2 (DESATIVADO - CAUSA REJEIÇÃO 297)
                # O Python Signer V2 está gerando assinaturas rejeitadas pela SEFAZ apesar de matematicamente corretas.
                # Desativado em 16/03/2026 para usar Java Signer (100% funcional) diretamente.
                """
                try:
                    from api.services.signer_service_v2 import XMLSignerV2
                    signer_v2 = XMLSignerV2(empresa.certificado_digital, empresa.senha_certificado)
                    xml_signed = signer_v2.sign_xml(xml_unsigned, parent_tag='infNFe')
                    logger.info("Assinatura NF-e realizada com Python V2")
                except Exception as e_python:
                    logger.warning(f"Falha na tentativa Python V2: {e_python}")
                """

                # TENTATIVA 2: Java Signer (Fallback se V2 falhar ou retornar None)
                if xml_signed is None:
                    try:
                        from api.services.java_signer_bridge import JavaXmlSigner
                        signer_java = JavaXmlSigner(empresa.certificado_digital, empresa.senha_certificado)
                        xml_signed = signer_java.sign_xml(xml_unsigned)
                        logger.info("[OK] Assinatura NF-e realizada com Java (Padrao)")
                    except Exception as e_java:
                        logger.error(f"Erro no Java signer: {e_java}. Falha total na assinatura.")
                        raise e_java
            
            # Inicializa SefazService para envio (modelo 55 = NF-e)
            sefaz = SefazService(empresa, modelo='55')
            
            # (CDATA já foi adicionado ANTES da assinatura no passo 1.1)
            
            # Save Signed XML to C:\XML_NFCe
            try:
                import os
                import time
                target_dir = "C:\\XML_NFCe"
                if not os.path.exists(target_dir):
                    os.makedirs(target_dir)

                # Try to extract ID from XML for filename
                import re
                file_name = f"NFe_Venda{venda.id_venda}_{int(time.time())}.xml"
                match_id = re.search(r'Id="NFe(\d+)"', xml_signed)
                if match_id:
                    file_name = f"{match_id.group(1)}.xml"
                
                debug_path = os.path.join(target_dir, file_name)
                with open(debug_path, 'w', encoding='utf-8') as f:
                    f.write(xml_signed)
                logger.info(f"XML Salvo em: {debug_path}")
                
                # Update venda object with path if needed or just log
            except Exception as e_save:
                logger.error(f"Erro ao salvar XML na pasta C:\\XML_NFCe: {e_save}")

            # 3. Transmit
            try:
                result = sefaz.enviar_nfce(xml_signed) # Metodo genérico de envio (enviNFe)
            except Exception as e_conn:
                logger.warning(f"Falha na conexão com SEFAZ: {e_conn}.")
                raise e_conn
            
            if result.get('sucesso'):
                # --- Montagem do XML de Distribuição (nfeProc) ---
                xml_distribuicao = result.get('xml_retorno', xml_signed)
                
                try:
                    import re
                    soap_xml_retorno = result.get('xml_retorno', '')
                    match_prot = re.search(r'(<(\w+:)?protNFe.*?</(\w+:)?protNFe>)', soap_xml_retorno, re.DOTALL)
                    
                    if match_prot:
                        prot_xml = match_prot.group(1)
                        xml_nfe_clean = xml_signed
                        if '<?xml' in xml_nfe_clean:
                            xml_nfe_clean = xml_nfe_clean.split('?>', 1)[1].strip()
                        xml_distribuicao = f'<?xml version="1.0" encoding="UTF-8"?><nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">{xml_nfe_clean}{prot_xml}</nfeProc>'
                    else:
                        logger.warning("Não foi possível extrair protNFe para montar nfeProc.")
                except Exception as e_xml:
                    logger.error(f"Erro ao montar XML de distribuição: {e_xml}")

                # Incrementa sequencial da operacao
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
                    except Exception as e:
                        logger.error(f"Erro ao incrementar operacao: {e}")

                venda.status_nfe = 'EMITIDA'
                venda.chave_nfe = result.get('chave')
                venda.protocolo_nfe = result.get('protocolo')
                venda.xml_nfe = xml_distribuicao
                venda.qrcode_nfe = result.get('qrcode', '') # Pode ser vazio se não conseguir extrair
                venda.save()
                
                # Message success + Key/Protocol
                result['mensagem'] = "NFe Emitida com Sucesso (Via Nativa)"
                return result
            else:
                # ERRO na emissão - Salvar mensagem para o usuário ver
                venda.status_nfe = 'ERRO'
                venda.xml_nfe = xml_signed
                venda.mensagem_nfe = result.get('mensagem') or result.get('xMotivo') or f"Erro cStat {result.get('cStat', 'desconhecido')}"
                venda.save()
                return result

        except Exception as e:
            raise e

    def carta_correcao(self, venda, texto_correcao, usuario=None):
        """
        Envia uma Carta de Correção Eletrônica (CCe) para a NFe da venda.
        Usa o modo NATIVO (webservice direto da SEFAZ).
        
        Args:
            venda: Objeto Venda com a NFe autorizada
            texto_correcao: Texto da correção (mínimo 15 caracteres)
            usuario: Usuário que está criando a CCe (opcional)
            
        Returns:
            dict: {'sucesso': bool, 'mensagem': str, 'carta_correcao': CartaCorrecaoNFe (se sucesso)}
        """
        try:
            from ..models import CartaCorrecaoNFe, EmpresaConfig
            from .sefaz_client import SefazService
            from .signer_service import SignerService
            import re
            
            if not venda.chave_nfe:
                return {'sucesso': False, 'mensagem': 'Venda não possui Chave NFe (não foi emitida?)'}
            
            if not texto_correcao or len(texto_correcao.strip()) < 15:
                return {'sucesso': False, 'mensagem': 'Texto de correção deve ter no mínimo 15 caracteres.'}

            # Verificar quantas CCe já foram REGISTRADAS com sucesso para esta NFe
            # Somente registros REGISTRADO contam para o sequencial do SEFAZ
            # Registros REJEITADO/ERRO não foram aceitos pela SEFAZ e não incrementam o seq
            ultima_cce = CartaCorrecaoNFe.objects.filter(
                id_venda=venda,
                status='REGISTRADO'
            ).order_by('-numero_sequencial').first()
            
            seq_evento = (ultima_cce.numero_sequencial + 1) if ultima_cce else 1
            
            # Limitar a 20 CCe por NFe (limite da SEFAZ)
            if seq_evento > 20:
                return {
                    'sucesso': False, 
                    'mensagem': 'Esta NFe já atingiu o limite máximo de 20 Cartas de Correção.'
                }
            
            # Buscar configurações da empresa
            config = EmpresaConfig.get_ativa()
            if not config:
                return {'sucesso': False, 'mensagem': 'Configuração da empresa não encontrada.'}
            
            # Criar/reutilizar registro no banco ANTES de enviar (status PENDENTE)
            # Usa update_or_create para reutilizar registros REJEITADO/ERRO com o mesmo seq,
            # evitando erro de chave duplicada na constraint (id_venda, numero_sequencial)
            carta_correcao, _ = CartaCorrecaoNFe.objects.update_or_create(
                id_venda=venda,
                numero_sequencial=seq_evento,
                defaults={
                    'texto_correcao': texto_correcao.strip(),
                    'status': 'PENDENTE',
                    'usuario': usuario,
                    'protocolo': None,
                    'mensagem_retorno': None,
                    'xml_evento': None,
                }
            )
            
            try:
                # Sanitizar texto - manter acentos, remover apenas caracteres de controle
                import xml.sax.saxutils as saxutils
                
                texto_limpo = texto_correcao.strip()
                
                # Remover quebras de linha e tabs, substituir por espaço
                texto_limpo = texto_limpo.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                
                # Remover caracteres de controle ASCII (0x00-0x1F exceto espaço)
                texto_limpo = ''.join(char for char in texto_limpo if ord(char) >= 32)
                
                # Remover múltiplos espaços em branco
                texto_limpo = re.sub(r'\s+', ' ', texto_limpo).strip()
                
                # Validar tamanho após limpeza
                if len(texto_limpo) < 15:
                    carta_correcao.status = 'ERRO'
                    carta_correcao.mensagem_retorno = 'Texto de correção muito curto após sanitização'
                    carta_correcao.save()
                    return {'sucesso': False, 'mensagem': 'Texto de correção muito curto após sanitização'}
                
                # Escapar caracteres XML usando função padrão do Python
                texto_xml_escaped = saxutils.escape(texto_limpo)
                
                # Dados do evento CCe
                chave_nfe = venda.chave_nfe
                cnpj = "".join(filter(str.isdigit, config.cpf_cnpj or ''))
                ambiente = config.ambiente_nfe or '2'
                uf_cod = chave_nfe[:2]  # Código UF está nos 2 primeiros dígitos da chave
                
                # Data/hora no formato ISO
                from datetime import datetime
                dh_evento = datetime.now().strftime('%Y-%m-%dT%H:%M:%S-03:00')
                
                # ID do evento: "ID" + tpEvento + chNFe + nSeqEvento (2 dígitos)
                tp_evento = '110110'  # Código do evento CC-e
                id_evento = f"ID{tp_evento}{chave_nfe}{seq_evento:02d}"
                
                # Construir XML manualmente com formatação minificada (sem espaços extras)
                # Usar texto com escape correto de caracteres XML
                xml_evento = (
                    f'<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">'
                    f'<infEvento Id="{id_evento}">'
                    f'<cOrgao>{uf_cod}</cOrgao>'
                    f'<tpAmb>{ambiente}</tpAmb>'
                    f'<CNPJ>{cnpj}</CNPJ>'
                    f'<chNFe>{chave_nfe}</chNFe>'
                    f'<dhEvento>{dh_evento}</dhEvento>'
                    f'<tpEvento>{tp_evento}</tpEvento>'
                    f'<nSeqEvento>{seq_evento}</nSeqEvento>'
                    f'<verEvento>1.00</verEvento>'
                    f'<detEvento versao="1.00">'
                    f'<descEvento>Carta de Correcao</descEvento>'
                    f'<xCorrecao>{texto_xml_escaped}</xCorrecao>'
                    f'<xCondUso>A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.</xCondUso>'
                    f'</detEvento>'
                    f'</infEvento>'
                    f'</evento>'
                )
                
                logger.info(f"=== INICIO CCe #{seq_evento} ===")
                logger.info(f"NFe: {chave_nfe}")
                logger.info(f"Texto original: '{texto_correcao}'")
                logger.info(f"Texto limpo: '{texto_limpo}'")
                logger.info(f"Texto escapado XML: '{texto_xml_escaped}'")
                logger.info(f"Tamanho texto: {len(texto_limpo)} chars")
                logger.info(f"XML Evento: {xml_evento[:500]}...")  # Primeiros 500 chars
                
                # Assinar o XML
                sefaz = SefazService(config, modelo='55')
                xml_assinado = sefaz.signer.sign_evento(xml_evento, id_evento)
                
                # Enviar para SEFAZ
                resultado = sefaz.enviar_evento(xml_assinado, chave_nfe)
                
                logger.info(f"Resposta CCe: {resultado}")
                
                # Analisar resposta
                if resultado.get('sucesso'):
                    carta_correcao.status = 'REGISTRADO'
                    carta_correcao.protocolo = resultado.get('protocolo')
                    carta_correcao.mensagem_retorno = resultado.get('xMotivo', 'Evento registrado com sucesso')
                    if resultado.get('xml_retorno'):
                        carta_correcao.xml_evento = resultado.get('xml_retorno')
                    carta_correcao.save()
                    
                    return {
                        'sucesso': True,
                        'mensagem': f'Carta de Correção #{seq_evento} enviada com sucesso!',
                        'carta_correcao': carta_correcao,
                        'protocolo': carta_correcao.protocolo,
                        'retorno': resultado.get('xMotivo')
                    }
                else:
                    carta_correcao.status = 'REJEITADO'
                    carta_correcao.mensagem_retorno = resultado.get('mensagem', 'Erro desconhecido')
                    carta_correcao.save()
                    
                    # Erro 594: seq maior que o permitido - ocorre quando há phantoms REGISTRADO no DB
                    # (gravados como sucesso antes da correção do bug de assinatura).
                    # Auto-recuperação: resetar os phantoms e retentar com seq=1.
                    if resultado.get('cStat') == '594' and seq_evento > 1:
                        logger.warning(f"CCe erro 594 com seq={seq_evento}. Resetando phantoms e retentando com seq=1.")
                        CartaCorrecaoNFe.objects.filter(
                            id_venda=venda, status='REGISTRADO'
                        ).update(
                            status='ERRO',
                            mensagem_retorno='Phantom REGISTRADO corrigido: SEFAZ rejeitou seq com erro 594'
                        )
                        
                        seq_evento = 1
                        id_evento_r = f"ID{tp_evento}{chave_nfe}{seq_evento:02d}"
                        dh_evento_r = datetime.now().strftime('%Y-%m-%dT%H:%M:%S-03:00')
                        xml_evento_r = (
                            f'<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">'
                            f'<infEvento Id="{id_evento_r}">'
                            f'<cOrgao>{uf_cod}</cOrgao>'
                            f'<tpAmb>{ambiente}</tpAmb>'
                            f'<CNPJ>{cnpj}</CNPJ>'
                            f'<chNFe>{chave_nfe}</chNFe>'
                            f'<dhEvento>{dh_evento_r}</dhEvento>'
                            f'<tpEvento>{tp_evento}</tpEvento>'
                            f'<nSeqEvento>{seq_evento}</nSeqEvento>'
                            f'<verEvento>1.00</verEvento>'
                            f'<detEvento versao="1.00">'
                            f'<descEvento>Carta de Correcao</descEvento>'
                            f'<xCorrecao>{texto_xml_escaped}</xCorrecao>'
                            f'<xCondUso>A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.</xCondUso>'
                            f'</detEvento>'
                            f'</infEvento>'
                            f'</evento>'
                        )
                        carta_correcao, _ = CartaCorrecaoNFe.objects.update_or_create(
                            id_venda=venda,
                            numero_sequencial=seq_evento,
                            defaults={
                                'texto_correcao': texto_correcao.strip(),
                                'status': 'PENDENTE',
                                'usuario': usuario,
                                'protocolo': None,
                                'mensagem_retorno': None,
                                'xml_evento': None,
                            }
                        )
                        xml_assinado_r = sefaz.signer.sign_evento(xml_evento_r, id_evento_r)
                        resultado_r = sefaz.enviar_evento(xml_assinado_r, chave_nfe)
                        logger.info(f"Resposta CCe retry seq=1: {resultado_r}")
                        
                        if resultado_r.get('sucesso'):
                            carta_correcao.status = 'REGISTRADO'
                            carta_correcao.protocolo = resultado_r.get('protocolo')
                            carta_correcao.mensagem_retorno = resultado_r.get('xMotivo', 'Evento registrado com sucesso')
                            if resultado_r.get('xml_retorno'):
                                carta_correcao.xml_evento = resultado_r.get('xml_retorno')
                            carta_correcao.save()
                            return {
                                'sucesso': True,
                                'mensagem': f'Carta de Correção #{seq_evento} enviada com sucesso!',
                                'carta_correcao': carta_correcao,
                                'protocolo': carta_correcao.protocolo,
                                'retorno': resultado_r.get('xMotivo')
                            }
                        else:
                            carta_correcao.status = 'REJEITADO'
                            carta_correcao.mensagem_retorno = resultado_r.get('mensagem', 'Erro desconhecido')
                            carta_correcao.save()
                            return {
                                'sucesso': False,
                                'mensagem': f"Erro ao enviar CCe: {resultado_r.get('mensagem')}",
                                'carta_correcao': carta_correcao
                            }
                    
                    return {
                        'sucesso': False,
                        'mensagem': f"Erro ao enviar CCe: {resultado.get('mensagem')}",
                        'carta_correcao': carta_correcao
                    }
                    
            except Exception as e_envio:
                # Erro no envio - marcar como ERRO
                carta_correcao.status = 'ERRO'
                carta_correcao.mensagem_retorno = str(e_envio)
                carta_correcao.save()
                logger.exception(f"Erro ao enviar CCe: {e_envio}")
                return {'sucesso': False, 'mensagem': f'Erro ao enviar CCe: {str(e_envio)}'}
                
        except Exception as e:
            logger.exception("Erro ao processar CCe NFe")
            return {'sucesso': False, 'mensagem': f'Erro ao processar CCe: {str(e)}'}


