"""
ViewSet para gerenciamento de Cashback.
Endpoints para consultar saldo, histórico e utilizar cashback.
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Cashback, Cliente, Venda
from .serializers_cashback import (
    CashbackSerializer,
    CashbackSaldoSerializer,
    CashbackGerarSerializer,
    CashbackUtilizarSerializer
)


class CashbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet para operações de Cashback.
    
    Endpoints disponíveis:
    - GET /api/cashback/ - Lista todos os cashbacks
    - GET /api/cashback/{id}/ - Detalhe de um cashback
    - POST /api/cashback/ - Criar cashback manual
    - GET /api/cashback/saldo/?cliente_id=X - Consultar saldo disponível
    - POST /api/cashback/utilizar/ - Utilizar cashback em uma venda
    - GET /api/cashback/historico/?cliente_id=X - Histórico do cliente
    - POST /api/cashback/expirar/ - Expirar cashbacks vencidos (job)
    """
    queryset = Cashback.objects.all()
    serializer_class = CashbackSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='saldo')
    def saldo(self, request):
        """
        Retorna o saldo disponível de cashback de um cliente.
        
        Query params:
        - cliente_id (obrigatório): ID do cliente
        
        Exemplo: GET /api/cashback/saldo/?cliente_id=5
        
        Retorno:
        {
            "cliente_id": 5,
            "cliente_nome": "João Silva",
            "saldo_total": "150.50",
            "cashbacks_ativos": 3,
            "detalhes": [
                {
                    "id": 1,
                    "valor_gerado": "100.00",
                    "saldo": "100.00",
                    "data_validade": "2025-12-31",
                    "dias_restantes": 35
                },
                ...
            ]
        }
        """
        cliente_id = request.query_params.get('cliente_id')
        
        if not cliente_id:
            return Response(
                {'detail': 'Parâmetro cliente_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cliente = Cliente.objects.get(pk=cliente_id)
        except Cliente.DoesNotExist:
            return Response(
                {'detail': f'Cliente com ID {cliente_id} não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Buscar cashbacks ativos e válidos
        agora = timezone.now()
        cashbacks_ativos = Cashback.objects.filter(
            id_cliente=cliente,
            ativo=True,
            saldo__gt=0,
            data_validade__gt=agora
        ).order_by('data_validade')  # Ordenar por vencimento (FIFO)
        
        # Calcular saldo total
        saldo_total = cashbacks_ativos.aggregate(
            total=Sum('saldo')
        )['total'] or Decimal('0.00')
        
        # Montar detalhes de cada cashback
        detalhes = []
        for cb in cashbacks_ativos:
            dias_restantes = (cb.data_validade - agora).days
            detalhes.append({
                'id': cb.id_cashback,
                'valor_gerado': str(cb.valor_gerado),
                'saldo': str(cb.saldo),
                'valor_utilizado': str(cb.valor_utilizado),
                'data_geracao': cb.data_geracao,
                'data_validade': cb.data_validade,
                'dias_restantes': dias_restantes,
                'venda_origem': cb.id_venda_origem.pk if cb.id_venda_origem else None,
                'percentual_origem': str(cb.percentual_origem) if cb.percentual_origem else None
            })
        
        resultado = {
            'cliente_id': cliente.pk,
            'cliente_nome': cliente.nome_razao_social,
            'saldo_total': str(saldo_total),
            'cashbacks_ativos': cashbacks_ativos.count(),
            'detalhes': detalhes,
            'tem_cashback': saldo_total > 0
        }
        
        print(f'💰 [CASHBACK] Saldo consultado: Cliente {cliente_id} = R$ {saldo_total}')
        
        return Response(resultado, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='utilizar')
    def utilizar(self, request):
        """
        Utiliza cashback disponível do cliente aplicando desconto em uma venda.
        
        Body:
        {
            "cliente_id": 5,
            "venda_id": 123,
            "valor_utilizar": "50.00"  // Opcional: se não informado, usa o máximo disponível
        }
        
        Retorno:
        {
            "sucesso": true,
            "valor_utilizado": "50.00",
            "saldo_restante": "100.50",
            "cashbacks_utilizados": [
                {"id": 1, "valor": "30.00"},
                {"id": 2, "valor": "20.00"}
            ]
        }
        """
        cliente_id = request.data.get('cliente_id')
        venda_id = request.data.get('venda_id')
        valor_utilizar = request.data.get('valor_utilizar')
        
        # Validações
        if not cliente_id:
            return Response(
                {'detail': 'Campo cliente_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not venda_id:
            return Response(
                {'detail': 'Campo venda_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cliente = Cliente.objects.get(pk=cliente_id)
        except Cliente.DoesNotExist:
            return Response(
                {'detail': f'Cliente com ID {cliente_id} não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            venda = Venda.objects.get(pk=venda_id)
        except Venda.DoesNotExist:
            return Response(
                {'detail': f'Venda com ID {venda_id} não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Converter valor a utilizar
        if valor_utilizar:
            try:
                valor_utilizar = Decimal(str(valor_utilizar))
            except:
                return Response(
                    {'detail': 'Valor inválido para valor_utilizar'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Buscar cashbacks disponíveis (FIFO - primeiro a vencer primeiro)
        agora = timezone.now()
        cashbacks_disponiveis = Cashback.objects.filter(
            id_cliente=cliente,
            ativo=True,
            saldo__gt=0,
            data_validade__gt=agora
        ).order_by('data_validade')
        
        if not cashbacks_disponiveis.exists():
            return Response(
                {'detail': 'Cliente não possui cashback disponível'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcular saldo total disponível
        saldo_disponivel = sum(cb.saldo for cb in cashbacks_disponiveis)
        
        # Se não especificou valor, usar o máximo disponível (limitado ao valor da venda)
        if not valor_utilizar:
            valor_utilizar = min(saldo_disponivel, venda.valor_total)
        
        # Validar se tem saldo suficiente
        if valor_utilizar > saldo_disponivel:
            return Response(
                {
                    'detail': f'Saldo insuficiente. Disponível: R$ {saldo_disponivel}',
                    'saldo_disponivel': str(saldo_disponivel)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar se o valor a utilizar não é maior que o valor da venda
        if valor_utilizar > venda.valor_total:
            return Response(
                {
                    'detail': f'Valor a utilizar (R$ {valor_utilizar}) não pode ser maior que o valor da venda (R$ {venda.valor_total})',
                    'valor_venda': str(venda.valor_total)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Aplicar cashback (FIFO - do mais antigo para o mais novo)
        valor_restante = valor_utilizar
        cashbacks_utilizados = []
        
        for cb in cashbacks_disponiveis:
            if valor_restante <= 0:
                break
            
            # Quanto usar deste cashback?
            usar_deste = min(cb.saldo, valor_restante)
            
            # Atualizar cashback
            cb.valor_utilizado += usar_deste
            cb.saldo -= usar_deste
            cb.data_utilizacao = timezone.now()
            cb.id_venda_utilizado = venda
            
            # Se zerou o saldo, desativar
            if cb.saldo <= 0:
                cb.ativo = False
            
            cb.save()
            
            cashbacks_utilizados.append({
                'id': cb.id_cashback,
                'valor': str(usar_deste)
            })
            
            valor_restante -= usar_deste
            
            print(f'💳 [CASHBACK] Utilizado: R$ {usar_deste} do cashback #{cb.pk}')
        
        # Calcular saldo restante
        saldo_restante = sum(
            cb.saldo for cb in Cashback.objects.filter(
                id_cliente=cliente,
                ativo=True,
                saldo__gt=0,
                data_validade__gt=agora
            )
        )
        
        resultado = {
            'sucesso': True,
            'valor_utilizado': str(valor_utilizar),
            'saldo_restante': str(saldo_restante),
            'cashbacks_utilizados': cashbacks_utilizados,
            'venda_id': venda.pk
        }
        
        print(f'✅ [CASHBACK] Utilização completa: R$ {valor_utilizar} aplicado na venda #{venda.pk}')
        
        return Response(resultado, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='historico')
    def historico(self, request):
        """
        Retorna o histórico completo de cashback de um cliente.
        
        Query params:
        - cliente_id (obrigatório): ID do cliente
        
        Exemplo: GET /api/cashback/historico/?cliente_id=5
        """
        cliente_id = request.query_params.get('cliente_id')
        
        if not cliente_id:
            return Response(
                {'detail': 'Parâmetro cliente_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cliente = Cliente.objects.get(pk=cliente_id)
        except Cliente.DoesNotExist:
            return Response(
                {'detail': f'Cliente com ID {cliente_id} não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Buscar todos os cashbacks do cliente
        cashbacks = Cashback.objects.filter(
            id_cliente=cliente
        ).order_by('-data_geracao')
        
        serializer = CashbackSerializer(cashbacks, many=True)
        
        return Response({
            'cliente_id': cliente.pk,
            'cliente_nome': cliente.nome_razao_social,
            'total_registros': cashbacks.count(),
            'historico': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='expirar')
    def expirar(self, request):
        """
        Expira cashbacks vencidos.
        Este endpoint deve ser chamado por um job agendado (cron).
        
        Retorno:
        {
            "expirados": 5,
            "detalhes": [...]
        }
        """
        agora = timezone.now()
        
        # Buscar cashbacks vencidos ainda ativos
        cashbacks_vencidos = Cashback.objects.filter(
            ativo=True,
            data_validade__lt=agora
        )
        
        count = cashbacks_vencidos.count()
        detalhes = []
        
        for cb in cashbacks_vencidos:
            detalhes.append({
                'id': cb.id_cashback,
                'cliente': cb.id_cliente.nome_razao_social,
                'saldo_perdido': str(cb.saldo),
                'data_validade': cb.data_validade
            })
            
            cb.ativo = False
            cb.save()
            
            print(f'⏰ [CASHBACK] Expirado: #{cb.pk} - Cliente {cb.id_cliente.pk} - R$ {cb.saldo}')
        
        return Response({
            'expirados': count,
            'data_execucao': agora,
            'detalhes': detalhes
        }, status=status.HTTP_200_OK)
