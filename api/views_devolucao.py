from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction, connection
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models_devolucao import Devolucao, DevolucaoItem, CreditoCliente, CreditoUtilizacao
from .serializers_devolucao import (
    DevolucaoSerializer, DevolucaoItemSerializer, CreditoClienteSerializer,
    CreditoUtilizacaoSerializer, DevolucaoCreateSerializer,
    VendaParaDevolucaoSerializer, CompraParaDevolucaoSerializer
)


class DevolucaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar devoluções de vendas e compras
    """
    queryset = Devolucao.objects.all().prefetch_related('itens')
    serializer_class = DevolucaoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar devoluções"""
        queryset = super().get_queryset()
        
        # Filtros via query params
        tipo = self.request.query_params.get('tipo')
        status_dev = self.request.query_params.get('status')
        id_cliente = self.request.query_params.get('id_cliente')
        id_fornecedor = self.request.query_params.get('id_fornecedor')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        if status_dev:
            queryset = queryset.filter(status=status_dev)
        
        if id_cliente:
            queryset = queryset.filter(id_cliente=id_cliente)
        
        if id_fornecedor:
            queryset = queryset.filter(id_fornecedor=id_fornecedor)
        
        if data_inicio:
            queryset = queryset.filter(data_devolucao__gte=data_inicio)
        
        if data_fim:
            queryset = queryset.filter(data_devolucao__lte=data_fim)
        
        return queryset
    
    @action(detail=False, methods=['GET'], url_path='buscar_venda/(?P<id_venda>[^/.]+)')
    def buscar_venda(self, request, id_venda=None):
        """
        Buscar dados de uma venda para devolução
        """
        try:
            with connection.cursor() as cursor:
                # Buscar dados da venda
                cursor.execute("""
                    SELECT 
                        v.id_venda,
                        v.numero_documento,
                        v.data_venda,
                        v.id_cliente,
                        c.nome_razao_social as nome_cliente,
                        COALESCE((SELECT SUM(vi.valor_total) FROM venda_itens vi WHERE vi.id_venda = v.id_venda), 0) as valor_total,
                        v.status_venda
                    FROM vendas v
                    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
                    WHERE v.id_venda = %s
                """, [id_venda])
                
                venda = cursor.fetchone()
                
                if not venda:
                    return Response(
                        {'error': 'Venda não encontrada'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Buscar itens da venda
                cursor.execute("""
                    SELECT 
                        vi.id_venda_item,
                        vi.id_produto,
                        p.nome_produto,
                        p.codigo_produto,
                        vi.quantidade,
                        vi.valor_unitario,
                        vi.valor_total,
                        COALESCE((
                            SELECT SUM(di.quantidade_devolvida)
                            FROM devolucao_itens di
                            JOIN devolucoes d ON di.devolucao_id = d.id_devolucao
                            WHERE di.id_venda_item = vi.id_venda_item
                            AND d.status != 'cancelada'
                        ), 0) as quantidade_devolvida
                    FROM venda_itens vi
                    JOIN produtos p ON vi.id_produto = p.id_produto
                    WHERE vi.id_venda = %s
                """, [id_venda])
                
                itens_raw = cursor.fetchall()
                
                # Formatar itens
                itens = []
                for item in itens_raw:
                    quantidade_disponivel = float(item[4]) - float(item[7])  # quantidade - quantidade_devolvida
                    if quantidade_disponivel > 0:  # Só incluir itens com quantidade disponível
                        itens.append({
                            'id_venda_item': item[0],
                            'id_produto': item[1],
                            'nome_produto': item[2],
                            'codigo_produto': item[3],
                            'quantidade_original': float(item[4]),
                            'quantidade_devolvida': float(item[7]),
                            'quantidade_disponivel': quantidade_disponivel,
                            'valor_unitario': float(item[5]),
                            'valor_total': float(item[6])
                        })
                
                # Montar resposta
                venda_data = {
                    'id_venda': venda[0],
                    'numero_documento': venda[1],
                    'data_venda': venda[2],
                    'id_cliente': venda[3],
                    'nome_cliente': venda[4],
                    'valor_total': float(venda[5]),
                    'status_venda': venda[6],
                    'itens': itens
                }
                
                return Response(venda_data)
                
        except Exception as e:
            return Response(
                {'error': f'Erro ao buscar venda: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['GET'], url_path='buscar_compra/(?P<id_compra>[^/.]+)')
    def buscar_compra(self, request, id_compra=None):
        """
        Buscar dados de uma compra para devolução
        """
        try:
            with connection.cursor() as cursor:
                # Buscar dados da compra
                cursor.execute("""
                    SELECT 
                        c.id_compra,
                        c.numero_nota,
                        c.data_movimento_entrada,
                        c.id_fornecedor,
                        COALESCE(f.nome_fantasia, f.nome_razao_social) as nome_fornecedor,
                        COALESCE(c.valor_total_nota, 0) as valor_total
                    FROM compras c
                    LEFT JOIN fornecedores f ON c.id_fornecedor = f.id_fornecedor
                    WHERE c.id_compra = %s
                """, [id_compra])
                
                compra = cursor.fetchone()
                
                if not compra:
                    return Response(
                        {'error': 'Compra não encontrada'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Buscar itens da compra
                cursor.execute("""
                    SELECT 
                        ci.id_compra_item,
                        ci.id_produto,
                        p.nome_produto,
                        p.codigo_produto,
                        ci.quantidade,
                        ci.valor_unitario,
                        ci.valor_total,
                        COALESCE((
                            SELECT SUM(di.quantidade_devolvida)
                            FROM devolucao_itens di
                            JOIN devolucoes d ON di.devolucao_id = d.id_devolucao
                            WHERE di.id_compra_item = ci.id_compra_item
                            AND d.status != 'cancelada'
                        ), 0) as quantidade_devolvida
                    FROM compra_itens ci
                    JOIN produtos p ON ci.id_produto = p.id_produto
                    WHERE ci.id_compra = %s
                """, [id_compra])
                
                itens_raw = cursor.fetchall()
                
                # Formatar itens
                itens = []
                for item in itens_raw:
                    quantidade_disponivel = float(item[4]) - float(item[7])
                    if quantidade_disponivel > 0:
                        itens.append({
                            'id_compra_item': item[0],
                            'id_produto': item[1],
                            'nome_produto': item[2],
                            'codigo_produto': item[3],
                            'quantidade_original': float(item[4]),
                            'quantidade_devolvida': float(item[7]),
                            'quantidade_disponivel': quantidade_disponivel,
                            'valor_unitario': float(item[5]),
                            'valor_total': float(item[6])
                        })
                
                # Montar resposta
                compra_data = {
                    'id_compra': compra[0],
                    'numero_nota': compra[1],
                    'data_movimento_entrada': compra[2],
                    'id_fornecedor': compra[3],
                    'nome_fornecedor': compra[4],
                    'valor_total_nota': float(compra[5]),
                    'itens': itens
                }
                
                return Response(compra_data)
                
        except Exception as e:
            return Response(
                {'error': f'Erro ao buscar compra: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['POST'])
    def aprovar(self, request, pk=None):
        """
        Aprovar devolução e executar ações necessárias
        """
        devolucao = self.get_object()
        
        if devolucao.status != 'pendente':
            return Response(
                {'error': 'Apenas devoluções pendentes podem ser aprovadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Atualizar status
                devolucao.status = 'aprovada'
                devolucao.aprovado_por = request.user
                devolucao.data_aprovacao = timezone.now()
                
                # Atualizar estoque
                self._atualizar_estoque(devolucao)
                devolucao.estoque_atualizado = True
                
                # Se for devolução de venda e gerar crédito
                if devolucao.tipo == 'venda' and devolucao.gerar_credito:
                    self._gerar_credito_cliente(devolucao)
                    devolucao.financeiro_gerado = True
                
                devolucao.save()
                
                serializer = self.get_serializer(devolucao)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {'error': f'Erro ao aprovar devolução: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['POST'])
    def cancelar(self, request, pk=None):
        """
        Cancelar devolução
        """
        devolucao = self.get_object()
        
        if devolucao.status == 'aprovada':
            return Response(
                {'error': 'Devoluções aprovadas não podem ser canceladas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        devolucao.status = 'cancelada'
        devolucao.save()
        
        serializer = self.get_serializer(devolucao)
        return Response(serializer.data)
    
    def _atualizar_estoque(self, devolucao):
        """Atualizar estoque baseado na devolução"""
        with connection.cursor() as cursor:
            for item in devolucao.itens.all():
                if devolucao.tipo == 'venda':
                    # Devolver ao estoque (aumentar quantidade)
                    cursor.execute("""
                        UPDATE estoque 
                        SET quantidade = quantidade + %s
                        WHERE id_produto = %s
                    """, [item.quantidade_devolvida, item.id_produto])
                    
                elif devolucao.tipo == 'compra':
                    # Remover do estoque (diminuir quantidade)
                    cursor.execute("""
                        UPDATE estoque 
                        SET quantidade = quantidade - %s
                        WHERE id_produto = %s
                    """, [item.quantidade_devolvida, item.id_produto])
    
    def _gerar_credito_cliente(self, devolucao):
        """Gerar crédito para o cliente"""
        # Calcular validade (90 dias a partir de hoje)
        data_validade = timezone.now().date() + timedelta(days=90)
        
        # Criar crédito
        credito = CreditoCliente.objects.create(
            id_cliente=devolucao.id_cliente,
            devolucao=devolucao,
            valor_credito=devolucao.valor_total_devolucao,
            saldo=devolucao.valor_total_devolucao,
            data_validade=data_validade,
            status='disponivel'
        )
        
        return credito
    
    def perform_create(self, serializer):
        """Adicionar usuário criador"""
        serializer.save(criado_por=self.request.user)


class CreditoClienteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar créditos de clientes
    """
    queryset = CreditoCliente.objects.all()
    serializer_class = CreditoClienteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar créditos"""
        queryset = super().get_queryset()
        
        id_cliente = self.request.query_params.get('id_cliente')
        status_credito = self.request.query_params.get('status')
        
        if id_cliente:
            queryset = queryset.filter(id_cliente=id_cliente)
        
        if status_credito:
            queryset = queryset.filter(status=status_credito)
        
        return queryset
    
    @action(detail=False, methods=['GET'], url_path='cliente/(?P<id_cliente>[0-9]+)/saldo')
    def saldo_cliente(self, request, id_cliente=None):
        """
        Retornar saldo total de créditos disponíveis do cliente
        """
        creditos = CreditoCliente.objects.filter(
            id_cliente=id_cliente,
            status__in=['disponivel', 'parcialmente_utilizado']
        )
        
        saldo_total = sum(c.saldo for c in creditos)
        
        return Response({
            'id_cliente': id_cliente,
            'saldo_total': saldo_total,
            'quantidade_creditos': creditos.count(),
            'creditos': CreditoClienteSerializer(creditos, many=True).data
        })
    
    @action(detail=False, methods=['POST'], url_path='utilizar')
    def utilizar_credito(self, request):
        """
        Utilizar crédito em uma venda
        """
        id_cliente = request.data.get('id_cliente')
        id_venda = request.data.get('id_venda')
        valor = Decimal(str(request.data.get('valor', 0)))
        
        if not all([id_cliente, id_venda, valor]):
            return Response(
                {'error': 'id_cliente, id_venda e valor são obrigatórios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if valor <= 0:
            return Response(
                {'error': 'Valor deve ser maior que zero'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Buscar créditos disponíveis do cliente
                creditos = CreditoCliente.objects.filter(
                    id_cliente=id_cliente,
                    status__in=['disponivel', 'parcialmente_utilizado']
                ).order_by('data_criacao')
                
                saldo_disponivel = sum(c.saldo for c in creditos)
                
                if saldo_disponivel < valor:
                    return Response(
                        {'error': f'Saldo insuficiente. Disponível: R$ {saldo_disponivel}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Utilizar créditos (FIFO - primeiro a expirar primeiro a usar)
                valor_restante = valor
                utilizacoes = []
                
                for credito in creditos:
                    if valor_restante <= 0:
                        break
                    
                    valor_usar = min(credito.saldo, valor_restante)
                    
                    # Utilizar o crédito
                    credito.utilizar(valor_usar)
                    
                    # Registrar utilização
                    utilizacao = CreditoUtilizacao.objects.create(
                        credito=credito,
                        id_venda=id_venda,
                        valor_utilizado=valor_usar,
                        usuario=request.user
                    )
                    utilizacoes.append(utilizacao)
                    
                    valor_restante -= valor_usar
                
                return Response({
                    'mensagem': 'Crédito utilizado com sucesso',
                    'valor_utilizado': float(valor),
                    'utilizacoes': CreditoUtilizacaoSerializer(utilizacoes, many=True).data
                })
                
        except Exception as e:
            return Response(
                {'error': f'Erro ao utilizar crédito: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Views customizadas para buscar venda e compra
from rest_framework.decorators import api_view, permission_classes
