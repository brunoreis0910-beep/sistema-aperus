"""
views_churn.py — Análise de Churn com RFM scoring
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .services.churn_service import ChurnService

logger = logging.getLogger(__name__)


class ChurnDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        svc = ChurnService()
        return Response(svc.resumo())


class ChurnClientesRiscoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        svc = ChurnService()
        limite = int(request.query_params.get('limite', 50))
        clientes = svc.clientes_em_risco()[:limite]
        return Response({
            'total': len(clientes),
            'clientes': clientes,
        })


class ChurnRFMView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        svc = ChurnService()
        rfm = svc.calcular_rfm()
        # Converte para lista ordenada por score desc
        resultado = sorted(rfm.values(), key=lambda x: x.get('score_total', 0), reverse=True)

        # Aplica paginação simples
        pagina = int(request.query_params.get('pagina', 1))
        por_pagina = int(request.query_params.get('por_pagina', 100))
        inicio = (pagina - 1) * por_pagina
        fim = inicio + por_pagina

        return Response({
            'total': len(resultado),
            'pagina': pagina,
            'por_pagina': por_pagina,
            'clientes': resultado[inicio:fim],
        })
