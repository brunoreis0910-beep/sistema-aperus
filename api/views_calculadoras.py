"""
Views para Calculadoras de Material de Construção
Endpoint: /api/calculadoras/
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from decimal import Decimal
import math
from api.models import Produto, UserParametros


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calcular_revestimento(request):
    """
    Calcula quantidade de caixas necessárias para cobrir uma área
    
    Payload:
    {
        "id_produto": 123,
        "comprimento": 7.0,
        "largura": 3.0,
        "margem_quebra": 10.0  (opcional)
    }
    
    Retorno:
    {
        "area_total": 21.0,
        "area_com_margem": 23.1,
        "metragem_caixa": 2.5,
        "quantidade_caixas": 10,
        "quantidade_calculada": 9.24
    }
    """
    try:
        id_produto = request.data.get('id_produto')
        comprimento = Decimal(str(request.data.get('comprimento', 0)))
        largura = Decimal(str(request.data.get('largura', 0)))
        margem_quebra = request.data.get('margem_quebra')
        
        # Buscar produto
        produto = Produto.objects.get(id_produto=id_produto)
        
        if not produto.metragem_caixa:
            return Response(
                {'error': 'Produto não possui metragem de caixa configurada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar margem de quebra
        if margem_quebra is None:
            try:
                parametros = UserParametros.objects.get(id_user=request.user)
                margem_quebra = float(parametros.margem_quebra_padrao or 10.0)
            except UserParametros.DoesNotExist:
                margem_quebra = 10.0
        else:
            margem_quebra = float(margem_quebra)
        
        # Calcular área
        area_total = comprimento * largura
        area_com_margem = area_total * (Decimal('1') + Decimal(str(margem_quebra)) / Decimal('100'))
        
        # Calcular quantidade de caixas
        quantidade_calculada = float(area_com_margem / produto.metragem_caixa)
        quantidade_caixas = math.ceil(quantidade_calculada)
        
        # Sugestão de argamassa baseada na área do piso
        CONSUMO_POR_TIPO = {
            'simples': Decimal('5.0'),
            'dupla': Decimal('8.5'),
            'pastilha': Decimal('4.0'),
        }
        tipo_aplicacao = (produto.tipo_aplicacao_argamassa or 'simples').lower().strip()
        consumo_arg = produto.consumo_argamassa_m2 or CONSUMO_POR_TIPO.get(tipo_aplicacao, Decimal('5.0'))
        peso_saco_arg = produto.peso_saco_argamassa or Decimal('20.0')
        total_kg_arg = area_com_margem * consumo_arg
        qtd_sacos_arg = math.ceil(float(total_kg_arg / peso_saco_arg))
        
        return Response({
            'success': True,
            'area_total': float(area_total),
            'area_com_margem': float(area_com_margem),
            'metragem_caixa': float(produto.metragem_caixa),
            'quantidade_calculada': quantidade_calculada,
            'quantidade_caixas': quantidade_caixas,
            'margem_quebra_utilizada': margem_quebra,
            'sugestao_argamassa': {
                'tipo_aplicacao': tipo_aplicacao,
                'consumo_m2_kg': float(consumo_arg),
                'peso_saco_kg': float(peso_saco_arg),
                'total_kg': float(total_kg_arg),
                'quantidade_sacos': qtd_sacos_arg,
            },
            'produto': {
                'id': produto.id_produto,
                'codigo': produto.codigo_produto,
                'nome': produto.nome_produto,
                'unidade': produto.unidade_medida
            }
        })
        
    except Produto.DoesNotExist:
        return Response(
            {'error': 'Produto não encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calcular_argamassa(request):
    """
    Calcula quantidade de sacos de argamassa necessários para uma área de piso.
    
    Payload:
    {
        "area_piso": 35.0,             (m² - informado diretamente)
        -- OU --
        "comprimento": 7.0,            (m)
        "largura": 5.0,                (m)
        
        "consumo_m2": 5.0,             (kg/m² - opcional, padrão por tipo_aplicacao ou 5.0)
        "peso_saco": 20.0,             (kg - opcional, padrão 20)
        "tipo_aplicacao": "simples",   (opcional: simples, dupla, pastilha)
        "margem_seguranca": 10.0,      (% - opcional, padrão 10)
        "id_produto": 123              (opcional - busca configs do produto de piso)
    }
    
    Retorno:
    {
        "area_piso": 35.0,
        "area_com_margem": 38.5,
        "consumo_m2": 5.0,
        "peso_saco": 20.0,
        "tipo_aplicacao": "simples",
        "total_kg": 192.5,
        "quantidade_sacos": 10,
        "quantidade_calculada": 9.625
    }
    """
    try:
        # Determinar área do piso
        area_piso = request.data.get('area_piso')
        if area_piso is not None:
            area_piso = Decimal(str(area_piso))
        else:
            comprimento = Decimal(str(request.data.get('comprimento', 0)))
            largura = Decimal(str(request.data.get('largura', 0)))
            if comprimento <= 0 or largura <= 0:
                return Response(
                    {'error': 'Informe area_piso ou comprimento e largura válidos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            area_piso = comprimento * largura

        if area_piso <= 0:
            return Response(
                {'error': 'Área do piso deve ser maior que zero'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Tabela de consumo padrão por tipo de aplicação
        CONSUMO_POR_TIPO = {
            'simples': Decimal('5.0'),    # Piso até 30x30
            'dupla': Decimal('8.5'),      # Piso maior que 30x30
            'pastilha': Decimal('4.0'),   # Pastilhas/Mosaicos
        }

        tipo_aplicacao = (request.data.get('tipo_aplicacao') or 'simples').lower().strip()
        
        # Tentar buscar configurações do produto de piso
        produto_info = None
        id_produto = request.data.get('id_produto')
        if id_produto:
            try:
                produto = Produto.objects.get(id_produto=id_produto)
                produto_info = {
                    'id': produto.id_produto,
                    'codigo': produto.codigo_produto,
                    'nome': produto.nome_produto,
                }
                # Usar configurações do produto se disponíveis
                if produto.tipo_aplicacao_argamassa:
                    tipo_aplicacao = produto.tipo_aplicacao_argamassa.lower().strip()
                if produto.consumo_argamassa_m2:
                    consumo_m2_produto = produto.consumo_argamassa_m2
                else:
                    consumo_m2_produto = None
                if produto.peso_saco_argamassa:
                    peso_saco_produto = produto.peso_saco_argamassa
                else:
                    peso_saco_produto = None
            except Produto.DoesNotExist:
                consumo_m2_produto = None
                peso_saco_produto = None
        else:
            consumo_m2_produto = None
            peso_saco_produto = None

        # Prioridade: parâmetro do request > config do produto > tabela por tipo
        consumo_m2_param = request.data.get('consumo_m2')
        if consumo_m2_param is not None:
            consumo_m2 = Decimal(str(consumo_m2_param))
        elif consumo_m2_produto:
            consumo_m2 = consumo_m2_produto
        else:
            consumo_m2 = CONSUMO_POR_TIPO.get(tipo_aplicacao, Decimal('5.0'))

        peso_saco_param = request.data.get('peso_saco')
        if peso_saco_param is not None:
            peso_saco = Decimal(str(peso_saco_param))
        elif peso_saco_produto:
            peso_saco = peso_saco_produto
        else:
            peso_saco = Decimal('20.0')

        # Margem de segurança
        margem_seguranca = Decimal(str(request.data.get('margem_seguranca', 10.0)))
        area_com_margem = area_piso * (Decimal('1') + margem_seguranca / Decimal('100'))

        # Cálculo: total_kg = area_com_margem * consumo_m2
        total_kg = area_com_margem * consumo_m2
        quantidade_calculada = float(total_kg / peso_saco)
        quantidade_sacos = math.ceil(quantidade_calculada)

        resposta = {
            'success': True,
            'area_piso': float(area_piso),
            'area_com_margem': float(area_com_margem),
            'margem_seguranca': float(margem_seguranca),
            'tipo_aplicacao': tipo_aplicacao,
            'consumo_m2_kg': float(consumo_m2),
            'peso_saco_kg': float(peso_saco),
            'total_kg': float(total_kg),
            'quantidade_calculada': round(quantidade_calculada, 2),
            'quantidade_sacos': quantidade_sacos,
            'tabela_consumo': {k: float(v) for k, v in CONSUMO_POR_TIPO.items()},
        }
        if produto_info:
            resposta['produto_piso'] = produto_info

        return Response(resposta)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calcular_tinta(request):
    """
    Calcula quantidade de latas/galões necessários para pintar uma área
    
    Payload:
    {
        "id_produto": 456,
        "area_pintar": 180.0,
        "demaos": 2  (opcional)
    }
    
    Retorno:
    {
        "area_pintar": 180.0,
        "demaos": 2,
        "area_total": 360.0,
        "rendimento_unidade": 110.0,
        "quantidade_unidades": 4,
        "quantidade_calculada": 3.27
    }
    """
    try:
        id_produto = request.data.get('id_produto')
        area_pintar = Decimal(str(request.data.get('area_pintar', 0)))
        demaos = int(request.data.get('demaos', 1))
        
        # Buscar produto
        produto = Produto.objects.get(id_produto=id_produto)
        
        if not produto.rendimento_m2:
            return Response(
                {'error': 'Produto não possui rendimento configurado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcular área total considerando demãos
        area_total = area_pintar * Decimal(str(demaos))
        
        # Calcular quantidade de unidades
        quantidade_calculada = float(area_total / produto.rendimento_m2)
        quantidade_unidades = math.ceil(quantidade_calculada)
        
        return Response({
            'success': True,
            'area_pintar': float(area_pintar),
            'demaos': demaos,
            'area_total': float(area_total),
            'rendimento_unidade': float(produto.rendimento_m2),
            'quantidade_calculada': quantidade_calculada,
            'quantidade_unidades': quantidade_unidades,
            'produto': {
                'id': produto.id_produto,
                'codigo': produto.codigo_produto,
                'nome': produto.nome_produto,
                'unidade': produto.unidade_medida
            }
        })
        
    except Produto.DoesNotExist:
        return Response(
            {'error': 'Produto não encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calcular_peso_venda(request):
    """
    Calcula peso total de uma lista de produtos
    
    Payload:
    {
        "itens": [
            {"id_produto": 123, "quantidade": 10},
            {"id_produto": 456, "quantidade": 5}
        ]
    }
    
    Retorno:
    {
        "peso_total": 619.75,
        "itens": [
            {
                "produto": {...},
                "quantidade": 10,
                "peso_unitario": 50.0,
                "peso_total": 500.0
            }
        ]
    }
    """
    try:
        itens = request.data.get('itens', [])
        
        if not itens:
            return Response(
                {'error': 'Lista de itens vazia'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        peso_total = Decimal('0')
        itens_calculados = []
        
        for item in itens:
            id_produto = item.get('id_produto')
            quantidade = Decimal(str(item.get('quantidade', 0)))
            
            produto = Produto.objects.get(id_produto=id_produto)
            
            peso_unitario = produto.peso_unitario or Decimal('0')
            peso_item = quantidade * peso_unitario
            peso_total += peso_item
            
            itens_calculados.append({
                'produto': {
                    'id': produto.id_produto,
                    'codigo': produto.codigo_produto,
                    'nome': produto.nome_produto,
                    'unidade': produto.unidade_medida
                },
                'quantidade': float(quantidade),
                'peso_unitario': float(peso_unitario),
                'peso_total_item': float(peso_item)
            })
        
        # Sugestão de veículo baseado no peso
        sugestao_veiculo = ''
        if peso_total <= 500:
            sugestao_veiculo = 'Carro de passeio (até 500kg)'
        elif peso_total <= 1000:
            sugestao_veiculo = 'Caminhonete pequena (até 1000kg)'
        elif peso_total <= 2000:
            sugestao_veiculo = 'Caminhonete grande (até 2000kg)'
        elif peso_total <= 5000:
            sugestao_veiculo = 'Caminhão 3/4 (até 5000kg)'
        else:
            sugestao_veiculo = 'Caminhão toco ou truck (acima de 5000kg)'
        
        return Response({
            'success': True,
            'peso_total': float(peso_total),
            'peso_total_toneladas': float(peso_total / 1000),
            'sugestao_veiculo': sugestao_veiculo,
            'itens': itens_calculados
        })
        
    except Produto.DoesNotExist:
        return Response(
            {'error': f'Produto {id_produto} não encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_variacoes_produto(request, id_produto_pai):
    """
    Lista todas as variações de um produto pai
    
    Retorno:
    {
        "produto_pai": {...},
        "variacoes": [
            {"id": 1, "codigo": "CANO-20", "nome": "Cano PVC 20mm", "variacao": "20mm"},
            {"id": 2, "codigo": "CANO-25", "nome": "Cano PVC 25mm", "variacao": "25mm"}
        ]
    }
    """
    try:
        produto_pai = Produto.objects.get(id_produto=id_produto_pai)
        variacoes = Produto.objects.filter(produto_pai=produto_pai).select_related('id_grupo')
        
        variacoes_lista = []
        for variacao in variacoes:
            variacoes_lista.append({
                'id': variacao.id_produto,
                'codigo': variacao.codigo_produto,
                'nome': variacao.nome_produto,
                'variacao': variacao.variacao,
                'unidade': variacao.unidade_medida,
                'grupo': variacao.id_grupo.nome_grupo if variacao.id_grupo else None
            })
        
        return Response({
            'success': True,
            'produto_pai': {
                'id': produto_pai.id_produto,
                'codigo': produto_pai.codigo_produto,
                'nome': produto_pai.nome_produto
            },
            'quantidade_variacoes': len(variacoes_lista),
            'variacoes': variacoes_lista
        })
        
    except Produto.DoesNotExist:
        return Response(
            {'error': 'Produto pai não encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buscar_produtos_pai(request):
    """
    Busca produtos que possuem variações (são produtos pai)
    
    Query params:
    - termo: Termo de busca (opcional)
    
    Retorno:
    {
        "produtos": [
            {
                "id": 100,
                "codigo": "CANO-PVC",
                "nome": "Cano PVC",
                "quantidade_variacoes": 4
            }
        ]
    }
    """
    try:
        termo = request.GET.get('termo', '')
        
        # Buscar produtos que são pai de outros
        produtos_pai = Produto.objects.filter(
            variacoes_simples__isnull=False
        ).distinct()
        
        if termo:
            produtos_pai = produtos_pai.filter(nome_produto__icontains=termo)
        
        produtos_lista = []
        for produto in produtos_pai:
            qtd_variacoes = produto.variacoes_simples.count()
            produtos_lista.append({
                'id': produto.id_produto,
                'codigo': produto.codigo_produto,
                'nome': produto.nome_produto,
                'quantidade_variacoes': qtd_variacoes
            })
        
        return Response({
            'success': True,
            'quantidade': len(produtos_lista),
            'produtos': produtos_lista
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_parametros_calculadora(request):
    """
    Retorna parâmetros de configuração das calculadoras de construção.
    Baseado em ConfiguracaoProduto do sistema.
    """
    try:
        from api.models import ConfiguracaoProduto
        config = ConfiguracaoProduto.objects.first()
        
        return Response({
            'habilitar_calc_revestimento': getattr(config, 'material_construcao', False),
            'habilitar_calc_tinta': getattr(config, 'material_construcao', False),
            'margem_quebra_padrao': 10.0,
        })
    except Exception:
        return Response({
            'habilitar_calc_revestimento': False,
            'habilitar_calc_tinta': False,
            'margem_quebra_padrao': 10.0,
        })
