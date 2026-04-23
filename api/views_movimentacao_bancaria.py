"""
Views para Movimentações Bancárias (Financeiro Bancário)
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from datetime import datetime, date
from decimal import Decimal
from collections import defaultdict

from .models import FinanceiroBancario, ContaBancaria
from .serializers_movimentacao_bancaria import FinanceiroBancarioSerializer


class FinanceiroBancarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de Movimentações Bancárias
    
    Endpoints:
    - GET /api/movimentacoes-bancarias/ - Lista todas as movimentações
    - POST /api/movimentacoes-bancarias/ - Cria nova movimentação
    - GET /api/movimentacoes-bancarias/{id}/ - Detalhes de uma movimentação
    - PUT/PATCH /api/movimentacoes-bancarias/{id}/ - Atualiza movimentação
    - DELETE /api/movimentacoes-bancarias/{id}/ - Remove movimentação
    """
    queryset = FinanceiroBancario.objects.select_related(
        'id_conta_bancaria',
        'id_cliente_fornecedor'
    ).all()
    serializer_class = FinanceiroBancarioSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros via query params
        conta_bancaria_id = self.request.query_params.get('conta_bancaria', None)
        tipo_movimento = self.request.query_params.get('tipo_movimento', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)
        
        if conta_bancaria_id:
            queryset = queryset.filter(id_conta_bancaria=conta_bancaria_id)
        
        if tipo_movimento:
            queryset = queryset.filter(tipo_movimento=tipo_movimento)
        
        if data_inicio:
            queryset = queryset.filter(data_pagamento__gte=data_inicio)
        
        if data_fim:
            queryset = queryset.filter(data_pagamento__lte=data_fim)
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='saldo-conta/(?P<conta_id>[^/.]+)')
    def saldo_conta(self, request, conta_id=None):
        """
        Retorna o saldo atual de uma conta bancária
        Calculado como: saldo_inicial + créditos - débitos
        """
        try:
            conta = ContaBancaria.objects.get(id_conta_bancaria=conta_id)
            
            movimentacoes = FinanceiroBancario.objects.filter(id_conta_bancaria=conta_id)
            
            creditos = movimentacoes.filter(tipo_movimento='C').aggregate(
                total=Sum('valor_movimento')
            )['total'] or 0
            
            debitos = movimentacoes.filter(tipo_movimento='D').aggregate(
                total=Sum('valor_movimento')
            )['total'] or 0
            
            saldo_atual = float(conta.saldo_inicial) + float(creditos) - float(debitos)
            
            return Response({
                'id_conta_bancaria': conta.id_conta_bancaria,
                'nome_conta': conta.nome_conta,
                'saldo_inicial': float(conta.saldo_inicial),
                'total_creditos': float(creditos),
                'total_debitos': float(debitos),
                'saldo_atual': saldo_atual
            })
        
        except ContaBancaria.DoesNotExist:
            return Response(
                {'error': 'Conta bancária não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], url_path='extrato')
    def extrato(self, request):
        """
        Retorna o extrato bancário com saldo corrente linha a linha,
        agrupado por dia.

        Parâmetros:
          - conta_bancaria (obrigatório): ID da conta bancária
          - data_inicio (opcional): YYYY-MM-DD
          - data_fim (opcional): YYYY-MM-DD
        """
        conta_bancaria_id = request.query_params.get('conta_bancaria')
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')

        if not conta_bancaria_id:
            return Response({'error': 'Parâmetro conta_bancaria é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            conta = ContaBancaria.objects.get(id_conta_bancaria=conta_bancaria_id)
        except ContaBancaria.DoesNotExist:
            return Response({'error': 'Conta bancária não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        # Calcular saldo anterior (saldo_inicial + todos os movimentos ANTES do data_inicio)
        saldo_anterior = Decimal(str(conta.saldo_inicial))
        if data_inicio_str:
            try:
                data_inicio = date.fromisoformat(data_inicio_str)
                movs_anteriores = FinanceiroBancario.objects.filter(
                    id_conta_bancaria=conta_bancaria_id,
                    data_pagamento__lt=data_inicio
                )
                cred = movs_anteriores.filter(tipo_movimento='C').aggregate(t=Sum('valor_movimento'))['t'] or Decimal('0')
                deb = movs_anteriores.filter(tipo_movimento='D').aggregate(t=Sum('valor_movimento'))['t'] or Decimal('0')
                saldo_anterior += Decimal(str(cred)) - Decimal(str(deb))
            except ValueError:
                return Response({'error': 'data_inicio inválida. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar movimentos do período
        queryset = FinanceiroBancario.objects.filter(id_conta_bancaria=conta_bancaria_id).select_related(
            'id_cliente_fornecedor'
        ).order_by('data_pagamento', 'id_movimento')

        if data_inicio_str:
            queryset = queryset.filter(data_pagamento__gte=data_inicio_str)
        if data_fim_str:
            queryset = queryset.filter(data_pagamento__lte=data_fim_str)

        # Construir lançamentos com saldo corrente
        saldo_corrente = saldo_anterior
        lancamentos_por_dia = defaultdict(list)

        for mov in queryset:
            valor = Decimal(str(mov.valor_movimento))
            if mov.tipo_movimento == 'C':
                saldo_corrente += valor
            else:
                saldo_corrente -= valor

            lancamentos_por_dia[mov.data_pagamento.isoformat()].append({
                'id_movimento': mov.id_movimento,
                'tipo_movimento': mov.tipo_movimento,
                'descricao': mov.descricao,
                'documento_numero': mov.documento_numero or '',
                'forma_pagamento': mov.forma_pagamento or '',
                'cliente_fornecedor': mov.id_cliente_fornecedor.nome_razao_social if mov.id_cliente_fornecedor else '',
                'valor': float(valor),
                'saldo_corrente': float(saldo_corrente),
                'conciliado': mov.conciliado,
            })

        # Calcular totais do período
        total_creditos = float(queryset.filter(tipo_movimento='C').aggregate(t=Sum('valor_movimento'))['t'] or 0)
        total_debitos = float(queryset.filter(tipo_movimento='D').aggregate(t=Sum('valor_movimento'))['t'] or 0)

        dias = [
            {'data': data, 'lancamentos': lançamentos}
            for data, lançamentos in sorted(lancamentos_por_dia.items())
        ]

        return Response({
            'conta': {
                'id_conta_bancaria': conta.id_conta_bancaria,
                'nome_conta': conta.nome_conta,
                'banco': conta.codigo_banco or '',
                'agencia': conta.agencia or '',
                'numero_conta': conta.conta or '',
            },
            'periodo': {
                'data_inicio': data_inicio_str or '',
                'data_fim': data_fim_str or '',
            },
            'saldo_anterior': float(saldo_anterior),
            'total_creditos': total_creditos,
            'total_debitos': total_debitos,
            'saldo_final': float(saldo_anterior) + total_creditos - total_debitos,
            'dias': dias,
        })
