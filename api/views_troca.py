"""
Views para funcionalidade de Troca
"""
from django.db import connection, transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from decimal import Decimal
from datetime import datetime, timedelta
import logging

from .models import Troca, TrocaItem
from .serializers_troca import (
    TrocaSerializer, TrocaCreateSerializer,
    VendaParaTrocaSerializer, ProdutoParaTrocaSerializer,
    FinanceiroTrocaSerializer
)

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_sales_for_exchange(request):
    """
    Busca vendas que contêm um produto específico nos últimos N dias
    
    Query Parameters:
    - produto (str): Código ou nome do produto para buscar
    - days (int): Número de dias para buscar (default: 7)
    
    Returns:
    - Lista de vendas com informações básicas e itens
    """
    produto = request.query_params.get('produto', '').strip()
    days = int(request.query_params.get('days', 7))
    
    if not produto:
        return Response(
            {'error': 'Parâmetro "produto" é obrigatório'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if days <= 0 or days > 365:
        return Response(
            {'error': 'Parâmetro "days" deve estar entre 1 e 365'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Query para buscar vendas que contêm o produto
        # Exclui vendas onde todos os itens já foram trocados
        sql_vendas = """
            SELECT DISTINCT
                v.id_venda,
                v.numero_documento,
                v.data_documento,
                v.id_cliente,
                COALESCE(c.nome_razao_social, '') as cliente_nome,
                COALESCE(c.cpf_cnpj, '') as cliente_documento,
                COALESCE((
                    SELECT SUM(vi.valor_total) 
                    FROM venda_itens vi 
                    WHERE vi.id_venda = v.id_venda
                ), v.valor_total_venda, v.valor_total, 0) as valor_total
            FROM vendas v
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            WHERE DATE(v.data_documento) >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
              AND EXISTS (
                  SELECT 1 FROM venda_itens vi 
                  JOIN produtos p ON vi.id_produto = p.id_produto
                  WHERE vi.id_venda = v.id_venda
                    AND (
                        p.codigo_produto LIKE %s 
                        OR p.nome_produto LIKE %s
                    )
              )
              -- Verifica se há itens disponíveis (não totalmente trocados)
              AND EXISTS (
                  SELECT 1 FROM venda_itens vi
                  WHERE vi.id_venda = v.id_venda
                    AND vi.quantidade > COALESCE((
                        SELECT SUM(ti.quantidade_retorno)
                        FROM troca_itens ti
                        JOIN trocas t ON ti.id_troca = t.id_troca
                        WHERE ti.id_venda_item_original = vi.id_venda_item
                          AND t.status != 'cancelada'
                    ), 0)
              )
            ORDER BY v.data_documento DESC, v.id_venda DESC
            LIMIT 100
        """
        
        param_busca = f"%{produto}%"
        
        with connection.cursor() as cursor:
            cursor.execute(sql_vendas, [days, param_busca, param_busca])
            vendas_rows = cursor.fetchall()
        
        # Converter para lista de dicionários
        vendas_list = []
        for row in vendas_rows:
            venda_data = {
                'id_venda': row[0],
                'numero_documento': row[1],
                'data_documento': row[2],
                'id_cliente': row[3],
                'cliente_nome': row[4] or 'N/A',
                'cliente_documento': row[5] or '',
                'valor_total': float(row[6]) if row[6] else 0.0
            }
            vendas_list.append(venda_data)
        
        # Serializar os dados
        serializer = VendaParaTrocaSerializer(vendas_list, many=True)
        
        return Response({
            'vendas': serializer.data,
            'total_encontradas': len(vendas_list),
            'filtros': {
                'produto': produto,
                'dias': days
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar vendas para troca: {e}")
        return Response(
            {'error': 'Erro interno ao buscar vendas'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sale_items_for_exchange(request, id_venda):
    """
    Busca os itens de uma venda específica para troca
    Retorna apenas itens que ainda não foram totalmente trocados
    
    Path Parameters:
    - id_venda (int): ID da venda
    
    Returns:
    - Lista de itens da venda com detalhes e quantidade disponível
    """
    try:
        sql_itens = """
            SELECT 
                vi.id_venda_item,
                vi.id_produto,
                p.nome_produto,
                p.codigo_produto,
                vi.quantidade as quantidade_original,
                vi.valor_unitario,
                vi.valor_total,
                COALESCE((
                    SELECT SUM(ti.quantidade_retorno)
                    FROM troca_itens ti
                    JOIN trocas t ON ti.id_troca = t.id_troca
                    WHERE ti.id_venda_item_original = vi.id_venda_item
                      AND t.status != 'cancelada'
                ), 0) as quantidade_trocada
            FROM venda_itens vi
            JOIN produtos p ON vi.id_produto = p.id_produto
            WHERE vi.id_venda = %s
            HAVING (quantidade_original - quantidade_trocada) > 0
            ORDER BY vi.id_venda_item
        """
        
        with connection.cursor() as cursor:
            cursor.execute(sql_itens, [id_venda])
            itens_rows = cursor.fetchall()
        
        if not itens_rows:
            return Response(
                {'error': 'Venda não encontrada, sem itens ou todos os itens já foram trocados'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Converter para lista de dicionários
        itens_list = []
        for row in itens_rows:
            quantidade_original = float(row[4]) if row[4] else 0.0
            quantidade_trocada = float(row[7]) if row[7] else 0.0
            quantidade_disponivel = quantidade_original - quantidade_trocada
            
            item_data = {
                'id_venda_item': row[0],
                'id_produto': row[1],
                'nome_produto': row[2],
                'codigo_produto': row[3],
                'quantidade_original': quantidade_original,
                'quantidade_trocada': quantidade_trocada,
                'quantidade': quantidade_disponivel,  # quantidade disponível para troca
                'valor_unitario': float(row[5]) if row[5] else 0.0,
                'valor_total': float(row[6]) if row[6] else 0.0
            }
            itens_list.append(item_data)
        
        return Response({'itens': itens_list})
        
    except Exception as e:
        logger.error(f"Erro ao buscar itens da venda {id_venda}: {e}")
        return Response(
            {'error': 'Erro interno ao buscar itens da venda'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_products_for_substitution(request):
    """
    Busca produtos disponíveis para substituição
    
    Query Parameters:
    - termo (str): Termo de busca (código ou nome)
    - limit (int): Limite de resultados (default: 20)
    
    Returns:
    - Lista de produtos com estoque e preços
    """
    termo = request.query_params.get('termo', '').strip()
    limit = int(request.query_params.get('limit', 20))
    
    if not termo:
        return Response(
            {'error': 'Parâmetro "termo" é obrigatório'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        sql_produtos = """
            SELECT 
                p.id_produto,
                p.codigo_produto,
                p.nome_produto,
                COALESCE(e.valor_venda, 0) as valor_venda,
                COALESCE(SUM(e.quantidade), 0) as estoque_total
            FROM produtos p
            LEFT JOIN estoque e ON p.id_produto = e.id_produto
            WHERE (
                p.codigo_produto LIKE %s 
                OR p.nome_produto LIKE %s
            )
            GROUP BY p.id_produto, p.codigo_produto, p.nome_produto, e.valor_venda
            HAVING estoque_total > 0
            ORDER BY p.nome_produto
            LIMIT %s
        """
        
        param_busca = f"%{termo}%"
        
        with connection.cursor() as cursor:
            cursor.execute(sql_produtos, [param_busca, param_busca, limit])
            produtos_rows = cursor.fetchall()
        
        # Converter para lista de dicionários
        produtos_list = []
        for row in produtos_rows:
            produto_data = {
                'id_produto': row[0],
                'codigo_produto': row[1],
                'nome_produto': row[2],
                'valor_venda': float(row[3]) if row[3] else 0.0,
                'estoque_disponivel': float(row[4]) if row[4] else 0.0
            }
            produtos_list.append(produto_data)
        
        serializer = ProdutoParaTrocaSerializer(produtos_list, many=True)
        
        return Response({
            'produtos': serializer.data,
            'total_encontrados': len(produtos_list)
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar produtos para substituição: {e}")
        return Response(
            {'error': 'Erro interno ao buscar produtos'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_exchange(request):
    """
    Cria uma nova troca com lógica financeira
    
    Request Body:
    {
        "id_venda_original": int,
        "id_cliente": int (opcional),
        "observacao": str (opcional),
        "itens_retorno": [
            {
                "id_venda_item_original": int,
                "id_produto_retorno": int,
                "quantidade_retorno": decimal,
                "valor_unit_retorno": decimal
            }
        ],
        "itens_substituicao": [
            {
                "id_produto_substituicao": int,
                "quantidade_substituicao": decimal,
                "valor_unit_substituicao": decimal
            }
        ]
    }
    
    Returns:
    - Dados da troca criada e informações financeiras
    """
    serializer = TrocaCreateSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {'error': 'Dados inválidos', 'details': serializer.errors}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    validated_data = serializer.validated_data
    
    try:
        with transaction.atomic():
            # Validar quantidades disponíveis para cada item de retorno
            for item in validated_data.get('itens_retorno', []):
                id_venda_item = item['id_venda_item_original']
                quantidade_retorno = Decimal(str(item['quantidade_retorno']))
                
                # Buscar quantidade já trocada
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT 
                            vi.quantidade as quantidade_original,
                            COALESCE((
                                SELECT SUM(ti.quantidade_retorno)
                                FROM troca_itens ti
                                JOIN trocas t ON ti.id_troca = t.id_troca
                                WHERE ti.id_venda_item_original = vi.id_venda_item
                                  AND t.status != 'cancelada'
                            ), 0) as quantidade_trocada
                        FROM venda_itens vi
                        WHERE vi.id_venda_item = %s
                    """, [id_venda_item])
                    
                    row = cursor.fetchone()
                    if not row:
                        return Response(
                            {'error': f'Item de venda {id_venda_item} não encontrado'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    quantidade_original = Decimal(str(row[0]))
                    quantidade_trocada = Decimal(str(row[1]))
                    quantidade_disponivel = quantidade_original - quantidade_trocada
                    
                    if quantidade_retorno > quantidade_disponivel:
                        return Response(
                            {
                                'error': f'Quantidade para troca ({quantidade_retorno}) excede o disponível ({quantidade_disponivel})',
                                'details': f'Item de venda {id_venda_item} - Já trocado: {quantidade_trocada} de {quantidade_original}'
                            }, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            # Calcular totais
            total_retorno = Decimal('0')
            total_substituicao = Decimal('0')
            
            for item in validated_data.get('itens_retorno', []):
                qtd = Decimal(str(item['quantidade_retorno']))
                valor_unit = Decimal(str(item['valor_unit_retorno']))
                total_retorno += qtd * valor_unit
            
            for item in validated_data.get('itens_substituicao', []):
                qtd = Decimal(str(item['quantidade_substituicao']))
                valor_unit = Decimal(str(item['valor_unit_substituicao']))
                total_substituicao += qtd * valor_unit
            
            # Criar a troca
            troca = Troca.objects.create(
                id_venda_original=validated_data['id_venda_original'],
                id_cliente=validated_data.get('id_cliente'),
                valor_total_retorno=total_retorno,
                valor_total_substituicao=total_substituicao,
                observacao=validated_data.get('observacao', ''),
                criado_por=validated_data.get('criado_por'),
                status='pendente'
            )
            
            # Criar itens de retorno
            for item in validated_data.get('itens_retorno', []):
                qtd = Decimal(str(item['quantidade_retorno']))
                valor_unit = Decimal(str(item['valor_unit_retorno']))
                valor_total = qtd * valor_unit
                
                TrocaItem.objects.create(
                    troca=troca,
                    id_venda_item_original=item['id_venda_item_original'],
                    id_produto_retorno=item.get('id_produto_retorno'),
                    quantidade_retorno=qtd,
                    valor_unit_retorno=valor_unit,
                    valor_total_retorno=valor_total
                )
            
            # Criar itens de substituição
            for item in validated_data.get('itens_substituicao', []):
                qtd = Decimal(str(item['quantidade_substituicao']))
                valor_unit = Decimal(str(item['valor_unit_substituicao']))
                valor_total = qtd * valor_unit
                
                TrocaItem.objects.create(
                    troca=troca,
                    id_produto_substituicao=item['id_produto_substituicao'],
                    quantidade_substituicao=qtd,
                    valor_unit_substituicao=valor_unit,
                    valor_total_substituicao=valor_total
                )
            
            # Lógica financeira
            diferenca = total_substituicao - total_retorno
            id_financeiro = None
            tipo_ajuste = None
            
            # Extrair dados de pagamento do request
            id_conta = validated_data.get('id_conta')
            id_tipo_pagamento = validated_data.get('id_tipo_pagamento')
            id_centro_custo = validated_data.get('id_centro_custo')
            id_condicao_pagamento = validated_data.get('id_condicao_pagamento')
            data_vencimento = validated_data.get('data_vencimento')
            numero_parcelas = validated_data.get('numero_parcelas', 1)
            
            # Calcular data de vencimento padrão se não fornecida
            from datetime import date, timedelta
            if not data_vencimento:
                data_vencimento = date.today() + timedelta(days=30)
            
            if diferenca > 0:
                # Criar cobrança (cliente deve pagar)
                tipo_ajuste = 'cobranca'
                descricao = f'Troca #{troca.id_troca} - Cobrança adicional'
                
                # Inserir registro financeiro
                with connection.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO financeiro_contas (
                            tipo_conta, id_cliente_fornecedor, descricao,
                            valor_parcela, status_conta, data_emissao, data_vencimento,
                            gerencial, parcela_numero, parcela_total,
                            id_conta, id_tipo_pagamento, id_centro_custo, id_condicao_pagamento
                        ) VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s, %s, %s, %s)
                    """, [
                        'receber',  # tipo_conta para cobrança
                        validated_data.get('id_cliente'),
                        descricao,
                        diferenca,
                        'pendente',
                        data_vencimento,
                        1,  # gerencial
                        1,  # parcela_numero
                        numero_parcelas,  # parcela_total
                        id_conta,
                        id_tipo_pagamento,
                        id_centro_custo,
                        id_condicao_pagamento
                    ])
                    id_financeiro = cursor.lastrowid
                    
            elif diferenca < 0:
                # Criar crédito (empresa deve devolver)
                tipo_ajuste = 'credito'
                valor_credito = abs(diferenca)
                descricao = f'Troca #{troca.id_troca} - Crédito ao cliente'
                
                # Inserir registro financeiro
                with connection.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO financeiro_contas (
                            tipo_conta, id_cliente_fornecedor, descricao,
                            valor_parcela, status_conta, data_emissao,
                            gerencial, parcela_numero, parcela_total,
                            id_conta, id_tipo_pagamento, id_centro_custo, id_condicao_pagamento
                        ) VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s, %s, %s, %s)
                    """, [
                        'credito',  # tipo_conta para crédito
                        validated_data.get('id_cliente'),
                        descricao,
                        valor_credito,
                        'disponivel',
                        1,  # gerencial
                        1,  # parcela_numero
                        numero_parcelas,  # parcela_total
                        id_conta,
                        id_tipo_pagamento,
                        id_centro_custo,
                        id_condicao_pagamento
                    ])
                    id_financeiro = cursor.lastrowid
            
            # Atualizar troca com ID do financeiro
            if id_financeiro:
                troca.id_financeiro = id_financeiro
                troca.save()
            
            # Concluir troca automaticamente
            troca.status = 'concluida'
            troca.save()
            
            # Serializar resposta
            troca_serializer = TrocaSerializer(troca)
            
            response_data = {
                'troca': troca_serializer.data,
                'financeiro': {
                    'id_financeiro': id_financeiro,
                    'tipo_ajuste': tipo_ajuste,
                    'valor_diferenca': float(diferenca),
                    'valor_absoluto': float(abs(diferenca))
                } if id_financeiro else None
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        logger.error(f"Erro ao criar troca: {e}")
        return Response(
            {'error': 'Erro interno ao criar troca', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exchange_detail(request, id_troca):
    """
    Busca detalhes de uma troca específica com nomes de produtos e cliente
    
    Path Parameters:
    - id_troca (int): ID da troca
    
    Returns:
    - Dados completos da troca com itens e nomes
    """
    try:
        # Buscar troca
        troca = Troca.objects.prefetch_related('itens').get(id_troca=id_troca)
        troca_data = TrocaSerializer(troca).data
        
        # Buscar nome do cliente
        if troca.id_cliente:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT nome_razao_social, cpf_cnpj 
                    FROM clientes 
                    WHERE id_cliente = %s
                """, [troca.id_cliente])
                cliente_row = cursor.fetchone()
                if cliente_row:
                    troca_data['cliente_nome'] = cliente_row[0]
                    troca_data['cliente_documento'] = cliente_row[1]
        
        # Enriquecer itens com nomes de produtos
        for item in troca_data.get('itens', []):
            with connection.cursor() as cursor:
                # Nome do produto de retorno
                if item.get('id_produto_retorno'):
                    cursor.execute("""
                        SELECT nome_produto, codigo_produto 
                        FROM produtos 
                        WHERE id_produto = %s
                    """, [item['id_produto_retorno']])
                    prod_row = cursor.fetchone()
                    if prod_row:
                        item['nome_produto_retorno'] = prod_row[0]
                        item['codigo_produto_retorno'] = prod_row[1]
                
                # Nome do produto de substituição
                if item.get('id_produto_substituicao'):
                    cursor.execute("""
                        SELECT nome_produto, codigo_produto 
                        FROM produtos 
                        WHERE id_produto = %s
                    """, [item['id_produto_substituicao']])
                    prod_row = cursor.fetchone()
                    if prod_row:
                        item['nome_produto_substituicao'] = prod_row[0]
                        item['codigo_produto_substituicao'] = prod_row[1]
        
        return Response(troca_data)
        
    except Troca.DoesNotExist:
        return Response(
            {'error': 'Troca não encontrada'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Erro ao buscar troca {id_troca}: {e}")
        return Response(
            {'error': 'Erro interno ao buscar troca'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_exchanges(request):
    """
    Lista trocas com filtros opcionais
    
    Query Parameters:
    - cliente (int): ID do cliente
    - status (str): Status da troca
    - data_inicio (str): Data início (YYYY-MM-DD)
    - data_fim (str): Data fim (YYYY-MM-DD)
    - limit (int): Limite de resultados (default: 50)
    - offset (int): Offset para paginação (default: 0)
    
    Returns:
    - Lista de trocas
    """
    try:
        queryset = Troca.objects.prefetch_related('itens').all()
        
        # Filtros
        if request.query_params.get('cliente'):
            queryset = queryset.filter(id_cliente=request.query_params['cliente'])
        
        if request.query_params.get('status'):
            queryset = queryset.filter(status=request.query_params['status'])
        
        if request.query_params.get('data_inicio'):
            data_inicio = datetime.strptime(request.query_params['data_inicio'], '%Y-%m-%d')
            queryset = queryset.filter(data_troca__gte=data_inicio)
        
        if request.query_params.get('data_fim'):
            data_fim = datetime.strptime(request.query_params['data_fim'], '%Y-%m-%d')
            queryset = queryset.filter(data_troca__lte=data_fim)
        
        # Paginação
        limit = int(request.query_params.get('limit', 50))
        offset = int(request.query_params.get('offset', 0))
        
        total = queryset.count()
        trocas = queryset[offset:offset + limit]
        
        serializer = TrocaSerializer(trocas, many=True)
        
        return Response({
            'trocas': serializer.data,
            'total': total,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        logger.error(f"Erro ao listar trocas: {e}")
        return Response(
            {'error': 'Erro interno ao listar trocas'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_options(request):
    """
    Busca opções de pagamento (contas, tipos de pagamento, centros de custo, condições)
    
    Returns:
    - Dicionário com todas as opções disponíveis
    """
    try:
        with connection.cursor() as cursor:
            # Buscar contas bancárias
            cursor.execute("""
                SELECT id_conta, nome_conta, tipo_conta
                FROM contas
                WHERE ativo = 1
                ORDER BY nome_conta
            """)
            contas = [
                {'id': row[0], 'nome': row[1], 'tipo': row[2]}
                for row in cursor.fetchall()
            ]
            
            # Buscar tipos de pagamento
            cursor.execute("""
                SELECT id_tipo_pagamento, nome_tipo_pagamento
                FROM tipos_pagamento
                WHERE ativo = 1
                ORDER BY nome_tipo_pagamento
            """)
            tipos_pagamento = [
                {'id': row[0], 'nome': row[1]}
                for row in cursor.fetchall()
            ]
            
            # Buscar centros de custo
            cursor.execute("""
                SELECT id_centro_custo, nome_centro_custo
                FROM centros_custo
                WHERE ativo = 1
                ORDER BY nome_centro_custo
            """)
            centros_custo = [
                {'id': row[0], 'nome': row[1]}
                for row in cursor.fetchall()
            ]
            
            # Buscar condições de pagamento
            cursor.execute("""
                SELECT id_condicao_pagamento, nome_condicao, dias_prazo, numero_parcelas
                FROM condicoes_pagamento
                WHERE ativo = 1
                ORDER BY nome_condicao
            """)
            condicoes_pagamento = [
                {
                    'id': row[0], 
                    'nome': row[1], 
                    'dias_prazo': row[2],
                    'numero_parcelas': row[3]
                }
                for row in cursor.fetchall()
            ]
            
        return Response({
            'contas': contas,
            'tipos_pagamento': tipos_pagamento,
            'centros_custo': centros_custo,
            'condicoes_pagamento': condicoes_pagamento
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar opções de pagamento: {e}")
        return Response(
            {'error': 'Erro interno ao buscar opções de pagamento'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )