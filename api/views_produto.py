from rest_framework import viewsets, serializers, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import connection
from django.db.models import Q
import sqlite3
import os
import sys

from .models import Produto, TributacaoProduto
from .services.gov_api_service import get_gov_api_service
from .services.gov_api_manager import get_gov_api_manager


# --- Helper de Correção Tributária ---
class TaxAuditHelper:
    def __init__(self):
        # Caminhos candidatos
        self.checked_paths = []
        
        # 1. Caminho dentro do bundle (PyInstaller)
        base_bundle = getattr(sys, '_MEIPASS', os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        bundle_path = os.path.join(base_bundle, "Correcao_de_Tributacao", "ncm_local.db")
        
        # 2. Caminho relativo ao executavel
        exe_dir = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else os.getcwd()
        dist_path = os.path.join(exe_dir, "Correcao_de_Tributacao", "ncm_local.db")
        
        # 3. Caminhos absolutos hardcoded (Legacy)
        legacy_paths = [
            r"c:\Projetos\SistemaGerencial\dist\SistemaGerencial\ncm_local.db",
            r"c:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\Correcao_de_Tributacao\ncm_local.db",
            r"c:\SistemaGerencial\Correcao_de_Tributacao\ncm_local.db",
            # Fonte original da base tributária
            r"c:\Projetos\SistemaGerencial\4_Calculadora_Fiscal\ncm_local.db",
        ]
        
        candidates = [bundle_path, dist_path] + legacy_paths
        
        self.db_path = None
        for c in candidates:
            self.checked_paths.append(c)
            if os.path.exists(c):
                self.db_path = c
                break
        
        if not self.db_path:
            print(f"[TaxAuditHelper] ERRO: ncm_local.db nao encontrado! Checked: {self.checked_paths}")
        else:
            print(f"[TaxAuditHelper] DB encontrado em: {self.db_path}")

    def get_connection(self):
        if not self.db_path: return None
        return sqlite3.connect(self.db_path)

    def search_ncm_by_desc(self, term):
        """Busca NCMs pela descrição (case-insensitive). Retorna apenas NCMs com 8 dígitos."""
        if not self.db_path: return []
        try:
            # FORÇAR MAIÚSCULO NO TERMO DE BUSCA
            term = term.upper()
            
            import unicodedata, re
            def strip_accents(s):
                return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii').upper()
            
            term_norm = strip_accents(term)
            conn = self.get_connection()
            conn.create_function('NOACCENT', 1, strip_accents)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT NCM_CD, NCM_DESCRICAO 
                FROM NCM 
                WHERE UPPER(NOACCENT(NCM_DESCRICAO)) LIKE ?
                  AND LENGTH(NCM_CD) = 8
                ORDER BY NCM_CD
                LIMIT 50
            """, ('%'+term_norm+'%',))
            res = cursor.fetchall()
            conn.close()
            return res
        except Exception as e:
            print(f"[TaxAudit] Search error: {e}")
            return []

    def search_ncm_multi_token(self, tokens):
        """Busca NCMs com múltiplos tokens com AND (case-insensitive). Retorna apenas NCMs com 8 dígitos."""
        if not self.db_path or not tokens: return []
        try:
            # FORÇAR MAIÚSCULO NOS TOKENS
            tokens = [t.upper() for t in tokens]
            
            import unicodedata
            def strip_accents(s):
                return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii').upper()
            
            conn = self.get_connection()
            conn.create_function('NOACCENT', 1, strip_accents)
            cursor = conn.cursor()
            tokens_norm = [strip_accents(t) for t in tokens]
            conditions = " AND ".join(["UPPER(NOACCENT(NCM_DESCRICAO)) LIKE ?" for _ in tokens_norm])
            params = tuple(f'%{t}%' for t in tokens_norm)
            cursor.execute(f"""
                SELECT NCM_CD, NCM_DESCRICAO 
                FROM NCM 
                WHERE ({conditions})
                  AND LENGTH(NCM_CD) = 8
                ORDER BY NCM_CD
                LIMIT 50
            """, params)
            res = cursor.fetchall()
            conn.close()
            return res
        except Exception as e:
            print(f"[TaxAudit] Multi-token search error: {e}")
            return []

    def get_info(self, ncm):
        if not self.db_path: return None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            ncm = str(ncm).replace('.', '').strip()
            candidates = [ncm]
            if len(ncm) > 6: candidates.append(ncm[:6])
            
            found_data = None
            
            for code in candidates:
                # Busca Info Basica usando JOINs corretos
                cursor.execute("""
                    SELECT C.CLTR_CD, S.SITR_CD, N.NCM_DESCRICAO, C.CLTR_ID, C.CLTR_DESCRICAO
                    FROM NCM_APLICAVEL A
                    JOIN CLASSIFICACAO_TRIBUTARIA C ON A.NCMA_CLTR_ID = C.CLTR_ID
                    LEFT JOIN NCM N ON A.NCMA_NCM_CD = N.NCM_CD
                    LEFT JOIN SITUACAO_TRIBUTARIA S ON C.CLTR_SITR_ID = S.SITR_ID
                    WHERE A.NCMA_NCM_CD = ? LIMIT 1
                """, (code,))
                row = cursor.fetchone()
                
                if row:
                    cltr_id = row[3]
                    desc_ncm = row[2] or ""
                    cltr_cd = row[0] or ""          # Código da classificação tributária (ex: "000001")
                    classificacao_desc = row[4] or ""  # Descrição textual (para log)
                    
                    rates = {'cbs': 8.8, 'ibs_uf': 17.7, 'ibs_mun': 0} # Defaults
                    
                    # 1. Busca Aliquotas Padrao da Classificacao
                    try:
                        cursor.execute("""
                            SELECT AADV_TBTO_ID, AADV_VALOR 
                            FROM ALIQUOTA_AD_VALOREM 
                            WHERE AADV_CLTR_ID = ? 
                            ORDER BY AADV_INICIO_VIGENCIA DESC
                        """, (cltr_id,))
                        
                        db_rates = cursor.fetchall()
                        if db_rates:
                             # Se tiver info no banco, zera os defaults para usar o banco
                             rates = {'cbs': 0, 'ibs_uf': 0, 'ibs_mun': 0}
                             for rate_row in db_rates:
                                 tid = rate_row[0]
                                 val = rate_row[1]
                                 if tid == 2: rates['cbs'] = val
                                 elif tid == 3: rates['ibs_uf'] = val
                                 elif tid == 4: rates['ibs_mun'] = val
                    except: pass
                    
                    found_data = {
                        "classificacao": cltr_cd,          # Código CLTR_CD para cClassTrib (ex: "000001")
                        "classificacao_descricao": classificacao_desc,  # Texto para log
                        "cst_ibs_cbs": row[1] or "000",   # SITR_CD = CST IBS/CBS diretamente
                        "descricao_ncm": desc_ncm,
                        "cbs": float(rates['cbs']),
                        "ibs": float(rates['ibs_uf'] + rates['ibs_mun']),
                        "pis": 1.65,
                        "cofins": 7.6,
                        "icms": 18.0
                    }
                    break

            # Fallback: Se nao achou via NCM_APLICAVEL, tenta direto na tabela NCM
            # Isso garante que NCMs validos mas sem regra tributaria especifica nao deem NOT_FOUND
            if not found_data:
                try:
                    cursor.execute("SELECT NCM_DESCRICAO FROM NCM WHERE NCM_CD = ? LIMIT 1", (ncm,))
                    row_basic = cursor.fetchone()
                    if row_basic:
                        # Busca alíquotas de referência do ano vigente (ALIQUOTA_REFERENCIA)
                        # ALRE_TBTO_ID: 2=CBS, 3=IBS(UF), 4=IBS(MUN)
                        from datetime import date
                        today = date.today().isoformat()
                        ref_cbs, ref_ibs = 0.9, 0.1  # Defaults 2026 caso a consulta falhe
                        try:
                            cursor.execute("""
                                SELECT ALRE_TBTO_ID, ALRE_VALOR
                                FROM ALIQUOTA_REFERENCIA
                                WHERE ALRE_INICIO_VIGENCIA <= ?
                                  AND (ALRE_FIM_VIGENCIA IS NULL OR ALRE_FIM_VIGENCIA >= ?)
                                ORDER BY ALRE_INICIO_VIGENCIA DESC
                            """, (today, today))
                            fetched = cursor.fetchall()
                            if fetched:
                                ref_cbs = 0.0
                                ref_ibs = 0.0
                                for tid, val in fetched:
                                    if tid == 2:
                                        ref_cbs = float(val)
                                    elif tid in (3, 4):
                                        ref_ibs += float(val)
                        except Exception:
                            pass

                        found_data = {
                            "classificacao": "000001",  # Classificação padrão tributação integral
                            "classificacao_descricao": "NCM Válido (Regra Geral)",
                            "cst_ibs_cbs": "000",
                            "descricao_ncm": row_basic[0],
                            "cbs": ref_cbs,
                            "ibs": ref_ibs,
                            "pis": 1.65,
                            "cofins": 7.6,
                            "icms": 18.0
                        }
                except: pass
            
            conn.close()
            return found_data

        except Exception as e:
            print(f"[TaxAuditHelper] Error: {e}")
            return None

    def get_ncm_categories(self):
        """Retorna dicionário de categorias-chave por capítulo NCM para busca mais assertiva."""
        return {
            # Alimentos e Bebidas (01-24)
            '01': ['animal', 'vivo', 'bovino', 'suino', 'equino', 'ovino', 'galinha', 'peixe'],
            '02': ['carne', 'fresca', 'refrigerada', 'congelada', 'bovino', 'suino', 'frango'],
            '03': ['peixe', 'pescado', 'crustaceo', 'molusco', 'camarao', 'lagosta', 'caranguejo'],
            '04': ['leite', 'lacteo', 'manteiga', 'queijo', 'iogurte', 'creme', 'ovos'],
            '07': ['legume', 'verdura', 'hortalica', 'tomate', 'cebola', 'alface', 'batata'],
            '08': ['fruta', 'citrico', 'banana', 'maca', 'laranja', 'manga', 'morango', 'uva'],
            '09': ['cafe', 'cha', 'especiaria', 'pimenta', 'canela', 'gengibre'],
            '10': ['cereal', 'trigo', 'arroz', 'milho', 'aveia', 'cevada'],
            '11': ['farinha', 'amido', 'gluten', 'malte'],
            '12': ['oleaginosa', 'semente', 'soja', 'girassol', 'amendoim'],
            '15': ['gordura', 'oleo', 'vegetal', 'soja', 'oliva', 'girassol'],
            '16': ['conserva', 'preparacao', 'carne', 'peixe', 'embutido', 'salsicha'],
            '17': ['acucar', 'mel', 'melaco', 'xarope'],
            '18': ['cacau', 'chocolate', 'bombom'],
            '19': ['massa', 'macarrao', 'biscoito', 'bolacha', 'pao', 'bolo'],
            '20': ['conserva', 'vegetal', 'preparacao', 'tomate', 'molho'],
            '21': ['preparacao', 'alimenticia', 'extrato', 'molho', 'tempero', 'sopa'],
            '22': ['bebida', 'agua', 'refrigerante', 'suco', 'cerveja', 'vinho', 'destilado'],
            '24': ['fumo', 'tabaco', 'cigarro', 'charuto'],
            
            # Produtos Minerais (25-27)
            '25': ['pedra', 'areia', 'argila', 'mineral', 'gesso', 'cal'],
            '26': ['minerio', 'ferro', 'cobre', 'aluminio'],
            '27': ['combustivel', 'petroleo', 'oleo', 'gasolina', 'diesel', 'gas', 'carvao'],
            
            # Químicos (28-38)
            '28': ['quimico', 'elemento', 'acido', 'alcalino'],
            '29': ['quimico', 'organico', 'composto'],
            '30': ['farmaceutico', 'medicamento', 'remedio', 'vacina', 'antibiotico'],
            '32': ['tinta', 'verniz', 'pigmento', 'corante'],
            '33': ['perfume', 'cosmetico', 'maquiagem', 'shampoo', 'sabonete'],
            '34': ['sabao', 'detergente', 'limpeza', 'desinfetante', 'cera'],
            '35': ['cola', 'adesivo', 'enzima'],
            '38': ['inseticida', 'fungicida', 'herbicida', 'desodorante'],
            
            # Plásticos e Borrachas (39-40)
            '39': ['plastico', 'polimero', 'acrilico', 'pvc', 'polietileno', 'resina'],
            '40': ['borracha', 'pneumatico', 'pneu', 'camara', 'latex'],
            
            # Madeira (44-46)
            '44': ['madeira', 'compensado', 'folheado', 'marcenaria'],
            '48': ['papel', 'cartao', 'papelao', 'lenco', 'guardanapo'],
            
            # Têxteis (50-63)
            '50': ['seda', 'fio'],
            '52': ['algodao', 'tecido'],
            '54': ['filamento', 'sintetico', 'fibra'],
            '55': ['fibra', 'sintetica', 'artificial'],
            '61': ['vestuario', 'roupa', 'malha', 'tricotado', 'camisa', 'calca'],
            '62': ['vestuario', 'roupa', 'tecido', 'camisa', 'calca', 'vestido'],
            '63': ['artigo', 'confeccionado', 'textil', 'cortina', 'toalha'],
            '64': ['calcado', 'sapato', 'tenis', 'bota', 'sandalia', 'chinelo'],
            
            # Pedras e Metais (71-83)
            '71': ['pedra', 'preciosa', 'diamante', 'joalheria', 'ouro', 'prata'],
            '72': ['ferro', 'aco', 'fundido', 'laminado'],
            '73': ['ferro', 'aco', 'tubo', 'chapa', 'parafuso', 'prego', 'estrutura'],
            '74': ['cobre', 'fio', 'chapa', 'tubo'],
            '76': ['aluminio', 'chapa', 'barra', 'perfil'],
            '82': ['ferramenta', 'faca', 'lamina', 'serra', 'chave', 'martelo'],
            '83': ['artefato', 'metal', 'fechadura', 'dobradicaliça', 'grampo'],
            
            # Máquinas e Equipamentos (84-85)
            '84': ['maquina', 'motor', 'bomba', 'compressor', 'turbina', 'reator', 'caldeira', 'ventilador'],
            '85': ['eletrico', 'eletronico', 'transformador', 'gerador', 'bateria', 'pilha', 'cabo', 
                   'lampada', 'led', 'diodo', 'transistor', 'circuito', 'aparelho', 'monitor', 'telefone'],
            
            # Veículos (87-89)
            '87': ['veiculo', 'automovel', 'carro', 'caminhao', 'onibus', 'motocicleta', 'reboque', 
                   'peca', 'carroceria', 'motor', 'cambio'],
            '88': ['aeronave', 'aviao', 'helicoptero'],
            '89': ['embarcacao', 'barco', 'navio', 'iate'],
            
            # Instrumentos (90-92)
            '90': ['instrumento', 'optico', 'medida', 'controle', 'medico', 'precisao', 'oculos', 
                   'lente', 'microscopio', 'termometro'],
            '91': ['relogio', 'cronometro'],
            '92': ['instrumento', 'musical', 'violao', 'piano', 'guitarra', 'bateria'],
            
            # Móveis e Brinquedos (94-95)
            '94': ['movel', 'mobilia', 'cadeira', 'mesa', 'cama', 'armario', 'estante', 'luminaria'],
            '95': ['brinquedo', 'jogo', 'esporte', 'bola', 'boneco', 'quebracabeca'],
            '96': ['vassoura', 'escova', 'caneta', 'lapis', 'borracha'],
        }
    
    def attempt_recovery(self, product_desc):
        """
        [MELHORADO] Tenta recuperar um NCM de 8 dígitos com base na descrição do produto.
        
        Melhorias:
        1. Usa categorias hierárquicas (capítulo NCM)
        2. Valida categoria antes de aceitar match
        3. Pontuação mais rigorosa
        4. Previne falsos positivos com validação cruzada
        """
        if not product_desc or len(product_desc) < 3: 
            return None
            
        # [MODIFICADO] Força conversão para MAIÚSCULO logo na entrada
        product_desc = product_desc.upper()

        try:
            import re
            import unicodedata

            def normalizar(s):
                """Remove acentos para comparação robusta e garante MAIÚSCULO."""
                if not s: return ""
                try:
                    s = s.upper() # Garante entrada maiúscula
                    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii').upper()
                except:
                    return s.upper()

            # Categorias por capítulo NCM
            categorias = self.get_ncm_categories()

            # --- MAPA DE NOMES COMERCIAIS PARA TERMOS GENÉRICOS ---
            # Ajuda a encontrar NCM correto quando o nome é uma marca
            # Mapeamento para termos que EXISTEM nas descrições da NCM (ex: "AGUAS ACUCAR" para refri)
            trade_names = {
                'COCA-COLA': 'AGUAS GASEIFICADAS', 'COCA COLA': 'AGUAS GASEIFICADAS',
                'FANTA': 'AGUAS GASEIFICADAS', 'PEPSI': 'AGUAS GASEIFICADAS', 
                'SPRITE': 'AGUAS GASEIFICADAS', 'KUAT': 'AGUAS GASEIFICADAS', 
                'GUARANA': 'AGUAS GASEIFICADAS', 'SUKITA': 'AGUAS GASEIFICADAS',
                'SCHWEPPES': 'AGUAS GASEIFICADAS', 'SODA': 'AGUAS GASEIFICADAS',
                'REFRIGERANTE': 'AGUAS GASEIFICADAS', # Reforça termo técnico
                
                'SKOL': 'CERVEJA DE MALTE', 'BRAHMA': 'CERVEJA DE MALTE', 'ANTARCTICA': 'CERVEJA DE MALTE',
                'HEINEKEN': 'CERVEJA DE MALTE', 'BUDWEISER': 'CERVEJA DE MALTE', 'STELLA': 'CERVEJA DE MALTE',
                'CORONA': 'CERVEJA DE MALTE', 'LATAO': 'CERVEJA DE MALTE', 'LONG NECK': 'CERVEJA DE MALTE',
                'PILSEN': 'CERVEJA DE MALTE', 'IPA': 'CERVEJA DE MALTE',
                
                'RED BULL': 'BEBIDAS PROPRIAS', 'MONSTER': 'BEBIDAS PROPRIAS', 
                'TNT': 'BEBIDAS PROPRIAS', 'FUSION': 'BEBIDAS PROPRIAS',
                'ENERGETICO': 'BEBIDAS PROPRIAS',
                
                'NUTELLA': 'CHOCOLATE', 'BIS': 'CHOCOLATE', 'BATOM': 'CHOCOLATE',
                'HALLS': 'BALA', 'TRIDENT': 'CHICLE',
                
                'IPHONE': 'TELEFONE CELULAR', 'SAMSUNG GALAXY': 'TELEFONE CELULAR',
                'MOTOROLA': 'TELEFONE CELULAR', 'XIAOMI': 'TELEFONE CELULAR',
                
                'DETERGENTE': 'AGENTE ORGANICO SUPERFICIE', 'SABAO': 'SABAO', 
                'AGUA SANITARIA': 'AGUA SANITARIA',
                'OMO': 'SABAO PO', 'YPE': 'AGENTE ORGANICO SUPERFICIE', 'VEJA': 'LIMPEZA',
            }
            
            # Aplicar substituição de nomes comerciais
            search_term_augmented = product_desc
            for trade, generic in trade_names.items():
                if trade in product_desc:
                    # Adiciona o termo genérico à busca para reforçar
                    search_term_augmented += f" {generic}"
            
            desc_clean = re.sub(r'[^a-zA-ZÀ-ú0-9 ]', ' ', search_term_augmented)
            stopwords = {
                'para', 'com', 'sem', 'tipo', 'uso', 'cor', 'und', 'unid',
                'caixa', 'peca', 'pcs', 'porcao', 'porcoes',
                'produto', 'item', 'artigo', 'teste', 'auto', 'novo',
                'nacional', 'importado', 'especial', 'super', 'mini', 'extra',
                'unit', 'litro', 'litros', 'gramas', 'kilo', 'quilo',
                'natural', 'preparado', 'preparada', 'preparados', 'preparadas',
                'outro', 'outros', 'outra', 'outras', 'misto', 'mista',
                'forma', 'base', 'pronto', 'pronta', 'simples', 'puro', 'pura',
                'branco', 'branca', 'preto', 'preta', 'negro', 'negra',
                'verde', 'vermelho', 'vermelha', 'azul', 'amarelo', 'amarela',
                'dourado', 'dourada', 'prata', 'cinza', 'rosa',
            }
            
            tokens = [
                normalizar(t) for t in desc_clean.split()
                if len(t) > 3 and normalizar(t).lower() not in stopwords
            ]

            if not tokens:
                return None

            def valid_ncm(code):
                """Valida se NCM tem 8 dígitos."""
                return code and len(str(code).replace('.', '').strip()) == 8
            
            def detect_category(desc_normalized, tokens_normalized):
                """Detecta categoria provável do produto baseado em palavras-chave."""
                scores = {}
                for capitulo, keywords in categorias.items():
                    score = 0
                    for keyword in keywords:
                        keyword_norm = normalizar(keyword)
                        # Match exato em token
                        if keyword_norm in tokens_normalized:
                            score += 10
                        # Match parcial na descrição
                        elif keyword_norm in desc_normalized:
                            score += 5
                    if score > 0:
                        scores[capitulo] = score
                return scores

            def score_match(ncm_cd, ncm_desc, product_tokens, product_desc_norm):
                """
                Pontuação melhorada com validação de categoria.
                Retorna (score_final, positive_matches, category_match)
                """
                ncm_norm = normalizar(ncm_desc)
                ncm_words = {
                    w for w in re.split(r'\s+', re.sub(r'[^a-zA-Z ]', ' ', ncm_norm))
                    if len(w) > 3
                }
                product_set = set(product_tokens)

                # Pontuação positiva: tokens do produto na desc NCM
                positive = 0
                matched_tokens = []
                for t in product_set:
                    if t in ncm_norm:
                        positive += len(t) * 2  # Peso dobrado para match exato
                        matched_tokens.append(t)
                    elif any(t in w or w in t for w in ncm_words):
                        positive += len(t)  # Match parcial
                        matched_tokens.append(t)

                # Penalidade: palavras importantes da NCM ausentes no produto
                # [AJUSTADO] Penalidade mais leve para evitar rejeição excessiva
                critical_words = [w for w in ncm_words if len(w) > 6]  # Palavras muito longas = mais específicas
                unmatched = [
                    w for w in critical_words
                    if not any(w in p or p in w for p in product_set)
                ]
                penalty = sum(len(w) for w in unmatched)  # Penalidade normal (não multiplicada)

                # Validação de categoria
                capitulo_ncm = str(ncm_cd)[:2]
                category_bonus = 0
                if capitulo_ncm in categorias:
                    for keyword in categorias[capitulo_ncm]:
                        keyword_norm = normalizar(keyword)
                        if keyword_norm in product_desc_norm:
                            category_bonus += 20  # Bônus grande se categoria bate
                        elif any(keyword_norm in t or t in keyword_norm for t in product_tokens):
                            category_bonus += 10

                score_final = positive + category_bonus - penalty
                category_match = category_bonus > 0
                
                return score_final, positive, category_match, matched_tokens

            MIN_SCORE = 10  # Score mínimo reduzido (mais permissivo)
            MIN_POSITIVE = 5  # Exige pelo menos 5 pontos de match positivo (flexibilizado)

            # Detectar categoria provável do produto
            desc_norm_full = normalizar(product_desc)
            product_categories = detect_category(desc_norm_full, tokens)
            
            # Coleta candidatos com validação
            candidates = {}  # ncm_cd -> (score, positive, category_match, tokens)

            def add_candidates(results):
                for ncm_cd, ncm_desc in results:
                    if not valid_ncm(ncm_cd):
                        continue
                    
                    # Validação de categoria: NCM deve estar em categoria compatível
                    # [MODIFICADO] Agora é opcional - não bloqueia, mas penaliza se não bater
                    ncm_cap = str(ncm_cd)[:2]
                    category_penalty = 0
                    if product_categories and ncm_cap not in product_categories:
                        # Penalidade se categoria detectada mas NCM não bate
                        category_penalty = 5  # Penalidade moderada
                    
                    s, pos, cat_match, matched = score_match(ncm_cd, ncm_desc, tokens, desc_norm_full)
                    
                    # Aplica penalidade de categoria
                    s_final = s - category_penalty
                    
                    # [MODIFICADO] Aceita se score bom E tem matches positivos
                    # Categoria é bônus, não requisito obrigatório
                    if s_final >= MIN_SCORE and pos >= MIN_POSITIVE:
                        if ncm_cd not in candidates or candidates[ncm_cd][0] < s_final:
                            candidates[ncm_cd] = (s_final, pos, cat_match, matched)

            tokens_sorted = sorted(tokens, key=len, reverse=True)

            # Estratégia 1: Busca pelos 2 maiores tokens (mais específico)
            if len(tokens) >= 2:
                add_candidates(self.search_ncm_multi_token(tokens_sorted[:2]))

            # Estratégia 2: Busca por token mais longo (específico)
            if tokens_sorted:
                add_candidates(self.search_ncm_by_desc(tokens_sorted[0]))

            # Estratégia 3: Todos os tokens (só se poucos tokens) 
            if len(tokens) >= 2 and len(tokens) <= 3:
                add_candidates(self.search_ncm_multi_token(tokens))

            # Estratégia 4: Segundo token mais longo
            if len(tokens_sorted) >= 2:
                add_candidates(self.search_ncm_by_desc(tokens_sorted[1]))

            if not candidates:
                print(f"[TaxAudit] attempt_recovery '{product_desc}' → NENHUM candidato válido (tokens={tokens}, categories={list(product_categories.keys())})")
                return None

            # Retorna o NCM com maior pontuação
            best_ncm = max(candidates, key=lambda k: candidates[k][0])
            best_score, best_pos, best_cat, best_tokens = candidates[best_ncm]
            print(f"[TaxAudit] attempt_recovery '{product_desc}' → {best_ncm} (score={best_score}, pos={best_pos}, cat={best_cat}, tokens={best_tokens})")
            return best_ncm

        except Exception as e:
            print(f"[TaxAudit] attempt_recovery error: {e}")
            import traceback
            traceback.print_exc()

        return None

    def attempt_recovery_multi(self, product_desc, limit=10):
        """
        Versão multi-resultado de attempt_recovery.
        Retorna lista de candidatos NCM ordenados por score descendente.
        Cada item: {"ncm": "...", "descricao": "...", "score": N, "info": {...}}
        """
        if not product_desc or len(product_desc) < 3:
            return []

        product_desc = product_desc.upper()

        try:
            import re
            import unicodedata

            def normalizar(s):
                if not s: return ""
                try:
                    s = s.upper()
                    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii').upper()
                except:
                    return s.upper()

            categorias = self.get_ncm_categories()

            desc_clean = re.sub(r'[^a-zA-ZÀ-ú0-9 ]', ' ', product_desc)
            stopwords = {
                'para', 'com', 'sem', 'tipo', 'uso', 'cor', 'und', 'unid',
                'caixa', 'peca', 'pcs', 'produto', 'item', 'artigo',
                'nacional', 'importado', 'especial', 'super', 'mini', 'extra',
                'unit', 'litro', 'litros', 'gramas', 'kilo', 'quilo',
                'natural', 'outro', 'outros', 'outra', 'outras',
            }
            tokens = [
                normalizar(t) for t in desc_clean.split()
                if len(t) > 3 and normalizar(t).lower() not in stopwords
            ]
            if not tokens:
                return []

            def valid_ncm(code):
                return code and len(str(code).replace('.', '').strip()) == 8

            def score_match(ncm_cd, ncm_desc, product_tokens, product_desc_norm):
                ncm_norm = normalizar(ncm_desc)
                ncm_words = {
                    w for w in re.split(r'\s+', re.sub(r'[^a-zA-Z ]', ' ', ncm_norm))
                    if len(w) > 3
                }
                product_set = set(product_tokens)

                positive = 0
                for t in product_set:
                    if t in ncm_norm:
                        positive += len(t) * 2
                    elif any(t in w or w in t for w in ncm_words):
                        positive += len(t)

                critical_words = [w for w in ncm_words if len(w) > 6]
                unmatched = [w for w in critical_words if not any(w in p or p in w for p in product_set)]
                penalty = sum(len(w) for w in unmatched)

                capitulo_ncm = str(ncm_cd)[:2]
                category_bonus = 0
                if capitulo_ncm in categorias:
                    for keyword in categorias[capitulo_ncm]:
                        keyword_norm = normalizar(keyword)
                        if keyword_norm in product_desc_norm:
                            category_bonus += 20
                        elif any(keyword_norm in t or t in keyword_norm for t in product_tokens):
                            category_bonus += 10

                return positive + category_bonus - penalty

            desc_norm_full = normalizar(product_desc)
            tokens_sorted = sorted(tokens, key=len, reverse=True)

            candidates = {}

            def add_candidates(results):
                for ncm_cd, ncm_desc in results:
                    if not valid_ncm(ncm_cd):
                        continue
                    s = score_match(ncm_cd, ncm_desc, tokens, desc_norm_full)
                    if s >= 5:
                        if ncm_cd not in candidates or candidates[ncm_cd][0] < s:
                            candidates[ncm_cd] = (s, ncm_desc)

            if len(tokens_sorted) >= 2:
                add_candidates(self.search_ncm_multi_token(tokens_sorted[:2]))
            if tokens_sorted:
                add_candidates(self.search_ncm_by_desc(tokens_sorted[0]))
            if len(tokens_sorted) >= 2:
                add_candidates(self.search_ncm_by_desc(tokens_sorted[1]))
            if len(tokens_sorted) >= 3:
                add_candidates(self.search_ncm_by_desc(tokens_sorted[2]))

            sorted_candidates = sorted(candidates.items(), key=lambda x: x[1][0], reverse=True)[:limit]

            results = []
            for ncm_cd, (score, ncm_desc) in sorted_candidates:
                info = self.get_info(ncm_cd)
                results.append({
                    "ncm": ncm_cd,
                    "descricao": ncm_desc,
                    "score": score,
                    "info": info
                })

            return results

        except Exception as e:
            print(f"[TaxAudit] attempt_recovery_multi error: {e}")
            return []

class ProdutoComDepositosSerializer(serializers.ModelSerializer):
    # Alterado para allow_blank=True para permitir geração automática no backend
    codigo_produto = serializers.CharField(required=False, allow_blank=True)
    
    depositos = serializers.SerializerMethodField()
    estoque_total = serializers.SerializerMethodField()
    estoque_por_deposito = serializers.SerializerMethodField()
    valor_venda = serializers.SerializerMethodField()  # NOVO: Valor de venda principal
    tributacao_detalhada = serializers.SerializerMethodField()  # Dados do produto tributário
    tributacao_info = serializers.SerializerMethodField()  # Formato esperado pelo frontend

    # Campos Calculadora Construção
    id_produto_pai = serializers.IntegerField(source='produto_pai_id', allow_null=True, required=False)
    metragem_caixa = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    rendimento_m2 = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    peso_unitario = serializers.DecimalField(max_digits=10, decimal_places=3, required=False, allow_null=True)
    variacao = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    consumo_argamassa_m2 = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    peso_saco_argamassa = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    tipo_aplicacao_argamassa = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    produtos_complementares = serializers.SerializerMethodField()
    produtos_similares = serializers.SerializerMethodField()

    def get_produtos_complementares(self, obj):
        """Retorna lista de produtos complementares vinculados (M2M)."""
        from api.models import ProdutoComplementar
        complementares = ProdutoComplementar.objects.filter(produto=obj).select_related('produto_complementar')
        result = []
        for c in complementares:
            pc = c.produto_complementar
            result.append({
                'id_produto': pc.id_produto,
                'codigo_produto': pc.codigo_produto,
                'nome_produto': pc.nome_produto,
                'unidade_medida': pc.unidade_medida,
                'consumo_argamassa_m2': float(pc.consumo_argamassa_m2) if pc.consumo_argamassa_m2 else None,
                'peso_saco_argamassa': float(pc.peso_saco_argamassa) if pc.peso_saco_argamassa else None,
                'tipo_aplicacao_argamassa': pc.tipo_aplicacao_argamassa,
                'rendimento_m2': float(pc.rendimento_m2) if pc.rendimento_m2 else None,
                'marca': pc.marca,
                'imagem_url': pc.imagem_url,
                'ordem': c.ordem,
            })
        return result

    def get_produtos_similares(self, obj):
        """Retorna lista de produtos similares vinculados (M2M)."""
        from api.models import ProdutoSimilar
        similares = ProdutoSimilar.objects.filter(produto=obj).select_related('produto_similar')
        result = []
        for s in similares:
            ps = s.produto_similar
            result.append({
                'id_produto': ps.id_produto,
                'codigo_produto': ps.codigo_produto,
                'nome_produto': ps.nome_produto,
                'unidade_medida': ps.unidade_medida,
                'marca': ps.marca,
                'imagem_url': ps.imagem_url,
                'ordem': s.ordem,
            })
        return result

    def get_tributacao_info(self, obj):
        """Retorna dados de tributação no formato esperado pelo frontend (chaves legadas)."""
        try:
            t = obj.tributacao_detalhada
            return {
                'IBS_ALIQ': float(t.ibs_aliquota) if t.ibs_aliquota is not None else None,
                'CBS_ALIQ': float(t.cbs_aliquota) if t.cbs_aliquota is not None else None,
                'CST_IBS_CBS': t.cst_ibs_cbs,
                'classificacao_fiscal': t.classificacao_fiscal,
                'cClassTrib': t.classificacao_fiscal,
                'ICMS_ATUAL': float(t.icms_aliquota) if t.icms_aliquota is not None else None,
                'PIS_ATUAL': float(t.pis_aliquota) if t.pis_aliquota is not None else None,
                'COFINS_ATUAL': float(t.cofins_aliquota) if t.cofins_aliquota is not None else None,
                'IPI_ATUAL': float(t.ipi_aliquota) if t.ipi_aliquota is not None else None,
            }
        except Exception:
            return {}

    def get_tributacao_detalhada(self, obj):
        try:
            t = obj.tributacao_detalhada
            return {
                'cfop': t.cfop,
                # Regime Normal
                'cst_icms': t.cst_icms,
                'icms_aliquota': str(t.icms_aliquota),
                'cst_ipi': t.cst_ipi,
                'ipi_aliquota': str(t.ipi_aliquota),
                'cst_pis_cofins': t.cst_pis_cofins,
                'pis_aliquota': str(t.pis_aliquota),
                'cofins_aliquota': str(t.cofins_aliquota),
                # Simples Nacional
                'csosn': t.csosn,
                'cst_ipi_sn': t.cst_ipi_sn,
                'ipi_aliquota_sn': str(t.ipi_aliquota_sn),
                'cst_pis_sn': t.cst_pis_sn,
                'pis_aliquota_sn': str(t.pis_aliquota_sn),
                'cst_cofins_sn': t.cst_cofins_sn,
                'cofins_aliquota_sn': str(t.cofins_aliquota_sn),
                # Reforma Tributária IBS/CBS
                'cst_ibs_cbs': t.cst_ibs_cbs,
                'ibs_aliquota': str(t.ibs_aliquota),
                'cbs_aliquota': str(t.cbs_aliquota),
                'imposto_seletivo_aliquota': str(t.imposto_seletivo_aliquota),
                # Metadados
                'classificacao_fiscal': t.classificacao_fiscal,
                'fonte_info': t.fonte_info,
                'cClassTrib': t.classificacao_fiscal,  # alias para compatibilidade
            }
        except Exception:
            return None

    class Meta:
        model = Produto
        # campos base usados pela UI/autocomplete + depositos
        # incluir id_grupo para permitir salvar/alterar o grupo do produto
        fields = [
            'id_produto', 'codigo_produto', 'nome_produto', 'id_grupo', 
            'depositos', 'estoque_total', 'estoque_por_deposito', 'valor_venda',
            'imagem_url', 'descricao', 'unidade_medida', 'marca', 'ncm', 'cest', 'gtin',
            'categoria', 'classificacao', 'observacoes', 'tributacao_detalhada', 'tributacao_info',
            'metragem_caixa', 'rendimento_m2', 'peso_unitario', 'id_produto_pai', 'variacao',
            'consumo_argamassa_m2', 'peso_saco_argamassa', 'tipo_aplicacao_argamassa',
            'produtos_complementares', 'produtos_similares', 'controla_lote', 'genero'
        ]

    def validate_nome_produto(self, value):
        return value.upper() if value else value

    def validate_descricao(self, value):
        return value.upper() if value else value

    def validate_marca(self, value):
        return value.upper() if value else value

    def validate_categoria(self, value):
        return value.upper() if value else value

    def validate_unidade_medida(self, value):
        return value.upper() if value else value

    def validate_observacoes(self, value):
        return value.upper() if value else value

    def validate_classificacao(self, value):
        if value:
            value = value.upper()
        if value and len(value) > 255:
            return value[:255]
        return value

    def validate_ncm(self, value):
        """Validação assertiva de NCM usando serviço centralizado"""
        try:
            from .services.ncm_validation import validate_ncm_assertiva
        except ImportError:
            # Fallback caso a importação falhe (ex: estrutura de pastas diferente em prod)
            from api.services.ncm_validation import validate_ncm_assertiva

        clean_ncm, error = validate_ncm_assertiva(value)
        
        if error:
            raise serializers.ValidationError(error)
            
        return clean_ncm

    def get_estoque_total(self, obj):
        """Calcula o estoque total somando as quantidades de todos os depósitos."""
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT COALESCE(SUM(e.quantidade), 0) AS total
                FROM estoque e
                WHERE e.id_produto = %s
                """,
                [obj.id_produto],
            )
            row = cur.fetchone()
            return float(row[0]) if row and row[0] else 0

    def get_estoque_por_deposito(self, obj):
        """Retorna lista de depósitos com quantidade e preço do produto neste depósito."""
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT d.id AS id_deposito, d.nome AS nome_deposito, 
                       COALESCE(e.quantidade, 0) AS quantidade_atual,
                       COALESCE(e.valor_venda, 0) AS valor_venda,
                       COALESCE(e.quantidade_minima, 0) AS quantidade_minima
                FROM deposito d
                LEFT JOIN estoque e ON e.id_deposito = d.id AND e.id_produto = %s
                ORDER BY d.nome
                """,
                [obj.id_produto],
            )
            rows = cur.fetchall()

        out = []
        for r in rows:
            out.append({
                'id_deposito': r[0],
                'nome_deposito': r[1],
                'quantidade_atual': float(r[2]) if r[2] is not None else 0,
                'valor_venda': float(r[3]) if r[3] is not None else 0,
                'quantidade_minima': float(r[4]) if r[4] is not None else 0,
            })
        return out

    def get_valor_venda(self, obj):
        """Retorna o valor de venda do produto (primeiro depósito com valor > 0)."""
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT COALESCE(e.valor_venda, 0) AS valor_venda
                FROM estoque e
                WHERE e.id_produto = %s AND e.valor_venda > 0
                ORDER BY e.valor_venda DESC
                LIMIT 1
                """,
                [obj.id_produto],
            )
            row = cur.fetchone()
            return float(row[0]) if row and row[0] else 0.0

    def get_depositos(self, obj):
        """Retorna lista de depósitos com quantidade do produto neste depósito.

        Estrutura retornada: [{'id_deposito': int, 'nome_deposito': str, 'quantidade': Decimal}, ...]
        """
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT sd.id_deposito, COALESCE(d.nome, '') AS nome_deposito, sd.quantidade
                FROM saldo_deposito sd
                LEFT JOIN deposito d ON d.id = sd.id_deposito
                WHERE sd.id_produto = %s
                """,
                [obj.id_produto],
            )
            rows = cur.fetchall()

        out = []
        for r in rows:
            out.append({
                'id_deposito': r[0],
                'nome_deposito': r[1],
                'quantidade': str(r[2]) if r[2] is not None else '0',
            })
        return out


class ProdutoViewSetCustom(viewsets.ModelViewSet):
    """ViewSet de produtos que adiciona informação de saldos por depósito.

    Tornando um ModelViewSet permitimos métodos PUT/PATCH/POST/DELETE além de GET.
    """
    queryset = Produto.objects.all().order_by('nome_produto')
    serializer_class = ProdutoComDepositosSerializer
    pagination_class = None # Desabilitar paginação para carregar todos os produtos no Frontend
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        from .models import ConfiguracaoProduto
        from rest_framework import status

        # Intercepta criação para garantir que modo Automático ignora input do usuário
        # evitando erros de validação se o usuário digitou algo duplicado
        try:
            config = ConfiguracaoProduto.objects.get(id_config=1)
            
            # --- Lógica de Produto em Grade ---
            if getattr(config, 'produto_em_grade', False) and 'variacoes' in request.data:
                variacoes = request.data.get('variacoes', [])
                if isinstance(variacoes, list) and len(variacoes) > 0:
                    created_products = []
                    base_data = request.data.copy()
                    base_data.pop('variacoes', None)
                    
                    # Para cada variação, criar um produto
                    for i, variacao in enumerate(variacoes):
                        prod_data = base_data.copy()
                        
                        # Pegar tamanho e cor
                        tamanho = variacao.get('tamanho', '')
                        cor = variacao.get('cor', '')
                        
                        # Compor nome
                        nome_original = prod_data.get('nome_produto', '')
                        nome_extra = []
                        if tamanho: nome_extra.append(f"Tam: {tamanho}")
                        if cor: nome_extra.append(f"Cor: {cor}")
                        
                        if nome_extra:
                            prod_data['nome_produto'] = f"{nome_original} ({' - '.join(nome_extra)})"
                            
                        # Salvar atributos na observação também, se desejar
                        obs_atual = prod_data.get('observacoes', '') or ''
                        prod_data['observacoes'] = f"{obs_atual}\nGRADE: Tamanho={tamanho}, Cor={cor}".strip()

                        # Lidar com Código (se auto, limpa; se manual, tenta sufixo)
                        tipo_geracao = str(config.tipo_geracao_codigo).strip().lower()
                        if tipo_geracao == 'automatica':
                            if 'codigo_produto' in prod_data:
                                prod_data['codigo_produto'] = '' # Força gerar novo
                        elif tipo_geracao == 'manual':
                            # Se manual, apenda indice se código existir
                            cod_orig = prod_data.get('codigo_produto', '')
                            if cod_orig:
                                prod_data['codigo_produto'] = f"{cod_orig}-{i+1}"
                        
                        # Criar
                        serializer = self.get_serializer(data=prod_data)
                        serializer.is_valid(raise_exception=True)
                        self.perform_create(serializer)
                        created_products.append(serializer.data)
                    
                    return Response(created_products, status=status.HTTP_201_CREATED)

            tipo_geracao = str(config.tipo_geracao_codigo).strip().lower()
            
            if tipo_geracao == 'automatica':
                 # Cria cópia mutável dos dados
                 data = request.data.copy()
                 # Remove código enviado pelo usuário para evitar validação de unique
                 if 'codigo_produto' in data:
                     data['codigo_produto'] = '' 
                 
                 serializer = self.get_serializer(data=data)
                 serializer.is_valid(raise_exception=True)
                 self.perform_create(serializer)
                 headers = self.get_success_headers(serializer.data)
                 return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            # Em caso de erro na config, segue fluxo normal
            print(f"Erro ao verificar config no create: {e}")
            pass
            
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('search') or self.request.query_params.get('q')
        if q:
            return qs.filter(Q(nome_produto__icontains=q) | Q(codigo_produto__icontains=q))
        # Guard: sem filtro de busca, limita a 5000 para proteger contra tabelas grandes.
        # IMPORTANTE: Querysets fatiados ([:N]) não podem ser filtrados — DRF converte
        # o TypeError em Http404 no get_object(). O slice só é seguro na ação 'list'.
        if getattr(self, 'action', 'list') == 'list':
            limit = self.request.query_params.get('limit')
            if limit:
                try:
                    return qs[:int(limit)]
                except (ValueError, TypeError):
                    pass
            return qs[:5000]
        return qs

    def _gerar_proximo_codigo(self, config):
        """Gera o próximo código formatado baseado na configuração"""
        prefixo = config.prefixo_codigo or ''
        numero = config.proximo_codigo
        tamanho = config.tamanho_codigo or 6
        
        if tamanho > 0:
            numero_str = str(numero).zfill(tamanho)
        else:
            numero_str = str(numero)
            
        return f"{prefixo}{numero_str}"

    def perform_create(self, serializer):
        from .models import ConfiguracaoProduto
        
        # Busca config (ID=1 é padrão)
        try:
            config = ConfiguracaoProduto.objects.get(id_config=1)
        except ConfiguracaoProduto.DoesNotExist:
            # Fallback se não existir, cria com ID 1
            config = ConfiguracaoProduto.objects.create(
                id_config=1,
                tipo_geracao_codigo='manual',
                proximo_codigo=1,
                tamanho_codigo=6
            )
        except Exception:
             # Fallback genérico para o primeiro registro
             config = ConfiguracaoProduto.objects.first()
             if not config:
                 config = ConfiguracaoProduto.objects.create(
                    tipo_geracao_codigo='manual',
                    proximo_codigo=1,
                    tamanho_codigo=6
                 )
        
        # Recupera dado validado (pode ser vazio string ou None)
        codigo_enviado = serializer.validated_data.get('codigo_produto')
        
        novo_codigo = codigo_enviado
        
        # Normaliza tipo de geração
        tipo_geracao = str(config.tipo_geracao_codigo).strip().lower()
        
        if tipo_geracao == 'automatica':
            # Gera sempre, ignorando o que foi enviado
            novo_codigo = config.gerar_proximo_codigo()
            config.incrementar_codigo()
            
        elif tipo_geracao == 'semi-automatica':
            # Gera se vazio (None ou string vazia)
            if not codigo_enviado:
                novo_codigo = config.gerar_proximo_codigo()
                config.incrementar_codigo()
        
        # Validação final para garantir que nao salva vazio
        if not novo_codigo:
             raise serializers.ValidationError({"codigo_produto": "Código é obrigatório para geração Manual."})
             
        serializer.save(codigo_produto=novo_codigo)
    @action(detail=True, methods=['get', 'patch'], url_path='tributacao')
    def tributacao(self, request, pk=None):
        """
        GET  /api/produtos/{id}/tributacao/  — retorna dados fiscais do produto
        PATCH /api/produtos/{id}/tributacao/ — cria ou atualiza dados fiscais

        Campos aceitos no PATCH:
          ncm, cfop            → atualizados diretamente no Produto
          cst_icms, cst_pis_cofins, cst_ipi, cst_ibs_cbs
          icms_aliquota, pis_aliquota, cofins_aliquota, ipi_aliquota
          ibs_aliquota, cbs_aliquota, imposto_seletivo_aliquota
          classificacao_fiscal, marketing_icms
        """
        from .serializers import TributacaoProdutoSerializer
        from .models import TributacaoProduto
        from rest_framework import status as drf_status

        produto = self.get_object()

        if request.method == 'GET':
            trib, _ = TributacaoProduto.objects.get_or_create(produto=produto)
            serializer = TributacaoProdutoSerializer(trib)
            data = serializer.data
            # Incluir campos do Produto pai
            data['ncm']  = produto.ncm or ''
            data['cfop'] = trib.cfop or '5102'
            return Response(data)

        # PATCH
        data = request.data
        # Atualizar ncm no Produto se veio no payload (cfop fica só em TributacaoProduto)
        if 'ncm' in data:
            produto.ncm = str(data['ncm']).replace('.', '').strip()[:10]
            produto.save(update_fields=['ncm'])

        trib, _ = TributacaoProduto.objects.get_or_create(produto=produto)
        # Remover campos que pertencem ao Produto (não ao TributacaoProduto)
        trib_data = {k: v for k, v in data.items() if k not in ('ncm',)}

        serializer = TributacaoProdutoSerializer(trib, data=trib_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        result = serializer.data
        result['ncm']  = produto.ncm or ''
        result['cfop'] = trib.cfop or '5102'
        return Response(result)

    @action(detail=True, methods=['post'], url_path='tributacao-auto')
    def tributacao_auto(self, request, pk=None):
        """
        POST /api/produtos/{id}/tributacao-auto/
        Detecta automaticamente os dados fiscais via ncm_local.db (mesmo NCM do produto).
        Substitui dados existentes se encontrar correspondência.
        """
        from .models import TributacaoProduto
        from rest_framework import status as drf_status

        produto = self.get_object()
        ncm_clean = str(produto.ncm or '').replace('.', '').strip()
        if len(ncm_clean) < 4:
            return Response(
                {'sucesso': False, 'mensagem': 'Produto não possui NCM válido (mínimo 4 dígitos).'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        helper = TaxAuditHelper()
        if not helper.db_path:
            return Response(
                {'sucesso': False, 'mensagem': 'Base tributária (ncm_local.db) não encontrada.'},
                status=drf_status.HTTP_503_SERVICE_UNAVAILABLE
            )

        info = helper.get_info(ncm_clean)
        if not info:
            return Response({
                'sucesso': False,
                'mensagem': f'NCM {ncm_clean} não encontrado na base tributária local.',
                'ncm': ncm_clean,
            }, status=drf_status.HTTP_404_NOT_FOUND)

        trib, created = TributacaoProduto.objects.get_or_create(produto=produto)
        
        # Atualiza classificacao_fiscal e CST do banco local
        trib.classificacao_fiscal = info.get('classificacao')
        trib.cst_ibs_cbs = info.get('cst_ibs_cbs', '000')
        
        # Atualiza ICMS
        icms_value = info.get('icms', 18.0)
        trib.icms_aliquota = icms_value
        # Define CST ICMS baseado no regime (pode ser customizado pelo usuário depois)
        if not trib.cst_icms or trib.cst_icms == '000':
            trib.cst_icms = '000'  # Tributada integralmente
        if not trib.csosn or trib.csosn == '000':
            trib.csosn = '102'  # Simples Nacional - Sem permissão de crédito
        
        # Atualiza PIS e COFINS
        pis_value = info.get('pis', 1.65)
        cofins_value = info.get('cofins', 7.6)
        trib.pis_aliquota = pis_value
        trib.cofins_aliquota = cofins_value
        # Define CST PIS/COFINS baseado no regime
        if not trib.cst_pis_cofins or trib.cst_pis_cofins == '000':
            trib.cst_pis_cofins = '01'  # Operação Tributável com Alíquota Básica
        
        # Atualiza IPI (padrão 0% se não informado)
        if not trib.ipi_aliquota:
            trib.ipi_aliquota = 0.0
        if not trib.cst_ipi or trib.cst_ipi == '000':
            trib.cst_ipi = '53'  # Saída não-tributada
        
        # Tenta obter alíquotas da API do governo (dados oficiais)
        gov_api = get_gov_api_service()
        api_result = None
        fonte_dados = 'ncm_local.db / Auto'
        
        if gov_api.api_disponivel:
            try:
                api_result = gov_api.calcular_tributos(
                    ncm=ncm_clean,
                    cst=trib.cst_ibs_cbs,
                    c_class_trib=trib.classificacao_fiscal
                )
                if api_result:
                    fonte_dados = 'API Governo (Oficial)'
            except Exception as e:
                import logging
                logging.warning(f"Erro ao consultar API governo: {e}")
        
        # Define alíquotas: API governo > banco local > valores padrão
        if api_result:
            # Usa dados oficiais da API do governo
            ibs_value = api_result['ibs_aliquota']
            cbs_value = api_result['cbs_aliquota']
            imposto_seletivo = api_result.get('imposto_seletivo', 0.0)
        else:
            # Fallback para banco local
            cbs_value = info.get('cbs', 0.0)
            ibs_value = info.get('ibs', 0.0)
            imposto_seletivo = info.get('is', 0.0)
            
            # Aplica valores padrão se banco local retornar 0.0
            if cbs_value == 0.0:
                cbs_value = 0.9
            if ibs_value == 0.0:
                ibs_value = 0.1
        
        # Atualiza campos da Reforma Tributária
        trib.cbs_aliquota = cbs_value
        trib.ibs_aliquota = ibs_value
        trib.imposto_seletivo_aliquota = imposto_seletivo
        trib.fonte_info = fonte_dados
        
        # Define CFOP padrão se não existir
        if not trib.cfop or trib.cfop == '':
            trib.cfop = '5102'  # Venda de mercadoria adquirida ou recebida de terceiros
        
        trib.save()

        return Response({
            'sucesso': True,
            'criado': created,
            'ncm': ncm_clean,
            'descricao_ncm': info.get('descricao_ncm', ''),
            'classificacao_fiscal': trib.classificacao_fiscal,
            'cfop': trib.cfop or '5102',
            'fonte_info': trib.fonte_info,
            # ICMS
            'cst_icms': trib.cst_icms,
            'csosn': trib.csosn or '102',
            'icms_aliquota': float(trib.icms_aliquota),
            # IPI — Regime Normal
            'cst_ipi': trib.cst_ipi,
            'ipi_aliquota': float(trib.ipi_aliquota),
            # IPI — Simples Nacional
            'cst_ipi_sn': trib.cst_ipi_sn or '99',
            'ipi_aliquota_sn': float(trib.ipi_aliquota_sn or 0),
            # PIS — Regime Normal
            'cst_pis_cofins': trib.cst_pis_cofins,
            'pis_aliquota': float(trib.pis_aliquota),
            # PIS — Simples Nacional
            'cst_pis_sn': trib.cst_pis_sn or '07',
            'pis_aliquota_sn': float(trib.pis_aliquota_sn or 0),
            # COFINS — Regime Normal
            'cofins_aliquota': float(trib.cofins_aliquota),
            # COFINS — Simples Nacional
            'cst_cofins_sn': trib.cst_cofins_sn or '07',
            'cofins_aliquota_sn': float(trib.cofins_aliquota_sn or 0),
            # IBS/CBS (Reforma Tributária)
            'ibs_aliquota': float(trib.ibs_aliquota),
            'cbs_aliquota': float(trib.cbs_aliquota),
            'cst_ibs_cbs': trib.cst_ibs_cbs or '000',
            'imposto_seletivo_aliquota': float(trib.imposto_seletivo_aliquota),
            # Mensagem de sucesso
            'mensagem': f'Tributação atualizada com sucesso! ICMS: {float(trib.icms_aliquota)}%, PIS: {float(trib.pis_aliquota)}%, COFINS: {float(trib.cofins_aliquota)}%, IBS: {float(trib.ibs_aliquota)}%, CBS: {float(trib.cbs_aliquota)}%'
        })

    @action(detail=True, methods=['get'], url_path='calcular-lucro')
    def calcular_lucro(self, request, pk=None):
        """
        GET /api/produtos/{id}/calcular-lucro/?preco_venda=100.00&quantidade=1&id_deposito=1
        
        Calcula o lucro de um produto baseado no preço de venda informado
        
        Parâmetros:
        - preco_venda: Preço de venda unitário (obrigatório)
        - quantidade: Quantidade a ser vendida (padrão: 1)
        - id_deposito: ID do depósito (opcional, usa primeiro disponível)
        
        Retorna:
        - custo_unitario: Custo médio do produto
        - preco_venda: Preço de venda informado
        - quantidade: Quantidade informada
        - receita_total: preco_venda * quantidade
        - custo_total: custo_unitario * quantidade
        - lucro_bruto: receita_total - custo_total
        - margem_lucro_percentual: (lucro_bruto / receita_total) * 100
        - lucro_unitario: preco_venda - custo_unitario
        """
        from api.models import Estoque
        from decimal import Decimal
        from rest_framework import status as drf_status
        
        produto = self.get_object()
        
        # Parâmetros
        try:
            preco_venda = Decimal(request.query_params.get('preco_venda', '0'))
            quantidade = Decimal(request.query_params.get('quantidade', '1'))
            id_deposito = request.query_params.get('id_deposito')
        except (ValueError, TypeError):
            return Response(
                {'error': 'Parâmetros inválidos. preco_venda e quantidade devem ser números.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        
        if preco_venda <= 0:
            return Response(
                {'error': 'preco_venda deve ser maior que zero.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        
        if quantidade <= 0:
            return Response(
                {'error': 'quantidade deve ser maior que zero.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar estoque
        try:
            filtros = {'id_produto': produto}
            if id_deposito:
                filtros['id_deposito__id_deposito'] = id_deposito
            
            estoque = Estoque.objects.filter(**filtros).first()
            
            if not estoque:
                return Response(
                    {'error': f'Produto não encontrado em estoque{" no depósito especificado" if id_deposito else ""}.'},
                    status=drf_status.HTTP_404_NOT_FOUND
                )
            
            custo_unitario = estoque.custo_medio or Decimal('0')
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao buscar informações do produto: {str(e)}'},
                status=drf_status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Cálculos
        receita_total = preco_venda * quantidade
        custo_total = custo_unitario * quantidade
        lucro_bruto = receita_total - custo_total
        margem_lucro_percentual = (lucro_bruto / receita_total * 100) if receita_total > 0 else Decimal('0')
        lucro_unitario = preco_venda - custo_unitario
        
        return Response({
            'produto': {
                'id': produto.id_produto,
                'codigo': produto.codigo_produto,
                'nome': produto.nome_produto
            },
            'deposito': {
                'id': estoque.id_deposito.id_deposito,
                'nome': estoque.id_deposito.nome_deposito
            },
            'calculos': {
                'custo_unitario': float(custo_unitario),
                'preco_venda': float(preco_venda),
                'quantidade': float(quantidade),
                'receita_total': float(receita_total),
                'custo_total': float(custo_total),
                'lucro_bruto': float(lucro_bruto),
                'lucro_unitario': float(lucro_unitario),
                'margem_lucro_percentual': float(margem_lucro_percentual)
            },
            'status_lucro': 'EXCELENTE' if margem_lucro_percentual >= 30 else 'BOM' if margem_lucro_percentual >= 20 else 'REGULAR' if margem_lucro_percentual >= 10 else 'BAIXO' if margem_lucro_percentual > 0 else 'PREJUÍZO'
        })

    @action(detail=False, methods=['get'])
    def preview_tributos(self, request):
        """
        Retorna um preview das alterações que seriam feitas pelo Calcular Tributos.
        Também detecta NCMs suspeitos (produto e descrição NCM sem correspondência).
        Não salva nada - apenas simula as mudanças.
        """
        helper = TaxAuditHelper()
        if not helper.db_path:
            return Response({"error": "Banco de dados tributário indisponível"}, status=500)

        from .models import TributacaoProduto

        # Stopwords em português para a verificação de NCM suspeito
        STOPWORDS = {
            'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'em', 'o', 'a', 'os', 'as',
            'um', 'uma', 'uns', 'umas', 'com', 'sem', 'por', 'para', 'ao', 'aos',
            'à', 'às', 'que', 'se', 'na', 'no', 'nas', 'nos', 'ml', 'kg', 'g',
            'mg', 'lt', 'lts', 'un', 'pç', 'cx', 'pt', 'pc', 'cx', 'bx',
            'natural', 'produto', 'produtos',
        }

        def tokens(text):
            """Extrai tokens significativos de uma string."""
            import re
            words = re.findall(r'[a-záàãâéêíóõôúçñ]+', (text or '').lower())
            return {w for w in words if len(w) > 2 and w not in STOPWORDS}

        produtos = Produto.objects.exclude(ncm__isnull=True).exclude(ncm='').order_by('nome_produto')
        preview = []

        for p in produtos:
            try:
                ncm_clean = str(p.ncm).replace('.', '').strip()
                if len(ncm_clean) < 4:
                    continue

                info = helper.get_info(ncm_clean)
                if not info:
                    continue

                # --- Detecção de NCM suspeito ---
                # Compara tokens do nome do produto com tokens da descrição NCM + classificação
                desc_ncm = info.get('descricao_ncm', '') or ''
                classificacao_desc = info.get('classificacao_descricao', '') or ''
                tokens_produto = tokens(p.nome_produto)
                tokens_ncm = tokens(desc_ncm) | tokens(classificacao_desc)
                # Marca suspeito apenas se há MUITO POUCA similaridade (menos de 10% de match)
                # Melhor: permite variações (água vs águas, mineral vs minerais)
                if len(tokens_produto) >= 2 and len(tokens_ncm) >= 2:
                    intersecao = len(tokens_produto & tokens_ncm)
                    menor_conjunto = min(len(tokens_produto), len(tokens_ncm))
                    similaridade = intersecao / menor_conjunto if menor_conjunto > 0 else 0
                    ncm_suspeito = similaridade < 0.1  # Menos de 10% de match
                else:
                    ncm_suspeito = False

                # Valores atuais
                try:
                    trib = TributacaoProduto.objects.get(produto=p)
                    cst_ibs_atual = trib.cst_ibs_cbs or ''
                    classificacao_atual = trib.classificacao_fiscal or ''
                    ibs_atual = float(trib.ibs_aliquota or 0)
                    cbs_atual = float(trib.cbs_aliquota or 0)
                    cfop_atual = trib.cfop or '5102'
                    cst_pis_atual = trib.cst_pis_cofins or ''
                    icms_atual = float(trib.icms_aliquota or 0)
                    pis_atual = float(trib.pis_aliquota or 0)
                    cofins_atual = float(trib.cofins_aliquota or 0)
                except TributacaoProduto.DoesNotExist:
                    cst_ibs_atual = ''
                    classificacao_atual = ''
                    ibs_atual = cbs_atual = 0.0
                    cfop_atual = '5102'
                    cst_pis_atual = ''
                    icms_atual = pis_atual = cofins_atual = 0.0

                # Calcula valores novos (somente campos IBS/CBS)
                classificacao_nova = info.get('classificacao', '')
                cst_ibs_novo = info.get('cst_ibs_cbs', '000')
                
                # Tenta obter alíquotas da API do governo (dados oficiais)
                gov_api = get_gov_api_service()
                api_result = None
                
                if gov_api.api_disponivel:
                    try:
                        api_result = gov_api.calcular_tributos(
                            ncm=ncm_clean,
                            cst=cst_ibs_novo,
                            c_class_trib=classificacao_nova
                        )
                    except:
                        pass
                
                # Define alíquotas: API governo > banco local > valores padrão
                if api_result:
                    _ibs_v = api_result['ibs_aliquota']
                    _cbs_v = api_result['cbs_aliquota']
                else:
                    _ibs_v = float(info.get('ibs', 0.0) or 0.0)
                    _cbs_v = float(info.get('cbs', 0.0) or 0.0)
                    
                    # Aplica valores padrão se não existirem no banco
                    if _ibs_v == 0.0:
                        _ibs_v = 0.1
                    if _cbs_v == 0.0:
                        _cbs_v = 0.9

                # Detecta mudanças
                mudancas = {}
                if cst_ibs_atual != cst_ibs_novo:
                    mudancas['cst_ibs_cbs'] = {'atual': cst_ibs_atual, 'novo': cst_ibs_novo}
                if classificacao_atual != classificacao_nova:
                    mudancas['classificacao_fiscal'] = {'atual': classificacao_atual, 'novo': classificacao_nova}
                if abs(ibs_atual - _ibs_v) > 0.001:
                    mudancas['ibs_aliquota'] = {'atual': ibs_atual, 'novo': _ibs_v}
                if abs(cbs_atual - _cbs_v) > 0.001:
                    mudancas['cbs_aliquota'] = {'atual': cbs_atual, 'novo': _cbs_v}

                preview.append({
                    'id': p.id_produto,
                    'nome': p.nome_produto,
                    'ncm': p.ncm,
                    'descricao_ncm': desc_ncm,
                    'ncm_suspeito': ncm_suspeito,
                    'tem_mudancas': len(mudancas) > 0,
                    'mudancas': mudancas,
                    'valores_atuais': {
                        'cfop': cfop_atual,
                        'cst_pis_cofins': cst_pis_atual,
                        'cst_ibs_cbs': cst_ibs_atual,
                        'classificacao_fiscal': classificacao_atual,
                        'icms_aliquota': icms_atual,
                        'pis_aliquota': pis_atual,
                        'cofins_aliquota': cofins_atual,
                        'ibs_aliquota': ibs_atual,
                        'cbs_aliquota': cbs_atual,
                    },
                    'valores_novos': {
                        'cst_ibs_cbs': cst_ibs_novo,
                        'classificacao_fiscal': classificacao_nova,
                        'ibs_aliquota': _ibs_v,
                        'cbs_aliquota': _cbs_v,
                    },
                })
            except Exception as e:
                continue

        return Response({
            'total': len(preview),
            'com_mudancas': sum(1 for x in preview if x['tem_mudancas']),
            'ncm_suspeitos': sum(1 for x in preview if x['ncm_suspeito']),
            'preview': preview,
        })

    @action(detail=False, methods=['post'])
    def atualizar_tributos_em_massa(self, request):
        """
        Atualiza automaticamente a tributação (CFOP, CST, IBS, CBS) de todos ou de
        produtos selecionados que possuem NCM válido.
        Body opcional: {"ids": [1, 2, 3]}  →  aplica somente nesses produtos.
        """
        helper = TaxAuditHelper()
        if not helper.db_path:
             return Response({"error": "Banco de dados tributário indisponível"}, status=500)

        ids_selecionados = request.data.get('ids', None)  # None = todos os produtos

        # Filtra produtos com NCM preenchido
        if ids_selecionados:
            produtos = Produto.objects.filter(id_produto__in=ids_selecionados).exclude(ncm__isnull=True).exclude(ncm='')
        else:
            produtos = Produto.objects.exclude(ncm__isnull=True).exclude(ncm='')
        updated_count = 0
        errors = []

        from .models import TributacaoProduto

        # Inicializa API do governo (verifica disponibilidade uma única vez)
        gov_api = get_gov_api_service()
        api_disponivel = gov_api.api_disponivel

        for p in produtos:
            try:
                ncm_clean = str(p.ncm).replace('.', '').strip()
                if len(ncm_clean) < 4: continue

                info = helper.get_info(ncm_clean)
                if info:
                    # Cria ou atualiza o registro na tabela dedicada
                    tributacao, created = TributacaoProduto.objects.get_or_create(produto=p)
                    
                    # Atualiza classificacao_fiscal e CST do banco local
                    tributacao.classificacao_fiscal = info.get('classificacao')
                    tributacao.cst_ibs_cbs = info.get('cst_ibs_cbs', '000')
                    
                    # Atualiza ICMS
                    icms_value = info.get('icms', 18.0)
                    tributacao.icms_aliquota = icms_value
                    # Define CST ICMS baseado no regime (pode ser customizado pelo usuário depois)
                    if not tributacao.cst_icms or tributacao.cst_icms == '000':
                        tributacao.cst_icms = '000'  # Tributada integralmente
                    if not tributacao.csosn or tributacao.csosn == '000':
                        tributacao.csosn = '102'  # Simples Nacional - Sem permissão de crédito
                    
                    # Atualiza PIS e COFINS
                    pis_value = info.get('pis', 1.65)
                    cofins_value = info.get('cofins', 7.6)
                    tributacao.pis_aliquota = pis_value
                    tributacao.cofins_aliquota = cofins_value
                    # Define CST PIS/COFINS baseado no regime
                    if not tributacao.cst_pis_cofins or tributacao.cst_pis_cofins == '000':
                        tributacao.cst_pis_cofins = '01'  # Operação Tributável com Alíquota Básica
                    
                    # Atualiza IPI (padrão 0% se não informado)
                    if not tributacao.ipi_aliquota:
                        tributacao.ipi_aliquota = 0.0
                    if not tributacao.cst_ipi or tributacao.cst_ipi == '000':
                        tributacao.cst_ipi = '53'  # Saída não-tributada
                    
                    # Tenta obter alíquotas da API do governo (dados oficiais)
                    api_result = None
                    fonte_dados = "ncm_local.db / Auto"
                    
                    if api_disponivel:
                        try:
                            api_result = gov_api.calcular_tributos(
                                ncm=ncm_clean,
                                cst=tributacao.cst_ibs_cbs,
                                c_class_trib=tributacao.classificacao_fiscal
                            )
                            if api_result:
                                fonte_dados = "API Governo (Oficial)"
                        except:
                            pass
                    
                    # Define alíquotas: API governo > banco local > valores padrão
                    if api_result:
                        # Usa dados oficiais da API do governo
                        ibs_value = api_result['ibs_aliquota']
                        cbs_value = api_result['cbs_aliquota']
                        imposto_seletivo = api_result.get('imposto_seletivo', 0.0)
                    else:
                        # Fallback para banco local
                        cbs_value = info.get('cbs', 0.0)
                        ibs_value = info.get('ibs', 0.0)
                        imposto_seletivo = info.get('is', 0.0)
                        
                        # Aplica valores padrão se banco local retornar 0.0
                        if cbs_value == 0.0:
                            cbs_value = 0.9
                        if ibs_value == 0.0:
                            ibs_value = 0.1
                    
                    # Atualiza campos da Reforma Tributária
                    tributacao.cbs_aliquota = cbs_value
                    tributacao.ibs_aliquota = ibs_value
                    tributacao.imposto_seletivo_aliquota = imposto_seletivo
                    tributacao.fonte_info = fonte_dados
                    
                    # Define CFOP padrão se não existir
                    if not tributacao.cfop or tributacao.cfop == '':
                        tributacao.cfop = '5102'  # Venda de mercadoria adquirida ou recebida de terceiros
                    
                    tributacao.save()
                    updated_count += 1
            except Exception as e:
                errors.append(f"Erro ID {p.id_produto}: {str(e)}")

        total = Produto.objects.exclude(ncm__isnull=True).exclude(ncm='').count() if not ids_selecionados else len(ids_selecionados)
        return Response({
            "message": "Processo concluído",
            "produtos_atualizados": updated_count,
            "total_produtos": total,
            "erros": errors[:10]
        })

    @action(detail=False, methods=['get'])
    def simular_impostos(self, request):
        """
        Retorna CST, Alíquotas (IBS/CBS) e Classificação com base no NCM.
        Exemplo: /api/produtos/simular_impostos/?ncm=12345678
        """
        ncm = request.query_params.get('ncm')
        if not ncm:
             return Response({"error": "Parâmetro 'ncm' é obrigatório"}, status=400)
        
        helper = TaxAuditHelper()
        if not helper.db_path:
             return Response({"error": "Banco de dados tributário indisponível"}, status=500)

        # Remove pontuação
        ncm_clean = str(ncm).replace('.', '').strip()
        
        info = helper.get_info(ncm_clean)
        
        if info:
             return Response(info)
             
        return Response({"error": "NCM não encontrado ou sem informações tributárias"}, status=404)

    @action(detail=False, methods=['post'])
    def audit_ncms_internal(self, request):
        """
        Analisa os produtos enviados (ids) usando o banco ncm_local.db
        Retorna status de validade e sugestoes.
        """
        ids = request.data.get('ids', [])
        audit_all = request.data.get('all', False)
        
        helper = TaxAuditHelper()
        if not helper.db_path:
             return Response({"error": "Banco de dados tributário (ncm_local.db) não encontrado no servidor."}, status=500)
        
        if audit_all:
             qs = Produto.objects.filter(id_grupo__isnull=False) # Removido limite
        elif ids:
             qs = Produto.objects.filter(id_produto__in=ids)
        else:
             # Fallback: se nenhum ID enviado, audita os primeiros 50
             qs = Produto.objects.all()[:50]
        
        results = []
        
        try:
            for p in qs:
                status = "VALID"
                suggestion = None
                info = None
                
                # Valida NCM atual
                current_ncm = str(p.ncm).replace('.', '').strip() if p.ncm else ""
                
                # 1. Busca Info do NCM atual, se possível
                if current_ncm and len(current_ncm) >= 4:
                     try:
                        info = helper.get_info(current_ncm)
                     except Exception as e:
                        print(f"Erro ao buscar NCM {current_ncm}: {e}")
                        info = None

                if not current_ncm or len(current_ncm) < 8:
                    status = "INVALID_FORMAT"
                elif not info:
                    status = "NOT_FOUND"
                
                # Se invalido, tenta recuperar
                if status != "VALID":
                     try:
                         suggestion_code = helper.attempt_recovery(p.nome_produto)
                         if suggestion_code:
                             suggestion = suggestion_code
                             status = "SUGGESTED"
                             # Recuperar info do NCM sugerido para permitir aplicacao completa
                             info_sug = helper.get_info(suggestion)
                             if info_sug:
                                 info = info_sug
                     except: pass

                # Se for VALID, vamos forcar 'sugestao' = current_ncm para permitir
                # que o botao "Aplicar" ou "Auto Fix" funcione para atualizar taxas.
                if status == "VALID" and info and not suggestion:
                     suggestion = current_ncm

                item_res = {
                    "id": p.id_produto,
                    "nome": p.nome_produto,
                    "ncm_atual": p.ncm,
                    "status": status,
                    "sugestao": suggestion,
                    "info": info
                }
                
                # Previne erro de JSON serialization se tiver valores invalidos
                results.append(item_res)
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print("CRITICAL ERROR IN AUDIT_TAXES:")
            print(error_details)
            # Log em arquivo no desktop para debugging em .exe
            try:
                desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
                with open(os.path.join(desktop, 'tax_error_log.txt'), 'w') as f:
                    f.write(error_details)
            except: pass
            
            return Response({"error": str(e), "details": error_details}, status=500)
            
        return Response(results)


    @action(detail=False, methods=['post'])
    def suggest_ncm(self, request):
        """
        Sugere NCM baseado no nome do produto (para uso no formulário de cadastro).
        Aceita opcionalmente 'gtin' para validação futura.
        """
        nome = request.data.get('nome', '')
        gtin = request.data.get('gtin', '')
        
        if not nome and not gtin:
            return Response({"error": "Nome do produto ou GTIN é obrigatório"}, status=400)
            
        helper = TaxAuditHelper()
        if not helper.db_path:
             return Response({"error": "Banco de dados tributário não disponivel."}, status=500)
             
        suggestion_code = None
        
        # 1. Tentar busca por GTIN (Futuro - placeholder)
        if gtin and len(gtin) in [8, 12, 13, 14] and gtin.isdigit():
            # TODO: Implementar busca por GTIN quando houver tabela
            pass
            
        # 2. Tentar busca por Nome
        if not suggestion_code and nome:
            suggestion_code = helper.attempt_recovery(nome)
        
        if suggestion_code:
            info = helper.get_info(suggestion_code)
            return Response({
                "found": True,
                "ncm": suggestion_code,
                "gtin_used": bool(gtin),
                "info": info
            })
        else:
            return Response({"found": False, "message": "Nenhum NCM sugerido para este termo/GTIN."})

    @action(detail=False, methods=['post'])
    def lookup_ncm_by_gtin(self, request):
        """
        Consulta produto por GTIN/EAN via APIs públicas e sugere NCM com base no nome encontrado.
        Tenta: Open Food Facts (alimentos), UPC Item DB (geral).
        Retorna: { found, gtin, nome_produto, source, ncm, ncm_info }
        """
        import requests as req

        gtin = request.data.get('gtin', '').strip()
        if not gtin or len(gtin) not in [8, 12, 13, 14] or not gtin.isdigit():
            return Response({"error": "GTIN inválido. Informe 8, 12, 13 ou 14 dígitos numéricos."}, status=400)

        product_name = None
        source = None

        # 1. Open Food Facts (melhor para alimentos/supermercado, gratuito)
        try:
            url = f"https://world.openfoodfacts.org/api/v0/product/{gtin}.json"
            r = req.get(url, timeout=6, headers={'User-Agent': 'SistemaGerencial/1.0 (+https://github.com/)'})
            if r.status_code == 200:
                data = r.json()
                if data.get('status') == 1:
                    p = data.get('product', {})
                    name = (p.get('product_name_pt') or p.get('product_name') or
                            p.get('generic_name_pt') or p.get('generic_name'))
                    if name and len(name) > 2:
                        product_name = name.strip()
                        source = 'Open Food Facts'
        except Exception as e:
            print(f"[GTIN] Open Food Facts error: {e}")

        # 2. UPC Item DB fallback (produtos em geral)
        if not product_name:
            try:
                url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={gtin}"
                r = req.get(url, timeout=6)
                if r.status_code == 200:
                    data = r.json()
                    items = data.get('items', [])
                    if items:
                        name = items[0].get('title') or items[0].get('description')
                        if name and len(name) > 2:
                            product_name = name.strip()
                            source = 'UPC Item DB'
            except Exception as e:
                print(f"[GTIN] UPC Item DB error: {e}")

        if not product_name:
            return Response({
                "found": False,
                "gtin": gtin,
                "message": f"Produto com GTIN {gtin} não encontrado nas bases públicas.",
            })

        # Sugerir NCM pela descrição encontrada
        helper = TaxAuditHelper()
        ncm_code = None
        ncm_info = None

        if helper.db_path:
            ncm_code = helper.attempt_recovery(product_name)
            if ncm_code:
                ncm_info = helper.get_info(ncm_code)

        return Response({
            "found": True,
            "gtin": gtin,
            "nome_produto": product_name,
            "source": source,
            "ncm": ncm_code,
            "ncm_info": ncm_info,
        })

    @action(detail=False, methods=['post'])
    def search_ncm_keyword(self, request):
        """
        Busca NCMs por palavra-chave retornando múltiplos candidatos ordenados por relevância.
        Aceita: { query: str, limit: int }
        Retorna: { found, query, results: [{ncm, descricao, score, info}] }
        """
        query = request.data.get('query', '').strip()
        limit = min(int(request.data.get('limit', 10)), 30)

        if not query or len(query) < 3:
            return Response({"error": "Informe ao menos 3 caracteres para a busca."}, status=400)

        helper = TaxAuditHelper()
        if not helper.db_path:
            return Response({"error": "Banco de dados tributário não disponível."}, status=500)

        results = helper.attempt_recovery_multi(query, limit=limit)

        return Response({
            "found": len(results) > 0,
            "query": query,
            "results": results,
        })

    @action(detail=False, methods=['post'])
    def apply_ncm_correction(self, request):
        """
        Aplica correcoes recebidas {id: 'novo_ncm', 'classificacao': '...', 'ibs': 0.0, 'cbs': 0.0}
        """
        import json
        corrections = request.data.get('corrections', [])
        count = 0
        for item in corrections:
            pid = item.get('id')
            ncm = item.get('ncm')
            classificacao = item.get('classificacao')
            ibs = item.get('ibs')
            cbs = item.get('cbs')
            
            if pid:
                try:
                    p = Produto.objects.get(id_produto=pid)
                    if ncm:
                        p.ncm = str(ncm).replace('.','').strip()
                    if classificacao:
                        p.classificacao = classificacao
                    
                    # Salva IBS/CBS diretamente em TributacaoProduto
                    if ibs is not None or cbs is not None:
                        from .models import TributacaoProduto
                        trib_obj, _ = TributacaoProduto.objects.get_or_create(produto=p)
                        if ibs is not None: trib_obj.ibs_aliquota = ibs
                        if cbs is not None: trib_obj.cbs_aliquota = cbs
                        trib_obj.save()

                    p.save()
                    count += 1
                except: pass
        return Response({"message": f"{count} produtos atualizados com sucesso."})

    @action(detail=False, methods=['post'])
    def launch_correction_tool(self, request):
        import subprocess
        import os
        import sys

        try:
            # Tenta localizar o script de correção
            # Caminho fixo baseado na estrutura conhecida
            bat_file_paths = [
                r"c:\Projetos\SistemaGerencial\dist\SistemaGerencial\INICIAR_CORRECAO.bat",
                r"c:\Projetos\SistemaGerencial\Correcao_de_Tributacao\INICIAR_CORRECAO.bat",
                r"c:\SistemaGerencial\Correcao_de_Tributacao\INICIAR_CORRECAO.bat",
            ]
            
            target_bat = None
            for p in bat_file_paths:
                if os.path.exists(p):
                    target_bat = p
                    break
            
            if not target_bat:
                 # Tentativa relativa
                 base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                 target_bat = os.path.join(base, "Correcao_de_Tributacao", "INICIAR_CORRECAO.bat")
            
            if not target_bat or not os.path.exists(target_bat):
                return Response({"error": "Ferramenta não encontrada no servidor."}, status=404)

            cwd = os.path.dirname(target_bat)
            
            if os.name == 'nt':
                 subprocess.Popen([target_bat], cwd=cwd, shell=True)
                 return Response({"message": "Ferramenta iniciada no servidor."})
            else:
                 return Response({"error": "Operação disponível apenas em Windows."}, status=400)

        except Exception as e:
            return Response({"error": f"Falha ao iniciar: {str(e)}"}, status=500)

    # ── CST IBS/CBS ────────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'])
    def listar_cst(self, request):
        """Retorna todos os CST (SITUACAO_TRIBUTARIA) do banco tributário."""
        helper = TaxAuditHelper()
        if not helper.db_path:
            return Response({"error": "Banco tributário não disponível."}, status=500)
        try:
            conn = helper.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT SITR_ID, SITR_CD, SITR_DESCRICAO FROM SITUACAO_TRIBUTARIA ORDER BY SITR_CD")
            rows = cursor.fetchall()
            conn.close()
            return Response([{"id": r[0], "codigo": r[1], "descricao": r[2]} for r in rows])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def criar_cst(self, request):
        """Cria novo CST (SITUACAO_TRIBUTARIA)."""
        codigo = request.data.get('codigo', '').strip()
        descricao = request.data.get('descricao', '').strip()
        if not codigo or not descricao:
            return Response({"error": "Informe código e descrição."}, status=400)
        helper = TaxAuditHelper()
        if not helper.db_path:
            return Response({"error": "Banco tributário não disponível."}, status=500)
        try:
            conn = helper.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT SITR_ID FROM SITUACAO_TRIBUTARIA WHERE SITR_CD = ?", (codigo,))
            if cursor.fetchone():
                conn.close()
                return Response({"error": f"Código {codigo} já existe."}, status=400)
            cursor.execute(
                "INSERT INTO SITUACAO_TRIBUTARIA (SITR_CD, SITR_DESCRICAO) VALUES (?, ?)",
                (codigo, descricao)
            )
            new_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return Response({"id": new_id, "codigo": codigo, "descricao": descricao}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    # ── cClassTrib ─────────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'])
    def listar_classificacoes(self, request):
        """Retorna todas as classificações tributárias (CLASSIFICACAO_TRIBUTARIA)."""
        helper = TaxAuditHelper()
        if not helper.db_path:
            return Response({"error": "Banco tributário não disponível."}, status=500)
        try:
            conn = helper.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT C.CLTR_ID, C.CLTR_CD, C.CLTR_DESCRICAO, S.SITR_CD
                FROM CLASSIFICACAO_TRIBUTARIA C
                LEFT JOIN SITUACAO_TRIBUTARIA S ON C.CLTR_SITR_ID = S.SITR_ID
                ORDER BY C.CLTR_CD
            """)
            rows = cursor.fetchall()
            conn.close()
            return Response([
                {"id": r[0], "codigo": r[1], "descricao": r[2], "cst": r[3] or ""}
                for r in rows
            ])
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def criar_classificacao(self, request):
        """Cria nova classificação tributária (CLASSIFICACAO_TRIBUTARIA)."""
        codigo = request.data.get('codigo', '').strip()
        descricao = request.data.get('descricao', '').strip()
        cst_codigo = request.data.get('cst', '').strip()
        if not codigo or not descricao:
            return Response({"error": "Informe código e descrição."}, status=400)
        helper = TaxAuditHelper()
        if not helper.db_path:
            return Response({"error": "Banco tributário não disponível."}, status=500)
        try:
            conn = helper.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT CLTR_ID FROM CLASSIFICACAO_TRIBUTARIA WHERE CLTR_CD = ?", (codigo,))
            if cursor.fetchone():
                conn.close()
                return Response({"error": f"Código {codigo} já existe."}, status=400)
            sitr_id = None
            if cst_codigo:
                cursor.execute("SELECT SITR_ID FROM SITUACAO_TRIBUTARIA WHERE SITR_CD = ?", (cst_codigo,))
                row = cursor.fetchone()
                if row:
                    sitr_id = row[0]
            cursor.execute(
                "INSERT INTO CLASSIFICACAO_TRIBUTARIA (CLTR_CD, CLTR_DESCRICAO, CLTR_SITR_ID) VALUES (?, ?, ?)",
                (codigo, descricao, sitr_id)
            )
            new_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return Response({"id": new_id, "codigo": codigo, "descricao": descricao, "cst": cst_codigo}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def update(self, request, *args, **kwargs):
        """Sobrescrever update para garantir que imagem_url seja salva"""
        from .models import GrupoProduto
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # DEBUG: Ver o que está chegando
        imagem_recebida = request.data.get('imagem_url')
        print(f"\n🔍 DEBUG UPDATE - Produto ID {instance.id_produto}")
        print(f"  - imagem_url recebida: {imagem_recebida[:100] if imagem_recebida else 'None'}...")
        print(f"  - Tamanho: {len(imagem_recebida) if imagem_recebida else 0} caracteres")
        print(f"  - categoria recebida: [{request.data.get('categoria')}]")
        print(f"  - produtos_complementares recebidos: {request.data.get('produtos_complementares')}")
        print(f"  - ALL request.data keys: {list(request.data.keys())}\n")
        
        # Extrair campos que podem ser atualizados
        data = {
            'codigo_produto': request.data.get('codigo_produto', instance.codigo_produto),
            'nome_produto': request.data.get('nome_produto', instance.nome_produto),
            'descricao': request.data.get('descricao', instance.descricao),
            'unidade_medida': request.data.get('unidade_medida', instance.unidade_medida),
            'marca': request.data.get('marca', instance.marca),
            'categoria': request.data.get('categoria', instance.categoria),
            'classificacao': request.data.get('classificacao', instance.classificacao),
            'ncm': request.data.get('ncm', instance.ncm),
            'cest': request.data.get('cest', instance.cest),
            'gtin': request.data.get('gtin', instance.gtin),
            'observacoes': request.data.get('observacoes', instance.observacoes),
            'imagem_url': request.data.get('imagem_url', instance.imagem_url),  # CRÍTICO: salvar imagem_url
            # Campos de materiais de construção
            'metragem_caixa': request.data.get('metragem_caixa', instance.metragem_caixa),
            'rendimento_m2': request.data.get('rendimento_m2', instance.rendimento_m2),
            'peso_unitario': request.data.get('peso_unitario', instance.peso_unitario),
            'variacao': request.data.get('variacao', instance.variacao),
            'consumo_argamassa_m2': request.data.get('consumo_argamassa_m2', instance.consumo_argamassa_m2),
            'peso_saco_argamassa': request.data.get('peso_saco_argamassa', instance.peso_saco_argamassa),
            'tipo_aplicacao_argamassa': request.data.get('tipo_aplicacao_argamassa', instance.tipo_aplicacao_argamassa),
            'controla_lote': request.data.get('controla_lote', instance.controla_lote),
            'genero': request.data.get('genero', instance.genero),
        }
        
        # Tratar id_grupo separadamente (precisa ser objeto GrupoProduto, não ID)
        id_grupo_value = request.data.get('id_grupo')
        if id_grupo_value is not None:
            try:
                grupo = GrupoProduto.objects.get(id_grupo=id_grupo_value)
                instance.id_grupo = grupo
            except GrupoProduto.DoesNotExist:
                pass  # Mantém o grupo atual se não encontrar
        
        # Tratar produto_pai separadamente (ForeignKey para si mesmo)
        produto_pai_value = request.data.get('produto_pai')
        if produto_pai_value is not None:
            if produto_pai_value == '' or produto_pai_value == 0:
                # Limpar produto_pai se enviar vazio ou 0
                instance.produto_pai = None
            else:
                try:
                    from .models import Produto
                    pai = Produto.objects.get(id_produto=produto_pai_value)
                    instance.produto_pai = pai
                    print(f"✅ produto_pai definido para: {pai.codigo_produto} (ID: {pai.id_produto})")
                except Produto.DoesNotExist:
                    print(f"⚠️ Produto pai ID {produto_pai_value} não encontrado")
                    pass  # Mantém o produto_pai atual se não encontrar
        
        # Atualizar apenas campos não-nulos
        for field, value in data.items():
            if value is not None:
                setattr(instance, field, value)
        
        instance.save()
        
        # Tratar produtos_complementares (M2M)
        complementares_value = request.data.get('produtos_complementares')
        if complementares_value is not None:
            from .models import ProdutoComplementar, Produto
            # Limpar os vínculos existentes e recriar
            ProdutoComplementar.objects.filter(produto=instance).delete()
            if isinstance(complementares_value, list):
                for idx, item in enumerate(complementares_value):
                    prod_id = item.get('id_produto') if isinstance(item, dict) else item
                    if prod_id:
                        try:
                            prod_comp = Produto.objects.get(id_produto=prod_id)
                            ProdutoComplementar.objects.create(
                                produto=instance,
                                produto_complementar=prod_comp,
                                ordem=item.get('ordem', idx) if isinstance(item, dict) else idx
                            )
                        except Produto.DoesNotExist:
                            pass

        # Tratar produtos_similares (M2M)
        similares_value = request.data.get('produtos_similares')
        if similares_value is not None:
            from .models import ProdutoSimilar, Produto
            ProdutoSimilar.objects.filter(produto=instance).delete()
            if isinstance(similares_value, list):
                for idx, item in enumerate(similares_value):
                    prod_id = item.get('id_produto') if isinstance(item, dict) else item
                    if prod_id:
                        try:
                            prod_sim = Produto.objects.get(id_produto=prod_id)
                            ProdutoSimilar.objects.create(
                                produto=instance,
                                produto_similar=prod_sim,
                                ordem=item.get('ordem', idx) if isinstance(item, dict) else idx
                            )
                        except Produto.DoesNotExist:
                            pass
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def corrigir_ncm_arquivo(self, request):
        """
        Recebe planilha Excel ou CSV para corrigir NCMs.
        Espera colunas: 'codigo' e 'ncm'.
        """
        if 'file' not in request.FILES:
            return Response({'error': 'Arquivo não fornecido. Selecione a planilha.'}, status=400)
        
        file_obj = request.FILES['file']
        filename = file_obj.name.lower()
        
        updated = 0
        errors = []
        
        if filename.endswith('.csv'):
            import csv
            try:
                # Decodificar arquivo
                try:
                    file_data_str = file_obj.read().decode('utf-8')
                except UnicodeDecodeError:
                    file_obj.seek(0)
                    file_data_str = file_obj.read().decode('latin-1')
                
                file_data = file_data_str.splitlines()
                reader = csv.reader(file_data, delimiter=';') # Tentar ponto-e-vírgula primeiro
                rows = list(reader)
                
                # Se só tem 1 coluna, tentar vírgula
                if rows and len(rows[0]) < 2:
                    file_obj.seek(0)
                    # Recarregar string
                    try:
                         # Re-read is safe because we read into variable, but logic above consumed stream? 
                         # We read from file_data_str which is in memory.
                        reader = csv.reader(file_data, delimiter=',')
                        rows = list(reader)
                    except:
                        pass
                
                if not rows:
                    return Response({'error': 'Arquivo CSV vazio'}, status=400)

                # Cabeçalho
                headers = {}
                header_row = rows[0]
                for idx, cell in enumerate(header_row):
                    if cell:
                        headers[str(cell).lower().strip()] = idx
                
                # Mapear colunas (Lógica igual ao Excel)
                col_codigo = None
                possible_codigos = ['codigo', 'código', 'codigo_produto', 'cod', 'cod_prod']
                for name in possible_codigos:
                    if name in headers:
                        col_codigo = headers[name]
                        break
                col_ncm = headers.get('ncm')
                
                if col_codigo is None or col_ncm is None:
                     return Response({'error': 'Colunas CODIGO e NCM obrigatórias.'}, status=400)

                # Processar linhas
                for row in rows[1:]:
                    if not row or len(row) <= max(col_codigo, col_ncm): continue
                    
                    val_codigo = row[col_codigo]
                    val_ncm = row[col_ncm]
                    
                    if not val_codigo: continue
                    
                    try:
                        codigo_str = str(val_codigo).strip()
                        produto = Produto.objects.filter(codigo_produto=codigo_str).first()
                        if produto and val_ncm:
                            ncm_str = str(val_ncm).strip().replace('.', '')
                            produto.ncm = ncm_str
                            produto.save()
                            updated += 1
                    except Exception as e:
                        errors.append(f"Erro {val_codigo}: {e}")
                        
            except Exception as e:
                return Response({'error': f'Erro CSV: {str(e)}'}, status=400)
        
        else:
            # Tentar Excel (requer openpyxl)
            try:
                import openpyxl
            except ImportError:
                return Response({'error': 'Suporte a Excel (.xlsx) indisponível sistema. Por favor salve como .CSV (separado por ponto-e-vírgula) e tente novamente.'}, status=500)

            try:
                wb = openpyxl.load_workbook(file_obj, data_only=True)
                ws = wb.active
                
                # Identificar colunas pelo cabeçalho (linha 1)
                headers = {}
                header_row = list(ws.rows)[0] # Pega primeira linha
                for idx, cell in enumerate(header_row):
                    if cell.value:
                        headers[str(cell.value).lower().strip()] = idx

                # Mapear colunas
                col_codigo = None
                possible_codigos = ['codigo', 'código', 'codigo_produto', 'cod', 'cod_prod']
                for name in possible_codigos:
                    if name in headers:
                        col_codigo = headers[name]
                        break
                
                col_ncm = headers.get('ncm')
                
                if col_codigo is None:
                    return Response({'error': 'Coluna de CÓDIGO não encontrada na planilha. Use "codigo" ou "codigo_produto".'}, status=400)
                if col_ncm is None:
                    return Response({'error': 'Coluna "NCM" não encontrada na planilha.'}, status=400)

                # Iterar dados (pular cabeçalho)
                for row in ws.iter_rows(min_row=2, values_only=True):
                    # Verificar se linha tem dados suficientes
                    if not row or len(row) <= max(col_codigo, col_ncm):
                        continue

                    val_codigo = row[col_codigo]
                    val_ncm = row[col_ncm]
                    
                    if val_codigo is None: 
                        continue

                    try:
                        codigo_str = str(val_codigo).strip()
                        # Buscar produto
                        produto = Produto.objects.filter(codigo_produto=codigo_str).first()
                        
                        if produto and val_ncm:
                            ncm_str = str(val_ncm).strip().replace('.', '')
                            produto.ncm = ncm_str
                            produto.save()
                            updated += 1
                            
                    except Exception as e:
                        errors.append(f"Erro produto {val_codigo}: {e}")

            except Exception as e:
                return Response({'error': f'Erro ao processar Excel: {str(e)}'}, status=400)

        return Response({
            'message': f'Processamento concluído! {updated} produtos atualizados.',
            'errors': errors
        })

    # ──────────────────────────────────────────────────────────────────────────
    # Tributação — Motor Fiscal Hierárquico
    # ──────────────────────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    def tributar(self, request, pk=None):
        """
        Calcula a tributação do produto usando o motor fiscal hierárquico (Tributador).

        Body JSON:
        {
            "empresa_id":     1,               -- opcional; usa EmpresaConfig do usuário se ausente
            "valor_unitario": 150.00,
            "quantidade":     5,
            "uf_destino":    "MG",             -- opcional
            "uf_origem":     "SP",             -- opcional
            "tipo_operacao":  "INTERNA",       -- opcional, padrão INTERNA
            "tipo_cliente":   "CONSUMIDOR_FINAL" -- opcional: TODOS|CONSUMIDOR_FINAL|REVENDEDOR
        }
        """
        from .services.tributador import Tributador

        data = request.data
        empresa_id     = data.get('empresa_id')
        uf_destino     = data.get('uf_destino')
        uf_origem      = data.get('uf_origem')
        tipo_operacao  = data.get('tipo_operacao', 'INTERNA')
        tipo_cliente   = data.get('tipo_cliente', 'TODOS')
        valor_unitario = data.get('valor_unitario', 0)
        quantidade     = data.get('quantidade', 1)

        try:
            t = Tributador(
                produto_id    = int(pk),
                empresa_id    = int(empresa_id) if empresa_id else None,
                uf_destino    = uf_destino,
                tipo_operacao = tipo_operacao,
                tipo_cliente  = tipo_cliente,
                uf_origem     = uf_origem,
            )
            resultado = t.tributar(
                valor_unitario = valor_unitario,
                quantidade     = quantidade,
            )
            return Response(resultado.to_dict())

        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            return Response(
                {"error": f"Erro no cálculo tributário: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ──────────────────────────────────────────────────────────────────────────
    # Gerenciamento da API do Governo (Reforma Tributária)
    # ──────────────────────────────────────────────────────────────────────────

    @action(detail=False, methods=['post'], url_path='gov-api/start')
    def start_gov_api(self, request):
        """
        POST /api/produtos/gov-api/start/
        Inicia a API oficial do governo para cálculo de IBS/CBS.
        """
        manager = get_gov_api_manager()
        result = manager.start(wait_timeout=30)
        
        if result['status'] in ['running', 'started']:
            return Response(result, status=200)
        elif result['status'] == 'timeout':
            return Response(result, status=202)  # Accepted mas ainda não pronto
        else:
            return Response(result, status=500)

    @action(detail=False, methods=['post'], url_path='gov-api/stop')
    def stop_gov_api(self, request):
        """
        POST /api/produtos/gov-api/stop/
        Para a API oficial do governo.
        """
        manager = get_gov_api_manager()
        result = manager.stop()
        return Response(result)

    @action(detail=False, methods=['get'], url_path='gov-api/status')
    def status_gov_api(self, request):
        """
        GET /api/produtos/gov-api/status/
        Verifica status da API oficial do governo.
        """
        manager = get_gov_api_manager()
        result = manager.status()
        return Response(result)

    @action(detail=False, methods=['post'], url_path='calcular-tributos-auto')
    def calcular_tributos_auto(self, request):
        """
        POST /api/produtos/calcular-tributos-auto/
        Sistema inteligente: Inicia API do governo (se necessário) e calcula tributos.
        
        Body opcional: {"ids": [1, 2, 3]} para calcular apenas produtos específicos.
        """
        manager = get_gov_api_manager()
        
        # 1. Verificar se API está rodando
        if not manager.is_running():
            # Tentar iniciar
            start_result = manager.start(wait_timeout=30)
            
            if start_result['status'] == 'error':
                return Response({
                    'status': 'error',
                    'message': 'Não foi possível iniciar a API do Governo',
                    'details': start_result,
                    'modo': 'fallback_local'
                }, status=200)  # 200 porque vai usar fallback
            
            elif start_result['status'] == 'timeout':
                return Response({
                    'status': 'warning',
                    'message': 'API iniciada mas ainda não respondeu. Usando banco local.',
                    'details': start_result,
                    'modo': 'fallback_local'
                }, status=200)
        
        # 2. API disponível - fazer preview
        try:
            resp_preview = self.preview_tributos(request)
            preview_data = resp_preview.data
            
            total_produtos = preview_data.get('total', 0)
            total_com_mudancas = preview_data.get('com_mudancas', 0)
            total_ncm_suspeitos = preview_data.get('ncm_suspeitos', 0)
            
            # 3. Aplicar tributos automaticamente nos produtos com mudanças
            ids_com_mudancas = [
                item['id'] for item in preview_data.get('preview', [])
                if item.get('tem_mudancas') and not item.get('ncm_suspeito')
            ]
            
            if not ids_com_mudancas:
                return Response({
                    'status': 'success',
                    'message': 'Nenhum produto precisa de atualização',
                    'api_disponivel': True,
                    'produtos_analisados': total_produtos,
                    'produtos_atualizados': 0,
                    'com_mudancas': total_com_mudancas,
                    'ncm_suspeitos': total_ncm_suspeitos
                })
            
            # 4. Atualizar produtos diretamente (sem passar pelo request.data)
            from .models import TributacaoProduto
            helper = TaxAuditHelper()
            produtos_atualizados = 0
            
            gov_api = get_gov_api_service()
            
            for produto_id in ids_com_mudancas:
                try:
                    p = Produto.objects.get(id_produto=produto_id)
                    ncm_clean = str(p.ncm).replace('.', '').strip()
                    
                    info = helper.get_info(ncm_clean)
                    if info:
                        # Cria ou atualiza o registro na tabela dedicada
                        tributacao, created = TributacaoProduto.objects.get_or_create(produto=p)
                        
                        # Atualiza classificacao_fiscal e CST do banco local
                        tributacao.classificacao_fiscal = info.get('classificacao')
                        tributacao.cst_ibs_cbs = info.get('cst_ibs_cbs', '000')
                        
                        # Tenta obter alíquotas da API do governo (dados oficiais)
                        api_result = None
                        fonte_dados = "ncm_local.db / Auto"
                        
                        if gov_api.api_disponivel:
                            try:
                                api_result = gov_api.calcular_tributos(
                                    ncm=ncm_clean,
                                    cst=tributacao.cst_ibs_cbs,
                                    c_class_trib=tributacao.classificacao_fiscal
                                )
                                if api_result:
                                    fonte_dados = "API Governo (Oficial)"
                            except:
                                pass
                        
                        # Define alíquotas: API governo > banco local > valores padrão
                        if api_result:
                            # Usa dados oficiais da API do governo
                            ibs_value = api_result['ibs_aliquota']
                            cbs_value = api_result['cbs_aliquota']
                            imposto_seletivo = api_result.get('imposto_seletivo', 0.0)
                        else:
                            # Fallback para banco local
                            cbs_value = info.get('cbs', 0.0)
                            ibs_value = info.get('ibs', 0.0)
                            imposto_seletivo = info.get('is', 0.0)
                            
                            # Aplica valores padrão se banco local retornar 0.0
                            if cbs_value == 0.0:
                                cbs_value = 0.9
                            if ibs_value == 0.0:
                                ibs_value = 0.1
                        
                        tributacao.cbs_aliquota = cbs_value
                        tributacao.ibs_aliquota = ibs_value
                        tributacao.imposto_seletivo_aliquota = imposto_seletivo
                        tributacao.fonte_info = fonte_dados
                        tributacao.save()
                        
                        print(f"[DEBUG] Produto {produto_id} ({p.nome_produto}): IBS={ibs_value}% CBS={cbs_value}% CST={tributacao.cst_ibs_cbs} cClassTrib={tributacao.classificacao_fiscal}")
                        produtos_atualizados += 1
                except Exception as e:
                    print(f"Erro ao atualizar produto {produto_id}: {e}")
                    continue
            
            return Response({
                'status': 'success',
                'message': f'Tributos calculados com API oficial do governo',
                'api_disponivel': True,
                'produtos_analisados': total_produtos,
                'produtos_atualizados': produtos_atualizados,
                'com_mudancas': total_com_mudancas,
                'ncm_suspeitos': total_ncm_suspeitos
            })
            
        except Exception as e:
            import traceback
            print(f"Erro em calcular_tributos_auto: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'status': 'error',
                'message': f'Erro ao calcular tributos: {str(e)}'
            }, status=500)
    
    @action(detail=False, methods=['get'], url_path='marcas')
    def listar_marcas(self, request):
        """Retorna lista de marcas únicas de produtos"""
        from .models import Produto
        marcas = Produto.objects.values_list('marca', flat=True).distinct().order_by('marca')
        # Filtrar valores vazios/nulos
        marcas_filtradas = [marca for marca in marcas if marca and marca.strip()]
        return Response(marcas_filtradas)
    
    @action(detail=False, methods=['get'], url_path='categorias')
    def listar_categorias(self, request):
        """Retorna lista de categorias únicas de produtos"""
        from .models import Produto
        categorias = Produto.objects.values_list('categoria', flat=True).distinct().order_by('categoria')
        # Filtrar valores vazios/nulos
        categorias_filtradas = [cat for cat in categorias if cat and cat.strip()]
        return Response(categorias_filtradas)
