from lxml import etree as ET
from datetime import datetime
import random
import math
import logging

import hashlib

logger = logging.getLogger(__name__)

class NfeXmlBuilder:
    def __init__(self, venda, empresa_config):
        self.venda = venda
        self.empresa = empresa_config
        self.ns = "http://www.portalfiscal.inf.br/nfe"
        # Detectar modelo (55=NF-e, 65=NFC-e) — IBSCBS só para modelo 65 pois SEFAZ 4.00 rejeita no 55
        try:
            self.modelo = int(getattr(venda.id_operacao, 'modelo_documento', 65))
        except (TypeError, ValueError):
            self.modelo = 65
        # lxml não precisa de register_namespace quando usamos nsmap
        
        # URLs NFCe MG (conforme ACBrNFeServicos.ini)
        # Versão 2.00 do QR Code
        if self.empresa.ambiente_nfce == '2':  # Homologação
             self.url_qrcode = "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml"
             self.url_consulta_chave = "https://hportalsped.fazenda.mg.gov.br/portalnfce"
        else:  # Produção
             self.url_qrcode = "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml"
             self.url_consulta_chave = "https://portalsped.fazenda.mg.gov.br/portalnfce"
             
        # Detect Payment Type
        self.tipo_pagamento = "01" # Default Dinheiro
        try:
            from api.models import FinanceiroConta, FormaPagamento
            # id_venda_origem is IntegerField, so pass ID vs Object
            fin = FinanceiroConta.objects.filter(id_venda_origem=self.venda.id_venda).first()
            if fin:
                forma_obj = None
                # Check directly if FK exists (in case model has it)
                if hasattr(fin, 'id_forma_pagamento') and fin.id_forma_pagamento:
                     forma_obj = fin.id_forma_pagamento
                # Check by name string
                elif fin.forma_pagamento:
                     forma_obj = FormaPagamento.objects.filter(nome_forma=fin.forma_pagamento).first()
                
                if forma_obj:
                    # Priority: DB Code > Name Heuristics
                    if hasattr(forma_obj, 'codigo_t_pag') and forma_obj.codigo_t_pag and forma_obj.codigo_t_pag != '99':
                         self.tipo_pagamento = forma_obj.codigo_t_pag
                    else:
                        nome = forma_obj.nome_forma.lower()
                        if 'dinheiro' in nome: self.tipo_pagamento = "01"
                        elif 'credito' in nome or 'crédito' in nome: self.tipo_pagamento = "03"
                        elif 'debito' in nome or 'débito' in nome: self.tipo_pagamento = "04"
                        elif 'pix' in nome: self.tipo_pagamento = "17"
                        elif 'boleto' in nome: self.tipo_pagamento = "15"
                        else: self.tipo_pagamento = "99" # Outros
        except Exception as e:
            print(f"Error detecting payment: {e}")
            pass

    def _formata_data(self, dt):
        # Formato: YYYY-MM-DDThh:mm:ss-03:00
        # Simples para exemplo: YYYY-MM-DDThh:mm:ss
        return dt.strftime('%Y-%m-%dT%H:%M:%S') + "-03:00"

    def remover_acentos_texto(self, texto):
        try:
            if not texto: return ""
            import unicodedata
            return unicodedata.normalize('NFKD', str(texto)).encode('ASCII', 'ignore').decode('ASCII')
        except:
            return str(texto)

    def _limpar_texto(self, text, max_len=None):
        """Remove characters invalid for XML NFe, strips whitespace/newlines and removes accents.
        Crítico para evitar Rejeição 297 (Assinatura difere do calculado)."""
        if not text:
            return ""
        
        # Converter para string
        s = str(text)
        
        # 0. Remover Acentos (Normalization)
        # Integrado aqui para garantir que todo texto limpo esteja sem acentos
        try:
            import unicodedata
            s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ASCII')
        except Exception:
            pass # Fallback se falhar
        
        # 1. Remover caracteres de controle (incluindo \n, \r, \t)
        # Manter apenas caracteres imprimíveis
        s = ''.join(char if char.isprintable() or char == ' ' else ' ' for char in s)
        
        # 2. Remover/substituir caracteres especiais problemáticos e proibidos pela SEFAZ
        # Lista expandida conforme recomendação da rejeição 297
        chars_proibidos = ['$', '#', '@', '*', '&', '<', '>', '"', "'", '`', '|', '\\', 'º', 'ª']
        for char in chars_proibidos:
            s = s.replace(char, '')
        
        # 3. Normalizar espaços: remover múltiplos espaços e colapsar
        # Importante: usar split() sem args remove TODOS os tipos de whitespace (\n, \t, etc)
        s = ' '.join(s.split())
        
        # 4. Remove pontuação de CPF/CNPJ do início do texto e traços soltos
        # Schema da SEFAZ não aceita certos padrões em xNome
        import re
        s = re.sub(r'^[\d\.\-/]+\s+', '', s)
        
        # 5. Truncate se necessário
        if max_len and len(s) > max_len:
            s = s[:max_len]
        
        # 6. Upper case (Padrão NFe prefere maiúsculas, ajuda a evitar erros de case sensitive no hash as vezes)
        s = s.upper()

        # 7. Strip final (garantir sem espaços nas bordas)
        return s.strip()

    def build_xml(self):
        # CRITICAL: Define namespace map no root - lxml herdará para todos os filhos
        root = ET.Element(f"{{{self.ns}}}NFe", nsmap={None: self.ns})
        
        # --- infNFe ---
        # Chave de Acesso (Simulada para geração - na real precisa calcular DV)
        # cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8) + cDV(1)
        cUF = "31" # MG
        cnpj = ''.join(filter(str.isdigit, self.empresa.cpf_cnpj or '00000000000000'))
        
        # Determine Model (55 or 65)
        # VALIDAÇÃO: modelo_documento deve ser '55' (NFe) ou '65' (NFCe)
        # Se vier inválido ou não numérico, usar '65' como padrão para NFCe
        modelo = "65"  # Padrão: NFCe
        if self.venda.id_operacao and self.venda.id_operacao.modelo_documento:
            modelo_raw = str(self.venda.id_operacao.modelo_documento).strip()
            # Validar se é um dos modelos válidos
            if modelo_raw in ['55', '65', '57']:  # 55=NFe, 65=NFCe, 57=CTe
                modelo = modelo_raw
            elif modelo_raw == '99' or not modelo_raw.isdigit():
                # Documentos não fiscais ou valores inválidos: usar NFCe por padrão
                modelo = "65"
                logger.warning(f"[AVISO] modelo_documento inválido '{modelo_raw}' na operação {self.venda.id_operacao.nome_operacao}. Usando '65' (NFCe) como padrão.")
            else:
                modelo = modelo_raw
        
        logger.info(f"? Modelo documento: {modelo}")
        
        # Logica para obter Serie e Numero da Operacao se disponivel
        serie_val = self.venda.serie_nfe or 1
        numero_val = self.venda.numero_nfe or self.venda.id_venda # Preferencia numero ja salvo, senao ID

        # Se nao tem numero salvo na venda, tenta pegar da operacao
        if not self.venda.numero_nfe and self.venda.id_operacao:
             try:
                 op = self.venda.id_operacao
                 # Se o objeto vier como ID (inteiro) por algum motivo de serializacao incorreta, tenta carregar
                 # Mas como estamos no Django ORM context, deve ser objeto.
                 if op.serie_nf:
                     serie_val = op.serie_nf
                 if op.proximo_numero_nf:
                     numero_val = op.proximo_numero_nf
             except Exception as e:
                 # Fallback log silencioso ou print
                 print(f"Erro ao ler Operacao: {e}")

        # Override removido. Usamos o numero_val calculado acima.
        
        # 🔍 VALIDAÇÃO ROBUSTA: Garantir que serie_val e numero_val são numéricos
        # Verifica se é string numérica ou já é número
        if not serie_val:
            serie_val = 1
        else:
            try:
                # Remove espaços e verifica se é numérico
                serie_str = str(serie_val).strip()
                if not serie_str.isdigit():
                    raise ValueError(f"Valor não numérico: '{serie_val}'")
                serie_val = int(serie_str)
            except (ValueError, TypeError, AttributeError) as e:
                logger.error(f"[AVISO] ERRO: serie_val inválido! Valor recebido: '{serie_val}' | Venda ID: {self.venda.id_venda}")
                logger.error(f"   Operação: {self.venda.id_operacao.nome_operacao if self.venda.id_operacao else 'N/A'}")
                logger.error(f"   Tipo: {type(serie_val)} | Erro: {e}")
                serie_val = 1  # Fallback para série 1
                
        if not numero_val:
            numero_val = self.venda.id_venda
        else:
            try:
                # Remove espaços e verifica se é numérico
                numero_str = str(numero_val).strip()
                if not numero_str.isdigit():
                    raise ValueError(f"Valor não numérico: '{numero_val}'")
                numero_val = int(numero_str)
            except (ValueError, TypeError, AttributeError) as e:
                logger.error(f"[AVISO] ERRO: numero_val inválido! Valor recebido: '{numero_val}' | Venda ID: {self.venda.id_venda}")
                logger.error(f"   Operação: {self.venda.id_operacao.nome_operacao if self.venda.id_operacao else 'N/A'}")
                logger.error(f"   Tipo: {type(numero_val)} | Erro: {e}")
                numero_val = self.venda.id_venda  # Fallback para ID da venda

        serie = str(serie_val).zfill(3)
        numero = str(numero_val).zfill(9)
        
        tpEmis = "1"
        if getattr(self.venda, 'tpEmis', None):
            tpEmis = str(self.venda.tpEmis)
        elif self.venda.status_nfe == 'CONTINGENCIA':
            tpEmis = "9"
        elif self.venda.status_nfe == 'CONTINGENCIA_SVCAN':
            tpEmis = "6"
        
        # === cNF Preservation Logic ===
        # If the sale already has a key, try to reuse the cNF to avoid changing the key (duplication handling)
        cNF = None
        if self.venda.chave_nfe and len(self.venda.chave_nfe) == 44:
            # Check if stored key matches CNPJ, Series and Number
            try:
                # Key Structure: cUF(2) AAMM(4) CNPJ(14) mod(2) serie(3) nNF(9) tpEmis(1) cNF(8) cDV(1)
                stored_cnpj = self.venda.chave_nfe[6:20]
                stored_mod = self.venda.chave_nfe[20:22]
                stored_serie = self.venda.chave_nfe[22:25]
                stored_nNF = self.venda.chave_nfe[25:34]
                
                # Compare critical fields (Serie and Number must match to reuse cNF)
                # CNPJ usually matches, but good to check.
                if (stored_nNF == numero and 
                    stored_serie == serie and 
                    stored_mod == modelo):
                    
                    # Extract cNF (Position 35 to 43 - 8 chars)
                    # 0-based index: start at 35 (2+4+14+2+3+9+1 = 35)
                    cNF = self.venda.chave_nfe[35:43]
                    print(f"Reusing cNF from stored key: {cNF}")
            except Exception as e:
                print(f"Error parsing stored key: {e}")
        
        if not cNF:
            cNF = str(random.randint(10000000, 99999999))
        
        # Chave incompleta (sem DV)
        # Note: If reusing cNF but Month/Year changed (AAMM), the key WILL change anyway. 
        # But usually we want to preserve if possible.

        chave_base = f"{cUF}{datetime.now().strftime('%y%m')}{cnpj}{modelo}{serie}{numero}{tpEmis}{cNF}"
        cDV = self._calcular_dv(chave_base)
        chave = f"{chave_base}{cDV}"
        
        # lxml: Use namespace nos elementos, SubElements herdam automaticamente
        infNFe = ET.SubElement(root, f"{{{self.ns}}}infNFe", attrib={"Id": f"NFe{chave}", "versao": "4.00"})
        
        # Nota: Data de emissão para QR Code deve ser salva para uso posterior
        self._dhEmi_str = self._formata_data(datetime.now())
        
        # --- ide ---
        # CRITICAL: Todos os SubElements devem usar {namespace}tag para herdar corretamente
        ide = ET.SubElement(infNFe, f"{{{self.ns}}}ide")
        ET.SubElement(ide, f"{{{self.ns}}}cUF").text = cUF
        ET.SubElement(ide, f"{{{self.ns}}}cNF").text = cNF

        # --- Determinar finalidade de emissão (finNFe) ---
        # Prioridade: campo finalidade_emissao da operação > fallback por nome da operação
        fin_nfe = "1"  # Normal por padrão
        if self.venda.id_operacao:
            op_fin = str(getattr(self.venda.id_operacao, 'finalidade_emissao', '') or '').strip()
            nome_op = (self.venda.id_operacao.nome_operacao or '').upper()
            if op_fin in ('2', '3', '4', '5', '6', '7'):
                fin_nfe = op_fin
            elif 'DEVOLU' in nome_op:
                fin_nfe = "4"
            elif 'COMPLEM' in nome_op:
                fin_nfe = "2"
            elif 'AJUSTE' in nome_op:
                fin_nfe = "3"
            else:
                fin_nfe = op_fin if op_fin == '1' else '1'

        # natOp: descrição da natureza da operação derivada da finalidade
        _NAT_OP_MAP = {
            '1': 'VENDA',
            '2': 'COMPLEMENTO DE NOTA FISCAL',
            '3': 'AJUSTE DE NOTA FISCAL',
            '4': 'DEVOLUCAO DE MERCADORIA',
            '5': 'NOTA DE CREDITO',
            '6': 'NOTA DE DEBITO - PAGAMENTO ANTECIPADO',
            '7': 'NOTA DE DEBITO - PERDA EM ESTOQUE',
        }
        nat_op = _NAT_OP_MAP.get(fin_nfe, 'VENDA')
        # Se a operação tem nome explícito, usa o nome da operação
        if self.venda.id_operacao and self.venda.id_operacao.nome_operacao:
            nat_op = str(self.venda.id_operacao.nome_operacao).upper()

        ET.SubElement(ide, f"{{{self.ns}}}natOp").text = nat_op
        ET.SubElement(ide, f"{{{self.ns}}}mod").text = modelo
        # ✅ Não precisa converter novamente, já foi validado acima
        ET.SubElement(ide, f"{{{self.ns}}}serie").text = serie.lstrip('0') or '1'  # Remove zeros à esquerda
        ET.SubElement(ide, f"{{{self.ns}}}nNF").text = numero.lstrip('0') or '1'
        ET.SubElement(ide, f"{{{self.ns}}}dhEmi").text = self._dhEmi_str
        # tpNF: 0=Entrada (devoluções de fornecedor, notas de crédito recebidas),
        #       1=Saída (emissões próprias: vendas, devoluções de clientes, complementar, ajuste, débito)
        # Finalidade 5 (Nota de Crédito emitida pelo fornecedor ao cliente = Entrada para o emitente se for
        # o receptor, mas na reforma tributária a NF de crédito é emitida pelo EMITENTE, então tpNF=1)
        tp_nf = "1"  # Saída por padrão para todos os casos de emissão própria
        ET.SubElement(ide, f"{{{self.ns}}}tpNF").text = tp_nf
        ET.SubElement(ide, f"{{{self.ns}}}idDest").text = "1" # Interna
        # FIX: Codigo IBGE de Patrocinio MG
        ET.SubElement(ide, f"{{{self.ns}}}cMunFG").text = "3148103" 

        # Select Environment and Print Format based on Model
        # If Model 55 (NFe), use ambiente_nfe, else (NFCe) use ambiente_nfce
        # Check if venda or operacao has a custom tpImp/tplmp attribute (can be set dynamically in tests or views)
        tpImp_override = None
        for obj in [self.venda, getattr(self.venda, 'id_operacao', None)]:
            if obj:
                for attr in ['tpImp', 'tplmp', 'tipo_impressao', 'tipo_danfe']:
                    val = getattr(obj, attr, None)
                    if val is not None:
                        tpImp_override = str(val)
                        break
            if tpImp_override:
                break

        if modelo == '55':
             amb = str(self.empresa.ambiente_nfe or "2")
             tpImp_val = tpImp_override if tpImp_override else "1" # 1=Retrato (NFe)
        else:
             amb = str(self.empresa.ambiente_nfce or "2")
             tpImp_val = tpImp_override if tpImp_override else "4" # 4=NFCe

        ET.SubElement(ide, f"{{{self.ns}}}tpImp").text = tpImp_val # Dynamic
        ET.SubElement(ide, f"{{{self.ns}}}tpEmis").text = tpEmis
        ET.SubElement(ide, f"{{{self.ns}}}cDV").text = str(cDV)
        
        ET.SubElement(ide, f"{{{self.ns}}}tpAmb").text = amb
        
        ET.SubElement(ide, f"{{{self.ns}}}finNFe").text = fin_nfe
        # indFinal: 0=Normal (B2B), 1=Consumidor Final
        # Regra geral: se o destinatário for CPF ou CNPJ sem IE (Não Contribuinte), indFinal DEVE ser 1.
        # Caso contrário (Contribuinte), se for Nota de Ajuste/Complemento/Crédito (2, 3, 5, 6, 7), o padrão B2B (0) é mais adequado.
        ind_final = "1"
        if self.venda.id_cliente:
            c = self.venda.id_cliente
            doc_cli = ''.join(filter(str.isdigit, c.cpf_cnpj or ''))
            ie_limpa = ''.join(filter(str.isdigit, c.inscricao_estadual or ''))
            is_cnpj = len(doc_cli) > 11
            has_ie = bool(ie_limpa and len(ie_limpa) > 4)
            if is_cnpj and has_ie:
                ind_final = "0"
            else:
                ind_final = "1"
        else:
            ind_final = "1"
        ET.SubElement(ide, f"{{{self.ns}}}indFinal").text = ind_final
        ET.SubElement(ide, f"{{{self.ns}}}indPres").text = "1"
        ET.SubElement(ide, f"{{{self.ns}}}procEmi").text = "0"
        ET.SubElement(ide, f"{{{self.ns}}}verProc").text = "1.0.2.0"
        
        if tpEmis != "1":
            dh_cont = getattr(self.venda, 'dh_cont', None)
            if not dh_cont:
                dh_cont = datetime.now().strftime('%Y-%m-%dT%H:%M:%S-03:00')
            x_just = getattr(self.venda, 'x_just', None)
            if not x_just:
                x_just = "Falha de comunicacao com a SEFAZ"
            ET.SubElement(ide, f"{{{self.ns}}}dhCont").text = dh_cont
            ET.SubElement(ide, f"{{{self.ns}}}xJust").text = x_just

        # --- NFref (Notas Referenciadas - para Devolução/Ajuste/Faturamento) ---
        # 1. Referência Única (vindo do campo chave_nfe_referenciada - ex: devolução simples)
        if getattr(self.venda, 'chave_nfe_referenciada', None):
            chave_ref = str(self.venda.chave_nfe_referenciada).strip()
            if len(chave_ref) == 44 and chave_ref.isdigit():
                nfref = ET.SubElement(ide, f"{{{self.ns}}}NFref")
                ET.SubElement(nfref, f"{{{self.ns}}}refNFe").text = chave_ref

        # 2. Referência Múltipla (Faturamento de Vendas/Cupons Anteriores)
        # Se esta venda for uma fatura que consolida outras vendas (via related_name 'vendas_faturadas')
        if hasattr(self.venda, 'vendas_faturadas'):
            # Prefetch ou iterate
            try:
                for venda_origem in self.venda.vendas_faturadas.all():
                    chave_origem = (venda_origem.chave_nfe or '').strip()
                    # Só adiciona se tiver chave válida (44 dígitos numéricos)
                    if len(chave_origem) == 44 and chave_origem.isdigit():
                        nfref = ET.SubElement(ide, f"{{{self.ns}}}NFref")
                        ET.SubElement(nfref, f"{{{self.ns}}}refNFe").text = chave_origem
            except Exception as e:
                logger.error(f"Erro ao processar referências de faturamento: {e}")

        # --- emit ---
        # Função auxiliar para remover acentos de nomes
        def remover_acentos_texto(texto):
            try:
                if not texto: return ""
                import unicodedata
                return unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('ASCII')
            except:
                return texto
        
        emit = ET.SubElement(infNFe, f"{{{self.ns}}}emit")
        ET.SubElement(emit, f"{{{self.ns}}}CNPJ").text = cnpj
        ET.SubElement(emit, f"{{{self.ns}}}xNome").text = remover_acentos_texto(self._limpar_texto(self.empresa.nome_razao_social, 60))
        # xFant is recommended if available
        if self.empresa.nome_fantasia:
             ET.SubElement(emit, f"{{{self.ns}}}xFant").text = remover_acentos_texto(self._limpar_texto(self.empresa.nome_fantasia, 60))
        
        enderEmit = ET.SubElement(emit, f"{{{self.ns}}}enderEmit")
        # Helper para remover acentos
        import unicodedata
        def remover_acentos(texto):
            try:
                if not texto: return ""
                # Normalize, encode to ASCII (ignore errors), decode back
                return unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('ASCII')
            except:
                return texto

        ET.SubElement(enderEmit, f"{{{self.ns}}}xLgr").text = self.remover_acentos_texto(self._limpar_texto(self.empresa.endereco, 60)) or "Rua"
        ET.SubElement(enderEmit, f"{{{self.ns}}}nro").text = self._limpar_texto(self.empresa.numero, 60) or "SN"
        ET.SubElement(enderEmit, f"{{{self.ns}}}xBairro").text = self.remover_acentos_texto(self._limpar_texto(self.empresa.bairro, 60)) or "Centro"
        
        # FIX: Codigo IBGE dinâmico ou fallback para Patrocinio
        # Usa campo codigo_municipio_ibge se existir, senão fallback
        cod_mun = "3148103"
        if hasattr(self.empresa, 'codigo_municipio_ibge') and self.empresa.codigo_municipio_ibge:
             cod_mun = ''.join(filter(str.isdigit, self.empresa.codigo_municipio_ibge))
        
        ET.SubElement(enderEmit, f"{{{self.ns}}}cMun").text = cod_mun
        ET.SubElement(enderEmit, f"{{{self.ns}}}xMun").text = self.remover_acentos_texto(self._limpar_texto(self.empresa.cidade, 60)) or "PATROCINIO"
        ET.SubElement(enderEmit, f"{{{self.ns}}}UF").text = self._limpar_texto(self.empresa.estado, 2) or "MG"
        ET.SubElement(enderEmit, f"{{{self.ns}}}CEP").text = ''.join(filter(str.isdigit, self.empresa.cep or '00000000'))
        
        # VOLTANDO cPais (Obrigatorio em NFe 4.0 na tag enderEmit)
        ET.SubElement(enderEmit, f"{{{self.ns}}}cPais").text = "1058"
        ET.SubElement(enderEmit, f"{{{self.ns}}}xPais").text = "BRASIL"
        
        # Helper para limpar IE (permite ISENTO ou digitos)
        def limpar_ie(ie_val):
             if not ie_val: return ""
             ie_upper = str(ie_val).upper().strip()
             if "ISENTO" in ie_upper:
                 return "ISENTO"
             return ''.join(filter(str.isdigit, ie_upper))

        ET.SubElement(emit, f"{{{self.ns}}}IE").text = limpar_ie(self.empresa.inscricao_estadual)
        
        # Adicionar CNAE se disponível (Opcional, mas bom ter)
        # REMOVIDO: A tag CNAE so deve ser enviada se houver IM (Inscricao Municipal)
        # O validador rejeita CNAE sozinho.
        # if hasattr(self.empresa, 'cnae') and self.empresa.cnae:
        #      cnae_val = ''.join(filter(str.isdigit, self.empresa.cnae))
        #      if cnae_val:
        #          ET.SubElement(emit, f"{{{self.ns}}}CNAE").text = cnae_val

        # Determine CRT
        crt_val = "1"
        if hasattr(self.empresa, 'crt') and self.empresa.crt:
            crt_val = str(self.empresa.crt)
        
        # Override se Regime Tributário for NORMAL (Forçar CRT 3)
        if hasattr(self.empresa, 'regime_tributario') and str(self.empresa.regime_tributario).upper() in ['NORMAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']:
             crt_val = '3'
        
        ET.SubElement(emit, f"{{{self.ns}}}CRT").text = crt_val

        # --- dest (Opcional) ---
        if self.venda.id_cliente:
             c = self.venda.id_cliente
             doc_cli = ''.join(filter(str.isdigit, c.cpf_cnpj or ''))

             # Ignorar destinatário se CPF for inválido/zeros (Consumidor padrão)
             # Isso resolve o problema de validar SCHEMA com CPF 00000000000
             is_invalid_doc = not doc_cli or doc_cli == '00000000000' or doc_cli == '00000000000000'

             if not is_invalid_doc:
                 dest = ET.SubElement(infNFe, f"{{{self.ns}}}dest")
                 if len(doc_cli) > 11:
                     ET.SubElement(dest, f"{{{self.ns}}}CNPJ").text = doc_cli
                 elif doc_cli:
                     ET.SubElement(dest, f"{{{self.ns}}}CPF").text = doc_cli
                 
                 # Lógica de Nome para Homologação
                 # Modelo 55 (NFe): xNome do Destinatário DEVE ser o texto fixo na maioria das validações
                 # Modelo 65 (NFCe): xNome do Destinatário pode ser vazio ou real (Não tem regra fixa em MG para NFCe que use esse texto no dest)
                 
                 xNomeDest = remover_acentos_texto(self._limpar_texto(c.nome_razao_social, 60)) or "CLIENTE"
                 
                 # Verifica se é Homologação e Modelo 55
                 # self.venda.id_operacao.modelo_documento ou "65"
                 modelo = "65"
                 if self.venda.id_operacao and self.venda.id_operacao.modelo_documento:
                     modelo = str(self.venda.id_operacao.modelo_documento)
                 
                 # Se for NFe (55) em Homologação (2), forçar xNome padrão
                 if modelo == "55" and str(self.empresa.ambiente_nfe or "2") == "2":
                     xNomeDest = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
                     # Truncar severamente para garantir schema (Max 60) e strip
                     xNomeDest = xNomeDest[:60].strip()

                 ET.SubElement(dest, f"{{{self.ns}}}xNome").text = xNomeDest
                 
                 # --- enderDest (Obrigatorio NFe) ---
                 enderDest = ET.SubElement(dest, f"{{{self.ns}}}enderDest")
                 ET.SubElement(enderDest, f"{{{self.ns}}}xLgr").text = remover_acentos(self._limpar_texto(c.endereco, 60)) or "Rua"
                 ET.SubElement(enderDest, f"{{{self.ns}}}nro").text = self._limpar_texto(c.numero, 60) or "SN"
                 
                 # Check if complemento exists (AttributeError fix)
                 comp = getattr(c, 'complemento', None)
                 if comp:
                      ET.SubElement(enderDest, f"{{{self.ns}}}xCpl").text = self._limpar_texto(comp, 60)
                      
                 ET.SubElement(enderDest, f"{{{self.ns}}}xBairro").text = remover_acentos(self._limpar_texto(c.bairro, 60)) or "Centro"
                 
                 # TODO: Melhorar busca de codigo IBGE. Default: Patrocinio-MG
                 ET.SubElement(enderDest, f"{{{self.ns}}}cMun").text = "3148103" 
                 ET.SubElement(enderDest, f"{{{self.ns}}}xMun").text = remover_acentos(self._limpar_texto(c.cidade, 60)) or "PATROCINIO"
                 ET.SubElement(enderDest, f"{{{self.ns}}}UF").text = self._limpar_texto(c.estado, 2) or "MG"
                 ET.SubElement(enderDest, f"{{{self.ns}}}CEP").text = ''.join(filter(str.isdigit, c.cep or '38740000'))
                 ET.SubElement(enderDest, f"{{{self.ns}}}cPais").text = "1058"
                 ET.SubElement(enderDest, f"{{{self.ns}}}xPais").text = "BRASIL"
                 if c.telefone:
                      fone_clean = ''.join(filter(str.isdigit, c.telefone))
                      if fone_clean:
                           ET.SubElement(enderDest, f"{{{self.ns}}}fone").text = fone_clean[:14] # Limit NFe pattern

                 # --- indIEDest e IE ---
                 raw_ie = str(c.inscricao_estadual or '').upper().strip()
                 ie_digits = ''.join(filter(str.isdigit, raw_ie))
                 uf_dest = self._limpar_texto(c.estado, 2) or "MG"
                 
                 if len(doc_cli) > 11: # CNPJ (Pessoa Jurídica)
                     if len(ie_digits) >= 2:
                         ind_ie_dest = "1"
                         ET.SubElement(dest, f"{{{self.ns}}}IE").text = ie_digits
                     elif "ISENTO" in raw_ie and uf_dest != "MG":
                         ind_ie_dest = "2"
                     else:
                         # MG e maioria das SEFAZs rejeitam indIEDest=2 (Rejeicao 805). Para PJ sem IE, usar indIEDest=9
                         ind_ie_dest = "9"
                 else: # CPF (Pessoa Física)
                     if len(ie_digits) >= 2:
                         ind_ie_dest = "1"
                         ET.SubElement(dest, f"{{{self.ns}}}IE").text = ie_digits
                     elif "ISENTO" in raw_ie and uf_dest != "MG":
                         ind_ie_dest = "2"
                     else:
                         ind_ie_dest = "9"
                 ET.SubElement(dest, f"{{{self.ns}}}indIEDest").text = ind_ie_dest

        # --- Totais Accumulators ---
        total_vbc = 0.0
        total_vpis = 0.0
        total_vcofins = 0.0
        total_vicms = 0.0
        total_vprod = 0.0
        
        # Totais ICMS Monofásico (NT 2023.001)
        total_qbc_mono_ret = 0.0
        total_vicms_mono_ret = 0.0
        
        # Totais Reforma Tributária
        total_vbc_reforma = 0.0
        total_vibs = 0.0
        total_vcbs = 0.0
        total_vibs_uf = 0.0
        total_vibs_mun = 0.0

        # --- det (Itens) ---
        # Para vendas de origem HOTEL_PMS, ignorar o item de diária na emissão fiscal.
        # A hospedagem é faturada no financeiro, mas não deve constar no XML da NFC-e/NF-e/NFS-e.
        CODIGOS_NAO_FISCAIS = {'DIARIA_HOTEL'}
        itens_fiscais = [
            item for item in self.venda.itens.all()
            if not (item.id_produto and item.id_produto.codigo_produto in CODIGOS_NAO_FISCAIS)
        ]

        # Recalcula o total fiscal (apenas produtos, sem a diária)
        total_fiscal = sum(float(item.valor_total) for item in itens_fiscais)

        i = 1
        for item in itens_fiscais:
            det = ET.SubElement(infNFe, f"{{{self.ns}}}det", attrib={"nItem": str(i)})
            prod = ET.SubElement(det, f"{{{self.ns}}}prod")
            
            # Carregar tributacao especifica do produto logo no inicio
            tributacao = None
            try:
                if hasattr(item.id_produto, 'tributacao_detalhada'):
                     tributacao = item.id_produto.tributacao_detalhada
            except:
                pass
                
            ET.SubElement(prod, f"{{{self.ns}}}cProd").text = self._limpar_texto(str(item.id_produto.codigo_produto if item.id_produto else item.id_item), 60)
            ET.SubElement(prod, f"{{{self.ns}}}cEAN").text = "SEM GTIN"
            
            # Função auxiliar para remover acentos
            def remover_acentos_produto(texto):
                try:
                    if not texto: return ""
                    import unicodedata
                    return unicodedata.normalize('NFKD', texto).encode('ASCII', 'ignore').decode('ASCII')
                except:
                    return texto
            
            # Descrição do Produto - CRÍTICO: Limpar acentos e caracteres especiais
            descricao_produto = remover_acentos_produto(
                self._limpar_texto(item.id_produto.nome_produto if item.id_produto else "Item", 120)
            )
            
            # REGRA ANTIGA: Em NFCe (65) Homologação, primeiro item mudava nome.
            # REGRA NOVA (Baseada no XML de Exemplo): Em NFe (55), mantém nome real do produto.
            # Vamos aplicar a regra de mudar nome APENAS se for NFCe (65).
            
            modelo_doc = "65"
            if self.venda.id_operacao and self.venda.id_operacao.modelo_documento:
                modelo_doc = str(self.venda.id_operacao.modelo_documento)

            if i == 1 and modelo_doc == "65" and str(self.empresa.ambiente_nfce or "2") == "2":
                descricao_produto = "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
            
            ET.SubElement(prod, f"{{{self.ns}}}xProd").text = descricao_produto
            
            raw_ncm = ''.join(filter(str.isdigit, item.id_produto.ncm or "00000000"))
            # FIX SCHEMA: NCM length must be 8 or 2. If 4, pad with zeros
            if len(raw_ncm) == 4:
                 if raw_ncm == "0703": raw_ncm = "07031019" # Especifico
                 else: raw_ncm = raw_ncm.ljust(8, '0')
            elif len(raw_ncm) < 8 and len(raw_ncm) != 2:
                 raw_ncm = raw_ncm.ljust(8, '0')

            ET.SubElement(prod, f"{{{self.ns}}}NCM").text = raw_ncm
            
            # Obter CFOP do item ou tributação (fallback para 5102)
            cfop_val = "5102"
            if hasattr(item, 'cfop') and item.cfop and item.cfop.strip():
                cfop_val = item.cfop.strip()
            elif tributacao and hasattr(tributacao, 'cfop') and tributacao.cfop and tributacao.cfop.strip():
                cfop_val = tributacao.cfop.strip()
            
            # Ajustar para interestadual se aplicável
            try:
                uf_emitente = self.empresa.estado.strip().upper() if self.empresa and self.empresa.estado else "MG"
                uf_destinatario = uf_emitente
                if self.venda.id_cliente and hasattr(self.venda.id_cliente, 'estado') and self.venda.id_cliente.estado:
                    uf_destinatario = self.venda.id_cliente.estado.strip().upper()
                elif hasattr(self.venda, 'endereco_entrega') and self.venda.endereco_entrega and hasattr(self.venda.endereco_entrega, 'estado') and self.venda.endereco_entrega.estado:
                    uf_destinatario = self.venda.endereco_entrega.estado.strip().upper()
                
                if uf_emitente != uf_destinatario:
                    if cfop_val.startswith('5'):
                        cfop_val = '6' + cfop_val[1:]
                else:
                    if cfop_val.startswith('6'):
                        cfop_val = '5' + cfop_val[1:]
            except Exception as e:
                print(f"Erro ao ajustar CFOP estadual/interestadual: {e}")

            ET.SubElement(prod, f"{{{self.ns}}}CFOP").text = cfop_val
            ET.SubElement(prod, f"{{{self.ns}}}uCom").text = self._limpar_texto(item.id_produto.unidade_medida, 6) or "UN"
            
            # Values come from DB (already mapped correctly in view now)
            q = float(item.quantidade)
            v = float(item.valor_unitario)
            vt = float(item.valor_total)
            
            ET.SubElement(prod, f"{{{self.ns}}}qCom").text = "{:.4f}".format(q)
            ET.SubElement(prod, f"{{{self.ns}}}vUnCom").text = "{:.2f}".format(v)
            ET.SubElement(prod, f"{{{self.ns}}}vProd").text = "{:.2f}".format(vt)
            ET.SubElement(prod, f"{{{self.ns}}}cEANTrib").text = "SEM GTIN"
            ET.SubElement(prod, f"{{{self.ns}}}uTrib").text = self._limpar_texto(item.id_produto.unidade_medida, 6) or "UN"
            ET.SubElement(prod, f"{{{self.ns}}}qTrib").text = "{:.4f}".format(q)
            ET.SubElement(prod, f"{{{self.ns}}}vUnTrib").text = "{:.2f}".format(v)
            ET.SubElement(prod, f"{{{self.ns}}}indTot").text = "1"

            # --- GRUPO VEÍCULO NOVO <veicProd> ---
            # Obrigatório quando a operação tem venda_veiculo_novo=True e o item possui dados cadastrados.
            try:
                _is_op_veiculo = (
                    self.venda.id_operacao and
                    getattr(self.venda.id_operacao, 'venda_veiculo_novo', False)
                )
                if _is_op_veiculo and hasattr(item, 'veiculo_novo'):
                    vn = item.veiculo_novo  # OneToOne reverse accessor
                    veic_prod = ET.SubElement(prod, f"{{{self.ns}}}veicProd")
                    ET.SubElement(veic_prod, f"{{{self.ns}}}tpOp").text    = str(vn.tp_op or '0')
                    ET.SubElement(veic_prod, f"{{{self.ns}}}chassi").text  = str(vn.chassi or '')[:17].upper()
                    ET.SubElement(veic_prod, f"{{{self.ns}}}cCor").text    = str(vn.c_cor or '')[:4]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}xCor").text    = self._limpar_texto(str(vn.x_cor or ''), 40)
                    ET.SubElement(veic_prod, f"{{{self.ns}}}pot").text     = str(vn.pot or '')[:4]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}cilin").text   = str(vn.cilin or '')[:4]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}pesoL").text   = str(vn.peso_l or '')[:9]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}pesoB").text   = str(vn.peso_b or '')[:9]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}nSerie").text  = str(vn.n_serie or '')[:9]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}tpComb").text  = str(vn.tp_comb or '02')[:2]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}nMotor").text  = str(vn.n_motor or '')[:21]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}CMT").text     = str(vn.cmt or '')[:9]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}dist").text    = str(vn.dist or '')[:4]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}anoMod").text  = str(vn.ano_mod or '')
                    ET.SubElement(veic_prod, f"{{{self.ns}}}anoFab").text  = str(vn.ano_fab or '')
                    ET.SubElement(veic_prod, f"{{{self.ns}}}tpPint").text  = str(vn.tp_pint or '1')[:1]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}tpVeic").text  = str(vn.tp_veic or '04')[:2]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}espVeic").text = str(vn.esp_veic or '1')[:1]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}VIN").text     = str(vn.vin or 'N')[:1].upper()
                    ET.SubElement(veic_prod, f"{{{self.ns}}}condVeic").text = str(vn.cond_veic or '1')[:1]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}cMod").text   = str(vn.c_mod or '')[:6]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}cCorDENATRAN").text = str(vn.c_cor_denatran or '')[:2]
                    ET.SubElement(veic_prod, f"{{{self.ns}}}lota").text   = str(vn.lota or '1')
                    ET.SubElement(veic_prod, f"{{{self.ns}}}tpRest").text = str(vn.tp_rest or '0')[:1]
            except Exception as _ev:
                pass  # Se não tiver veiculo_novo cadastrado, ignora silenciosamente

            # --- TENTATIVA DE CARREGAR TRIBUTACAO ESPECIFICA DO PRODUTO ---
            tributacao = None
            try:
                if hasattr(item.id_produto, 'tributacao_detalhada'):
                    tributacao = item.id_produto.tributacao_detalhada
            except Exception:
                pass

            # --- OBTER CST ICMS ANTECIPADAMENTE ---
            cst_icms_val = ""
            if hasattr(item, 'icms_cst_csosn') and item.icms_cst_csosn and str(item.icms_cst_csosn).strip():
                cst_icms_val = str(item.icms_cst_csosn).strip()
            elif tributacao and hasattr(tributacao, 'cst_icms') and tributacao.cst_icms and str(tributacao.cst_icms).strip():
                cst_icms_val = str(tributacao.cst_icms).strip()
            elif tributacao and hasattr(tributacao, 'csosn') and tributacao.csosn and str(tributacao.csosn).strip():
                cst_icms_val = str(tributacao.csosn).strip()

            # --- GRUPO COMBUSTÍVEL <comb> ---
            # Obrigatório para combustíveis/derivados de petróleo com código ANP válido ou CFOP de combustível.
            NCM_ANP_MAP = {
                '27101911': ('120101001', 'GASOLINA AUTOMOTIVA TIPO A COMUM'),
                '27101912': ('120201001', 'GASOLINA AUTOMOTIVA TIPO A PREMIUM'),
                '27101259': ('320102001', 'GASOLINA C COMUM'),
                '27101251': ('320101001', 'GASOLINA A COMUM'),
                '27101921': ('130101001', 'OLEO DIESEL A S50'),
                '27101922': ('130102001', 'OLEO DIESEL A S10'),
                '27101923': ('130202001', 'OLEO DIESEL B S10'),
                '27101931': ('110201001', 'QUEROSENE DE AVIACAO NACIONAL'),
                '27111100': ('210201001', 'GLP - GAS LIQUEFEITO DE PETROLEO'),
                '27111900': ('210203001', 'GLP - GAS LIQUEFEITO DE PETROLEO'),
                '27111910': ('210203001', 'GLP - GAS LIQUEFEITO DE PETROLEO'),
                '27112100': ('210101001', 'GAS NATURAL GÁS'),
            }
            # Verificar código ANP direto no cadastro do produto ou tributação
            anp_code_prod = (
                getattr(tributacao, 'cprod_anp', None) or
                getattr(item.id_produto, 'cprod_anp', None) or
                getattr(item.id_produto, 'anp_code', None) or
                getattr(item.id_produto, 'cod_anp', None)
            )
            anp_desc_prod = (
                getattr(tributacao, 'desc_anp', None) or
                getattr(item.id_produto, 'desc_anp', None) or
                getattr(item.id_produto, 'descricao_anp', None)
            )

            is_cfop_combustivel = any(str(cfop_val).startswith(prefix) for prefix in ['565', '566', '665', '666', '765', '766'])
            is_cst_61 = (cst_icms_val == '61')
            is_ncm_combustivel = raw_ncm.startswith('2710') or raw_ncm.startswith('2711') or raw_ncm in NCM_ANP_MAP

            if anp_code_prod and str(anp_code_prod).strip():
                anp_data = (str(anp_code_prod).strip(), str(anp_desc_prod or 'GLP - GAS LIQUEFEITO DE PETROLEO').strip()[:95])
            elif raw_ncm in NCM_ANP_MAP:
                anp_data = NCM_ANP_MAP[raw_ncm]
            elif is_cfop_combustivel or is_cst_61 or is_ncm_combustivel:
                # Default de emergência para Gás/GLP quando o CFOP/NCM é de combustível mas não tinha ANP cadastrado no produto
                anp_data = ('210203001', 'GLP - GAS LIQUEFEITO DE PETROLEO')
            else:
                anp_data = None

            item_has_comb = False
            if anp_data:
                comb = ET.SubElement(prod, f"{{{self.ns}}}comb")
                ET.SubElement(comb, f"{{{self.ns}}}cProdANP").text = str(anp_data[0]).strip()
                ET.SubElement(comb, f"{{{self.ns}}}descANP").text = str(anp_data[1]).strip()[:95]
                
                is_anp_glp = str(anp_data[0]).strip().startswith('21020') or 'GLP' in str(anp_data[1]).upper()
                if is_anp_glp:
                    pglp_val = float(getattr(tributacao, 'pglp', 100) or 100.0)
                    if pglp_val == 0.0:
                        pglp_val = 100.0
                    ET.SubElement(comb, f"{{{self.ns}}}pGLP").text = "{:.4f}".format(pglp_val)
                    
                    pgnn_val = float(getattr(tributacao, 'pgnn', 0) or 0.0)
                    if pgnn_val > 0:
                        ET.SubElement(comb, f"{{{self.ns}}}pGNn").text = "{:.4f}".format(pgnn_val)
                    
                    pgni_val = float(getattr(tributacao, 'pgni', 0) or 0.0)
                    if pgni_val > 0:
                        ET.SubElement(comb, f"{{{self.ns}}}pGNi").text = "{:.4f}".format(pgni_val)
                    
                    vpart_val = float(getattr(tributacao, 'vpart', 0) or 0.0)
                    if vpart_val > 0:
                        ET.SubElement(comb, f"{{{self.ns}}}vPart").text = "{:.2f}".format(vpart_val)
                
                uf_cons = self._limpar_texto(self.empresa.estado, 2) or "MG"
                ET.SubElement(comb, f"{{{self.ns}}}UFCons").text = uf_cons[:2].upper()
                
                # Adiciona origComb conforme NT 2023.001 para GLP
                if is_anp_glp:
                    origens = [
                        {"indImport": "0", "cUFOrig": "32", "pOrig": "0.0002"},
                        {"indImport": "0", "cUFOrig": "33", "pOrig": "36.8902"},
                        {"indImport": "0", "cUFOrig": "35", "pOrig": "63.1096"},
                        {"indImport": "1", "cUFOrig": "26", "pOrig": "35.8485"},
                        {"indImport": "1", "cUFOrig": "33", "pOrig": "0.0002"},
                        {"indImport": "1", "cUFOrig": "43", "pOrig": "60.7091"},
                        {"indImport": "1", "cUFOrig": "35", "pOrig": "3.4422"},
                    ]
                    for orig in origens:
                        orig_elem = ET.SubElement(comb, f"{{{self.ns}}}origComb")
                        ET.SubElement(orig_elem, f"{{{self.ns}}}indImport").text = orig["indImport"]
                        ET.SubElement(orig_elem, f"{{{self.ns}}}cUFOrig").text = orig["cUFOrig"]
                        ET.SubElement(orig_elem, f"{{{self.ns}}}pOrig").text = orig["pOrig"]
                        
                item_has_comb = True
            
            # [MODIFICADO] Lógica de Recálculo Automático (Normal e Simples)
            # Se não tiver tributação OU se tiver mas IBS/CBS estiverem zerados (0.00), forçar cálculo
            # Isso corrige produtos antigos que não receberam atualização de cadastro
            
            precisa_calcular = False
            if not tributacao:
                precisa_calcular = True
            else:
                 # Se tem tributacao, verifica se tem campos preenchidos
                 ibs = getattr(tributacao, 'ibs_aliquota', 0.0)
                 cbs = getattr(tributacao, 'cbs_aliquota', 0.0)
                 cst_ibs = getattr(tributacao, 'cst_ibs_cbs', '')
                 
                 # [ATUALIZADO] Se zerado, tenta obter do NCM
                 # MAS se tiver CST definido (ex: 410 Monofásico), respeita e não recalcula tudo
                 # CST 000 é considerado "não definido" porque é apenas placeholder
                 has_cst_defined = cst_ibs and cst_ibs.strip() != '' and cst_ibs.strip() != '000'
                 
                 # [MODIFICADO] Recalcula se alíquotas zeradas, mesmo com CST='000' (placeholder inválido)
                 if (float(ibs) == 0.0 and float(cbs) == 0.0) and not has_cst_defined:
                     precisa_calcular = True

            if precisa_calcular:
                try:
                    from api.services.reforma_tax_service import ReformaTaxService
                    svc = ReformaTaxService()
                    ncm_prod = item.id_produto.ncm
                    if ncm_prod:
                         res_calc = svc.calcular_aliquotas(ncm_prod)
                         if res_calc:
                             if not tributacao:
                                 class MockTrib: pass
                                 tributacao = MockTrib()
                                 # Preencher defaults que faltam
                                 tributacao.icms_aliquota = 18.0
                                 tributacao.pis_aliquota = 1.65
                                 tributacao.cofins_aliquota = 7.60
                                 tributacao.cst_pis_cofins = "07"
                                 
                                 # Se Normal, default 00. Se Simples, default 102.
                                 is_normal_regime = hasattr(self.empresa, 'regime_tributario') and str(self.empresa.regime_tributario) in ['NORMAL', 'LUCRO_PRESUMIDO', '3']
                                 tributacao.cst_icms = "00" if is_normal_regime else "102"
                             
                             # Preenche campos reforma
                             tributacao.cst_ibs_cbs = str(res_calc.get('cst_ibs_cbs', '001'))
                             tributacao.ibs_aliquota = float(res_calc.get('ibs_aliquota', 0.0))
                             tributacao.cbs_aliquota = float(res_calc.get('cbs_aliquota', 0.0))
                             tributacao.classificacao_fiscal = str(res_calc.get('cClassTrib', ''))
                             
                             # Ajusta PIS/COFINS e ICMS baseado na reforma se necessário (Tributado vs Isento)
                             if tributacao.cst_ibs_cbs in ['001', '002']:
                                 if not tributacao.cst_pis_cofins: tributacao.cst_pis_cofins = "01"
                except ImportError:
                    pass
                except Exception as e:
                    print(f"Erro calculo automatico tax builder: {e}")

            # Classificação (Adiciona ao xProd ou infAdProd se existir)
            classificacao_texto = ""
            if tributacao and tributacao.classificacao_fiscal:
                 classificacao_texto = tributacao.classificacao_fiscal
            elif item.id_produto.classificacao:
                 classificacao_texto = item.id_produto.classificacao
                 
            # Impostos group
            imposto = ET.SubElement(det, f"{{{self.ns}}}imposto")
            
            # --- ICMS ---
            icms = ET.SubElement(imposto, f"{{{self.ns}}}ICMS")
            
            # Simplificação: Se tiver tributação definida, tenta usar. Se não, fallback Simples 102.
            # LÓGICA DE ICMS (CST vs CSOSN)
            # Verifica o Regime da Empresa (CRT) e Regime Tributário
            
            crt_raw = getattr(self.empresa, 'crt', '1')
            regime_trib = getattr(self.empresa, 'regime_tributario', '')
            
            # SE REGIME FOR SIMPLES, FORÇA CRT 1 (Prioridade User Feedback)
            if str(regime_trib).upper() == 'SIMPLES':
                crt_raw = '1'

            # Se regime_tributario for NORMAL, força CRT 3 para lógica interna, mesmo que campo esteja 1
            elif str(regime_trib).upper() in ['NORMAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']:
                crt_raw = '3'
                
            is_simples = str(crt_raw) in ['1', '2']
            
            # DEBUG
            # print(f"DEBUG BUILDER ICMS: CRT={crt_raw}, Regime={regime_trib}, IsSimples={is_simples}")
            
            csosn_val = "102"
            cst_icms_val = "00"

            # 1. Tentar ler do item (venda_itens) primeiro, depois da tributação do produto
            cst_raw = ""
            if hasattr(item, 'icms_cst_csosn') and item.icms_cst_csosn and item.icms_cst_csosn.strip():
                cst_raw = item.icms_cst_csosn.strip()
            elif tributacao and hasattr(tributacao, 'cst_icms') and tributacao.cst_icms and tributacao.cst_icms.strip():
                cst_raw = tributacao.cst_icms.strip()
            elif tributacao and hasattr(tributacao, 'csosn') and tributacao.csosn and tributacao.csosn.strip():
                cst_raw = tributacao.csosn.strip()

            if is_simples:
                if cst_raw:
                    # Se for de 2 dígitos, pode ser CST que precisa virar CSOSN equivalente
                    if len(cst_raw) == 2 and cst_raw.isdigit():
                        if cst_raw in ['00', '20', '90']: csosn_val = "102"
                        elif cst_raw in ['40', '41', '50']: csosn_val = "400"
                        elif cst_raw in ['60', '61']: csosn_val = "500"
                        else: csosn_val = "102"
                    else:
                        csosn_val = cst_raw
                # Forçar CSOSN 500 se o CFOP for ST ou combustível em Simples Nacional
                is_cfop_fuel = any(str(cfop_val).startswith(p) for p in ['565', '566', '665', '666', '765', '766'])
                if cfop_val in ['5405', '6405'] or is_cfop_fuel:
                    csosn_val = "500"
            else:
                if cst_raw:
                    # Se for de 3 dígitos (CSOSN), converter para CST 2 dígitos
                    if len(cst_raw) == 3 and cst_raw.isdigit():
                        if cst_raw in ['101', '102']: cst_icms_val = "00"
                        elif cst_raw in ['103', '300', '400']: cst_icms_val = "41"
                        elif cst_raw in ['201', '202', '203']: cst_icms_val = "60"
                        elif cst_raw in ['500']: cst_icms_val = "60"
                        elif cst_raw in ['900']: cst_icms_val = "90"
                        else: cst_icms_val = "00"
                    else:
                        cst_icms_val = cst_raw.zfill(2)
                # Forçar CST 60 se o CFOP for ST
                if cfop_val in ['5405', '6405']:
                    cst_icms_val = "60"

            # Definir se o CST/regime do item é combustível
            cst_ibs_cbs_val = ""
            if tributacao and hasattr(tributacao, 'cst_ibs_cbs') and tributacao.cst_ibs_cbs:
                cst_ibs_cbs_val = tributacao.cst_ibs_cbs.strip()
            
            is_cst_combustivel = (
                (cst_ibs_cbs_val and cst_ibs_cbs_val.startswith('6')) or 
                cst_icms_val in ['61', '60', '500'] or 
                item_has_comb or 
                is_cfop_combustivel
            )

            if item_has_comb or cst_icms_val in ['61', '60'] or is_cst_combustivel:
                # SEFAZ NT 2023.001 / Rejeição 960: Para combustíveis/GLP (tag comb),
                # a SEFAZ exige o grupo ICMS61 obrigatoriamente (mesmo em Simples Nacional)
                icms61 = ET.SubElement(icms, f"{{{self.ns}}}ICMS61")
                ET.SubElement(icms61, f"{{{self.ns}}}orig").text = "0"
                ET.SubElement(icms61, f"{{{self.ns}}}CST").text = "61"
                
                ad_rem = float(getattr(tributacao, 'ad_rem_icms_ret', 0) or 0.0)
                q_bc = float(item.quantidade) if ad_rem > 0 else 0.0
                v_mono = q_bc * ad_rem if ad_rem > 0 else 0.0
                
                total_qbc_mono_ret += q_bc
                total_vicms_mono_ret += v_mono
                
                ET.SubElement(icms61, f"{{{self.ns}}}qBCMonoRet").text = "{:.4f}".format(q_bc)
                ET.SubElement(icms61, f"{{{self.ns}}}adRemICMSRet").text = "{:.4f}".format(ad_rem)
                ET.SubElement(icms61, f"{{{self.ns}}}vICMSMonoRet").text = "{:.2f}".format(v_mono)
            elif is_simples:
                # LÓGICA PARA SIMPLES NACIONAL (mantida)
                if len(csosn_val) == 3 or csosn_val in ['101','102','103','201','202','203','300','400','500','900']:
                    # Cria a tag correta baseada no CSOSN
                    tag_name = f"ICMSSN{csosn_val}"
                    # Fallback para tags suportadas
                    if csosn_val not in ['101','102','201','202','500','900']:
                        tag_name = "ICMSSN102"
                    
                    icmsSn = ET.SubElement(icms, f"{{{self.ns}}}{tag_name}")
                    
                    if csosn_val == "500":
                          ET.SubElement(icmsSn, f"{{{self.ns}}}orig").text = "0"
                          ET.SubElement(icmsSn, f"{{{self.ns}}}CSOSN").text = "500"
                          ET.SubElement(icmsSn, f"{{{self.ns}}}vBCSTRet").text = "0.00"
                          ET.SubElement(icmsSn, f"{{{self.ns}}}pST").text = "0.00"
                          ET.SubElement(icmsSn, f"{{{self.ns}}}vICMSSTRet").text = "0.00"
                    else:
                          ET.SubElement(icmsSn, f"{{{self.ns}}}orig").text = "0"
                          final_csosn = csosn_val
                          # Validação para garantir que o CSOSN corresponda à tag (se tag for 101, csosn deve ser 101)
                          # Permitir todos os CSOSN válidos mapeados
                          if csosn_val not in ['101', '102', '103', '201', '202', '203', '300', '400', '500', '900']: 
                               final_csosn = "102" 
                          
                          # Se tagname for ICMSSN102 mas csosn for outro (incompativel), força 102
                          # Mas como tag_name suporta 101, 201 etc, devemos respeitar o csosn_val
                          
                          ET.SubElement(icmsSn, f"{{{self.ns}}}CSOSN").text = final_csosn
                          
                          # Se for 101 ou 201, precisa de pCredSN e vCredICMSSN
                          if csosn_val in ['101', '201']:
                               # Implementar campos de credito se disponivel
                               aliq_cred = float(self.empresa.aliquota_credito_icms or 0.0)
                               val_cred = vt * (aliq_cred / 100)
                               ET.SubElement(icmsSn, f"{{{self.ns}}}pCredSN").text = "{:.2f}".format(aliq_cred)
                               ET.SubElement(icmsSn, f"{{{self.ns}}}vCredICMSSN").text = "{:.2f}".format(val_cred)

                          # Se for 201, 202, 203, 900 -> Pode precisar de ST (MVA etc)
                          # Por enquanto, mantendo simples (sem MVA) ou zerado se não tiver dados
                          if csosn_val in ['201', '202', '203', '900']:
                               ET.SubElement(icmsSn, f"{{{self.ns}}}modBCST").text = "4" # Margem Valor Agregado (simulado)
                               ET.SubElement(icmsSn, f"{{{self.ns}}}vBCST").text = "0.00"
                               ET.SubElement(icmsSn, f"{{{self.ns}}}pICMSST").text = "0.00"
                               ET.SubElement(icmsSn, f"{{{self.ns}}}vICMSST").text = "0.00"
                               if csosn_val in ['201']: # 201 tambem tem ST
                                    ET.SubElement(icmsSn, f"{{{self.ns}}}pMVAST").text = "0.00"
                                    ET.SubElement(icmsSn, f"{{{self.ns}}}pRedBCST").text = "0.00"
                else:
                    # Se caiu aqui, é Simples mas está com CST de 2 digitos? Forçar CSOSN 102
                    icmsSn = ET.SubElement(icms, f"{{{self.ns}}}ICMSSN102")
                    ET.SubElement(icmsSn, f"{{{self.ns}}}orig").text = "0"
                    ET.SubElement(icmsSn, f"{{{self.ns}}}CSOSN").text = "102"
            else:
                 # LÓGICA PARA REGIME NORMAL (CST)
                 # Usar cst_icms_val calculado acima
                 
                 # Implementar switch básico de CSTs comuns
                 # CST 00: Tributada integralmente
                 # CST 60: Cobrada anteriormente por ST
                 # CST 41: Não tributada
                 
                 tag_cst = f"ICMS{cst_icms_val}"
                 if cst_icms_val == '00':
                     icms00 = ET.SubElement(icms, f"{{{self.ns}}}ICMS00")
                     ET.SubElement(icms00, f"{{{self.ns}}}orig").text = "0"
                     ET.SubElement(icms00, f"{{{self.ns}}}CST").text = "00"
                     ET.SubElement(icms00, f"{{{self.ns}}}modBC").text = "3"
                     ET.SubElement(icms00, f"{{{self.ns}}}vBC").text = "{:.2f}".format(vt)
                     
                     aliq_icms_00 = float(tributacao.icms_aliquota) if tributacao else 18.0
                     val_icms_00 = vt * (aliq_icms_00/100)
                     ET.SubElement(icms00, f"{{{self.ns}}}pICMS").text = "{:.2f}".format(aliq_icms_00)
                     ET.SubElement(icms00, f"{{{self.ns}}}vICMS").text = "{:.2f}".format(val_icms_00)
                     
                     total_vbc += vt
                     total_vicms += val_icms_00
                 elif cst_icms_val == '60':
                     icms60 = ET.SubElement(icms, f"{{{self.ns}}}ICMS60")
                     ET.SubElement(icms60, f"{{{self.ns}}}orig").text = "0"
                     ET.SubElement(icms60, f"{{{self.ns}}}CST").text = "60"
                     # ST retido anteriormente, nao destaca BC nem ICMS proprio, mas pode ter retido
                     # Campos obrigatórios se preenchidos no cadastro, senao zerado ou omitido se schemas permitirem
                     ET.SubElement(icms60, f"{{{self.ns}}}vBCSTRet").text = "0.00"
                     ET.SubElement(icms60, f"{{{self.ns}}}pST").text = "0.00"
                     ET.SubElement(icms60, f"{{{self.ns}}}vICMSSTRet").text = "0.00"
                 elif cst_icms_val == '61':
                      icms61 = ET.SubElement(icms, f"{{{self.ns}}}ICMS61")
                      ET.SubElement(icms61, f"{{{self.ns}}}orig").text = "0"
                      ET.SubElement(icms61, f"{{{self.ns}}}CST").text = "61"
                      q_bc_mono = float(getattr(item, 'quantidade', 0) or 0)
                      ad_rem = float(getattr(tributacao, 'ad_rem_icms_ret', 0) if tributacao else 0)
                      v_icms_mono = q_bc_mono * ad_rem
                      
                      total_qbc_mono_ret += q_bc_mono
                      total_vicms_mono_ret += v_icms_mono
                      
                      ET.SubElement(icms61, f"{{{self.ns}}}qBCMonoRet").text = "{:.4f}".format(q_bc_mono)
                      ET.SubElement(icms61, f"{{{self.ns}}}adRemICMSRet").text = "{:.4f}".format(ad_rem)
                      ET.SubElement(icms61, f"{{{self.ns}}}vICMSMonoRet").text = "{:.2f}".format(v_icms_mono)
                 elif cst_icms_val in ['40', '41', '50']: # Isento, Não Trib, Suspensão
                     icms40 = ET.SubElement(icms, f"{{{self.ns}}}ICMS40")
                     ET.SubElement(icms40, f"{{{self.ns}}}orig").text = "0"
                     ET.SubElement(icms40, f"{{{self.ns}}}CST").text = cst_icms_val
                 else:
                     # Fallback para ICMS90 (Outros) se CST não mapeado
                     icms90 = ET.SubElement(icms, f"{{{self.ns}}}ICMS90")
                     ET.SubElement(icms90, f"{{{self.ns}}}orig").text = "0"
                     ET.SubElement(icms90, f"{{{self.ns}}}CST").text = "90"
                     # ICMS90 pode ter ICMS proprio ou nao. Vamos assumir tributado se tiver aliquota > 0
                     aliq = float(tributacao.icms_aliquota) if tributacao else 0.0
                     if aliq > 0:
                         val_icms_90 = vt * (aliq/100)
                         ET.SubElement(icms90, f"{{{self.ns}}}modBC").text = "3"
                         ET.SubElement(icms90, f"{{{self.ns}}}vBC").text = "{:.2f}".format(vt)
                         ET.SubElement(icms90, f"{{{self.ns}}}pICMS").text = "{:.2f}".format(aliq)
                         ET.SubElement(icms90, f"{{{self.ns}}}vICMS").text = "{:.2f}".format(val_icms_90)
                         
                         total_vbc += vt
                         total_vicms += val_icms_90
                     else:

                         ET.SubElement(icms90, f"{{{self.ns}}}modBC").text = "3"
                         ET.SubElement(icms90, f"{{{self.ns}}}vBC").text = "0.00"
                         ET.SubElement(icms90, f"{{{self.ns}}}pICMS").text = "0.00"
                         ET.SubElement(icms90, f"{{{self.ns}}}vICMS").text = "0.00"

            # --- PIS ---
            # Verifica regime: Default Simples if not explicit (CRT 1)
            # Default to '1' if None or missing
            
            # Reutiliza lógica de CRT ajustada acima
            crt_val = str(crt_raw) 
            
            # Considera Simples apenas se for 1. Se for 2 (Excesso Sublimite) ou 3 (Normal), comporta-se como Normal para fins de tag
            is_simples_pis = (crt_val == '1') 
            
            cst_pis_val = "07"
            if tributacao and tributacao.cst_pis_cofins:
                 val_sanitize = tributacao.cst_pis_cofins.strip()
                 
                 # Sanitize: Se vier CST de Reforma (3 digitos), tenta mapear para PIS (2 digitos)
                 if len(val_sanitize) > 2:
                      if val_sanitize in ['000', '001', '002']: val_sanitize = '01'
                      elif val_sanitize in ['410', '401', '402']: val_sanitize = '04'
                      elif val_sanitize in ['006']: val_sanitize = '06'
                      elif val_sanitize in ['060', '040', '050', '60']: val_sanitize = '07'
                      else: val_sanitize = '99'
                 
                 cst_pis_val = val_sanitize.zfill(2)
            
            # Se for Regime Normal mas estiver com CST de Simples (99 ou vazio), tentar corrigir para Tributado ou Isento
            if not is_simples_pis and cst_pis_val in ['99', '']:
                 # Se ICMS for tributado (00), sugere PIS 01
                 if cst_icms_val == '00':
                     cst_pis_val = "01"
                 # Se ICMS for isento ou ST (40, 41, 60), sugere PIS 07 (Isento)
                 elif cst_icms_val in ['40', '41', '60']:
                     cst_pis_val = "07"

            if is_simples_pis:
                 if cst_pis_val in ['01', '02']:
                     cst_pis_val = "99" # Simples usa 99 ou 49

            if cst_pis_val == "00": cst_pis_val = "01"
            
            pis = ET.SubElement(imposto, f"{{{self.ns}}}PIS")
            
            val_pis_item = 0.0
            # Se for Regime Normal e PIS 01/02, calcula
            if cst_pis_val in ['01', '02'] and not is_simples_pis:
                 pisTrib = ET.SubElement(pis, f"{{{self.ns}}}PISAliq")
                 ET.SubElement(pisTrib, f"{{{self.ns}}}CST").text = cst_pis_val
                 ET.SubElement(pisTrib, f"{{{self.ns}}}vBC").text = "{:.2f}".format(vt)
                 aliq_pis = float(tributacao.pis_aliquota) if tributacao else 1.65
                 # Se veio 0.00 mas é CST 01/02 em Regime Normal, força 1.65% de default
                 if aliq_pis <= 0.001: aliq_pis = 1.65
                 
                 val_pis_item = vt * aliq_pis / 100
                 ET.SubElement(pisTrib, f"{{{self.ns}}}pPIS").text = "{:.2f}".format(aliq_pis)
                 ET.SubElement(pisTrib, f"{{{self.ns}}}vPIS").text = "{:.2f}".format(val_pis_item)
            elif cst_pis_val == '06':
                 # CST 06 = Operação Tributável a Alíquota Zero
                 # Usa PISAliq com base, alíquota e valor zerados
                 pisAliqZero = ET.SubElement(pis, f"{{{self.ns}}}PISAliq")
                 ET.SubElement(pisAliqZero, f"{{{self.ns}}}CST").text = "06"
                 ET.SubElement(pisAliqZero, f"{{{self.ns}}}vBC").text = "{:.2f}".format(vt)
                 ET.SubElement(pisAliqZero, f"{{{self.ns}}}pPIS").text = "0.00"
                 ET.SubElement(pisAliqZero, f"{{{self.ns}}}vPIS").text = "0.00"
            else:
                 val_pis_item = 0.0
                 if cst_pis_val in ['04', '05', '07', '08', '09']:
                     pisNt = ET.SubElement(pis, f"{{{self.ns}}}PISNT")
                     ET.SubElement(pisNt, f"{{{self.ns}}}CST").text = cst_pis_val
                 else:
                     pisOutr = ET.SubElement(pis, f"{{{self.ns}}}PISOutr")
                     ET.SubElement(pisOutr, f"{{{self.ns}}}CST").text = cst_pis_val
                     ET.SubElement(pisOutr, f"{{{self.ns}}}vBC").text = "0.00"
                     ET.SubElement(pisOutr, f"{{{self.ns}}}pPIS").text = "0.00"
                     ET.SubElement(pisOutr, f"{{{self.ns}}}vPIS").text = "0.00"
            
            total_vpis += val_pis_item


            # --- COFINS ---
            cst_cofins_val = cst_pis_val # Usually same
            
            # Override for Simples just in case
            if is_simples_pis and cst_cofins_val in ['01', '02']:
                 cst_cofins_val = "99"

            cofins = ET.SubElement(imposto, f"{{{self.ns}}}COFINS")
            
            val_cofins_item = 0.0
            if cst_cofins_val in ['01', '02'] and not is_simples_pis:
                 cofinsTrib = ET.SubElement(cofins, f"{{{self.ns}}}COFINSAliq")
                 ET.SubElement(cofinsTrib, f"{{{self.ns}}}CST").text = cst_cofins_val
                 ET.SubElement(cofinsTrib, f"{{{self.ns}}}vBC").text = "{:.2f}".format(vt)

                 aliq_cofins = float(tributacao.cofins_aliquota) if tributacao else 7.60
                 # Se veio 0.00 mas é CST 01/02 em Regime Normal, força 7.60% de default
                 if aliq_cofins <= 0.001: aliq_cofins = 7.60
                 
                 val_cofins_item = vt * aliq_cofins / 100
                 ET.SubElement(cofinsTrib, f"{{{self.ns}}}pCOFINS").text = "{:.2f}".format(aliq_cofins)
                 ET.SubElement(cofinsTrib, f"{{{self.ns}}}vCOFINS").text = "{:.2f}".format(val_cofins_item)
            elif cst_cofins_val == '06':
                 # CST 06 = Operação Tributável a Alíquota Zero
                 # Usa COFINSAliq com base, alíquota e valor zerados
                 cofinsAliqZero = ET.SubElement(cofins, f"{{{self.ns}}}COFINSAliq")
                 ET.SubElement(cofinsAliqZero, f"{{{self.ns}}}CST").text = "06"
                 ET.SubElement(cofinsAliqZero, f"{{{self.ns}}}vBC").text = "{:.2f}".format(vt)
                 ET.SubElement(cofinsAliqZero, f"{{{self.ns}}}pCOFINS").text = "0.00"
                 ET.SubElement(cofinsAliqZero, f"{{{self.ns}}}vCOFINS").text = "0.00"
            else:
                 val_cofins_item = 0.0
                 if cst_cofins_val in ['04', '05', '07', '08', '09']:
                     cofinsNt = ET.SubElement(cofins, f"{{{self.ns}}}COFINSNT")
                     ET.SubElement(cofinsNt, f"{{{self.ns}}}CST").text = cst_cofins_val
                 else:
                     cofinsOutr = ET.SubElement(cofins, f"{{{self.ns}}}COFINSOutr")
                     ET.SubElement(cofinsOutr, f"{{{self.ns}}}CST").text = cst_cofins_val
                     ET.SubElement(cofinsOutr, f"{{{self.ns}}}vBC").text = "0.00"
                     ET.SubElement(cofinsOutr, f"{{{self.ns}}}pCOFINS").text = "0.00"
                     ET.SubElement(cofinsOutr, f"{{{self.ns}}}vCOFINS").text = "0.00"
            
            total_vcofins += val_cofins_item


            # --- REFORMA TRIBUTÁRIA (IBS / CBS) ---
            # Implementação conforme NT 2025.002 - Grupo gIBSCBS
            # Estrutura simplificada para compatibilidade
            # Verifica se tributacao_detalhada tem campos de IBS/CBS
            has_reform_fields = hasattr(tributacao, 'ibs_aliquota') or hasattr(tributacao, 'cbs_aliquota') or hasattr(tributacao, 'cst_ibs_cbs')
            
            if tributacao:
                # DEBUG: Forçar para testar se cai no IF
                # print(f"DEBUG BUILDER: Item {i}, HasTrib={bool(tributacao)}, HasReform={has_reform_fields}")
                pass
            
            # REFORMA TRIBUTÁRIA: 
            # Anteriormente restrito a NFe (55).
            # [MODIFICADO] Permitir para NFCe (65) e verificar validade dos valores (Recalcula se zero)
            
            is_regime_normal = False
            # Check explicit field
            if hasattr(self.empresa, 'regime_tributario') and self.empresa.regime_tributario:
                 r = str(self.empresa.regime_tributario).upper()
                 if r in ['NORMAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', '3']:
                     is_regime_normal = True
            
            # Check CRT (Most reliable as it is used in XML)
            crt_raw = getattr(self.empresa, 'crt', None)
            if crt_raw and str(crt_raw) == '3':
                is_regime_normal = True

            # DEBBUG FORCE
            # print(f"DEBUG: CRT={crt_raw} Regime={getattr(self.empresa, 'regime_tributario', 'N/A')} is_normal={is_regime_normal}")
            
            # REFORMA TRIBUTÁRIA: IBSCBS desativado para o Schema NFe 4.00 oficial (produção)
            # A SEFAZ 4.00 rejeita o XML com Rejeição 225 se contiver tags de reforma não ativadas no WebService
            should_generate_reform = False
            
            has_reform_fields = True
            
            if should_generate_reform:
                    # DEBUG LOG REMOVED TO PREVENT CRASH



                    
                    # CST (001: Tributado Integral, 410: Monofásico, 006: Isento)
                    # Mapeamento para tag <CST> e estrutura conforme NT 2025.002
                    # Estrutura: <IBSCBS> -> <CST>, <cClassTrib>, <gIBSCBS>
                    # <gIBSCBS> -> <vBC>, <gIBSUF>, <gIBSMun>, <vIBS>, <gCBS>
                    
                    # DESATIVADO TEMPORARIAMENTE: A tag <IBSCBS> ainda não é válida no Schema NFe 4.00 oficial (produção)
                    # porem o usuario SOLICITOU explicitamente CST IBS 410 e classificacao 410020
                    # Entao vamos REATIVAR para atender a solicitacao, assumindo ambiente habilitado.
                    
                    
                    # ESTA E A LOGICA QUE ESTAVA SOBREPONDO OS VALORES
                    # VAMOS SIMPLIFICAR E USAR DIRETAMENTE O QUE ESTA NO BANCO DE DADOS
                    
                    cst_val = "000" 
                    if tributacao and hasattr(tributacao, 'cst_ibs_cbs') and tributacao.cst_ibs_cbs:
                         cst_val = tributacao.cst_ibs_cbs.strip()

                    if (cst_icms_val in ['61', '60', '500'] or item_has_comb or is_cfop_combustivel) and (not cst_val or cst_val in ['000', '001', '']):
                         cst_val = "620"

                    is_cst_combustivel = cst_val.startswith('6') or cst_icms_val in ['61', '60', '500'] or item_has_comb or is_cfop_combustivel

                    # Parent Tag: <IBSCBS>
                    ibs_cbs_group = ET.SubElement(imposto, f"{{{self.ns}}}IBSCBS")

                    # 1. <CST>
                    ET.SubElement(ibs_cbs_group, f"{{{self.ns}}}CST").text = cst_val

                    # 2. <cClassTrib>
                    if cst_val == '620' or cst_icms_val in ['61', '60', '500'] or item_has_comb or is_cfop_combustivel:
                        c_class_trib = "620006"
                    elif cst_val == '410':
                        c_class_trib = "410008"
                    else:
                        c_class_trib = "000001"

                    if tributacao and hasattr(tributacao, 'classificacao_fiscal') and tributacao.classificacao_fiscal:
                         c_clean = ''.join(filter(str.isdigit, tributacao.classificacao_fiscal))
                         if c_clean and c_clean not in ['000001', '0']:
                             c_class_trib = c_clean
                    
                    # Garantir 6 digitos
                    ET.SubElement(ibs_cbs_group, f"{{{self.ns}}}cClassTrib").text = c_class_trib.zfill(6)

                    # 3. Grupo de valores: <gIBSCBS> (estrutura padrão para todos os CSTs com valor)
                    # Para CSTs sem valor a recolher (imunidade, suspensão, monofásico, ajustes), omitir gIBSCBS
                    CST_SEM_VALOR = {'410', '620', '550', '800', '810', '811', '830'}
                    
                    if cst_val not in CST_SEM_VALOR:
                         # Truncação (floor) para 2 casas decimais — SEFAZ não aceita arredondamento
                         def _trunc2(v):
                             return math.floor(v * 100) / 100

                         p_ibs = float(tributacao.ibs_aliquota) if hasattr(tributacao, 'ibs_aliquota') and tributacao.ibs_aliquota else 0.1
                         p_cbs = float(tributacao.cbs_aliquota) if hasattr(tributacao, 'cbs_aliquota') and tributacao.cbs_aliquota else 0.9
                         p_ibs_mun = 0.0
                         
                         # Detecção de redução da Reforma
                         p_ibs_nominal = p_ibs
                         p_cbs_nominal = p_cbs
                         p_ibs_mun_nominal = p_ibs_mun
                         p_red_ibs = 0.0
                         p_red_cbs = 0.0
                         p_red_ibs_mun = 0.0
                         
                         try:
                             from api.services.reforma_tax_service import ReformaTaxService
                             svc = ReformaTaxService()
                             
                             # Obter cClassTrib formatado do item/produto
                             c_class_trib_clean = "000001"
                             if tributacao and hasattr(tributacao, 'classificacao_fiscal') and tributacao.classificacao_fiscal:
                                 c_clean = ''.join(filter(str.isdigit, tributacao.classificacao_fiscal))
                                 if c_clean:
                                     c_class_trib_clean = c_clean
                                     
                             reducoes_db = svc._get_reducoes_db(c_class_trib_clean)
                             if reducoes_db:
                                 p_red_ibs = float(reducoes_db.get(3, 0.0))
                                 p_red_cbs = float(reducoes_db.get(2, 0.0))
                                 p_red_ibs_mun = float(reducoes_db.get(4, 0.0))
                                 
                                 # Se houver redução de IBS
                                 if p_red_ibs > 0:
                                     aliq_ref = svc._get_aliquotas_referencia()
                                     p_ibs_nominal = float(aliq_ref.get(3, 0.1))
                                     # Força a alíquota efetiva a ser a nominal reduzida
                                     p_ibs = p_ibs_nominal * (1.0 - p_red_ibs / 100.0)
                                     
                                 # Se houver redução de IBS Municipal
                                 if p_red_ibs_mun > 0:
                                     aliq_ref = svc._get_aliquotas_referencia()
                                     p_ibs_mun_nominal = float(aliq_ref.get(4, 0.0))
                                     p_ibs_mun = p_ibs_mun_nominal * (1.0 - p_red_ibs_mun / 100.0)
                                     
                                 # Se houver redução de CBS
                                 if p_red_cbs > 0:
                                     aliq_ref = svc._get_aliquotas_referencia()
                                     p_cbs_nominal = float(aliq_ref.get(2, 0.9))
                                     # Força a alíquota efetiva a ser a nominal reduzida
                                     p_cbs = p_cbs_nominal * (1.0 - p_red_cbs / 100.0)
                         except Exception as e:
                             print(f"Erro ao obter informacoes de reducao da Reforma no builder: {e}")

                         vbc_trib = vt
                         p_ibs_uf = p_ibs
                         v_ibs_uf = _trunc2(vbc_trib * p_ibs_uf / 100)
                         v_ibs_mun = _trunc2(vbc_trib * p_ibs_mun / 100)
                         v_ibs_total = _trunc2(v_ibs_uf + v_ibs_mun)
                         v_cbs = _trunc2(vbc_trib * p_cbs / 100)

                         # Tributação geral (ad valorem): usa <gIBSCBS> para todos os CSTs com valor
                         g_ibs_cbs = ET.SubElement(ibs_cbs_group, f"{{{self.ns}}}gIBSCBS")

                         # <vBC> (Base de Cálculo)
                         ET.SubElement(g_ibs_cbs, f"{{{self.ns}}}vBC").text = "{:.2f}".format(vbc_trib)
                         
                         # <gIBSUF>
                         g_ibs_uf = ET.SubElement(g_ibs_cbs, f"{{{self.ns}}}gIBSUF")
                         ET.SubElement(g_ibs_uf, f"{{{self.ns}}}pIBSUF").text = "{:.4f}".format(p_ibs_nominal)
                         if p_red_ibs > 0:
                             g_red = ET.SubElement(g_ibs_uf, f"{{{self.ns}}}gRed")
                             ET.SubElement(g_red, f"{{{self.ns}}}pRedAliq").text = "{:.4f}".format(p_red_ibs)
                             ET.SubElement(g_red, f"{{{self.ns}}}pAliqEfet").text = "{:.4f}".format(p_ibs)
                         ET.SubElement(g_ibs_uf, f"{{{self.ns}}}vIBSUF").text = "{:.2f}".format(v_ibs_uf)

                         # <gIBSMun>
                         g_ibs_mun = ET.SubElement(g_ibs_cbs, f"{{{self.ns}}}gIBSMun")
                         ET.SubElement(g_ibs_mun, f"{{{self.ns}}}pIBSMun").text = "{:.4f}".format(p_ibs_mun_nominal)
                         if p_red_ibs_mun > 0:
                             g_red = ET.SubElement(g_ibs_mun, f"{{{self.ns}}}gRed")
                             ET.SubElement(g_red, f"{{{self.ns}}}pRedAliq").text = "{:.4f}".format(p_red_ibs_mun)
                             ET.SubElement(g_red, f"{{{self.ns}}}pAliqEfet").text = "{:.4f}".format(p_ibs_mun)
                         ET.SubElement(g_ibs_mun, f"{{{self.ns}}}vIBSMun").text = "{:.2f}".format(v_ibs_mun)
                         
                         # <vIBS> (Total)
                         ET.SubElement(g_ibs_cbs, f"{{{self.ns}}}vIBS").text = "{:.2f}".format(v_ibs_total)
                         
                         # <gCBS>
                         g_cbs = ET.SubElement(g_ibs_cbs, f"{{{self.ns}}}gCBS")
                         ET.SubElement(g_cbs, f"{{{self.ns}}}pCBS").text = "{:.4f}".format(p_cbs_nominal)
                         if p_red_cbs > 0:
                             g_red = ET.SubElement(g_cbs, f"{{{self.ns}}}gRed")
                             ET.SubElement(g_red, f"{{{self.ns}}}pRedAliq").text = "{:.4f}".format(p_red_cbs)
                             ET.SubElement(g_red, f"{{{self.ns}}}pAliqEfet").text = "{:.4f}".format(p_cbs)
                         ET.SubElement(g_cbs, f"{{{self.ns}}}vCBS").text = "{:.2f}".format(v_cbs)

                         # Accumulate Totals
                         total_vbc_reforma += vbc_trib
                         total_vibs += v_ibs_total
                         total_vcbs += v_cbs
                         total_vibs_uf += v_ibs_uf
                         total_vibs_mun += v_ibs_mun


            # Fim de imposto

            i += 1

        total = ET.SubElement(infNFe, f"{{{self.ns}}}total")
        ICMSTot = ET.SubElement(total, f"{{{self.ns}}}ICMSTot")
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vBC").text = "{:.2f}".format(total_vbc)
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vICMS").text = "{:.2f}".format(total_vicms)
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vICMSDeson").text = "0.00"

        ET.SubElement(ICMSTot, f"{{{self.ns}}}vFCP").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vBCST").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vST").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vFCPST").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vFCPSTRet").text = "0.00"
        
        # Adiciona totais de ICMS Monofásico (NT 2023.001) se houver (deve ficar antes de vProd)
        if total_vicms_mono_ret > 0:
            ET.SubElement(ICMSTot, f"{{{self.ns}}}qBCMonoRet").text = "{:.2f}".format(total_qbc_mono_ret)
            ET.SubElement(ICMSTot, f"{{{self.ns}}}vICMSMonoRet").text = "{:.2f}".format(total_vicms_mono_ret)

        ET.SubElement(ICMSTot, f"{{{self.ns}}}vProd").text = "{:.2f}".format(total_fiscal)
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vFrete").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vSeg").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vDesc").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vII").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vIPI").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vIPIDevol").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vPIS").text = "{:.2f}".format(total_vpis)
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vCOFINS").text = "{:.2f}".format(total_vcofins)
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vOutro").text = "0.00"
        ET.SubElement(ICMSTot, f"{{{self.ns}}}vNF").text = "{:.2f}".format(total_fiscal)

        # --- REFORMA TRIBUTÁRIA TOTAIS ---
        # NT 2025.002 - IBSCBSTot gerado para TODOS os modelos (55 e 65)
        v_nf_tot_val = total_fiscal  # Total fiscal (sem diária de hospedagem)
        
        if should_generate_reform:
            # Tag Principal: IBSCBSTot
            ibs_cbs_tot = ET.SubElement(total, f"{{{self.ns}}}IBSCBSTot")
            
            # vBCIBSCBS
            ET.SubElement(ibs_cbs_tot, f"{{{self.ns}}}vBCIBSCBS").text = "{:.2f}".format(total_vbc_reforma)
            
            # Atualiza vNFTot
            v_nf_tot_val += (total_vibs + total_vcbs)
            
            # vNFTot (Novo Total Final) - Obrigatório se tiver IBSCBSTot
            ET.SubElement(total, f"{{{self.ns}}}vNFTot").text = "{:.2f}".format(v_nf_tot_val)

        # --- transp ---
        transp = ET.SubElement(infNFe, f"{{{self.ns}}}transp")
        
        # modFrete
        mod_frete = str(getattr(self.venda, 'tipo_frete', 9) if getattr(self.venda, 'tipo_frete', 9) is not None else 9)
        ET.SubElement(transp, f"{{{self.ns}}}modFrete").text = mod_frete
        
        # transporta (Carrier/Transportadora)
        transportadora = getattr(self.venda, 'transportadora', None)
        if transportadora:
            transporta = ET.SubElement(transp, f"{{{self.ns}}}transporta")
            # CNPJ or CPF
            cnpj_cpf = (transportadora.cpf_cnpj or '').replace('.', '').replace('-', '').replace('/', '').replace(' ', '')
            if len(cnpj_cpf) == 14:
                ET.SubElement(transporta, f"{{{self.ns}}}CNPJ").text = cnpj_cpf
            elif len(cnpj_cpf) == 11:
                ET.SubElement(transporta, f"{{{self.ns}}}CPF").text = cnpj_cpf
            
            if transportadora.nome_razao_social:
                ET.SubElement(transporta, f"{{{self.ns}}}xNome").text = self._limpar_texto(transportadora.nome_razao_social, 60)
            
            if transportadora.inscricao_estadual:
                ie_clean = (transportadora.inscricao_estadual or '').replace('.', '').replace('-', '').replace(' ', '')
                if ie_clean.upper() in ['ISENTO', '']:
                    ET.SubElement(transporta, f"{{{self.ns}}}IE").text = "ISENTO"
                else:
                    ET.SubElement(transporta, f"{{{self.ns}}}IE").text = ie_clean
            
            if transportadora.endereco:
                end_text = f"{transportadora.endereco}, {transportadora.numero or ''}".strip(', ')
                ET.SubElement(transporta, f"{{{self.ns}}}xEnder").text = self._limpar_texto(end_text, 60)
            
            if transportadora.cidade:
                ET.SubElement(transporta, f"{{{self.ns}}}xMun").text = self._limpar_texto(transportadora.cidade, 60)
            
            if transportadora.estado:
                ET.SubElement(transporta, f"{{{self.ns}}}UF").text = transportadora.estado.upper()
        
        # veicTransp (Vehicle)
        placa = getattr(self.venda, 'placa_veiculo', None)
        if placa:
            veicTransp = ET.SubElement(transp, f"{{{self.ns}}}veicTransp")
            placa_limpa = placa.replace('-', '').replace(' ', '').upper()
            ET.SubElement(veicTransp, f"{{{self.ns}}}placa").text = placa_limpa
            
            uf_veic = getattr(self.venda, 'uf_veiculo', None)
            if uf_veic:
                ET.SubElement(veicTransp, f"{{{self.ns}}}UF").text = uf_veic.upper()
            else:
                ET.SubElement(veicTransp, f"{{{self.ns}}}UF").text = (self.empresa.estado or 'MG').upper()
            
            rntrc_val = getattr(self.venda, 'rntrc', None)
            if rntrc_val:
                ET.SubElement(veicTransp, f"{{{self.ns}}}RNTRC").text = self._limpar_texto(rntrc_val, 20)
        
        # vol (Volumes)
        q_vol = getattr(self.venda, 'quantidade_volumes', 0)
        peso_b = getattr(self.venda, 'peso_bruto', 0.0)
        peso_l = getattr(self.venda, 'peso_liquido', 0.0)
        
        esp_vol = getattr(self.venda, 'especie_volumes', None)
        marca_vol = getattr(self.venda, 'marca_volumes', None)
        
        if q_vol or peso_b or peso_l or esp_vol or marca_vol:
            vol = ET.SubElement(transp, f"{{{self.ns}}}vol")
            if q_vol:
                ET.SubElement(vol, f"{{{self.ns}}}qVol").text = str(int(q_vol))
            if esp_vol:
                ET.SubElement(vol, f"{{{self.ns}}}esp").text = self._limpar_texto(esp_vol, 60)
            if marca_vol:
                ET.SubElement(vol, f"{{{self.ns}}}marca").text = self._limpar_texto(marca_vol, 60)
            if peso_l:
                ET.SubElement(vol, f"{{{self.ns}}}pesoL").text = "{:.3f}".format(float(peso_l))
            if peso_b:
                ET.SubElement(vol, f"{{{self.ns}}}pesoB").text = "{:.3f}".format(float(peso_b))

        # --- pag ---
        pag = ET.SubElement(infNFe, f"{{{self.ns}}}pag")
        detPag = ET.SubElement(pag, f"{{{self.ns}}}detPag")
        
        # Verificar se é nota de Devolução (finNFe = 4)
        fin_nfe = '1'
        if self.venda.id_operacao:
            op_fin = str(getattr(self.venda.id_operacao, 'finalidade_emissao', '') or '').strip()
            nome_op = (self.venda.id_operacao.nome_operacao or '').upper()
            if op_fin == '4' or 'DEVOLU' in nome_op:
                fin_nfe = '4'

        if fin_nfe == '4':
            # SEFAZ NT 2020.006 (Rejeição 871): Emissão de NF-e de Devolução (finalidade 4) exige tPag = '90' (Sem Pagamento)
            t_pag = "90"
            ET.SubElement(detPag, f"{{{self.ns}}}tPag").text = "90"
            ET.SubElement(detPag, f"{{{self.ns}}}vPag").text = "0.00"
        else:
            t_pag = self.tipo_pagamento
            if t_pag not in ['01','02','03','04','05','10','11','12','13','15','90','99']:
                t_pag = "01"
            ET.SubElement(detPag, f"{{{self.ns}}}indPag").text = "0" 
            ET.SubElement(detPag, f"{{{self.ns}}}tPag").text = t_pag
            ET.SubElement(detPag, f"{{{self.ns}}}vPag").text = "{:.2f}".format(total_fiscal)
        
        # Pagamento cartao exige tag card no subgrupo se integrado, mas se nao integrado (POS)
        # a tag card é opcional/recomendada. Vamos manter simples.
        if t_pag in ['03', '04']:
             # Se for cartao, tpIntegra é obrigatorio se enviar o grupo card
             # Mas grupo card não é obrigatorio se nao integrado?
             # Para simplificar e evitar erro "card" vazio:
             # Nao enviamos grupo card para vendas POS nao integradas a menos que tenhamos CNPJ da credenciadora.
             pass 
             
        if t_pag == '99':
            ET.SubElement(detPag, f"{{{self.ns}}}xPag").text = "Outros"
        
        # --- infAdic ---
        infAdic = ET.SubElement(infNFe, f"{{{self.ns}}}infAdic")
        
        # Texto base de impostos
        info_text = "Trib aprox R$ 0,00 Federal e R$ 0,00 Estadual Fonte: IBPT"
        
        # REGRA SEFAZ: Em homologação, adicionar aviso no infAdic
        if str(self.empresa.ambiente_nfce or "2") == "2":
            info_text = "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL - " + info_text

        # Adicionar observações do contribuinte configuradas na venda
        obs_contrib = getattr(self.venda, 'observacao_contribuinte', None)
        if obs_contrib:
            info_text = info_text + " - " + obs_contrib

        # Adicionar informações ao fisco
        obs_fisco = getattr(self.venda, 'observacao_fisco', None)
        if obs_fisco:
            ET.SubElement(infAdic, f"{{{self.ns}}}infAdFisco").text = self._limpar_texto(obs_fisco, 2000)

        # --- APROVEITAMENTO ICMS (NF-e Modelo 55) ---
        # Verifica se o recurso está ativo e se algum item da venda possui CSOSN configurado
        if modelo == '55' and getattr(self.empresa, 'nfe_aproveitamento_icms_ativo', False):
            csosns_config_raw = getattr(self.empresa, 'nfe_aproveitamento_icms_csosns', '') or ''
            csosns_config = [c.strip() for c in csosns_config_raw.split(',') if c.strip()]
            mensagem_config = getattr(self.empresa, 'nfe_aproveitamento_icms_mensagem', '') or ''
            aliquota_config = getattr(self.empresa, 'nfe_aproveitamento_icms_aliquota', 0) or 0

            if csosns_config and mensagem_config:
                # Verifica se algum item da venda tem CSOSN que corresponde à configuração
                csosns_venda = set()
                for item in self.venda.itens.all():
                    csosn_item = str(getattr(item, 'icms_cst_csosn', '') or '').strip()
                    if csosn_item:
                        csosns_venda.add(csosn_item)

                if any(c in csosns_config for c in csosns_venda):
                    # Substitui variáveis na mensagem
                    valor_total = total_fiscal  # Total fiscal (sem diária de hospedagem)
                    aliquota_fmt = "{:.4f}".format(float(aliquota_config)).rstrip('0').rstrip('.')
                    valor_icms = valor_total * float(aliquota_config) / 100

                    msg_aproveitamento = mensagem_config
                    msg_aproveitamento = msg_aproveitamento.replace('{PERC_ALIQ}', aliquota_fmt)
                    msg_aproveitamento = msg_aproveitamento.replace('{VLR_TOTAL}', "R$ {:,.2f}".format(valor_icms).replace(',', 'X').replace('.', ',').replace('X', '.'))

                    info_text = info_text + " " + msg_aproveitamento

        # CRÍTICO: Limpar texto para evitar Rejeição 297 (quebras de linha, caracteres especiais)
        info_text_limpo = self._limpar_texto(info_text, 5000)
        # Ensure strip again just in case
        if info_text_limpo: info_text_limpo = info_text_limpo.strip()

        ET.SubElement(infAdic, f"{{{self.ns}}}infCpl").text = info_text_limpo

        # --- infNFeSupl (QR Code) - OBRIGATÓRIO APENAS PARA NFC-e (Modelo 65) ---
        # Para NF-e (Modelo 55) esse bloco NÃO DEVE EXISTIR
        if modelo == '65':
            # Versão 3.00 do QR Code (NT 2025.001)
            versao_qr = "3"
            tpAmb = str(self.empresa.ambiente_nfce or "2")
            tpEmis_val = tpEmis
            
            # Base URL
            base_url = self.url_qrcode or "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml"
            
            if tpEmis_val == "9": # Contingência Offline
                # Parameters: chave_acesso|3|tpAmb|dia_data_emissao|vNF|tp_idDest|idDest|assinatura
                dia_data_emissao = self.venda.data_documento.strftime('%d') if self.venda.data_documento else datetime.now().strftime('%d')
                vNF = f"{self.venda.valor_total:.2f}"
                
                # Check client identification
                client_identified = False
                tp_idDest = None
                idDest = None
                if self.venda.id_cliente and self.venda.id_cliente.cpf_cnpj:
                    import re
                    doc_cli = re.sub(r'\D', '', self.venda.id_cliente.cpf_cnpj)
                    if doc_cli and doc_cli not in ('00000000000', '00000000000000'):
                        idDest = doc_cli
                        # Destinatário: 1=CNPJ, 2=CPF, 3=IdEstrangeiro
                        tp_idDest = "2" if len(doc_cli) == 11 else "1"
                        client_identified = True
                
                if client_identified:
                    params_to_sign = f"{chave}|{versao_qr}|{tpAmb}|{dia_data_emissao}|{vNF}|{tp_idDest}|{idDest}"
                else:
                    params_to_sign = f"{chave}|{versao_qr}|{tpAmb}|{dia_data_emissao}|{vNF}"
                
                # Sign using the Private Key
                signature_b64 = ""
                try:
                    from .signer_service import SignerService
                    signer = SignerService(self.empresa.certificado_digital, self.empresa.senha_certificado)
                    if signer.private_key:
                        from cryptography.hazmat.primitives.asymmetric import padding
                        from cryptography.hazmat.primitives import hashes
                        import base64
                        sig_bytes = signer.private_key.sign(
                            params_to_sign.encode('utf-8'),
                            padding.PKCS1v15(),
                            hashes.SHA1()
                        )
                        signature_b64 = base64.b64encode(sig_bytes).decode('utf-8')
                        logger.info("[OK] Assinatura do QR Code v3 gerada com sucesso.")
                except Exception as e_sign:
                    logger.error(f"Erro ao gerar assinatura digital para o QR Code v3: {e_sign}")
                
                # Fallback se não conseguir assinar (por exemplo, sem certificado em simulação)
                if not signature_b64:
                    import base64, hashlib
                    mock_sig = hashlib.sha1(params_to_sign.encode('utf-8')).digest()
                    signature_b64 = base64.b64encode(mock_sig).decode('utf-8')
                    logger.warning("[DEV] Usando assinatura fictícia para o QR Code v3.")
                
                # Form URL-encoded signature
                import urllib.parse
                signature_encoded = urllib.parse.quote(signature_b64)
                
                p_param = f"{params_to_sign}|{signature_encoded}"
            else: # Online (tpEmis = 1)
                # Parameters: chave_acesso|3|tpAmb
                p_param = f"{chave}|{versao_qr}|{tpAmb}"
            
            qr_url = f"{base_url}?p={p_param}"
            self._qr_url_final = qr_url
            
            infSupl = ET.SubElement(root, f"{{{self.ns}}}infNFeSupl")
            ET.SubElement(infSupl, f"{{{self.ns}}}qrCode").text = qr_url
            ET.SubElement(infSupl, f"{{{self.ns}}}urlChave").text = self.url_consulta_chave
        else:
            # Para NF-e (modelo 55), não gera QR Code
            self._qr_url_final = None
        
        # Retorna XML com declaração XML no início
        xml_str = ET.tostring(root, encoding='utf-8').decode('utf-8')
        
        # REMOVIDO: Injeção de CDATA Manual. O lxml safe-escaping é suficiente e preferido se não exigido CDATA.
        # Caso o lxml escape o '&' (se houver) para &amp;, é valido XML. 
        # Como usamos '|' no V2.0, não há chars reservados.
            
        return '<?xml version="1.0" encoding="UTF-8"?>' + xml_str

    def _calcular_dv(self, chave43):
        # Algoritmo Módulo 11 (Padrão SEFAZ)
        pesos = [2, 3, 4, 5, 6, 7, 8, 9]
        total = 0
        pos = 0
        for c in reversed(chave43):
            total += int(c) * pesos[pos % 8]
            pos += 1
        resto = total % 11
        if resto == 0 or resto == 1:
            return 0
        else:
            return 11 - resto
