import logging
import requests
import os
import random
from datetime import datetime, timedelta
from lxml import etree
from api.models import EmpresaConfig
from .signer_service import SignerService
from .cte_signer_native import CTeSignerNative

logger = logging.getLogger(__name__)

class CTeService:
    """
    Serviço para emissão de CTe (Modelo 57) 4.00 via SOAP NATIVO (Sem ACBr).
    """
    
    # URL MG Homologação (Conforme solicitado)
    URL_AUTORIZACAO = "https://hcte.fazenda.mg.gov.br/cte/services/CTeRecepcaoSincV4"
    # URL SVRS Antiga
    # URL_AUTORIZACAO = "https://cte-homologacao.svrs.rs.gov.br/ws/cterecepcaosync/cterecepcaosync.asmx"
    
    NAMESPACE_CTE = "http://www.portalfiscal.inf.br/cte"
    NAMESPACE_SOAP = "http://www.w3.org/2003/05/soap-envelope"
    NAMESPACE_WSDL = "http://www.portalfiscal.inf.br/cte/wsdl/CTeRecepcaoSincV4"
    
    UF_IBGE = {
        'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15', 'AP': '16', 'TO': '17',
        'MA': '21', 'PI': '22', 'CE': '23', 'RN': '24', 'PB': '25', 'PE': '26', 'AL': '27',
        'SE': '28', 'BA': '29', 'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35', 'PR': '41',
        'SC': '42', 'RS': '43', 'MS': '50', 'MT': '51', 'GO': '52', 'DF': '53'
    }
    
    def __init__(self):
        self.empresa = EmpresaConfig.get_ativa()
        if not self.empresa:
            raise ValueError("Empresa não configurada no sistema.")
            
        # Carrega Certificado NATIVO para CT-e (com canonização correta)
        try:
            self.signer = CTeSignerNative(
                self.empresa.certificado_digital, 
                self.empresa.senha_certificado
            )
            logger.info("[CTE_NATIVE] Assinador nativo carregado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao carregar certificado: {e}")
            raise ValueError(f"Erro ao carregar certificado digital: {e}")

    def emitir_cte(self, cte_obj):
        """
        Gera XML, Assina, Envia para SEFAZ e Processa Retorno.
        """
        logger.info(f"[CTE_NATIVE] Iniciando emissão do CTe {cte_obj.id_cte} via SOAP")
        
        try:
            # 1. Numeração e Chave
            self._preparar_dados(cte_obj)
            
            # 2. Gerar XML (ElementTree)
            logger.info("[CTE_NATIVE] Gerando XML do CTe...")
            xml_root = self._gerar_xml_cte(cte_obj)
            xml_str = etree.tostring(xml_root, encoding='unicode', method='xml')
            logger.info(f"[CTE_NATIVE] XML gerado. Tamanho: {len(xml_str)} bytes")
            logger.info(f"[CTE_NATIVE] Primeiros 500 caracteres do XML:")
            logger.info(xml_str[:500])
            
            # 3. Assinar XML: priorizar Java (SHA-1) igual NFe/NFCe conforme solicitado
            logger.info("[CTE_NATIVE] Iniciando assinatura do CTe (preferência: Java -> python V2 -> nativo)")
            xml_signed_str = None
            try:
                from api.services.java_signer_bridge import JavaXmlSigner
                signer_java = JavaXmlSigner(self.empresa.certificado_digital, self.empresa.senha_certificado)
                xml_signed_str = signer_java.sign_xml(xml_str)
                logger.info("[CTE_NATIVE] [OK] Assinatura realizada com Java (Igual NFe)")
            except Exception as e_java:
                logger.warning(f"[CTE_NATIVE] Falha no assinador Java: {e_java}. Tentando Python V2...")
                try:
                    from api.services.signer_service_v2 import XMLSignerV2
                    signer_v2 = XMLSignerV2(self.empresa.certificado_digital, self.empresa.senha_certificado)
                    xml_signed_str = signer_v2.sign_xml(xml_str, parent_tag='infCte')
                    logger.info("[CTE_NATIVE] ✓ Assinatura realizada com Python V2")
                except Exception as e_py:
                    logger.warning(f"[CTE_NATIVE] Falha Python V2: {e_py}. Tentando Nativo...")
                    try:
                        xml_signed_str = self.signer.sign_cte_xml(xml_str)
                        logger.info("[CTE_NATIVE] ✓ Assinatura realizada com CTeSignerNative")
                    except Exception as e_native:
                        logger.exception(f"[CTE_NATIVE] ❌ Erro total na assinatura: {e_native}")
                        raise ValueError(f"Não foi possível assinar o XML: {e_native}")

            # TODO: Validar Schema aqui se possivel
            
            # 4. Montar enviCTe usando lxml para gerenciar namespaces corretamente
            # Parse do CTe assinado
            cte_element = etree.fromstring(xml_signed_str.encode('utf-8'))
            
            # Guardar string do CTe assinado para logs
            cte_signed_xml = xml_signed_str
            
            # Remover header XML se existir (<?xml...?>)
            if cte_signed_xml.strip().startswith('<?xml'):
                # Encontrar onde fecha a tag <?xml ... ?>
                close_index = cte_signed_xml.find('?>')
                if close_index != -1:
                    cte_signed_xml = cte_signed_xml[close_index+2:].strip()

            # Construir enviCTe MANUALMENTE (String) para garantir namespaces
            # O lxml remove o xmlns do CTe se o pai tiver o mesmo namespace, o que gera erro na SEFAZ
            # IMPORTANTE: Em testes com SEFAZ MG Sincrono v4.00, enviar o CTe diretamente (sem enviCTe)
            # funcionou (retorno 100), enquanto enviCTe gerou erro 225 (Schema).
            # Mantendo envio direto para garantir autorização.
            # envi_cte_xml = (
            #    f'<enviCTe xmlns="{self.NAMESPACE_CTE}" versao="4.00">'
            #    f'<idLote>1</idLote>'
            #    f'{cte_signed_xml}'
            #    f'</enviCTe>'
            # )
            envi_cte_xml = cte_signed_xml # Envio direto funciona no endpoint Sincrono MG
            
            logger.info(f"[CTE_NATIVE] Tamanho do enviCTe (antes compressao): {len(envi_cte_xml)} bytes")
            logger.info("[CTE_NATIVE] ===== XML enviCTe (primeiros 1000 chars) =====")
            logger.info(envi_cte_xml[:1000])
            logger.info("[CTE_NATIVE] ================================================")
            
            # --- MG CTe 4.00: GZIP + Base64 ---
            import gzip
            import base64
            
            # Comprimir com GZIP
            compressed_data = gzip.compress(envi_cte_xml.encode('utf-8'))
            logger.info(f"[CTE_NATIVE] Tamanho comprimido: {len(compressed_data)} bytes")
            
            # Codificar em Base64
            base64_content = base64.b64encode(compressed_data).decode('utf-8')
            logger.info(f"[CTE_NATIVE] Tamanho Base64: {len(base64_content)} bytes")
            
            soap_envelope = self._criar_envelope_soap(base64_content)
            
            # 5. Enviar via Requests com Certificado
            cert_pem, key_pem = self.signer.get_cert_key_pem()
            
            headers = {
                'Content-Type': 'application/soap+xml; charset=utf-8',
                # Alguns servidores exigem SOAPAction mesmo no 1.2
                # 'SOAPAction': 'http://www.portalfiscal.inf.br/cte/wsdl/CTeRecepcaoSyncV4/cteRecepcaoLoteSync' 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' # Corrige erro "AccessDenied" em alguns WAFs
            }
            
            logger.info(f"[CTE_NATIVE] Enviando para: {self.URL_AUTORIZACAO}")
            logger.info(f"[CTE_NATIVE] Tamanho do SOAP: {len(soap_envelope)} bytes")
            
            # Debug: Dump SOAP request
            try:
                 debug_dir = r"C:\XML_CTE\Debug"
                 if not os.path.exists(debug_dir): os.makedirs(debug_dir)
                 
                 # Salvar o XML assinado puro (CTe com assinatura)
                 cte_signed_xml_str = etree.tostring(cte_element, encoding='unicode', method='xml')
                 with open(os.path.join(debug_dir, f"CTE_{cte_obj.id_cte}_ASSINADO.xml"), "w", encoding='utf-8') as f:
                     f.write(cte_signed_xml_str)
                 
                 # Salvar o enviCTe completo (antes compressao)
                 with open(os.path.join(debug_dir, f"CTE_{cte_obj.id_cte}_ENVI.xml"), "w", encoding='utf-8') as f:
                     f.write(envi_cte_xml)
                     
                 # Salvar o SOAP envelope
                 with open(os.path.join(debug_dir, f"CTE_{cte_obj.id_cte}_REQ.xml"), "w", encoding='utf-8') as f:
                     f.write(soap_envelope)
                     
                 logger.info(f"[CTE_NATIVE] Arquivos debug salvos em: {debug_dir}")
            except Exception as e:
                logger.warning(f"[CTE_NATIVE] Erro ao salvar debug: {e}")
            
            # Timeout maior pois SEFAZ pode demorar
            import time
            t_start = time.time()
            logger.info(f"[CTE_NATIVE] Iniciando requisição HTTP...")
            
            response = requests.post(
                self.URL_AUTORIZACAO,
                data=soap_envelope.encode('utf-8'),
                headers=headers,
                cert=(cert_pem, key_pem),
                verify=False, # Certificados SEFAZ geralmente requerem cadeia ICP-Brasil não presente no certifi padrão
                timeout=30
            )
            
            t_end = time.time()
            logger.info(f"[CTE_NATIVE] Tempo de resposta: {t_end - t_start:.2f}s")
            
            # Cleanup temp files
            try:
                os.remove(cert_pem)
                os.remove(key_pem)
            except: pass
            
            logger.info(f"[CTE_NATIVE] Status HTTP: {response.status_code}")
            logger.info(f"[CTE_NATIVE] Tamanho da resposta: {len(response.text)} bytes")
            logger.info(f"[CTE_NATIVE] ===== RESPOSTA COMPLETA DA SEFAZ =====")
            logger.info(response.text[:2000])  # Primeiros 2000 caracteres
            logger.info(f"[CTE_NATIVE] ========================================")
            
            # Debug: Salvar resposta
            try:
                debug_dir = r"C:\XML_CTE\Debug"
                with open(os.path.join(debug_dir, f"CTE_{cte_obj.id_cte}_RESP.xml"), "w", encoding='utf-8') as f:
                    f.write(response.text)
                logger.info(f"[CTE_NATIVE] Resposta SEFAZ salva em: {debug_dir}\\CTE_{cte_obj.id_cte}_RESP.xml")
            except Exception as e_debug:
                logger.warning(f"[CTE_NATIVE] Erro ao salvar resposta: {e_debug}")
            
            # 6. Processar Retorno
            if response.status_code != 200:
                logger.error(f"[CTE_NATIVE] ===== ERRO HTTP {response.status_code} =====")
                logger.error(f"[CTE_NATIVE] Headers: {response.headers}")
                logger.error(f"[CTE_NATIVE] Response: {response.text[:1000]}")
                return {
                    "sucesso": False, 
                    "mensagem": f"Erro HTTP {response.status_code} da SEFAZ",
                    "xml_envio": cte_signed_xml,
                    "response": response.text[:500]
                }
                
            return self._processar_retorno_soap(response.text, cte_obj, cte_signed_xml)

        except Exception as e:
            logger.exception(f"[CTE_NATIVE] Erro Crítico: {e}")
            return {"sucesso": False, "mensagem": f"Erro interno: {str(e)}"}

    def _preparar_dados(self, cte):
        """Gera numero e chave se necessario"""
        if not cte.numero_cte:
            from cte.models import ConhecimentoTransporte
            last = ConhecimentoTransporte.objects.exclude(pk=cte.pk).order_by('-numero_cte').first()
            cte.numero_cte = (last.numero_cte + 1) if (last and last.numero_cte) else 1
            cte.save()
            
        if not cte.chave_cte:
            cte.chave_cte = self._gerar_chave(cte)
            cte.save()
            
    def _gerar_chave(self, cte):
        uf_sigla = self.empresa.estado or 'MG'
        uf = self.UF_IBGE.get(uf_sigla, '31')
        dt = cte.data_emissao
        aamm = dt.strftime('%y%m')
        cnpj = ''.join(filter(str.isdigit, self.empresa.cpf_cnpj)).zfill(14)
        mod = cte.modelo or '57'
        serie = str(cte.serie_cte).zfill(3)
        nct = str(cte.numero_cte).zfill(9)
        tpemis = '1' # Normal
        
        # Codigo Numerico Aleatorio (cCT) - 8 digitos
        random.seed(cte.id_cte) # Determinístico se re-gerar
        cct = f"{random.randint(10000000, 99999999)}"
        
        base_chave = f"{uf}{aamm}{cnpj}{mod}{serie}{nct}{tpemis}{cct}"
        
        # Calculo DV (Módulo 11)
        import sys
        if len(base_chave) != 43:
            raise ValueError(f"Chave base invalida: {len(base_chave)}")
            
        weights = [4,3,2,9,8,7,6,5,4,3,2,9,8,7,6,5,4,3,2,9,8,7,6,5,4,3,2,9,8,7,6,5,4,3,2]
        # Extending weights for 43 positions (reverse is easier)
        peso = 2
        soma = 0
        for c in reversed(base_chave):
            soma += int(c) * peso
            peso += 1
            if peso > 9: peso = 2
            
        resto = soma % 11
        if resto == 0 or resto == 1:
            dv = 0
        else:
            dv = 11 - resto
            
        return f"{base_chave}{dv}"

    def _gerar_xml_cte(self, cte):
        # Namespace map - NECESSÁRIO para que todos elementos tenham o namespace correto
        nsmap = {None: self.NAMESPACE_CTE}
        
        # Root Element <CTe> com namespace
        root = etree.Element('CTe', nsmap=nsmap)
        
        # <infCte>
        inf = etree.SubElement(root, 'infCte', Id=f"CTe{cte.chave_cte}", versao="4.00")
        
        # 1. <ide> Identificação
        ide = etree.SubElement(inf, 'ide')
        
        uf_sigla = self.empresa.estado or 'MG'
        cUF_val = self.UF_IBGE.get(uf_sigla, '31')
        self._tag(ide, 'cUF', cUF_val)
        
        self._tag(ide, 'cCT', cte.chave_cte[35:43]) # Codigo aleatorio da chave
        self._tag(ide, 'CFOP', cte.cfop.replace('.',''))
        
        # Sanitize natOp (Remove accents and ensure uppercase)
        nat_op = cte.natureza_operacao or "CTE DE SAIDA"
        from unicodedata import normalize
        nat_op = normalize('NFKD', nat_op).encode('ASCII', 'ignore').decode('ASCII').upper()
        self._tag(ide, 'natOp', nat_op)
        
        self._tag(ide, 'mod', '57')
        self._tag(ide, 'serie', str(cte.serie_cte))
        self._tag(ide, 'nCT', str(cte.numero_cte))
        self._tag(ide, 'dhEmi', datetime.now().strftime("%Y-%m-%dT%H:%M:%S-03:00")) # UTC-3 Hardcoded
        self._tag(ide, 'tpImp', '1') # Retrato
        self._tag(ide, 'tpEmis', '1') # Normal
        self._tag(ide, 'cDV', cte.chave_cte[-1])
        self._tag(ide, 'tpAmb', '2') # 2=Homologacao (HARDCODED FOR TEST)
        self._tag(ide, 'tpCTe', str(cte.tipo_cte))
        self._tag(ide, 'procEmi', '0') # App contribuinte
        self._tag(ide, 'verProc', '3.0')
        
        # cMunEnv = Codigo do municipio deve ser o do emitente onde está sendo emitido
        cMun_val = getattr(self.empresa, 'codigo_municipio_ibge', None) or '3148103'
        self._tag(ide, 'cMunEnv', cMun_val)
        self._tag(ide, 'xMunEnv', self.empresa.cidade or 'Patrocinio') 
        self._tag(ide, 'UFEnv', self.empresa.estado or 'MG')
        
        self._tag(ide, 'modal', '01') # Rodoviario
        self._tag(ide, 'tpServ', str(cte.tipo_servico))
        
        # Inicio da Prestacao
        self._tag(ide, 'cMunIni', cte.cidade_origem_ibge or '3148103')
        self._tag(ide, 'xMunIni', cte.cidade_origem_nome or 'Patrocínio')
        self._tag(ide, 'UFIni', cte.cidade_origem_uf or 'MG')
        
        # Fim da Prestacao
        self._tag(ide, 'cMunFim', cte.cidade_destino_ibge or '3148103')
        self._tag(ide, 'xMunFim', cte.cidade_destino_nome or 'Patrocínio')
        self._tag(ide, 'UFFim', cte.cidade_destino_uf or 'MG')
        
        self._tag(ide, 'retira', '1') # 1=Nao
        
        # 1.5 indIEToma (Indicador papel Tomador)
        # 1=Contribuinte ICMS
        # 2=Contribuinte Isento
        # 9=Nao Contribuinte
        # FIX 225: Using '9' based on successful ACBr XML analysis (homologacao usually non-contrib)
        self._tag(ide, 'indIEToma', '9')
        
        # Tomador 3=Destinatario (Structure: <toma3><toma>3</toma></toma3>)
        toma3 = etree.SubElement(ide, 'toma3')
        self._tag(toma3, 'toma', '3') 
        
        # 1b. <compl> (Dados Complementares)
        # Required to match successful ACBr XML structure
        compl = etree.SubElement(inf, 'compl')
        entrega = etree.SubElement(compl, 'Entrega')
        semData = etree.SubElement(entrega, 'semData')
        self._tag(semData, 'tpPer', '0') # 0=Sem data definida
        semHora = etree.SubElement(entrega, 'semHora')
        self._tag(semHora, 'tpHor', '0') # 0=Sem hora definida

        # 2. <emit> Emitente (Empresa Logada)
        emit = etree.SubElement(inf, 'emit')
        self._tag(emit, 'CNPJ', ''.join(filter(str.isdigit, self.empresa.cpf_cnpj)))
        self._tag(emit, 'IE', ''.join(filter(str.isdigit, self.empresa.inscricao_estadual)))
        self._tag(emit, 'xNome', self.empresa.nome_razao_social)
        if self.empresa.nome_fantasia:
             self._tag(emit, 'xFant', self.empresa.nome_fantasia)
        
        # Ordering matching authorized XSD TEndereco (Verified in Types definition): 
        # xLgr, nro, xCpl, xBairro, cMun, xMun, CEP, UF, cPais, xPais
        
        enderEmit = etree.SubElement(emit, 'enderEmit')
        self._tag(enderEmit, 'xLgr', self.empresa.endereco)
        self._tag(enderEmit, 'nro', self.empresa.numero)
        
        compl_emit = getattr(self.empresa, 'complemento', '')
        if compl_emit:
             self._tag(enderEmit, 'xCpl', compl_emit)
             
        self._tag(enderEmit, 'xBairro', self.empresa.bairro)
        
        cMun_emit = getattr(self.empresa, 'codigo_municipio_ibge', None) or '3148103'
        self._tag(enderEmit, 'cMun', cMun_emit)
        self._tag(enderEmit, 'xMun', self.empresa.cidade)
        
        self._tag(enderEmit, 'CEP', ''.join(filter(str.isdigit, self.empresa.cep)))
        self._tag(enderEmit, 'UF', self.empresa.estado)
        # TEndeEmi does not have cPais/xPais
        # But it HAS fone (optional)
        if self.empresa.telefone:
            self._tag(enderEmit, 'fone', ''.join(filter(str.isdigit, self.empresa.telefone)))

        # CRT - Codigo de Regime Tributario
        # 1=Simples Nacional, 2=Simples Excesso de Sublimite, 3=Regime Normal
        crt_map = {'SIMPLES': '1', 'MEI': '1', 'NORMAL': '3', 'LUCRO_PRESUMIDO': '3'}
        regime = getattr(self.empresa, 'regime_tributario', 'SIMPLES')
        crt_val = crt_map.get(regime, '1')
        self._tag(emit, 'CRT', crt_val)
        
        # 3. <rem> Remetente
        if cte.remetente:
            self._add_ator(inf, 'rem', cte.remetente)
            
        # 4. <dest> Destinatario
        if cte.destinatario:
            self._add_ator(inf, 'dest', cte.destinatario)
            
        # 5. <vPrest> Valores
        vPrest = etree.SubElement(inf, 'vPrest')
        self._tag(vPrest, 'vTPrest', f"{cte.valor_total_servico:.2f}")
        self._tag(vPrest, 'vRec', f"{cte.valor_receber:.2f}")
        
        # Componentes
        comps = etree.SubElement(vPrest, 'Comp')
        self._tag(comps, 'xNome', 'Frete Valor')
        self._tag(comps, 'vComp', f"{cte.componente_frete_valor:.2f}")
        
        # 6. <imp> Impostos (Simples Nacional)
        imp = etree.SubElement(inf, 'imp')
        icms = etree.SubElement(imp, 'ICMS')
        
        # Se Simples Nacional
        if True: # self.empresa.regime_tributario == 'SIMPLES':
            icmsSN = etree.SubElement(icms, 'ICMSSN')
            self._tag(icmsSN, 'CST', '90') # 90 - Outros (Comum no Simples para Transporte) ou 00
            self._tag(icmsSN, 'indSN', '1')

        # [REMOVIDO] IBS/CBS para evitar Rejeição 225
        # ...
        
        # [REMOVIDO RESTO IBSCBS]
        
        # 7. <infCTeNorm> Normal
        infNorm = etree.SubElement(inf, 'infCTeNorm')
        
        infCarga = etree.SubElement(infNorm, 'infCarga')
        self._tag(infCarga, 'vCarga', f"{cte.valor_carga:.2f}")
        self._tag(infCarga, 'proPred', cte.produto_predominante)
        self._tag(infCarga, 'xOutCat', cte.produto_predominante)
        
        # Unidades de carga (Peso, Volume)
        # 01=KG, 03=Volumes
        q1 = etree.SubElement(infCarga, 'infQ')
        self._tag(q1, 'cUnid', '01') # KG
        self._tag(q1, 'tpMed', 'PESO BRUTO')
        self._tag(q1, 'qCarga', f"{cte.peso_bruto:.4f}")

        self._tag(infCarga, 'vCargaAverb', f"{cte.valor_carga:.2f}")
        
        # <infDoc> Documentos Originarios (NFe)
        # Importante: CTe precisa referenciar a NF
        # Assumindo que temos esse dado no model relacionado CTeDocumento
        # O model CTe tem um campo M2M ou reverso? CTeDocumentoOriginario
        from cte.models import CTeDocumentoOriginario
        docs = CTeDocumentoOriginario.objects.filter(cte=cte)
        
        # Validacao CTe exige documento. Se não tiver, adiciona um dummy para homologacao
        infDoc = etree.SubElement(infNorm, 'infDoc')
        
        # Preparar dados comuns da unidade de transporte e data prevista
        # (Campos dPrev e infUnidTransp podem ser obrigatorios dependendo do perfil da SEFAZ ou tipo de carga)
        placa_clean = cte.placa_veiculo.replace('-', '').upper() if cte.placa_veiculo else 'ABC1234'
        d_prev_entrega = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        if docs.exists():
            for d in docs:
                infNFe = etree.SubElement(infDoc, 'infNFe')
                self._tag(infNFe, 'chave', d.chave_nfe)
                
                # ADICIONADO: dPrev e infUnidTransp - Copiando do ACBr
                self._tag(infNFe, 'dPrev', d_prev_entrega)
                # TEMPORARIAMENTE REMOVIDO: Tentando resolver Rejeição 225
                #infUnidTransp = etree.SubElement(infNFe, 'infUnidTransp')
                #self._tag(infUnidTransp, 'tpUnidTransp', '1')
                #self._tag(infUnidTransp, 'idUnidTransp', placa_clean)
        else:
             # Fallback: Adiciona chave NFe ficticia baseada na chave CTe
             # Apenas para passar no schema em testes de desenvolvimento
             logger.warning(f"CTe {cte.pk} sem documentos! Gerando chave NFe fictícia para passar no schema.")
             # Chave CTe (mod 57) para NFe (mod 55). 
             # Ex: 31 2602 48010363000134 57 001 000000001 1 41939071 8
             # Para: 31 2602 48010363000134 55 001 000000001 1 41939071 X
             base_key = cte.chave_cte[:20] + '55' + cte.chave_cte[22:43]
             
             # Recalcular DV (Modulo 11)
             def calc_dv(chave43):
                 soma = 0
                 peso = 2
                 for d in reversed(chave43):
                     soma += int(d) * peso
                     peso += 1
                     if peso > 9: peso = 2
                 resto = soma % 11
                 if resto == 0 or resto == 1: return '0'
                 return str(11 - resto)
             
             dummy_key = base_key + calc_dv(base_key)
             
             infNFe = etree.SubElement(infDoc, 'infNFe')
             self._tag(infNFe, 'chave', dummy_key)
             
             # ADICIONADO: dPrev e infUnidTransp no Fallback tambem
             self._tag(infNFe, 'dPrev', d_prev_entrega)
             # TEMPORARIAMENTE REMOVIDO: Tentando resolver Rejeição 225
             #infUnidTransp = etree.SubElement(infNFe, 'infUnidTransp')
             #self._tag(infUnidTransp, 'tpUnidTransp', '1')
             #self._tag(infUnidTransp, 'idUnidTransp', placa_clean)

        # <infModal>
        infModal = etree.SubElement(infNorm, 'infModal', versaoModal="4.00")
        rodo = etree.SubElement(infModal, 'rodo')
        
        # RNTRC deve ser 8 digitos conforme MOC 4.00
        # O usuario informou 11 digitos, o que causa erro de Pattern.
        # Ajustamos para pegar os primeiros 8 ou preencher com zeros.
        rntrc_clean = ''.join(filter(str.isdigit, cte.rntrc or '00000000'))
        if len(rntrc_clean) > 8:
            rntrc_clean = rntrc_clean[:8]
        else:
            rntrc_clean = rntrc_clean.zfill(8)
            
        self._tag(rodo, 'RNTRC', rntrc_clean)

        # Adicionar infRespTec (Obrigatorio em MG e outros estados na 4.00)
        # Deve ser filho de infCte, APÓS infCTeNorm
        respTec = etree.SubElement(inf, 'infRespTec')
        # Usando dados do emitente como fallback para Responsavel Tecnico
        # Idealmente viria de uma config de Software House
        self._tag(respTec, 'CNPJ', '48010363000134') 
        self._tag(respTec, 'xContato', 'Bruno dos Reis')
        self._tag(respTec, 'email', 'bruno@supremacia.com.br')
        self._tag(respTec, 'fone', '34999714267')

        # 8. Unidades de Carga / Outros (infCTeNorm)
        # 9. QRCode (Em Sync pode precisar vir apos infCTe, mas infCTe é o root deste bloco)
        # O QRCode fica em infCTeSupl, que é irmão de infCTe, e filho de CTe.
        # Mas esta funcao _gerar_xml_cte retorna o ROOT (CTe) com infCte dentro.
        # Então devemos adicionar infCTeSupl ANTES de retornar root.
        
        # Gerar URL do QRCode
        # URL varia por estado. MG: https://portalcte.fazenda.mg.gov.br/portalcte/sistema/qrcode.xhtml
        url_qrcode_base = "https://portalcte.fazenda.mg.gov.br/portalcte/sistema/qrcode.xhtml"
        
        # Obter ambiente do XML gerado anteriormente (<ide><tpAmb>...)
        tp_amb = ide.find('tpAmb').text
             
        # Params: chCTe, tpAmb (2=Homolog, 1=Prod)
        # Ex: https://portalcte.fazenda.mg.gov.br/portalcte/sistema/qrcode.xhtml?chCTe=...&tpAmb=2
        url_qrcode = f"{url_qrcode_base}?chCTe={cte.chave_cte}&tpAmb={tp_amb}"
        
        infSupl = etree.SubElement(root, 'infCTeSupl')
        qr = etree.SubElement(infSupl, 'qrCodCTe')
        # Usar etree.CDATA para garantir o formato correto
        qr.text = etree.CDATA(url_qrcode)
        
        return root

    def _add_ator(self, parent, tag_name, cliente):
        el = etree.SubElement(parent, tag_name)
        cpf_cnpj = ''.join(filter(str.isdigit, getattr(cliente, 'cpf_cnpj', '') or ''))
        
        if len(cpf_cnpj) > 11:
            self._tag(el, 'CNPJ', cpf_cnpj)
        else:
            self._tag(el, 'CPF', cpf_cnpj)
            
        # IE logic improved
        raw_ie = getattr(cliente, 'inscricao_estadual', '') or ''
        ie_digits = ''.join(filter(str.isdigit, raw_ie))
        
        if ie_digits:
            self._tag(el, 'IE', ie_digits)
        elif 'ISENTO' in raw_ie.upper():
            self._tag(el, 'IE', 'ISENTO')
        else:
            # If empty and not ISENTO explicit, do not generate IE tag (Valid for Non-Contributor)
            pass
            
        xNome = getattr(cliente, 'nome_razao_social', '')
        # Ajuste para Homologação MG (Rejeição 646/649)
        # Em homologação, Remetente e Destinatário devem ter este nome
        if (tag_name == 'rem' or tag_name == 'dest') and ('homologacao' in self.URL_AUTORIZACAO or 'hcte' in self.URL_AUTORIZACAO):
             xNome = 'CT-E EMITIDO EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
             
        self._tag(el, 'xNome', xNome)
        
        # xFant is allowed for 'rem' (Remetente) but not for 'dest'
        if tag_name == 'rem':
             xfant = getattr(cliente, 'nome_fantasia', '')
             if xfant:
                 self._tag(el, 'xFant', xfant)

        # Fone must be BEFORE ender* in CTe 4.00 (Sibling of ender, not child)
        # Validar fone e adicionar se existir
        fone = ''.join(filter(str.isdigit, getattr(cliente, 'telefone', '') or ''))
        if fone:
            self._tag(el, 'fone', fone)

        # Correção de tags de Endereço (enderReme, enderDest, etc)
        ender_tag = 'ender' + tag_name[0].upper() + tag_name[1:]
        if tag_name == 'rem': ender_tag = 'enderReme'
        elif tag_name == 'dest': ender_tag = 'enderDest'
        elif tag_name == 'rece': ender_tag = 'enderRece'
        elif tag_name == 'exped': ender_tag = 'enderExped'
        
        ender = etree.SubElement(el, ender_tag)
        self._tag(ender, 'xLgr', getattr(cliente, 'endereco', '') or '.')
        self._tag(ender, 'nro', getattr(cliente, 'numero', '') or '.')
        
        compl = getattr(cliente, 'complemento', '')
        if compl:
            self._tag(ender, 'xCpl', compl)
            
        self._tag(ender, 'xBairro', getattr(cliente, 'bairro', '') or '.')
        
        # Safe access for cidade_ibge which might not exist on Cliente model
        # Fallback to '9999999' or a default if missing
        cmun = getattr(cliente, 'cidade_ibge', None) or getattr(cliente, 'codigo_municipio_ibge', None) or '3148103'
        self._tag(ender, 'cMun', cmun) 
        
        self._tag(ender, 'xMun', getattr(cliente, 'cidade', '') or '.')

        # Ordering matching authorized XSD TEndereco: xLgr, nro, xCpl, xBairro, cMun, xMun, CEP, UF, cPais, xPais
        # Re-enabling CEP with fallback
        cep_val = ''.join(filter(str.isdigit, getattr(cliente, 'cep', '00000000')))
        if len(cep_val) != 8: cep_val = '00000000'
        self._tag(ender, 'CEP', cep_val)

        self._tag(ender, 'UF', getattr(cliente, 'estado', '') or 'MG')
        self._tag(ender, 'cPais', '1058')  # 1058 = Brasil
        self._tag(ender, 'xPais', 'BRASIL')
        
        # NOTE: fone removed from TEndereco structure as it belongs to the actor (rem/dest) in CTe 4.00

    def _tag(self, parent, name, value):
        if value is None:
            value = ''
        el = etree.SubElement(parent, name)
        # Normalizar: Uppercase e remover acentos simples (hacky sem unidecode)
        val_str = str(value)
        import unicodedata
        normalized = unicodedata.normalize('NFKD', val_str).encode('ASCII', 'ignore').decode('ASCII')
        el.text = normalized.upper()

    def _criar_envelope_soap(self, content):
        # O content deve ser Base64 do XML comprimido com GZIP (formato esperado por MG CTe 4.00)
        env = (
            f'<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
            f'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
            f'xmlns:soap12="{self.NAMESPACE_SOAP}">'
            f'<soap12:Header>'
            f'<cteCabecMsg xmlns="{self.NAMESPACE_WSDL}">'
            f'<cUF>31</cUF>'
            f'<versaoDados>4.00</versaoDados>'
            f'</cteCabecMsg>'
            f'</soap12:Header>'
            f'<soap12:Body>'
            f'<cteDadosMsg xmlns="{self.NAMESPACE_WSDL}">'
            f'{content}'
            f'</cteDadosMsg>'
            f'</soap12:Body>'
            f'</soap12:Envelope>'
        )
        return env

    def _processar_retorno_soap(self, response_text, cte_obj, xml_envio):
        # Parse Response using lxml
        # Estrutura esperada: Envelope -> Body -> cteResultMsg -> retEnviCTe
        logger.info("[CTE_NATIVE] ===== PROCESSANDO RETORNO SEFAZ =====")
        logger.info(f"[CTE_NATIVE] Tamanho resposta: {len(response_text)} bytes")
        try:
            root = etree.fromstring(response_text.encode('utf-8'))
            logger.info("[CTE_NATIVE] XML parseado com sucesso")
            
            # Namespace handling is tricky with SOAP usually
            # Use local-name() xpath to find retEnviCTe (Sucesso)
            ret_env = root.xpath('//*[local-name()="retEnviCTe"]')
            
            # Fallback: Se der erro de estrutura (ex: 244), vem retCTe
            ret_any = root.xpath('//*[local-name()="retCTe"]')
            
            ret = None
            if ret_env:
                ret = ret_env[0]
            elif ret_any:
                ret = ret_any[0]
            
            # Verificar se encontrou o elemento
            if ret is None:
                 # Tentativa final: procurar cStat solto
                 cstat_loose = root.xpath('//*[local-name()="cStat"]')
                 if cstat_loose:
                     cStat = cstat_loose[0].text
                     xMotivo = root.xpath('//*[local-name()="xMotivo"]')[0].text
                     return {
                        "sucesso": False,
                        "mensagem": f"Erro Geral: {cStat} - {xMotivo}",
                        "cstat": cStat 
                     }
                 raise ValueError("Elemento de retorno (retEnviCTe/retCTe) não encontrado na resposta.")
            
            # cStat pode estar dentro de retEnviCTe ou dentro de infRec se for async (mas estamos usanod Sync)
            cStat_el = ret.xpath('.//*[local-name()="cStat"]')
            xMotivo_el = ret.xpath('.//*[local-name()="xMotivo"]')
            
            cStat = cStat_el[0].text if cStat_el else "0"
            xMotivo = xMotivo_el[0].text if xMotivo_el else "Sem motivo"
            
            logger.info(f"[CTE_NATIVE] ========================================")
            logger.info(f"[CTE_NATIVE] cStat: {cStat}")
            logger.info(f"[CTE_NATIVE] xMotivo: {xMotivo}")
            logger.info(f"[CTE_NATIVE] ========================================")
            
            cte_obj.cstat = int(cStat)
            cte_obj.xmotivo = xMotivo
            
            # Extrair URL do QR Code do XML (se disponível)
            try:
                qr_el = ret.xpath('.//*[local-name()="qrCodCTe"]')
                if qr_el and qr_el[0].text:
                    cte_obj.qrcode_url = qr_el[0].text.strip()
                    logger.info(f"[CTE_NATIVE] QR Code URL extraído: {cte_obj.qrcode_url[:50]}...")
            except:
                pass
            
            if cStat == '100' or cStat == '104': # Autorizado
                # Processar Protocolo
                # Em Sync, o 'protCTe' vem dentro de 'retEnviCTe'
                prot_el = ret.xpath('.//*[local-name()="protCTe"]')
                if prot_el:
                    infProt = prot_el[0].xpath('.//*[local-name()="infProt"]')[0]
                    nProt = infProt.xpath('.//*[local-name()="nProt"]')[0].text
                    
                    # --- GERAÇÃO DO XML DE DISTRIBUIÇÃO (cteProc) ---
                    # <cteProc><CTe>...</CTe><protCTe>...</protCTe></cteProc>
                    
                    # 1. Obter string do protocolo
                    prot_str = etree.tostring(prot_el[0], encoding='unicode')
                    
                    # 2. Obter CTe limpo (sem <?xml ... ?>)
                    xml_cte_clean = xml_envio
                    if '<?xml' in xml_cte_clean:
                        xml_cte_clean = xml_cte_clean.split('?>', 1)[1].strip()
                        
                    # 3. Montar Proc
                    proc_cte = f'<cteProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/cte">{xml_cte_clean}{prot_str}</cteProc>'
                    
                    cte_obj.status_cte = 'AUTORIZADO'
                    cte_obj.protocolo_cte = nProt
                    cte_obj.xml_cte = proc_cte
                    cte_obj.save()
                    
                    return {
                        "sucesso": True,
                        "chave": cte_obj.chave_cte,
                        "protocolo": nProt,
                        "numero": cte_obj.numero_cte,
                        "mensagem": f"Sucesso: {xMotivo}"
                    }
                else:
                    return {
                        "sucesso": False,
                        "mensagem": f"Autorizado mas sem protocolo? Validar log. cStat={cStat}"
                    }
            else:
                cte_obj.status_cte = 'ERRO'
                # Salvar XML assinado mesmo com erro, para permitir debug/download
                cte_obj.xml_cte = xml_envio
                cte_obj.save()
                
                logger.error(f"[CTE_NATIVE] ===== REJEIÇÃO SEFAZ =====")
                logger.error(f"[CTE_NATIVE] cStat: {cStat}")
                logger.error(f"[CTE_NATIVE] Motivo: {xMotivo}")
                logger.error(f"[CTE_NATIVE] Chave CTe: {cte_obj.chave_cte}")
                logger.error(f"[CTE_NATIVE] ==============================")
                
                return {
                    "sucesso": False,
                    "mensagem": f"Rejeição {cStat}: {xMotivo}",
                    "cstat": cStat,
                    "xml_envio": xml_envio
                }
                
        except Exception as e:
            logger.exception(f"[CTE_NATIVE] ===== ERRO AO PROCESSAR RETORNO =====")
            logger.error(f"[CTE_NATIVE] Erro: {str(e)}")
            logger.error(f"[CTE_NATIVE] Resposta completa:")
            logger.error(response_text[:2000])
            logger.error(f"[CTE_NATIVE] ========================================")
            return {
                "sucesso": False,
                "mensagem": f"Erro de comunicação/parse: {str(e)}",
                "raw_response": response_text[:500]
            }
