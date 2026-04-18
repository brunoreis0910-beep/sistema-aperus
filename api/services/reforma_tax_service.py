import os
import sys
import sqlite3
import json
from decimal import Decimal
from django.conf import settings

class RepositorioReforma:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RepositorioReforma, cls).__new__(cls)
            cls._instance.inicializar()
        return cls._instance
    
    def inicializar(self):
        self.classification_map = {}
        self.db_path = self._find_db()
        self.json_path = self._find_json()
        self._load_json()
        
    def _find_db(self):
        # Localiza ncm_local.db
        candidates = [
            os.path.join(settings.BASE_DIR, "Correcao_de_Tributacao", "ncm_local.db"),
            os.path.join(settings.BASE_DIR, "ncm_local.db"),
            r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\Correcao_de_Tributacao\ncm_local.db"
        ]
        for p in candidates:
            if os.path.exists(p):
                return p
        return None

    def _find_json(self):
        # Localiza classificacoes.json
        candidates = [
            os.path.join(settings.BASE_DIR, "classificacoes.json"),
            os.path.join(settings.BASE_DIR, "..", "classificacoes.json"),
            r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\classificacoes.json"
        ]
        for p in candidates:
            if os.path.exists(p):
                return p
        return None

    def _load_json(self):
        if self.json_path and os.path.exists(self.json_path):
            try:
                with open(self.json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self.classification_map = {str(item.get('codigo', '')): item for item in data}
            except Exception as e:
                print(f"Erro loading JSON Reforma: {e}")

class ReformaTaxService:
    def __init__(self):
        self.repo = RepositorioReforma()
        self._cache_aliquotas_ref = None
        
    def _get_aliquotas_referencia(self):
        """
        Busca as alíquotas de referência do banco (valores oficiais da Reforma)
        Retorna dict com {tributo_id: valor}
        """
        if self._cache_aliquotas_ref is not None:
            return self._cache_aliquotas_ref
            
        aliquotas = {}
        if not self.repo.db_path:
            return aliquotas
            
        try:
            with sqlite3.connect(self.repo.db_path) as conn:
                cursor = conn.cursor()
                # Buscar alíquotas vigentes para 2026
                cursor.execute("""
                    SELECT ALRE_TBTO_ID, ALRE_VALOR
                    FROM ALIQUOTA_REFERENCIA
                    WHERE ALRE_INICIO_VIGENCIA <= '2026-12-31'
                      AND ALRE_FIM_VIGENCIA >= '2026-01-01'
                """)
                rows = cursor.fetchall()
                for row in rows:
                    aliquotas[row[0]] = Decimal(str(row[1]))
                    
        except Exception as e:
            print(f"Erro ao buscar alíquotas referência: {e}")
            
        self._cache_aliquotas_ref = aliquotas
        return aliquotas
        
    def get_info_ncm(self, ncm):
        """
        Retorna (cClassTrib, cst, descricao_class) para um NCM dado.
        Aplica busca hierárquica: 8 dígitos -> 6 -> 4 -> 2
        """
        if not self.repo.db_path:
            # Regra geral como fallback
            return "000001", "000", "NCM Válido (Regra Geral)"
            
        try:
            with sqlite3.connect(self.repo.db_path) as conn:
                cursor = conn.cursor()
                ncm_clean = str(ncm).strip().replace('.', '').replace('-', '').replace(' ', '')
                
                # Garantir 8 dígitos com padding
                ncm_clean = ncm_clean.ljust(8, '0')[:8]
                
                # Busca Hierárquica: 8 -> 6 -> 4 -> 2 dígitos
                candidates = []
                if len(ncm_clean) >= 8: candidates.append(ncm_clean[:8])
                if len(ncm_clean) >= 6: candidates.append(ncm_clean[:6])
                if len(ncm_clean) >= 4: candidates.append(ncm_clean[:4])
                if len(ncm_clean) >= 2: candidates.append(ncm_clean[:2])
                
                for cand in candidates:
                    query = """
                        SELECT C.CLTR_CD, S.SITR_CD, C.CLTR_DESCRICAO
                        FROM NCM_APLICAVEL A
                        JOIN CLASSIFICACAO_TRIBUTARIA C ON A.NCMA_CLTR_ID = C.CLTR_ID
                        LEFT JOIN SITUACAO_TRIBUTARIA S ON C.CLTR_SITR_ID = S.SITR_ID
                        WHERE A.NCMA_NCM_CD = ?
                        AND (A.NCMA_FIM_VIGENCIA IS NULL OR A.NCMA_FIM_VIGENCIA >= date('now'))
                        ORDER BY length(A.NCMA_NCM_CD) DESC
                        LIMIT 1
                    """
                    cursor.execute(query, (cand,))
                    row = cursor.fetchone()
                    if row:
                        return row[0], row[1], row[2] # Class, CST, Desc
                        
        except Exception as e:
            print(f"Erro DB Reforma get_info_ncm: {e}")
            
        # Se não encontrou, usa regra geral (primeiro fornecimento)
        return "000001", "000", "NCM Válido (Regra Geral)"

    def _get_aliquota_ad_valorem_ncm(self, ncm):
        """
        Busca alíquota ad valorem específica para um NCM
        Retorna (ibs_aliquota, cbs_aliquota) ou None
        """
        if not self.repo.db_path:
            return None
            
        try:
            with sqlite3.connect(self.repo.db_path) as conn:
                cursor = conn.cursor()
                ncm_clean = str(ncm).strip().replace('.', '').replace('-', '').ljust(8, '0')[:8]
                
                # Buscar alíquota específica para este NCM
                cursor.execute("""
                    SELECT V.AADV_VALOR, V.AADV_TBTO_ID
                    FROM ALIQUOTA_AD_VALOREM_PRODUTO P
                    JOIN ALIQUOTA_AD_VALOREM V ON P.AAVP_AADV_ID = V.AADV_ID
                    WHERE P.AAVP_NCM_CD = ?
                      AND P.AAVP_FIM_VIGENCIA >= date('now')
                    ORDER BY P.AAVP_INICIO_VIGENCIA DESC
                    LIMIT 1
                """, (ncm_clean,))
                row = cursor.fetchone()
                if row:
                    return Decimal(str(row[0])), row[1]
                    
        except Exception as e:
            print(f"Erro ao buscar alíquota ad valorem: {e}")
            
        return None

    def calcular_aliquotas(self, ncm):
        """
        Retorna dict com CST e Aliquotas IBS/CBS para o NCM.
        Usa alíquotas oficiais da Reforma Tributária (2026).
        """
        cClassTrib, cst_db, desc = self.get_info_ncm(ncm)
        
        # Buscar alíquotas de referência oficiais (TBTO_ID: 1=IBS, 2=CBS, 3=IBS_UF, 4=IBS_MUN)
        aliq_ref = self._get_aliquotas_referencia()
        
        # Valores padrão 2026: CBS=0.9%, IBS_UF=0.1%, IBS_MUN=0.0%
        cbs_valor = aliq_ref.get(2, Decimal("0.9"))  # TBTO_ID 2 = CBS
        ibs_uf_valor = aliq_ref.get(3, Decimal("0.1"))  # TBTO_ID 3 = IBS UF
        
        # Resultado base
        res = {
            "cst_ibs_cbs": cst_db or "000",
            "ibs_aliquota": ibs_uf_valor,
            "cbs_aliquota": cbs_valor,
            "cClassTrib": cClassTrib or "000001",
            "descricao_regra": desc or "NCM Válido (Regra Geral)"
        }
        
        # Verificar se existe alíquota ad valorem específica para este NCM
        aliq_adval = self._get_aliquota_ad_valorem_ncm(ncm)
        if aliq_adval:
            valor_adval, tributo_id = aliq_adval
            # Se encontrou alíquota específica, usar ela
            if tributo_id == 1:  # Alíquota combinada IVA
                # Dividir proporcionalmente (CBS ~8.8%, IBS ~17.7% = total ~26.5%)
                res["cbs_aliquota"] = (valor_adval * Decimal("0.33")).quantize(Decimal("0.01"))  # ~33% do total
                res["ibs_aliquota"] = (valor_adval * Decimal("0.67")).quantize(Decimal("0.01"))  # ~67% do total
        
        # CST: Converter códigos antigos para novos
        # CST 200 = Alíquota Normal -> CST 001 (Tributado Integralmente)
        if str(cst_db) == '200':
            res["cst_ibs_cbs"] = "001"
        
        # Lista de CSTs que zeram alíquota ad valorem (monofásicos, isentos, etc)
        csts_zerados = ['410', '401', '402', '403', '404', '405', '30', '40', '41', '50', '51', '60', '70', '90', '006']
        if str(res["cst_ibs_cbs"]) in csts_zerados:
            res["ibs_aliquota"] = Decimal("0.00")
            res["cbs_aliquota"] = Decimal("0.00")
            
        # Aplicar Reduções do JSON (se existir classificação)
        if cClassTrib and cClassTrib in self.repo.classification_map:
            rule = self.repo.classification_map[cClassTrib]
            
            # Reduções Percentuais
            red_cbs = Decimal(str(rule.get('percentualReducaoCbs', 0.0)))
            red_ibs = Decimal(str(rule.get('percentualReducaoIbsUf', 0.0) or rule.get('percentualReducaoIbs', 0.0)))
            
            # Aplicar redução: Alíquota Efetiva = Alíquota Base × (1 - Redução%)
            if red_cbs > 0:
                nova_cbs = res["cbs_aliquota"] * (Decimal("1") - red_cbs / Decimal("100"))
                res["cbs_aliquota"] = nova_cbs.quantize(Decimal("0.01"))
                
            if red_ibs > 0:
                nova_ibs = res["ibs_aliquota"] * (Decimal("1") - red_ibs / Decimal("100"))
                res["ibs_aliquota"] = nova_ibs.quantize(Decimal("0.01"))
            
        return res
