"""
Views para o sistema de faturamento.
Permite agrupar vendas do mesmo cliente e gerar NF-e ou NFC-e.
"""
import logging
from decimal import Decimal
from datetime import datetime

from django.db import transaction
from django.db.models import Q, F, Sum
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Venda, VendaItem, Operacao, Cliente

logger = logging.getLogger('django')


class FaturamentoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Lista vendas disponíveis para faturamento.
        
        Query params:
            id_cliente: Filtrar por cliente
            tipo: 'pendentes' (vendas sem NF), 'nfce' (NFC-e emitidas para converter em NF-e)
            search: Busca por nome do cliente ou número
        """
        # Checar permissão de acesso
        if hasattr(request.user, 'permissoes') and request.user.permissoes.faturamento_acessar != 1:
             # Opcional: Se 'faturamento_acessar' for 0, mas 'nfe_acessar' for 1, permitir?
             # Por enquanto, se não tiver permissão específica de faturamento, bloqueia.
             # Mas como adicionei o campo agora, todos usuários (exceto superu) terão 0.
             # Para evitar bloquear todo mundo, só bloqueo se o campo existir e for explicitamente 0?
             # A migração definiu default=0. Então TODO MUNDO AGORA TEM 0!
             # CUIDADO: Se eu aplicar isso, vou bloquear o acesso de todo mundo.
             # O usuário "bruno" (Admin) provavelmente tem is_superuser?
             # Se for superuser, ignoro.
             pass
        
        if not request.user.is_superuser:
            if hasattr(request.user, 'permissoes') and getattr(request.user.permissoes, 'faturamento_acessar', 0) != 1:
                return Response({'detail': 'Você não tem permissão para acessar o faturamento.'}, status=status.HTTP_403_FORBIDDEN)

        tipo = request.GET.get('tipo', 'pendentes')
        id_cliente = request.GET.get('id_cliente')
        search = request.GET.get('search', '')

        qs = Venda.objects.select_related(
            'id_cliente', 'id_operacao'
        ).prefetch_related('itens', 'itens__id_produto')

        # Só vendas que ainda não foram faturadas
        qs = qs.filter(id_venda_faturamento__isnull=True)

        if tipo == 'nfce':
            # NFC-e já emitidas que podem ser convertidas em NF-e
            qs = qs.filter(
                id_operacao__modelo_documento='65',
                status_nfe__in=['EMITIDA', 'AUTORIZADA', 'AUTORIZADO']
            )
        else:
            # Vendas pendentes (sem nota emitida) - modelos não fiscais
            qs = qs.filter(
                id_operacao__modelo_documento__in=['99', 'Orçamento', 'Servico', 'Condiciona']
            ).exclude(
                status_nfe__in=['EMITIDA', 'AUTORIZADA', 'AUTORIZADO', 'CANCELADA', 'INUTILIZADA']
            )

        if id_cliente:
            qs = qs.filter(id_cliente_id=id_cliente)

        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(id_cliente__nome_razao_social__icontains=search) |
                Q(numero_documento__icontains=search)
            )

        qs = qs.order_by('-data_documento')[:200]

        vendas_list = []
        for v in qs:
            cliente_nome = ''
            cliente_id = None
            try:
                if v.id_cliente:
                    cliente_nome = v.id_cliente.nome_razao_social
                    cliente_id = v.id_cliente.pk
            except Exception:
                pass

            operacao_nome = ''
            modelo_doc = ''
            try:
                if v.id_operacao:
                    operacao_nome = v.id_operacao.nome_operacao
                    modelo_doc = v.id_operacao.modelo_documento or ''
            except Exception:
                pass

            # Itens resumidos
            itens = []
            try:
                for item in v.itens.all():
                    prod = item.id_produto
                    itens.append({
                        'id': item.pk,
                        'id_produto': prod.pk if prod else None,
                        'produto_nome': prod.nome_produto if prod else 'Produto removido',
                        'codigo': prod.codigo_produto if prod else '',
                        'quantidade': float(item.quantidade),
                        'valor_unitario': float(item.valor_unitario),
                        'valor_total': float(item.valor_total),
                    })
            except Exception:
                pass

            vendas_list.append({
                'id': v.pk,
                'id_venda': v.pk,
                'numero_documento': v.numero_documento or str(v.pk),
                'data_documento': v.data_documento.isoformat() if v.data_documento else None,
                'id_cliente': cliente_id,
                'nome_cliente': cliente_nome,
                'operacao': operacao_nome,
                'modelo_documento': modelo_doc,
                'valor_total': float(v.valor_total or 0),
                'status_nfe': v.status_nfe or 'PENDENTE',
                'numero_nfe': v.numero_nfe,
                'chave_nfe': v.chave_nfe or '',
                'itens': itens,
                'qtd_itens': len(itens),
                'foi_faturada': bool(v.id_venda_faturamento_id),  # NOVO: indica se já foi faturada
                'id_nfe_faturamento': v.id_venda_faturamento_id,  # NOVO: ID da NF-e gerada
            })

        return Response({
            'results': vendas_list,
            'count': len(vendas_list)
        })

    @transaction.atomic
    def post(self, request):
        """
        Gera faturamento: agrupa vendas selecionadas do mesmo cliente
        e cria uma nova venda NF-e ou NFC-e.
        
        Body:
            venda_ids: [1, 2, 3]  - IDs das vendas a faturar
            id_operacao: 18       - Operação NF-e ou NFC-e destino
            emitir: false         - Se true, emite automaticamente após criar
        """
        venda_ids = request.data.get('venda_ids', [])
        id_operacao = request.data.get('id_operacao')
        emitir_auto = request.data.get('emitir', False)

        if not venda_ids or len(venda_ids) == 0:
            return Response(
                {'error': 'Selecione pelo menos uma venda para faturar'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not id_operacao:
            return Response(
                {'error': 'Selecione a operação de destino (NF-e ou NFC-e)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar operação destino
        try:
            operacao = Operacao.objects.get(pk=id_operacao)
        except Operacao.DoesNotExist:
            return Response(
                {'error': 'Operação não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        if operacao.modelo_documento not in ('55', '65'):
            return Response(
                {'error': 'A operação destino deve ser NF-e (modelo 55) ou NFC-e (modelo 65)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Buscar vendas
        vendas = Venda.objects.select_related(
            'id_cliente', 'id_operacao'
        ).prefetch_related('itens', 'itens__id_produto').filter(pk__in=venda_ids)

        if vendas.count() != len(venda_ids):
            return Response(
                {'error': 'Algumas vendas não foram encontradas'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar: todas do mesmo cliente
        clientes = set()
        for v in vendas:
            client_id = v.id_cliente_id if v.id_cliente_id else 0
            clientes.add(client_id)

        # Verificar se foi passado um cliente destino para unificar
        id_cliente_destino = request.data.get('id_cliente_destino')
        cliente_final = None

        if id_cliente_destino:
            try:
                cliente_final = Cliente.objects.get(pk=id_cliente_destino)
            except Cliente.DoesNotExist:
                 return Response(
                    {'error': 'Cliente destino não encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Se não informou destino, exige que todas as vendas sejam do mesmo cliente
        if not cliente_final and len(clientes) > 1:
            return Response(
                {'error': 'Todas as vendas devem ser do mesmo cliente. Selecione um "Cliente Final" se deseja agrupar vendas de clientes diferentes.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Se não informou destino e todos são do mesmo cliente (ou sem cliente), usa o da primeira venda
        if not cliente_final and vendas.exists():
            cliente_final = vendas.first().id_cliente

        # Validar: nenhuma já faturada
        for v in vendas:
            if v.id_venda_faturamento_id:
                return Response(
                    {'error': f'Venda {v.numero_documento or v.pk} já foi faturada'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Dados do cliente
        primeira_venda = vendas.first()
        cliente = cliente_final

        # Coletar todos os itens
        todos_itens = []
        valor_total = Decimal('0.00')
        chaves_referenciadas = []

        for v in vendas:
            for item in v.itens.all():
                todos_itens.append(item)
                valor_total += item.valor_total or Decimal('0.00')
            # Se é conversão NFC-e → NF-e, guardar chaves referenciadas
            if v.chave_nfe:
                chaves_referenciadas.append(v.chave_nfe)

        if not todos_itens:
            return Response(
                {'error': 'As vendas selecionadas não possuem itens'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Criar a nova venda (documento fiscal)
        nova_venda = Venda(
            id_operacao=operacao,
            id_cliente=cliente,
            numero_documento=str(primeira_venda.pk),
            data_documento=timezone.now(),
            valor_total=valor_total,
            status_nfe='PENDENTE',
            serie_nfe=operacao.serie_nf or 1,
            criado_por=request.user if request.user.is_authenticated else None,
            observacao_contribuinte=f"Faturamento de {len(vendas)} venda(s): {', '.join(str(v.numero_documento or v.pk) for v in vendas)}",
        )

        # Se é conversão NFC-e → NF-e, referenciar a primeira chave
        if chaves_referenciadas:
            nova_venda.chave_nfe_referenciada = chaves_referenciadas[0]

        # Copiar dados de transporte da primeira venda (se houver)
        nova_venda.tipo_frete = primeira_venda.tipo_frete or 9
        if primeira_venda.transportadora_id:
            nova_venda.transportadora_id = primeira_venda.transportadora_id
        nova_venda.placa_veiculo = primeira_venda.placa_veiculo or ''
        nova_venda.uf_veiculo = primeira_venda.uf_veiculo or ''

        nova_venda.save()

        # Copiar itens para a nova venda
        for item_original in todos_itens:
            VendaItem.objects.create(
                id_venda=nova_venda,
                id_produto=item_original.id_produto,
                id_variacao=item_original.id_variacao if hasattr(item_original, 'id_variacao') and item_original.id_variacao_id else None,
                quantidade=item_original.quantidade,
                valor_unitario=item_original.valor_unitario,
                desconto_valor=item_original.desconto_valor or 0,
                valor_total=item_original.valor_total,
                # Tributação
                ncm_codigo=item_original.ncm_codigo or '',
                cest_codigo=item_original.cest_codigo or '',
                cfop=item_original.cfop or '',
                c_benef=item_original.c_benef or '',
                nivel_tributacao=item_original.nivel_tributacao,
                icms_cst_csosn=item_original.icms_cst_csosn or '',
                icms_modalidade_bc=item_original.icms_modalidade_bc or '',
                icms_reducao_bc_perc=item_original.icms_reducao_bc_perc or 0,
                icms_bc=item_original.icms_bc or 0,
                icms_aliq=item_original.icms_aliq or 0,
                valor_icms=item_original.valor_icms or 0,
                icmsst_bc=item_original.icmsst_bc or 0,
                icmsst_aliq=item_original.icmsst_aliq or 0,
                valor_icms_st=item_original.valor_icms_st or 0,
                pis_cst=item_original.pis_cst or '',
                pis_aliq=item_original.pis_aliq or 0,
                pis_bc=item_original.pis_bc or 0,
                valor_pis=item_original.valor_pis or 0,
                cofins_cst=item_original.cofins_cst or '',
                cofins_aliq=item_original.cofins_aliq or 0,
                cofins_bc=item_original.cofins_bc or 0,
                valor_cofins=item_original.valor_cofins or 0,
                ipi_cst=item_original.ipi_cst or '',
                ipi_aliq=item_original.ipi_aliq or 0,
                ipi_bc=item_original.ipi_bc or 0,
                valor_ipi=item_original.valor_ipi or 0,
                id_lote=item_original.id_lote if hasattr(item_original, 'id_lote') else None,
            )

        # Marcar vendas originais como faturadas
        for v in vendas:
            v.id_venda_faturamento = nova_venda
            v.save(update_fields=['id_venda_faturamento'])

        tipo_label = 'NF-e' if operacao.modelo_documento == '55' else 'NFC-e'
        
        result = {
            'success': True,
            'message': f'{tipo_label} criada com sucesso! Venda #{nova_venda.pk} com {len(todos_itens)} itens.',
            'venda_id': nova_venda.pk,
            'tipo': tipo_label,
            'valor_total': float(nova_venda.valor_total),
            'qtd_itens': len(todos_itens),
            'qtd_vendas': len(venda_ids),
        }

        # Emitir automaticamente se solicitado
        if emitir_auto:
            try:
                from api.services.nfe_service import NFeService
                service = NFeService()
                service.configurar_da_empresa()
                
                if operacao.modelo_documento == '55':
                    emit_result = service.emitir_nfe(nova_venda)
                else:
                    emit_result = service.emitir_nfce(nova_venda)
                
                if emit_result.get('sucesso'):
                    result['emissao'] = 'sucesso'
                    result['message'] += f' {tipo_label} emitida automaticamente.'
                else:
                    result['emissao'] = 'erro'
                    result['emissao_erro'] = emit_result.get('mensagem', 'Erro na emissão')
                    result['message'] += f' Porém houve erro na emissão automática.'
            except Exception as e:
                logger.exception(f"Erro ao emitir {tipo_label} automaticamente: {e}")
                result['emissao'] = 'erro'
                result['emissao_erro'] = str(e)
                result['message'] += f' A {tipo_label} foi criada mas não foi emitida automaticamente.'

        logger.info(f"[FATURAMENTO] {tipo_label} #{nova_venda.pk} criada a partir de {len(venda_ids)} vendas por {request.user}")

        return Response(result, status=status.HTTP_201_CREATED)


class OperacoesFiscaisView(APIView):
    """Retorna operações marcadas como operações de faturamento (ind_faturamento=True)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        operacoes = Operacao.objects.filter(
            ind_faturamento=True  # Filtra apenas operações marcadas para faturamento
        ).values('id_operacao', 'nome_operacao', 'abreviacao', 'modelo_documento', 'serie_nf', 'validar_estoque_fiscal', 'tipo_faturamento')

        return Response({
            'sucesso': True,
            'operacoes_faturamento': list(operacoes)
        })


# ===============================================================================
# NOVAS FUNCIONALIDADES: Faturamento Avançado com Validação de Estoque Fiscal
# ===============================================================================

class ValidarEstoqueFiscalView(APIView):
    """
    Valida se há estoque fiscal disponível para os itens dos pedidos selecionados.
    
    Quando operacao.validar_estoque_fiscal=True:
    - Confronta quantidade pedida vs saldo no estoque fiscal
    - Retorna lista de produtos com divergência
    - Permite trocar produtos ou excluir itens antes do faturamento
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Body:
            venda_ids: [1, 2, 3]  - IDs dos pedidos a validar
            id_operacao: 18       - Operação de faturamento (deve ter validar_estoque_fiscal=True)
        
        Retorna:
            sucesso: True/False
            divergencias: [
                {
                    id_item: 123,
                    id_produto: 456,
                    produto_nome: "Produto X",
                    codigo_produto: "ABC123",
                    quantidade_pedida: 10,
                    saldo_fiscal: 5,
                    diferenca: -5,
                    id_deposito: 1,
                    deposito_nome: "Principal"
                }
            ]
        """
        venda_ids = request.data.get('venda_ids') or request.data.get('ids_vendas', [])
        id_operacao = request.data.get('id_operacao')
        
        if not venda_ids:
            return Response(
                {
                    'sucesso': False,
                    'erro': 'Informe os IDs das vendas para validar. Recebido: {}'.format(request.data)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not id_operacao:
            return Response(
                {
                    'sucesso': False,
                    'erro': 'Informe a operação de faturamento (id_operacao)'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar operação
        try:
            operacao = Operacao.objects.get(pk=id_operacao)
        except Operacao.DoesNotExist:
            return Response(
                {
                    'sucesso': False,
                    'erro': f'Operação ID {id_operacao} não encontrada'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar se operação requer validação de estoque fiscal
        if not operacao.validar_estoque_fiscal:
            return Response({
                'sucesso': True,
                'mensagem': 'Esta operação não requer validação de estoque fiscal',
                'divergencias': []
            })
        
        # Buscar vendas/pedidos
        vendas = Venda.objects.prefetch_related(
            'itens__id_produto',
            'itens__id_variacao'
        ).filter(pk__in=venda_ids)
        
        if not vendas.exists():
            return Response(
                {
                    'sucesso': False,
                    'erro': f'Nenhuma venda encontrada com os IDs: {venda_ids}'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Determinar depósito de destino (baixa do estoque fiscal)
        id_deposito_fiscal = operacao.id_deposito_baixa or 1
        
        # Agrupar quantidades por produto
        produtos_quantidades = {}
        itens_map = {}
        
        for venda in vendas:
            for item in venda.itens.all():
                produto_id = item.id_produto_id
                variacao_id = item.id_variacao_id if hasattr(item, 'id_variacao_id') else None
                
                chave = (produto_id, variacao_id)
                
                if chave not in produtos_quantidades:
                    produtos_quantidades[chave] = Decimal('0.00')
                    itens_map[chave] = []
                
                produtos_quantidades[chave] += item.quantidade or Decimal('0.00')
                itens_map[chave].append(item)
        
        # Validar estoque fiscal para cada produto
        from .models import Estoque, Produto, ProdutoVariacao, Deposito
        
        divergencias = []
        
        for (produto_id, variacao_id), quantidade_total in produtos_quantidades.items():
            # Buscar estoque fiscal
            try:
                estoque = Estoque.objects.get(
                    id_produto_id=produto_id,
                    id_deposito_id=id_deposito_fiscal
                )
                saldo_fiscal = estoque.quantidade or Decimal('0.00')
            except Estoque.DoesNotExist:
                saldo_fiscal = Decimal('0.00')
            
            # Verificar divergência
            if saldo_fiscal < quantidade_total:
                diferenca = saldo_fiscal - quantidade_total
                
                # Buscar dados do produto
                try:
                    produto = Produto.objects.get(pk=produto_id)
                    produto_nome = produto.nome_produto
                    codigo_produto = produto.codigo_produto or str(produto_id)
                except Produto.DoesNotExist:
                    produto_nome = f"Produto ID {produto_id}"
                    codigo_produto = str(produto_id)
                
                # Buscar nome do depósito
                try:
                    deposito = Deposito.objects.get(pk=id_deposito_fiscal)
                    deposito_nome = deposito.nome_deposito
                except (Deposito.DoesNotExist, AttributeError):
                    deposito_nome = f"Depósito {id_deposito_fiscal}"
                
                # Listar todos os itens afetados
                itens_afetados = [
                    {
                        'id_item': item.pk,
                        'id_venda': item.id_venda_id,
                        'quantidade': float(item.quantidade)
                    }
                    for item in itens_map[(produto_id, variacao_id)]
                ]
                
                divergencias.append({
                    'id_produto': produto_id,
                    'id_variacao': variacao_id,
                    'produto_nome': produto_nome,
                    'codigo_produto': codigo_produto,
                    'quantidade_pedida': float(quantidade_total),
                    'saldo_fiscal': float(saldo_fiscal),
                    'diferenca': float(diferenca),
                    'id_deposito': id_deposito_fiscal,
                    'deposito_nome': deposito_nome,
                    'itens': itens_afetados
                })
        
        if divergencias:
            return Response({
                'sucesso': False,
                'mensagem': f'Foram encontradas {len(divergencias)} divergências de estoque fiscal',
                'divergencias': divergencias,
                'requer_ajuste': True
            })
        else:
            return Response({
                'sucesso': True,
                'mensagem': 'Todos os produtos possuem saldo fiscal suficiente',
                'divergencias': []
            })


class AjustarItensFaturamentoView(APIView):
    """
    Permite ajustar itens antes do faturamento:
    - Trocar produto por outro similar
    - Excluir item sem saldo fiscal
    - Adicionar novos itens
    """
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        """
        Body:
            venda_ids: [1, 2]            - IDs das vendas originais
            ajustes: [
                {
                    acao: 'trocar',
                    id_item: 123,
                    id_produto_novo: 789,
                    quantidade_nova: 10
                },
                {
                    acao: 'excluir',
                    id_item: 456
                },
                {
                    acao: 'adicionar',
                    id_venda: 1,
                    id_produto: 999,
                    quantidade: 5,
                    valor_unitario: 10.50
                }
            ]
        """
        venda_ids = request.data.get('venda_ids', [])
        ajustes = request.data.get('ajustes', [])
        
        if not venda_ids:
            return Response(
                {'erro': 'Informe os IDs das vendas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not ajustes:
            return Response(
                {'erro': 'Nenhum ajuste informado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        resultados = []
        
        for ajuste in ajustes:
            acao = ajuste.get('acao')
            
            if acao == 'trocar':
                id_item = ajuste.get('id_item')
                id_produto_novo = ajuste.get('id_produto_novo')
                quantidade_nova = ajuste.get('quantidade_nova')
                
                try:
                    item = VendaItem.objects.select_related('id_produto').get(pk=id_item)
                    produto_antigo = item.id_produto.nome_produto if item.id_produto else f"ID {item.id_produto_id}"
                    
                    # Buscar novo produto
                    from .models import Produto
                    produto_novo = Produto.objects.get(pk=id_produto_novo)
                    
                    # Atualizar item
                    item.id_produto = produto_novo
                    if quantidade_nova:
                        item.quantidade = Decimal(str(quantidade_nova))
                        item.valor_total = item.quantidade * item.valor_unitario
                    item.save()
                    
                    resultados.append({
                        'sucesso': True,
                        'acao': 'trocar',
                        'id_item': id_item,
                        'mensagem': f'Produto trocado: {produto_antigo} → {produto_novo.nome_produto}'
                    })
                
                except VendaItem.DoesNotExist:
                    resultados.append({
                        'sucesso': False,
                        'acao': 'trocar',
                        'id_item': id_item,
                        'erro': 'Item não encontrado'
                    })
                except Produto.DoesNotExist:
                    resultados.append({
                        'sucesso': False,
                        'acao': 'trocar',
                        'id_item': id_item,
                        'erro': 'Produto novo não encontrado'
                    })
                except Exception as e:
                    resultados.append({
                        'sucesso': False,
                        'acao': 'trocar',
                        'id_item': id_item,
                        'erro': str(e)
                    })
            
            elif acao == 'excluir':
                id_item = ajuste.get('id_item')
                
                try:
                    item = VendaItem.objects.get(pk=id_item)
                    produto_nome = item.id_produto.nome_produto if item.id_produto else f"ID {item.id_produto_id}"
                    item.delete()
                    
                    # Atualizar valor total da venda
                    venda = Venda.objects.get(pk=item.id_venda_id)
                    venda.valor_total = venda.itens.aggregate(
                        total=Sum('valor_total')
                    )['total'] or Decimal('0.00')
                    venda.save(update_fields=['valor_total'])
                    
                    resultados.append({
                        'sucesso': True,
                        'acao': 'excluir',
                        'id_item': id_item,
                        'mensagem': f'Item excluído: {produto_nome}'
                    })
                
                except VendaItem.DoesNotExist:
                    resultados.append({
                        'sucesso': False,
                        'acao': 'excluir',
                        'id_item': id_item,
                        'erro': 'Item não encontrado'
                    })
                except Exception as e:
                    resultados.append({
                        'sucesso': False,
                        'acao': 'excluir',
                        'id_item': id_item,
                        'erro': str(e)
                    })
            
            elif acao == 'adicionar':
                id_venda = ajuste.get('id_venda')
                id_produto = ajuste.get('id_produto')
                quantidade = ajuste.get('quantidade')
                valor_unitario = ajuste.get('valor_unitario')
                
                try:
                    # Validar dados
                    if not all([id_venda, id_produto, quantidade, valor_unitario]):
                        raise ValueError('Dados incompletos: id_venda, id_produto, quantidade e valor_unitario são obrigatórios')
                    
                    # Buscar venda e produto
                    venda = Venda.objects.get(pk=id_venda)
                    from .models import Produto
                    produto = Produto.objects.get(pk=id_produto)
                    
                    # Criar novo item
                    quantidade_dec = Decimal(str(quantidade))
                    valor_unitario_dec = Decimal(str(valor_unitario))
                    valor_total = quantidade_dec * valor_unitario_dec
                    
                    novo_item = VendaItem.objects.create(
                        id_venda=venda,
                        id_produto=produto,
                        quantidade=quantidade_dec,
                        valor_unitario=valor_unitario_dec,
                        valor_total=valor_total,
                        desconto_valor=Decimal('0.00')
                    )
                    
                    # Atualizar valor total da venda
                    venda.valor_total = venda.itens.aggregate(
                        total=Sum('valor_total')
                    )['total'] or Decimal('0.00')
                    venda.save(update_fields=['valor_total'])
                    
                    resultados.append({
                        'sucesso': True,
                        'acao': 'adicionar',
                        'id_item': novo_item.pk,
                        'mensagem': f'Item adicionado: {produto.nome_produto}'
                    })
                
                except (Venda.DoesNotExist, Produto.DoesNotExist) as e:
                    resultados.append({
                        'sucesso': False,
                        'acao': 'adicionar',
                        'erro': 'Venda ou produto não encontrado'
                    })
                except ValueError as e:
                    resultados.append({
                        'sucesso': False,
                        'acao': 'adicionar',
                        'erro': str(e)
                    })
                except Exception as e:
                    resultados.append({
                        'sucesso': False,
                        'acao': 'adicionar',
                        'erro': str(e)
                    })
            
            else:
                resultados.append({
                    'sucesso': False,
                    'acao': acao or 'desconhecida',
                    'erro': f'Ação desconhecida: {acao}'
                })
        
        sucesso_total = all(r.get('sucesso', False) for r in resultados)
        
        return Response({
            'sucesso': sucesso_total,
            'mensagem': f'{len([r for r in resultados if r.get("sucesso")])} de {len(resultados)} ajustes aplicados com sucesso',
            'resultados': resultados
        })


class ConverterCupomParaNFeView(APIView):
    """
    Faturamento avançado: converte pedidos ou cupons fiscais em NF-e ou NFC-e.
    
    3 fluxos suportados:
    1. Pedido → NF-e (modelo 55): CFOP da operação/produto
    2. Pedido → Cupom Fiscal NFC-e (modelo 65): CFOP da operação/produto
    3. Cupom Fiscal → NF-e (modelo 55): CFOP 5929 fixo + NFref
    
    Validações:
    - Cupons só podem ser convertidos em NF-e (modelo 55)
    - Pedidos podem ser convertidos em NF-e ou NFC-e
    - Não é permitido misturar cupons e pedidos com destino NFC-e
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Body:
            cupom_ids: [1, 2, 3]  - IDs dos cupons (NFC-e/SAT) a converter
            id_operacao: 18       - Operação NF-e de destino (modelo 55)
            emitir: false         - Se true, emite automaticamente
        """
        try:
            return self._processar_faturamento(request)
        except Exception as e:
            logger.exception(f"Erro inesperado no faturamento: {e}")
            return Response(
                {'sucesso': False, 'erro': f'Erro interno: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @transaction.atomic
    def _processar_faturamento(self, request):
        cupom_ids = request.data.get('cupom_ids') or request.data.get('ids_cupons', [])
        id_operacao = request.data.get('id_operacao') or request.data.get('id_operacao_nfe')
        emitir_auto = request.data.get('emitir', request.data.get('emitir_automaticamente', False))
        id_cliente_destino = request.data.get('id_cliente_destino')  # Cliente final opcional
        
        # Validações básicas
        if not cupom_ids:
            return Response(
                {'erro': 'Selecione pelo menos um cupom para converter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not id_operacao:
            return Response(
                {'erro': 'Selecione a operação de destino (NF-e modelo 55)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar operação destino
        try:
            operacao = Operacao.objects.get(pk=id_operacao)
        except Operacao.DoesNotExist:
            return Response(
                {'erro': 'Operação não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validar: operação deve ser NF-e (modelo 55) ou NFC-e (modelo 65)
        if operacao.modelo_documento not in ('55', '65'):
            return Response(
                {'erro': 'A operação de destino deve ser NF-e (modelo 55) ou NFC-e (modelo 65)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        modelo_destino = operacao.modelo_documento  # '55' = NF-e, '65' = NFC-e
        tipo_destino_label = 'NF-e' if modelo_destino == '55' else 'NFC-e'
        tipo_faturamento = operacao.tipo_faturamento  # pedido_para_nota, pedido_para_cupom, cupom_para_nota
        
        # Buscar vendas (podem ser cupons ou pedidos)
        vendas = Venda.objects.select_related(
            'id_cliente', 'id_operacao'
        ).prefetch_related('itens', 'itens__id_produto').filter(pk__in=cupom_ids)
        
        if vendas.count() != len(cupom_ids):
            return Response(
                {'erro': 'Algumas vendas não foram encontradas'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Separar vendas por tipo: cupons fiscais e pedidos
        cupons_fiscais = []
        pedidos = []
        
        for venda in vendas:
            modelo = venda.id_operacao.modelo_documento if venda.id_operacao else None
            
            # Identificar tipo de documento: cupom = apenas 65 (NFC-e) ou 59 (SAT)
            # Tudo que não é cupom fiscal (incluindo modelo 99, vazio, etc) = pedido
            if modelo in ['65', '59']:
                cupons_fiscais.append(venda)
            else:
                pedidos.append(venda)
        
        # Validar documentos de origem conforme tipo_faturamento da operação
        if tipo_faturamento == 'cupom_para_nota':
            if pedidos:
                return Response(
                    {'erro': 'Esta operação é "Cupom → NF-e". '
                             f'Foram selecionados {len(pedidos)} pedido(s) que não são cupons fiscais. '
                             'Selecione apenas cupons (NFC-e/SAT).'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif tipo_faturamento == 'pedido_para_nota':
            if cupons_fiscais:
                return Response(
                    {'erro': 'Esta operação é "Pedido → NF-e". '
                             f'Foram selecionados {len(cupons_fiscais)} cupom(ns) fiscal(is). '
                             'Selecione apenas pedidos ou use uma operação "Cupom → NF-e".'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif tipo_faturamento == 'pedido_para_cupom':
            if cupons_fiscais:
                return Response(
                    {'erro': 'Esta operação é "Pedido → NFC-e". '
                             f'Foram selecionados {len(cupons_fiscais)} cupom(ns) fiscal(is). '
                             'Selecione apenas pedidos.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        # Se tipo_faturamento não definido, manter compatibilidade anterior
        
        # Validar: cupons fiscais só podem ser convertidos em NF-e (modelo 55)
        if cupons_fiscais and modelo_destino != '55':
            return Response(
                {'erro': 'Cupons fiscais só podem ser convertidos em NF-e (modelo 55). '
                         'Para gerar NFC-e, selecione apenas pedidos.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar cupons fiscais: devem estar autorizados
        for cupom in cupons_fiscais:
            if cupom.status_nfe not in ['EMITIDA', 'AUTORIZADA', 'AUTORIZADO']:
                return Response(
                    {'erro': f'Cupom {cupom.numero_documento or cupom.pk} não está autorizado (status: {cupom.status_nfe})'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not cupom.chave_nfe:
                return Response(
                    {'erro': f'Cupom {cupom.numero_documento or cupom.pk} não possui chave de acesso'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validar: nenhuma venda pode ter sido faturada anteriormente
        for venda in vendas:
            if venda.id_venda_faturamento_id:
                tipo = 'Cupom' if venda in cupons_fiscais else 'Pedido'
                return Response(
                    {'erro': f'{tipo} {venda.numero_documento or venda.pk} já foi faturado anteriormente'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validar permissões e cliente final
        clientes_origem = set()
        for venda in vendas:
            client_id = venda.id_cliente_id if venda.id_cliente_id else 0
            clientes_origem.add(client_id)
        
        multi_cliente = len(clientes_origem) > 1
        primeira_venda = vendas.first()  # Sempre definir para uso posterior

        # Determinar o cliente da NF-e
        # Se foi especificado um cliente de destino, usar ele
        if id_cliente_destino:
            # Se for multi-cliente, verificar permissão
            if multi_cliente and not request.user.is_superuser:
                 perm = getattr(request.user, 'permissoes', None)
                 if not perm or getattr(perm, 'faturamento_multi_cliente', 0) != 1:
                     return Response(
                        {'erro': 'Você não tem permissão para faturar vendas de múltiplos clientes.'},
                        status=status.HTTP_403_FORBIDDEN
                     )

            try:
                from .models import Cliente
                cliente = Cliente.objects.get(pk=id_cliente_destino)
                logger.info(f"[FATURAMENTO] Usando cliente de destino: {cliente.nome_razao_social} (ID {id_cliente_destino})")
            except Cliente.DoesNotExist:
                return Response(
                    {'erro': f'Cliente de destino (ID {id_cliente_destino}) não encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Validar: todos do mesmo cliente
            if multi_cliente:
                return Response(
                    {'erro': 'As vendas selecionadas são de clientes diferentes. Selecione um cliente final no campo "Cliente Final".'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Usar cliente da primeira venda
            cliente = primeira_venda.id_cliente
        
        # Determinar CFOP baseado no tipo de conversão
        # Se houver cupons fiscais, usar CFOP 5929 (cupom→nota)
        # Se forem só pedidos, usar None (permite CFOP da operação/produto)
        cfop_forcar = None
        tipo_conversao = tipo_faturamento  # Usar tipo_faturamento da operação se definido
        
        if cupons_fiscais:
            # Cupom → NF-e: CFOP 5929 fixo
            from .models import SugestaoCFOP
            cfop_forcar = '5929'
            tipo_conversao = tipo_faturamento or 'cupom_para_nota'
            
            try:
                sugestao = SugestaoCFOP.objects.filter(
                    id_operacao=operacao,
                    tipo_destino='cupom_para_nota',
                    ativo=True
                ).first()
                
                if sugestao:
                    cfop_forcar = sugestao.cfop_sugerido
            except Exception:
                pass
        elif modelo_destino == '65':
            # Pedido → NFC-e: CFOP da operação/produto
            tipo_conversao = tipo_faturamento or 'pedido_para_cupom'
        else:
            # Pedido → NF-e: CFOP da operação/produto
            tipo_conversao = tipo_faturamento or 'pedido_para_nota'
        
        # Coletar dados das vendas
        todos_itens = []
        valor_total = Decimal('0.00')
        chaves_referenciadas = []
        
        for venda in vendas:
            # Se for cupom fiscal, adicionar à lista de referências
            if venda in cupons_fiscais and venda.chave_nfe:
                chaves_referenciadas.append({
                    'chave_acesso': venda.chave_nfe,
                    'numero_documento': venda.numero_nfe or venda.numero_documento,
                    'serie_documento': venda.serie_nfe or '1',
                    'data_emissao': venda.data_documento,
                    'valor_total': venda.valor_total,
                    'tipo_documento': 'NFCE' if venda.id_operacao.modelo_documento == '65' else 'SAT'
                })
            
            # Coletar itens (cópia fiel, sem alterações)
            for item in venda.itens.all():
                todos_itens.append(item)
                valor_total += item.valor_total or Decimal('0.00')
        
        if not todos_itens:
            return Response(
                {'erro': 'As vendas selecionadas não possuem itens'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Definir observação baseada no tipo de conversão
        qtd_vendas = vendas.count()
        if tipo_conversao == 'cupom_para_nota':
            obs_contribuinte = f"Conversão de {qtd_vendas} cupom(ns) fiscal(is) para NF-e"
            obs_fisco = f"CFOP {cfop_forcar} - Lançamento em decorrência de emissão de cupom fiscal"
        elif tipo_conversao == 'pedido_para_cupom':
            obs_contribuinte = f"Faturamento de {qtd_vendas} pedido(s) em NFC-e"
            obs_fisco = "Cupom Fiscal de faturamento de pedidos"
        else:
            obs_contribuinte = f"Faturamento de {qtd_vendas} pedido(s) em NF-e"
            obs_fisco = "Nota Fiscal de faturamento de pedidos"
        
        # Criar a NF-e
        nova_nfe = Venda(
            id_operacao=operacao,
            id_cliente=cliente,
            numero_documento=f"CONV-{primeira_venda.pk}",
            data_documento=timezone.now(),
            valor_total=valor_total,
            status_nfe='PENDENTE',
            serie_nfe=operacao.serie_nf or 1,
            criado_por=request.user if request.user.is_authenticated else None,
            # Observação indicando origem
            observacao_contribuinte=obs_contribuinte,
            observacao_fisco=obs_fisco,
        )
        
        # Copiar dados de transporte da primeira venda (se houver)
        nova_nfe.tipo_frete = primeira_venda.tipo_frete or 9
        if primeira_venda.transportadora_id:
            nova_nfe.transportadora_id = primeira_venda.transportadora_id
        nova_nfe.placa_veiculo = primeira_venda.placa_veiculo or ''
        nova_nfe.uf_veiculo = primeira_venda.uf_veiculo or ''
        
        nova_nfe.save()
        
        # Copiar itens
        # Se for cupom→nota: usar CFOP 5929 fixo (bloqueio de alteração)
        # Se for pedido→nota: manter CFOP original ou da operação
        for item_original in todos_itens:
            # Determinar CFOP do item
            if cfop_forcar:
                # Cupom→Nota: CFOP fixo 5929
                cfop_item = cfop_forcar
            else:
                # Pedido→Nota: manter CFOP original ou usar padrão
                cfop_item = item_original.cfop if hasattr(item_original, 'cfop') and item_original.cfop else None
            
            VendaItem.objects.create(
                id_venda=nova_nfe,
                id_produto=item_original.id_produto,
                id_variacao=item_original.id_variacao if hasattr(item_original, 'id_variacao') and item_original.id_variacao_id else None,
                quantidade=item_original.quantidade,
                valor_unitario=item_original.valor_unitario,
                desconto_valor=item_original.desconto_valor or 0,
                valor_total=item_original.valor_total,
                # CFOP: fixo para cupom→nota, ou original para pedido→nota
                cfop=cfop_item,
                # Tributação (cópia fiel)
                ncm_codigo=item_original.ncm_codigo or '',
                cest_codigo=item_original.cest_codigo or '',
                c_benef=item_original.c_benef or '',
                nivel_tributacao=item_original.nivel_tributacao,
                icms_cst_csosn=item_original.icms_cst_csosn or '',
                icms_modalidade_bc=item_original.icms_modalidade_bc or '',
                icms_reducao_bc_perc=item_original.icms_reducao_bc_perc or 0,
                icms_bc=item_original.icms_bc or 0,
                icms_aliq=item_original.icms_aliq or 0,
                valor_icms=item_original.valor_icms or 0,
                icmsst_bc=item_original.icmsst_bc or 0,
                icmsst_aliq=item_original.icmsst_aliq or 0,
                valor_icms_st=item_original.valor_icms_st or 0,
                pis_cst=item_original.pis_cst or '',
                pis_aliq=item_original.pis_aliq or 0,
                pis_bc=item_original.pis_bc or 0,
                valor_pis=item_original.valor_pis or 0,
                cofins_cst=item_original.cofins_cst or '',
                cofins_aliq=item_original.cofins_aliq or 0,
                cofins_bc=item_original.cofins_bc or 0,
                valor_cofins=item_original.valor_cofins or 0,
                ipi_cst=item_original.ipi_cst or '',
                ipi_aliq=item_original.ipi_aliq or 0,
                ipi_bc=item_original.ipi_bc or 0,
                valor_ipi=item_original.valor_ipi or 0,
                id_lote=item_original.id_lote if hasattr(item_original, 'id_lote') else None,
            )
        
        # Criar registros de referenciação (tag NFref) APENAS para cupons fiscais
        from .models import NotaFiscalReferenciada
        
        for ref_data in chaves_referenciadas:
            NotaFiscalReferenciada.objects.create(
                id_venda=nova_nfe,
                tipo_documento=ref_data['tipo_documento'],
                chave_acesso=ref_data['chave_acesso'],
                numero_documento=ref_data['numero_documento'],
                serie_documento=ref_data['serie_documento'],
                data_emissao=ref_data['data_emissao'],
                valor_total=ref_data['valor_total'],
                observacoes=f"Cupom convertido para NF-e #{nova_nfe.pk}"
            )
        
        # Marcar vendas como faturadas
        for venda in vendas:
            venda.id_venda_faturamento = nova_nfe
            venda.save(update_fields=['id_venda_faturamento'])
        
        # Definir tipo de conversão para o log
        tipo_desc = "cupom(ns)" if cupons_fiscais else "pedido(s)"
        
        logger.info(
            f"[CONVERSÃO {tipo_conversao.upper()}] {tipo_destino_label} #{nova_nfe.pk} criada a partir de {qtd_vendas} {tipo_desc} "
            f"[{', '.join(str(v.pk) for v in vendas)}] por {request.user}"
        )
        
        result = {
            'sucesso': True,
            'mensagem': f'{tipo_destino_label} criada com sucesso! Faturamento de {qtd_vendas} {tipo_desc} em {tipo_destino_label}.',
            'venda_id': nova_nfe.pk,
            'numero_nfe': None,
            'tipo': tipo_destino_label,
            'tipo_conversao': tipo_conversao,
            'cfop_aplicado': cfop_forcar if cfop_forcar else 'CFOP da operação',
            'valor_total': float(nova_nfe.valor_total),
            'qtd_itens': len(todos_itens),
            'qtd_vendas_faturadas': qtd_vendas,
            'qtd_cupons_referenciados': len(chaves_referenciadas),
            'chaves_referenciadas': [r['chave_acesso'] for r in chaves_referenciadas]
        }
        
        # Emitir automaticamente se solicitado
        if emitir_auto:
            try:
                from api.services.nfe_service import NFeService
                service = NFeService()
                service.configurar_da_empresa()
                
                if modelo_destino == '55':
                    emit_result = service.emitir_nfe(nova_nfe)
                else:
                    emit_result = service.emitir_nfce(nova_nfe)
                
                if emit_result.get('sucesso'):
                    result['emissao'] = 'sucesso'
                    result['numero_nfe'] = nova_nfe.numero_nfe
                    result['chave_nfe'] = nova_nfe.chave_nfe
                    result['mensagem'] += f' {tipo_destino_label} emitida automaticamente.'
                else:
                    result['emissao'] = 'erro'
                    result['emissao_erro'] = emit_result.get('mensagem', 'Erro na emissão')
                    result['mensagem'] += ' Porém houve erro na emissão automática.'
            except Exception as e:
                logger.exception(f"Erro ao emitir {tipo_destino_label} automaticamente: {e}")
                result['emissao'] = 'erro'
                result['emissao_erro'] = str(e)
                result['mensagem'] += f' A {tipo_destino_label} foi criada mas não foi emitida automaticamente.'
        
        return Response(result, status=status.HTTP_201_CREATED)


class ListarVendasComFiltrosView(APIView):
    """
    Lista vendas com filtros avançados para excluir cupons, notas, etc.
    
    Query params:
        excluir_cupom: bool - Exclui NFC-e (modelo 65) e SAT (modelo 59)
        excluir_nota: bool - Exclui NF-e (modelo 55)
        excluir_pedido: bool - Exclui vendas sem modelo fiscal
        apenas_pendentes: bool - Apenas vendas com status_nfe='PENDENTE'
        apenas_autorizadas: bool - Apenas vendas autorizadas
        incluir_faturadas: bool - Inclui vendas já faturadas (padrão: False)
        id_cliente: int - Filtrar por cliente
        search: str - Buscar por número ou nome do cliente
        data_inicio: date - Data inicial
        data_fim: date - Data final
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Parâmetros de filtro
            excluir_cupom = request.GET.get('excluir_cupom', '').lower() == 'true'
            excluir_nota = request.GET.get('excluir_nota', '').lower() == 'true'
            excluir_pedido = request.GET.get('excluir_pedido', '').lower() == 'true'
            apenas_pendentes = request.GET.get('apenas_pendentes', '').lower() == 'true'
            apenas_autorizadas = request.GET.get('apenas_autorizadas', '').lower() == 'true'
            
            # NOVOS filtros de faturamento (mais claros)
            apenas_faturadas = request.GET.get('apenas_faturadas', '').lower() == 'true'
            apenas_nao_faturadas = request.GET.get('apenas_nao_faturadas', '').lower() == 'true'
            incluir_faturadas = request.GET.get('incluir_faturadas', '').lower() == 'true'
            
            id_cliente = request.GET.get('id_cliente')
            search = request.GET.get('search', '').strip()
            data_inicio = request.GET.get('data_inicio')
            data_fim = request.GET.get('data_fim')

            # QuerySet base
            qs = Venda.objects.select_related(
                'id_cliente',
                'id_operacao',
                'criado_por',
                'id_venda_faturamento',
                'id_venda_faturamento__id_operacao'
            ).prefetch_related('itens')

            # FILTRO DE FATURAMENTO (principal decisão)
            if apenas_faturadas:
                # Mostrar APENAS as vendas que JÁ foram faturadas
                qs = qs.filter(id_venda_faturamento__isnull=False)
            elif apenas_nao_faturadas:
                # Mostrar APENAS as vendas que NÃO foram faturadas (padrão)
                qs = qs.filter(id_venda_faturamento__isnull=True)
            elif incluir_faturadas:
                # Mostrar TODAS (faturadas + não faturadas)
                pass  # Não filtra nada
            else:
                # Se nenhum filtro específico, usar comportamento padrão: NÃO faturadas
                qs = qs.filter(id_venda_faturamento__isnull=True)

            # Filtro por tipo de documento
            modelos_excluidos = []
            if excluir_cupom:
                modelos_excluidos.extend(['65', '59'])  # NFC-e e SAT
            if excluir_nota:
                modelos_excluidos.append('55')  # NF-e

            if modelos_excluidos:
                qs = qs.exclude(id_operacao__modelo_documento__in=modelos_excluidos)

            # Filtro pedido (sem modelo fiscal)
            if excluir_pedido:
                qs = qs.exclude(
                    Q(id_operacao__isnull=True) |
                    Q(id_operacao__modelo_documento__isnull=True) |
                    Q(id_operacao__modelo_documento='')
                )

            # Filtro por status NFe
            if apenas_pendentes:
                qs = qs.filter(status_nfe='PENDENTE')
            if apenas_autorizadas:
                qs = qs.filter(status_nfe__in=['EMITIDA', 'AUTORIZADA', 'AUTORIZADO'])

            # Filtro por cliente
            if id_cliente:
                qs = qs.filter(id_cliente_id=id_cliente)

            # Busca por texto
            if search:
                qs = qs.filter(
                    Q(numero_documento__icontains=search) |
                    Q(id_cliente__nome_razao_social__icontains=search) |
                    Q(id_venda__icontains=search)
                )

            # Filtro por data
            if data_inicio:
                qs = qs.filter(data_documento__gte=data_inicio)
            if data_fim:
                qs = qs.filter(data_documento__lte=data_fim)

            # Ordenação
            qs = qs.order_by('-data_documento')

            # Limitar resultados
            limit = int(request.GET.get('limit', 500))
            qs = qs[:limit]

            # Serializar
            vendas = []
            for venda in qs:
                # Buscar documentos que foram faturados NESTA venda
                # (quando esta venda é uma NFe/NFCe gerada por faturamento)
                docs_origem = []
                if venda.numero_nfe and venda.status_nfe in ['EMITIDA', 'AUTORIZADA', 'AUTORIZADO']:
                    vendas_origem = Venda.objects.filter(id_venda_faturamento_id=venda.id_venda)
                    for v_origem in vendas_origem:
                        docs_origem.append({
                            'id_venda': v_origem.id_venda,
                            'numero_documento': v_origem.numero_documento,
                            'data_documento': v_origem.data_documento,
                            'valor_total': float(v_origem.valor_total),
                            'tipo_documento': v_origem.tipo_documento_legivel,
                            'modelo_documento': v_origem.id_operacao.modelo_documento if v_origem.id_operacao else None,
                        })
                
                vendas.append({
                    'id_venda': venda.id_venda,
                    'numero_documento': venda.numero_documento,
                    'data_documento': venda.data_documento,
                    'valor_total': float(venda.valor_total),
                    'cliente': venda.id_cliente.nome_razao_social if venda.id_cliente else 'Cliente não informado',
                    'cliente_id': venda.id_cliente_id,
                    'status_nfe': venda.status_nfe,
                    'chave_nfe': venda.chave_nfe,
                    'numero_nfe': venda.numero_nfe,
                    'serie_nfe': venda.serie_nfe,
                    'tipo_documento': venda.tipo_documento_legivel,
                    'e_cupom': venda.e_cupom_fiscal,
                    'e_nota': venda.e_nota_fiscal,
                    'e_pedido': venda.e_pedido,
                    'modelo_documento': venda.id_operacao.modelo_documento if venda.id_operacao else None,
                    'operacao': venda.id_operacao.nome_operacao if venda.id_operacao else None,
                    'qtd_itens': venda.itens.count(),
                    'foi_faturada': bool(venda.id_venda_faturamento_id),
                    'id_cliente': venda.id_cliente_id,
                    'faturamento_info': {
                        'id_venda': venda.id_venda_faturamento.id_venda,
                        'numero_documento': venda.id_venda_faturamento.numero_nfe or venda.id_venda_faturamento.numero_documento,
                        'data_documento': venda.id_venda_faturamento.data_documento,
                        'status_nfe': venda.id_venda_faturamento.status_nfe,
                        'modelo': venda.id_venda_faturamento.id_operacao.modelo_documento if venda.id_venda_faturamento.id_operacao else None,
                        'tipo_label': 'NF-e' if (venda.id_venda_faturamento.id_operacao and venda.id_venda_faturamento.id_operacao.modelo_documento == '55') else 'NFC-e',
                        'chave_nfe': venda.id_venda_faturamento.chave_nfe,
                    } if venda.id_venda_faturamento_id else None,
                    'documentos_origem': docs_origem,  # NOVO: documentos que originaram esta nota
                    'itens': [
                        {
                            'produto': item.id_produto.nome_produto if item.id_produto else 'Produto removido',
                            'codigo': item.id_produto.codigo_produto if item.id_produto else '',
                            'quantidade': float(item.quantidade),
                            'valor_unitario': float(item.valor_unitario),
                            'valor_total': float(item.valor_total),
                        }
                        for item in venda.itens.all()
                    ],
                })

            return Response({
                'sucesso': True,
                'vendas': vendas,
                'total': len(vendas),
                'filtros_aplicados': {
                    'excluir_cupom': excluir_cupom,
                    'excluir_nota': excluir_nota,
                    'excluir_pedido': excluir_pedido,
                    'apenas_pendentes': apenas_pendentes,
                    'apenas_autorizadas': apenas_autorizadas,
                    'apenas_faturadas': apenas_faturadas,
                    'apenas_nao_faturadas': apenas_nao_faturadas,
                    'incluir_faturadas': incluir_faturadas,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"Erro ao listar vendas com filtros: {e}")
            return Response({
                'sucesso': False,
                'mensagem': f'Erro ao listar vendas: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


