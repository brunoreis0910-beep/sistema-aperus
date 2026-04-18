from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from datetime import date, timedelta
from .models import Cheque
from .serializers import ChequeSerializer


class ChequeViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para gerenciamento de cheques
    """
    queryset = Cheque.objects.all()
    serializer_class = ChequeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtros personalizados"""
        queryset = Cheque.objects.all()
        
        # Filtro por tipo
        tipo = self.request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        # Filtro por status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filtro por cliente
        cliente_id = self.request.query_params.get('id_cliente', None)
        if cliente_id:
            queryset = queryset.filter(id_cliente=cliente_id)
        
        # Filtro por fornecedor
        fornecedor_id = self.request.query_params.get('id_fornecedor', None)
        if fornecedor_id:
            queryset = queryset.filter(id_fornecedor=fornecedor_id)
        
        # Filtro por período de vencimento
        data_inicio = self.request.query_params.get('data_vencimento_inicio', None)
        data_fim = self.request.query_params.get('data_vencimento_fim', None)
        if data_inicio:
            queryset = queryset.filter(data_vencimento__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_vencimento__lte=data_fim)
        
        # Filtro por banco
        banco = self.request.query_params.get('banco', None)
        if banco:
            queryset = queryset.filter(banco__icontains=banco)
        
        # Filtro vencidos
        vencidos = self.request.query_params.get('vencidos', None)
        if vencidos == 'true':
            queryset = queryset.filter(
                data_vencimento__lt=date.today(),
                status__in=['custodia', 'depositado']
            )
        
        # Filtro a vencer (próximos 7 dias)
        a_vencer = self.request.query_params.get('a_vencer', None)
        if a_vencer == 'true':
            data_limite = date.today() + timedelta(days=7)
            queryset = queryset.filter(
                data_vencimento__lte=data_limite,
                data_vencimento__gte=date.today(),
                status__in=['custodia', 'depositado']
            )
        
        return queryset.select_related(
            'id_cliente',
            'id_fornecedor',
            'id_conta_bancaria',
            'usuario_cadastro'
        )
    
    def perform_create(self, serializer):
        """Salva o usuário que cadastrou o cheque"""
        serializer.save(usuario_cadastro=self.request.user)
    
    @action(detail=True, methods=['post'])
    def depositar(self, request, pk=None):
        """Marca cheque como depositado"""
        cheque = self.get_object()
        
        if cheque.status != 'custodia':
            return Response(
                {'error': 'Apenas cheques em custódia podem ser depositados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data_deposito = request.data.get('data_deposito', date.today())
        id_conta_bancaria = request.data.get('id_conta_bancaria')
        
        if not id_conta_bancaria:
            return Response(
                {'error': 'É necessário informar a conta bancária para depósito'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cheque.status = 'depositado'
        cheque.data_deposito = data_deposito
        cheque.id_conta_bancaria_id = id_conta_bancaria
        cheque.save()
        
        serializer = self.get_serializer(cheque)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def compensar(self, request, pk=None):
        """Marca cheque como compensado"""
        cheque = self.get_object()
        
        if cheque.status != 'depositado':
            return Response(
                {'error': 'Apenas cheques depositados podem ser compensados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data_compensacao = request.data.get('data_compensacao', date.today())
        
        cheque.status = 'compensado'
        cheque.data_compensacao = data_compensacao
        cheque.save()
        
        serializer = self.get_serializer(cheque)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def devolver(self, request, pk=None):
        """Marca cheque como devolvido"""
        cheque = self.get_object()
        
        observacao = request.data.get('observacao', '')
        if observacao:
            cheque.observacoes = f"{cheque.observacoes or ''}\n[DEVOLUÇÃO] {observacao}".strip()
        
        cheque.status = 'devolvido'
        cheque.save()
        
        serializer = self.get_serializer(cheque)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def repassar(self, request, pk=None):
        """Marca cheque como repassado"""
        cheque = self.get_object()
        
        if cheque.status not in ['custodia', 'depositado']:
            return Response(
                {'error': 'Cheque não pode ser repassado neste status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        observacao = request.data.get('observacao', '')
        if observacao:
            cheque.observacoes = f"{cheque.observacoes or ''}\n[REPASSE] {observacao}".strip()
        
        cheque.status = 'repassado'
        cheque.save()
        
        serializer = self.get_serializer(cheque)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela um cheque"""
        cheque = self.get_object()
        
        observacao = request.data.get('observacao', '')
        if observacao:
            cheque.observacoes = f"{cheque.observacoes or ''}\n[CANCELAMENTO] {observacao}".strip()
        
        cheque.status = 'cancelado'
        cheque.save()
        
        serializer = self.get_serializer(cheque)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Retorna estatísticas dos cheques"""
        hoje = date.today()
        
        # Totais por status
        em_custodia = Cheque.objects.filter(status='custodia').aggregate(
            total=Sum('valor'),
            quantidade=Count('id_cheque')
        )
        
        depositados = Cheque.objects.filter(status='depositado').aggregate(
            total=Sum('valor'),
            quantidade=Count('id_cheque')
        )
        
        compensados = Cheque.objects.filter(status='compensado').aggregate(
            total=Sum('valor'),
            quantidade=Count('id_cheque')
        )
        
        devolvidos = Cheque.objects.filter(status='devolvido').aggregate(
            total=Sum('valor'),
            quantidade=Count('id_cheque')
        )
        
        # Cheques vencidos (em custódia ou depositados)
        vencidos = Cheque.objects.filter(
            data_vencimento__lt=hoje,
            status__in=['custodia', 'depositado']
        ).aggregate(
            total=Sum('valor'),
            quantidade=Count('id_cheque')
        )
        
        # Cheques a vencer nos próximos 7 dias
        data_limite = hoje + timedelta(days=7)
        a_vencer = Cheque.objects.filter(
            data_vencimento__gte=hoje,
            data_vencimento__lte=data_limite,
            status__in=['custodia', 'depositado']
        ).aggregate(
            total=Sum('valor'),
            quantidade=Count('id_cheque')
        )
        
        # Totais por tipo
        receber = Cheque.objects.filter(
            tipo='receber',
            status__in=['custodia', 'depositado']
        ).aggregate(
            total=Sum('valor'),
            quantidade=Count('id_cheque')
        )
        
        pagar = Cheque.objects.filter(
            tipo='pagar',
            status__in=['custodia', 'depositado']
        ).aggregate(
            total=Sum('valor'),
            quantidade=Count('id_cheque')
        )
        
        return Response({
            'em_custodia': {
                'total': em_custodia['total'] or 0,
                'quantidade': em_custodia['quantidade'] or 0
            },
            'depositados': {
                'total': depositados['total'] or 0,
                'quantidade': depositados['quantidade'] or 0
            },
            'compensados': {
                'total': compensados['total'] or 0,
                'quantidade': compensados['quantidade'] or 0
            },
            'devolvidos': {
                'total': devolvidos['total'] or 0,
                'quantidade': devolvidos['quantidade'] or 0
            },
            'vencidos': {
                'total': vencidos['total'] or 0,
                'quantidade': vencidos['quantidade'] or 0
            },
            'a_vencer': {
                'total': a_vencer['total'] or 0,
                'quantidade': a_vencer['quantidade'] or 0
            },
            'receber': {
                'total': receber['total'] or 0,
                'quantidade': receber['quantidade'] or 0
            },
            'pagar': {
                'total': pagar['total'] or 0,
                'quantidade': pagar['quantidade'] or 0
            }
        })
