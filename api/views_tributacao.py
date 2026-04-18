from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
import sqlite3
import os

class CalculadoraTributariaView(APIView):
    """
    API para cálculo de tributos (IBS, CBS, CST, Classificação) 
    baseado na Tabela do Governo (NCM).
    """

    def get_db_connection(self):
        candidates = [
            r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\Correcao_de_Tributacao\ncm_local.db",
            r"C:\Projetos\SistemaGerencial\Correcao_de_Tributacao\ncm_local.db",
            r"C:\SistemaGerencial\Correcao_de_Tributacao\ncm_local.db",
            # Caminho sugerido pelo usuário (caso mova o DB para lá)
            r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\Correcao_de_Tributacao\Calculadora_Gov_Oficial\ncm_local.db"
        ]
        
        db_path = None
        for c in candidates:
            if os.path.exists(c):
                db_path = c
                break
        
        if not db_path:
            return None
            
        return sqlite3.connect(db_path)

    def get(self, request):
        """
        Calcula tributos para um dado NCM e Valor.
        Ex: GET /api/tributacao/calcular/?ncm=84713012&valor=100.00
        """
        ncm = request.query_params.get('ncm')
        valor = request.query_params.get('valor', 0)
        
        if not ncm:
            return Response({"error": "NCM é obrigatório"}, status=400)
            
        try:
            valor = float(valor)
        except:
            return Response({"error": "Valor inválido"}, status=400)

        conn = self.get_db_connection()
        if not conn:
            return Response({"error": "Banco de dados tributário não encontrado (ncm_local.db)"}, status=503)

        try:
            cursor = conn.cursor()
            ncm_clean = str(ncm).replace('.', '').strip()
            
            # Buscar Classificação e CST
            # Tenta exato (8 digitos) ou fallback (6, 4...)
            cursor.execute("""
                SELECT C.CLTR_CD, S.SITR_CD, N.NCM_DESCRICAO, C.CLTR_ID
                FROM NCM_APLICAVEL A
                JOIN CLASSIFICACAO_TRIBUTARIA C ON A.NCMA_CLTR_ID = C.CLTR_ID
                LEFT JOIN NCM N ON A.NCMA_NCM_CD = N.NCM_CD
                LEFT JOIN SITUACAO_TRIBUTARIA S ON C.CLTR_SITR_ID = S.SITR_ID
                WHERE A.NCMA_NCM_CD = ? 
                LIMIT 1
            """, (ncm_clean,))
            
            row = cursor.fetchone()
            
            if not row and len(ncm_clean) > 6:
                 # Fallback 6 digitos
                 cursor.execute("""
                    SELECT C.CLTR_CD, S.SITR_CD, N.NCM_DESCRICAO, C.CLTR_ID
                    FROM NCM_APLICAVEL A
                    JOIN CLASSIFICACAO_TRIBUTARIA C ON A.NCMA_CLTR_ID = C.CLTR_ID
                    LEFT JOIN NCM N ON A.NCMA_NCM_CD = N.NCM_CD
                    LEFT JOIN SITUACAO_TRIBUTARIA S ON C.CLTR_SITR_ID = S.SITR_ID
                    WHERE A.NCMA_NCM_CD = ? 
                    LIMIT 1
                """, (ncm_clean[:6],))
                 row = cursor.fetchone()

            if not row:
                return Response({"error": "NCM não encontrado na tabela governamental"}, status=404)

            cltr_cd = row[0]
            cst = row[1]
            descricao = row[2]
            cltr_id = row[3]

            # Buscar Alíquotas (IBS=3+4, CBS=2)
            # 2 = CBS, 3 = IBS-UF, 4 = IBS-Mun
            cbs_rate = 0.0
            ibs_rate = 0.0
            
            cursor.execute("""
                SELECT AADV_TBTO_ID, AADV_VALOR 
                FROM ALIQUOTA_AD_VALOREM 
                WHERE AADV_CLTR_ID = ? 
                ORDER BY AADV_INICIO_VIGENCIA DESC
            """, (cltr_id,))
            
            rates_found = {} # avoid dups (usa a mais recente pelo order by)
            
            for r in cursor.fetchall():
                tid = r[0]
                val = r[1]
                if tid not in rates_found:
                    rates_found[tid] = val
            
            cbs_rate = rates_found.get(2, 0.0)
            ibs_rate = rates_found.get(3, 0.0) + rates_found.get(4, 0.0)

            # Calcular Valores
            cbs_valor = valor * (cbs_rate / 100)
            ibs_valor = valor * (ibs_rate / 100)

            response_data = {
                "ncm": ncm_clean,
                "descricao": descricao,
                "classificacao_fiscal": cltr_cd,
                "cst": cst,
                "aliquotas": {
                    "cbs_percentual": cbs_rate,
                    "ibs_percentual": ibs_rate,
                    "carga_tributaria_total": cbs_rate + ibs_rate
                },
                "calculo": {
                    "base_calculo": valor,
                    "cbs_valor": round(cbs_valor, 2),
                    "ibs_valor": round(ibs_valor, 2),
                    "total_impostos": round(cbs_valor + ibs_valor, 2)
                },
                "fonte": "Tabela IBPT/Gov (ncm_local.db)"
            }
            
            return Response(response_data)

        except Exception as e:
            return Response({"error": f"Erro interno: {str(e)}"}, status=500)
        finally:
            if conn: conn.close()
