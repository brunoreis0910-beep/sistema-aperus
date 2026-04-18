# Em: C:\Projetos\SistemaGerencial\api\views_cashback.py
"""
Views para o sistema de Cashback
"""

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Cashback, Cliente, Venda, Operacao
from .serializers_cashback import (
    CashbackSerializer,
    CashbackListSerializer,
    CashbackSaldoSerializer,
    CashbackGerarSerializer,
    CashbackUtilizarSerializer
)


class CashbackSaldoView(APIView):
    """
    GET /api/cashback/saldo/<id_cliente>/
    Retorna o saldo total de cashback disponível para um cliente
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, id_cliente):
        cliente = get_object_or_404(Cliente, pk=id_cliente)
        
        # Busca cashbacks ativos e não vencidos
        cashbacks = Cashback.objects.filter(
            id_cliente=cliente,
            ativo=True,
            data_validade__gt=timezone.now()
        ).order_by('data_validade')  # Mais antigos primeiro (FIFO)
        
        saldo_total = sum(cb.saldo for cb in cashbacks)
        
        data = {
            'id_cliente': cliente.id_cliente,
            'nome_cliente': cliente.nome_razao_social,
            'saldo_total': saldo_total,
            'quantidade_cashbacks': cashbacks.count(),
            'cashbacks': CashbackListSerializer(cashbacks, many=True).data
        }
        
        return Response(data)


class CashbackGerarView(APIView):
    """
    POST /api/cashback/gerar/
    Gera cashback para uma venda baseado na configuração da operação
    
    Body: {"id_venda": 123}
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CashbackGerarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        id_venda = serializer.validated_data['id_venda']
        venda = get_object_or_404(Venda, pk=id_venda)
        
        # Verifica se tem operação configurada
        if not venda.id_operacao:
            return Response(
                {'error': 'Venda não possui operação configurada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        operacao = venda.id_operacao
        
        # Verifica se operação gera cashback
        if not operacao.cashback_percentual or operacao.cashback_percentual <= 0:
            return Response(
                {'message': 'Esta operação não gera cashback'},
                status=status.HTTP_200_OK
            )
        
        # Verifica se já existe cashback para esta venda
        if Cashback.objects.filter(id_venda_origem=venda).exists():
            return Response(
                {'error': 'Cashback já foi gerado para esta venda'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcula valor do cashback
        valor_gerado = (venda.valor_total * operacao.cashback_percentual) / Decimal('100.0')
        valor_gerado = valor_gerado.quantize(Decimal('0.01'))  # Arredonda para 2 casas
        
        # Calcula data de validade
        dias_validade = operacao.cashback_validade_dias or 30
        data_validade = timezone.now() + timedelta(days=dias_validade)
        
        # Cria cashback
        with transaction.atomic():
            cashback = Cashback.objects.create(
                id_cliente=venda.id_cliente,
                id_venda_origem=venda,
                valor_gerado=valor_gerado,
                valor_utilizado=Decimal('0.00'),
                saldo=valor_gerado,
                data_validade=data_validade,
                ativo=True,
                percentual_origem=operacao.cashback_percentual,
                observacoes=f'Gerado automaticamente pela venda {venda.numero_documento or venda.id_venda}'
            )
        
        return Response(
            {
                'message': 'Cashback gerado com sucesso',
                'cashback': CashbackSerializer(cashback).data
            },
            status=status.HTTP_201_CREATED
        )


class CashbackUtilizarView(APIView):
    """
    POST /api/cashback/utilizar/
    Utiliza cashback em uma venda
    
    Body: {
        "id_cliente": 1,
        "id_venda": 456,
        "valor_utilizar": 50.00,
        "ids_cashback": [1, 2]  # opcional
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CashbackUtilizarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        id_cliente = serializer.validated_data['id_cliente']
        id_venda = serializer.validated_data['id_venda']
        valor_utilizar = serializer.validated_data['valor_utilizar']
        ids_cashback = serializer.validated_data.get('ids_cashback', [])
        
        venda = get_object_or_404(Venda, pk=id_venda)
        
        # Busca cashbacks disponíveis
        cashbacks = Cashback.objects.filter(
            id_cliente=id_cliente,
            ativo=True,
            data_validade__gt=timezone.now()
        ).order_by('data_validade')  # FIFO - usa os mais antigos primeiro
        
        if ids_cashback:
            cashbacks = cashbacks.filter(id_cashback__in=ids_cashback)
        
        valor_restante = valor_utilizar
        cashbacks_utilizados = []
        
        with transaction.atomic():
            for cashback in cashbacks:
                if valor_restante <= 0:
                    break
                
                # Quanto pode usar deste cashback
                valor_usar = min(cashback.saldo, valor_restante)
                
                # Atualiza cashback
                cashback.valor_utilizado += valor_usar
                cashback.saldo -= valor_usar
                cashback.data_utilizacao = timezone.now()
                cashback.id_venda_utilizado = venda
                
                if cashback.saldo <= 0:
                    cashback.ativo = False
                
                cashback.save()
                
                cashbacks_utilizados.append({
                    'id_cashback': cashback.id_cashback,
                    'valor_utilizado': float(valor_usar),
                    'saldo_restante': float(cashback.saldo)
                })
                
                valor_restante -= valor_usar
        
        return Response(
            {
                'message': 'Cashback utilizado com sucesso',
                'valor_total_utilizado': float(valor_utilizar),
                'cashbacks_utilizados': cashbacks_utilizados
            },
            status=status.HTTP_200_OK
        )


class CashbackHistoricoView(APIView):
    """
    GET /api/cashback/historico/?id_cliente=<id>
    Lista histórico de cashback de um cliente
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        id_cliente = request.query_params.get('id_cliente')
        
        if not id_cliente:
            return Response(
                {'error': 'Parâmetro id_cliente é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cliente = get_object_or_404(Cliente, pk=id_cliente)
        
        # Busca todos os cashbacks do cliente
        cashbacks = Cashback.objects.filter(
            id_cliente=cliente
        ).order_by('-data_geracao')
        
        return Response(
            CashbackSerializer(cashbacks, many=True).data,
            status=status.HTTP_200_OK
        )


class CashbackExpirarView(APIView):
    """
    POST /api/cashback/expirar/
    Marca cashbacks vencidos como inativos (manutenção)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Busca cashbacks vencidos que ainda estão ativos
        cashbacks_expirados = Cashback.objects.filter(
            ativo=True,
            data_validade__lt=timezone.now()
        )
        
        quantidade = cashbacks_expirados.count()
        
        # Marca como inativos
        cashbacks_expirados.update(ativo=False)
        
        return Response(
            {
                'message': f'{quantidade} cashback(s) expirado(s) marcado(s) como inativos',
                'quantidade': quantidade
            },
            status=status.HTTP_200_OK
        )


class CashbackListView(APIView):
    """
    GET /api/cashback/
    Lista todos os cashbacks (com filtros opcionais)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        queryset = Cashback.objects.all()
        
        # Filtros opcionais
        id_cliente = request.query_params.get('id_cliente')
        ativo = request.query_params.get('ativo')
        
        if id_cliente:
            queryset = queryset.filter(id_cliente=id_cliente)
        
        if ativo is not None:
            queryset = queryset.filter(ativo=ativo.lower() == 'true')
        
        queryset = queryset.order_by('-data_geracao')
        
        return Response(
            CashbackSerializer(queryset, many=True).data,
            status=status.HTTP_200_OK
        )
