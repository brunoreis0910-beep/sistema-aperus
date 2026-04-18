from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from api.models import Venda
from datetime import date
from django.utils import timezone
from datetime import timedelta

class SpedDiagnosticoView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Diagnóstico COMPLETO de vendas para SPED"""
        
        resultado = {
            "resumo_geral": {},
            "fevereiro_2026": {},
            "ultimas_vendas_banco": [],
            "por_modelo_documento": {}
        }
        
        # ===== RESUMO GERAL DO BANCO =====
        total_vendas = Venda.objects.count()
        resultado["resumo_geral"]["total_vendas_banco"] = total_vendas
        
        if total_vendas > 0:
            # Últimas 10 vendas do banco (qualquer período)
            ultimas = Venda.objects.all().order_by('-data_documento')[:10]
            for v in ultimas:
                resultado["ultimas_vendas_banco"].append({
                    "id_venda": v.id_venda,
                    "data_documento": str(v.data_documento),
                    "id_operacao": v.id_operacao_id,
                    "status_nfe": v.status_nfe or "NULL",
                    "numero_nfe": v.numero_nfe,
                    "serie_nfe": v.serie_nfe,
                    "chave_nfe": v.chave_nfe[:20] + "..." if v.chave_nfe else None
                })
            
            # Status de todas as vendas
            todas_vendas = Venda.objects.all()
            status_geral = {}
            for v in todas_vendas:
                st = v.status_nfe or 'NULL'
                status_geral[st] = status_geral.get(st, 0) + 1
            resultado["resumo_geral"]["por_status"] = status_geral
            
            # Operações usadas
            ops_todas = list(Venda.objects.values_list('id_operacao', flat=True).distinct())
            resultado["resumo_geral"]["operacoes_usadas"] = ops_todas
        
        # ===== FEVEREIRO 2026 - TODAS AS VENDAS =====
        dt_fev_ini = date(2026, 2, 1)
        dt_fev_fim = date(2026, 2, 28)
        
        # Testa diferentes formas de buscar
        # 1. Por data_documento sem usar .date()
        vendas_fev_v1 = Venda.objects.filter(
            data_documento__gte=timezone.make_aware(timezone.datetime.combine(dt_fev_ini, timezone.datetime.min.time())),
            data_documento__lte=timezone.make_aware(timezone.datetime.combine(dt_fev_fim, timezone.datetime.max.time()))
        )
        
        # 2. Por data_documento usando .date()
        vendas_fev_v2 = Venda.objects.filter(
            data_documento__date__gte=dt_fev_ini,
            data_documento__date__lte=dt_fev_fim
        )
        
        resultado["fevereiro_2026"]["com_datetime_gte_lte"] = vendas_fev_v1.count()
        resultado["fevereiro_2026"]["com_date_gte_lte"] = vendas_fev_v2.count()
        
        # Usar a que encontrou mais
        vendas_fev = vendas_fev_v1 if vendas_fev_v1.count() > 0 else vendas_fev_v2
        
        resultado["fevereiro_2026"]["total"] = vendas_fev.count()
        
        if vendas_fev.count() > 0:
            # Detalhes
            status_fev = {}
            for v in vendas_fev:
                st = v.status_nfe or 'NULL'
                status_fev[st] = status_fev.get(st, 0) + 1
            resultado["fevereiro_2026"]["por_status"] = status_fev
            
            ops_fev = list(vendas_fev.values_list('id_operacao', flat=True).distinct())
            resultado["fevereiro_2026"]["operacoes"] = ops_fev
            
            # Amostra
            amostra = []
            for v in vendas_fev[:10]:
                amostra.append({
                    "id_venda": v.id_venda,
                    "data": str(v.data_documento),
                    "id_operacao": v.id_operacao_id,
                    "status_nfe": v.status_nfe or "NULL",
                    "numero_nfe": v.numero_nfe,
                    "serie": v.serie_nfe
                })
            resultado["fevereiro_2026"]["amostra"] = amostra
        
        # ===== POR MODELO DE DOCUMENTO =====
        # Separar NFCe (série 1) vs NFe (série > 1)
        nfce = Venda.objects.filter(serie_nfe=1).count()
        nfe = Venda.objects.filter(serie_nfe__gt=1).count()
        resultado["por_modelo_documento"]["nfce_serie_1"] = nfce
        resultado["por_modelo_documento"]["nfe_serie_maior_1"] = nfe
        
        # ===== RECOMENDAÇÃO =====
        if vendas_fev.count() > 0:
            emitidas = vendas_fev.filter(status_nfe='EMITIDA').count()
            if emitidas > 0:
                ops = list(vendas_fev.filter(status_nfe='EMITIDA').values_list('id_operacao', flat=True).distinct())
                resultado["recomendacao"] = f"✓ Fevereiro tem {emitidas} vendas EMITIDAS. Operações: {ops}. Selecione um conjunto que inclua essas operações."
            else:
                sts = list(set([v.status_nfe or 'NULL' for v in vendas_fev]))
                resultado["recomendacao"] = f"⚠ Fevereiro tem {vendas_fev.count()} vendas, mas nenhuma com status EMITIDA. Status encontrados: {sts}"
        else:
            resultado["recomendacao"] = "✗ Não há vendas em fevereiro de 2026 na tabela 'vendas'. Verifique se NFC-e e CT-e estão em outras tabelas."
        
        return JsonResponse(resultado, safe=False, json_dumps_params={'indent': 2})
