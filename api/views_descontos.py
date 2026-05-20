# views_descontos.py
"""
ViewSets e Endpoints para o Módulo de Descontos Inteligentes
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from decimal import Decimal
import logging
from django.utils import timezone

from .models import Cliente, Produto, Promocao, PromocaoProduto, ClienteGrupoExcecao
from .logic.descontos import validar_desconto, gerar_resumo_desconto_cliente

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simular_desconto_cliente(request):
    """
    Endpoint de simulação: Recebe cliente_id e produto_id, retorna o cálculo de desconto.
    
    Body esperado:
    {
        "id_cliente": 123,
        "id_produto": 456,
        "valor_tabela": 99.90
    }
    
    Response:
    {
        "success": true,
        "preco": 89.91,
        "desconto_aplicado": 9.99,
        "desconto_percentual": 10.0,
        "travado": true,
        "motivo": "Desconto de Cliente: PERCENTUAL - 10",
        "mensagem_tooltip": "Desconto de 10% aplicado automaticamente..."
    }
    """
    
    try:
        id_cliente = request.data.get('id_cliente')
        id_produto = request.data.get('id_produto')
        valor_tabela = request.data.get('valor_tabela')
        
        # Validação básica
        if not all([id_cliente, id_produto, valor_tabela]):
            return Response({
                'success': False,
                'error': 'Campos obrigatórios: id_cliente, id_produto, valor_tabela'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar cliente e produto
        try:
            cliente = Cliente.objects.get(id_cliente=id_cliente)
        except Cliente.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Cliente com ID {id_cliente} não encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            produto = Produto.objects.select_related('id_grupo').get(id_produto=id_produto)
        except Produto.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Produto com ID {id_produto} não encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Calcular
        try:
            if not valor_tabela:
                valor_tabela = Decimal('0.00')
            else:
                valor_tabela = Decimal(str(valor_tabela))
        except Exception:
            valor_tabela = Decimal('0.00')
        
        # 1. Verificar se há promoção ativa
        promocoes_ativas = Promocao.objects.filter(
            data_inicio__lte=timezone.now(),
            data_fim__gte=timezone.now(),
            status='ativa',
            promocao_produtos__id_produto=produto
        ).first()

        priorizar_cliente = cliente.priorizar_desconto_cliente if cliente.priorizar_desconto_cliente else False

        # Calcular o desconto do cliente usando a lógica centralizada
        from .logic.descontos import calcular_preco_final
        resultado_cliente = calcular_preco_final(produto, cliente, valor_tabela)
        desconto_cliente_aplicado = resultado_cliente["desconto_aplicado"]

        # Determinar qual regra aplicar seguindo a hierarquia
        if priorizar_cliente and desconto_cliente_aplicado > 0:
            # Prioriza desconto do cliente
            preco_final = resultado_cliente["preco"]
            desconto_aplicado = resultado_cliente["desconto_aplicado"]
            desconto_percentual = resultado_cliente["desconto_percentual"]
            travado = resultado_cliente["travado"]
            motivo = resultado_cliente["motivo"]
        elif promocoes_ativas:
            # Promoção ativa tem preferência se o cliente não priorizar o seu próprio desconto ou não tiver desconto
            promo_produto = PromocaoProduto.objects.filter(id_promocao=promocoes_ativas, id_produto=produto).first()
            desconto_percentual = promo_produto.valor_desconto_produto if (promo_produto and promo_produto.valor_desconto_produto is not None) else promocoes_ativas.valor_desconto
            desconto_aplicado = valor_tabela * (desconto_percentual / Decimal('100'))
            preco_final = valor_tabela - desconto_aplicado
            travado = True
            motivo = f"Promoção: {promocoes_ativas.nome_promocao}"
        elif desconto_cliente_aplicado > 0:
            # Desconto do cliente padrão
            preco_final = resultado_cliente["preco"]
            desconto_aplicado = resultado_cliente["desconto_aplicado"]
            desconto_percentual = resultado_cliente["desconto_percentual"]
            travado = resultado_cliente["travado"]
            motivo = resultado_cliente["motivo"]
        elif produto.desconto_maximo_percentual and produto.desconto_maximo_percentual > 0:
            # Desconto máximo do produto
            desconto_percentual = produto.desconto_maximo_percentual
            desconto_aplicado = valor_tabela * (desconto_percentual / Decimal('100'))
            preco_final = valor_tabela - desconto_aplicado
            travado = False
            motivo = f"Desconto máximo do produto ({desconto_percentual}%)"
        else:
            # Sem desconto
            preco_final = valor_tabela
            desconto_aplicado = Decimal('0.00')
            desconto_percentual = Decimal('0.00')
            travado = False
            motivo = "Nenhum desconto aplicado"

        # Tratamento de grupo de exceção
        if "grupo de exceção" in resultado_cliente["motivo"]:
            mensagem_tooltip = resultado_cliente["motivo"]
            preco_final = valor_tabela
            desconto_aplicado = Decimal('0.00')
            desconto_percentual = Decimal('0.00')
            travado = resultado_cliente["travado"]
            motivo = resultado_cliente["motivo"]
        else:
            mensagem_tooltip = f"Desconto de {desconto_percentual}% aplicado automaticamente." if travado else motivo
            
        logger.info(f"[DESCONTO] Simulação para Cliente {id_cliente}, Produto {id_produto}: {motivo}")
        
        return Response({
            'success': True,
            'preco': float(preco_final),
            'desconto_aplicado': float(desconto_aplicado),
            'desconto_percentual': float(desconto_percentual),
            'travado': travado,
            'motivo': motivo,
            'mensagem_tooltip': mensagem_tooltip,
            'cliente_nome': cliente.nome_razao_social,
            'produto_nome': produto.nome_produto,
            'tipo_desconto': cliente.tipo_desconto,
            'cliente_tem_desconto': bool(cliente.valor_desconto and cliente.valor_desconto > 0),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[DESCONTO] Erro na simulação: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': f'Erro ao simular desconto: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validar_desconto_proposto(request):
    """
    Endpoint para validar se um desconto proposto pelo vendedor é permitido.
    
    Body esperado:
    {
        "id_cliente": 123,
        "id_produto": 456,
        "desconto_proposto": 15.50
    }
    
    Response:
    {
        "success": true,
        "permitido": true,
        "requer_aprovacao": true,
        "mensagem": "Atenção: Desconto proposto...",
        "desconto_automatico": 10.0
    }
    """
    
    try:
        id_cliente = request.data.get('id_cliente')
        id_produto = request.data.get('id_produto')
        desconto_proposto = request.data.get('desconto_proposto', 0)
        
        if not all([id_cliente, id_produto]):
            return Response({
                'success': False,
                'error': 'Campos obrigatórios: id_cliente, id_produto'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cliente = Cliente.objects.get(id_cliente=id_cliente)
        produto = Produto.objects.select_related('id_grupo').get(id_produto=id_produto)
        
        resultado = validar_desconto(cliente, produto, Decimal(str(desconto_proposto)))
        
        return Response({
            'success': True,
            'permitido': resultado['permitido'],
            'requer_aprovacao': resultado.get('requer_aprovacao', False),
            'mensagem': resultado['mensagem'],
            'desconto_automatico': float(resultado['desconto_maximo']),
            'desconto_proposto': float(desconto_proposto)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[DESCONTO] Erro ao validar: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obter_config_desconto_cliente(request, cliente_id):
    """
    Retorna a configuração de desconto de um cliente para exibição na UI.
    
    URL: /descontos/cliente/{cliente_id}/
    
    Response:
    {
        "success": true,
        "cliente_id": 123,
        "cliente_nome": "Empresa XTYZ",
        "tem_desconto": true,
        "tipo": "PERCENTUAL",
        "valor": "10.00",
        "prioridade": true,
        "grupos_excecao": ["Ferramentas", "Eletrônicos"],
        "margem_arredondamento": "0.50",
        "descricao": "Desconto de 10% para este cliente. Excluídos: Ferramentas, Eletrônicos (Prioridade: Bloqueia alterações)"
    }
    """
    
    try:
        cliente = Cliente.objects.prefetch_related('grupos_excecao').get(id_cliente=cliente_id)
        resumo = gerar_resumo_desconto_cliente(cliente)
        
        return Response({
            'success': True,
            'cliente_id': cliente.id_cliente,
            'cliente_nome': cliente.nome_razao_social,
            **resumo  # Desempacota o resumo
        }, status=status.HTTP_200_OK)
        
    except Cliente.DoesNotExist:
        return Response({
            'success': False,
            'error': f'Cliente {cliente_id} não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"[DESCONTO] Erro ao obter config: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_clientes_com_desconto(request):
    """
    Lista todos os clientes que têm desconto configurado.
    
    Query params:
    - ativo: true/false (filtrar por status)
    - tipo_desconto: FIXO/PERCENTUAL
    - com_excecao: true/false (apenas com grupos de exceção)
    
    Response:
    {
        "success": true,
        "total": 5,
        "clientes": [
            {
                "id_cliente": 123,
                "nome": "Empresa XYZ",
                "tipo_desconto": "PERCENTUAL",
                "valor_desconto": "10.00",
                "prioridade": true,
                "grupos_excecao_count": 2
            }
        ]
    }
    """
    
    try:
        queryset = Cliente.objects.filter(
            valor_desconto__gt=0
        ).prefetch_related('grupos_excecao')
        
        # Filtros
        ativo = request.query_params.get('ativo')
        if ativo is not None:
            queryset = queryset.filter(ativo=ativo.lower() in ('true', '1', 'sim'))
        
        tipo_desconto = request.query_params.get('tipo_desconto')
        if tipo_desconto:
            queryset = queryset.filter(tipo_desconto=tipo_desconto)
        
        com_excecao = request.query_params.get('com_excecao')
        if com_excecao == 'true':
            queryset = queryset.filter(grupos_excecao__isnull=False).distinct()
        elif com_excecao == 'false':
            queryset = queryset.filter(grupos_excecao__isnull=True).distinct()
        
        clientes_data = []
        for cliente in queryset:
            clientes_data.append({
                'id_cliente': cliente.id_cliente,
                'nome': cliente.nome_razao_social,
                'tipo_desconto': cliente.tipo_desconto or 'N/A',
                'valor_desconto': str(cliente.valor_desconto) if cliente.valor_desconto else '0.00',
                'prioridade': cliente.priorizar_desconto_cliente,
                'grupos_excecao_count': cliente.grupos_excecao.count(),
                'ativo': cliente.ativo,
            })
        
        return Response({
            'success': True,
            'total': len(clientes_data),
            'clientes': clientes_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[DESCONTO] Erro ao listar: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
