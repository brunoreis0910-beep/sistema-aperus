"""
views_recorrencia.py — Contratos de Recorrência e Parcelas
"""
import logging
from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models_recorrencia import ContratoRecorrencia, ParcelaRecorrencia
from .services.recorrencia_service import RecorrenciaService

logger = logging.getLogger(__name__)


# ── Serializers ──────────────────────────────────────────────────────────────


class ParcelaRecorrenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcelaRecorrencia
        fields = '__all__'


class ContratoRecorrenciaSerializer(serializers.ModelSerializer):
    parcelas = ParcelaRecorrenciaSerializer(many=True, read_only=True)
    cliente_nome = serializers.SerializerMethodField()
    proxima_parcela = serializers.SerializerMethodField()

    class Meta:
        model = ContratoRecorrencia
        fields = '__all__'

    def get_cliente_nome(self, obj):
        return obj.cliente.nome_razao_social if obj.cliente else None

    def get_proxima_parcela(self, obj):
        prox = obj.parcelas.filter(status='PENDENTE').order_by('data_vencimento').first()
        if prox:
            return {'vencimento': prox.data_vencimento, 'valor': prox.valor, 'competencia': prox.competencia}
        return None


class ContratoRecorrenciaListSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.SerializerMethodField()
    proxima_parcela = serializers.SerializerMethodField()

    class Meta:
        model = ContratoRecorrencia
        fields = '__all__'

    def get_cliente_nome(self, obj):
        return obj.cliente.nome_razao_social if obj.cliente else None

    def get_proxima_parcela(self, obj):
        prox = obj.parcelas.filter(status='PENDENTE').order_by('data_vencimento').first()
        if prox:
            return {'vencimento': prox.data_vencimento, 'valor': prox.valor, 'competencia': prox.competencia}
        return None


# ── ViewSets ─────────────────────────────────────────────────────────────────


class ContratoRecorrenciaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ContratoRecorrenciaListSerializer
        return ContratoRecorrenciaSerializer

    def get_queryset(self):
        qs = ContratoRecorrencia.objects.select_related('cliente').prefetch_related('parcelas').all()
        status_f = self.request.query_params.get('status')
        cliente = self.request.query_params.get('cliente')

        if status_f:
            qs = qs.filter(status=status_f)
        if cliente:
            qs = qs.filter(cliente_id=cliente)
        return qs.order_by('-criado_em')

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def gerar_parcelas(self, request, pk=None):
        """Gera parcelas para o mês vigente."""
        contrato = self.get_object()
        svc = RecorrenciaService()
        parcelas = svc.gerar_parcelas_contrato(contrato)
        return Response({
            'geradas': len(parcelas),
            'parcelas': ParcelaRecorrenciaSerializer(parcelas, many=True).data,
        })

    @action(detail=True, methods=['post'])
    def aplicar_reajuste(self, request, pk=None):
        """Aplica reajuste pelo índice configurado (BCB API)."""
        contrato = self.get_object()
        svc = RecorrenciaService()
        try:
            resultado = svc.aplicar_reajuste(contrato.id_contrato)
            return Response(resultado)
        except Exception as exc:
            logger.exception('Erro ao aplicar reajuste')
            return Response({'erro': str(exc)}, status=400)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        contrato = self.get_object()
        if contrato.status == 'CANCELADO':
            return Response({'erro': 'Contrato já cancelado.'}, status=400)
        motivo = request.data.get('motivo', '')
        contrato.status = 'CANCELADO'
        contrato.observacoes = f'{contrato.observacoes or ""}\nCancelado em {timezone.now().date()}: {motivo}'.strip()
        contrato.save(update_fields=['status', 'observacoes'])
        return Response({'mensagem': 'Contrato cancelado.'})

    @action(detail=False, methods=['post'])
    def processar_vencimentos(self, request):
        """Processa todos os vencimentos do dia (uso interno / cron)."""
        svc = RecorrenciaService()
        resultado = svc.processar_vencimentos_hoje()
        return Response(resultado)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Resumo dos contratos de recorrência."""
        from django.db.models import Sum, Count
        hoje = timezone.now().date()
        contratos = ContratoRecorrencia.objects.all()
        parcelas = ParcelaRecorrencia.objects.all()

        return Response({
            'total_ativos': contratos.filter(status='ATIVO').count(),
            'total_suspensos': contratos.filter(status='SUSPENSO').count(),
            'receita_mensal_ativa': float(
                contratos.filter(status='ATIVO').aggregate(s=Sum('valor_mensal'))['s'] or 0
            ),
            'parcelas_vencendo_hoje': parcelas.filter(
                status='PENDENTE', data_vencimento=hoje
            ).count(),
            'parcelas_em_atraso': parcelas.filter(
                status='PENDENTE', data_vencimento__lt=hoje
            ).count(),
        })


class ParcelaRecorrenciaViewSet(viewsets.ModelViewSet):
    serializer_class = ParcelaRecorrenciaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ParcelaRecorrencia.objects.select_related('contrato__cliente').all()
        contrato = self.request.query_params.get('contrato')
        status_f = self.request.query_params.get('status')
        vencimento = self.request.query_params.get('vencimento')

        if contrato:
            qs = qs.filter(contrato_id=contrato)
        if status_f:
            qs = qs.filter(status=status_f)
        if vencimento:
            qs = qs.filter(data_vencimento=vencimento)
        return qs.order_by('data_vencimento')

    @action(detail=True, methods=['post'])
    def baixar(self, request, pk=None):
        """Marca parcela como PAGA."""
        parcela = self.get_object()
        if parcela.status == 'PAGA':
            return Response({'erro': 'Parcela já paga.'}, status=400)
        parcela.status = 'PAGA'
        parcela.data_pagamento = timezone.now().date()
        parcela.valor_pago = parcela.valor
        parcela.save(update_fields=['status', 'data_pagamento', 'valor_pago'])
        return Response(ParcelaRecorrenciaSerializer(parcela).data)
