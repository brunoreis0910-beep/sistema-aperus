"""
views_relatorios_produto.py — Endpoints para Relatórios de Produto
Relatórios: Nível do Estoque, Custo do Estoque, Estoque Mín/Máx,
Lista de Preço/Estoque Atual, Devoluções, Valor Produtos X Vendas,
PIS/COFINS, Entradas/Saídas/Transferência, Grupo de Produtos,
Vencimento Estoque, Lucro do Estoque, Valor do Estoque,
Produtos com Baixa Rotatividade, Produtos Mais Vendidos, Produtos Alterados
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta, datetime
from django.db.models import (
    Sum, Count, Avg, F, Q, Value, CharField, Max, Min,
    DecimalField, Case, When, Subquery, OuterRef
)
from django.db.models.functions import Coalesce, TruncMonth, TruncDate
from django.utils import timezone
from decimal import Decimal
import logging

from api.models import (
    Produto, Estoque, EstoqueMovimentacao, GrupoProduto,
    Venda, VendaItem, Deposito, LoteProduto, TributacaoProduto,
    Compra, CompraItem
)
from api.models_devolucao import Devolucao, DevolucaoItem

logger = logging.getLogger(__name__)
ZERO = Decimal('0.00')


def _parse_date(val, default=None):
    if not val:
        return default
    if isinstance(val, date):
        return val
    try:
        return datetime.strptime(val, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return default


class RelNivelEstoqueView(APIView):
    """GET /api/relatorios/produtos/nivel-estoque/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_deposito = request.query_params.get('id_deposito')
        id_grupo = request.query_params.get('id_grupo')
        nivel = request.query_params.get('nivel')  # BAIXO, NORMAL, ALTO

        qs = Estoque.objects.select_related('id_produto', 'id_deposito').filter(ativo=True)
        if id_deposito:
            qs = qs.filter(id_deposito_id=id_deposito)
        if id_grupo:
            qs = qs.filter(id_produto__id_grupo_id=id_grupo)

        itens = []
        for e in qs.order_by('id_produto__nome_produto'):
            status = e.status_estoque
            if nivel and status != nivel:
                continue
            itens.append({
                'id_produto': e.id_produto_id,
                'codigo': e.id_produto.codigo_produto,
                'nome': e.id_produto.nome_produto,
                'unidade': e.id_produto.unidade_medida or 'UN',
                'deposito': e.id_deposito.nome_deposito if e.id_deposito else '',
                'quantidade': float(e.quantidade or 0),
                'quantidade_minima': float(e.quantidade_minima or 0),
                'quantidade_maxima': float(e.quantidade_maxima or 0),
                'nivel': status,
            })

        resumo = {
            'total': len(itens),
            'baixo': sum(1 for i in itens if i['nivel'] == 'BAIXO'),
            'normal': sum(1 for i in itens if i['nivel'] == 'NORMAL'),
            'alto': sum(1 for i in itens if i['nivel'] == 'ALTO'),
        }
        return Response({'resumo': resumo, 'itens': itens})


class RelCustoEstoqueView(APIView):
    """GET /api/relatorios/produtos/custo-estoque/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_deposito = request.query_params.get('id_deposito')
        id_grupo = request.query_params.get('id_grupo')

        qs = Estoque.objects.select_related('id_produto', 'id_produto__id_grupo', 'id_deposito').filter(ativo=True)
        if id_deposito:
            qs = qs.filter(id_deposito_id=id_deposito)
        if id_grupo:
            qs = qs.filter(id_produto__id_grupo_id=id_grupo)

        itens = []
        total_custo = ZERO
        total_venda = ZERO
        for e in qs.order_by('id_produto__nome_produto'):
            custo_unit = e.custo_medio or ZERO
            qtd = e.quantidade or ZERO
            custo_total = custo_unit * qtd
            venda_total = (e.valor_venda or ZERO) * qtd
            total_custo += custo_total
            total_venda += venda_total
            itens.append({
                'id_produto': e.id_produto_id,
                'codigo': e.id_produto.codigo_produto,
                'nome': e.id_produto.nome_produto,
                'grupo': e.id_produto.id_grupo.nome_grupo if e.id_produto.id_grupo else '',
                'deposito': e.id_deposito.nome_deposito if e.id_deposito else '',
                'quantidade': float(qtd),
                'custo_medio': float(custo_unit),
                'custo_total': float(custo_total),
                'valor_venda': float(e.valor_venda or 0),
                'valor_ultima_compra': float(e.valor_ultima_compra or 0),
            })

        return Response({
            'resumo': {
                'total_itens': len(itens),
                'custo_total_estoque': float(total_custo),
                'valor_venda_total': float(total_venda),
                'margem_media': float(((total_venda - total_custo) / total_custo * 100) if total_custo else 0),
            },
            'itens': itens,
        })


class RelEstoqueMinMaxView(APIView):
    """GET /api/relatorios/produtos/estoque-min-max/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_deposito = request.query_params.get('id_deposito')
        filtro = request.query_params.get('filtro')  # abaixo_minimo, acima_maximo, sem_limite

        qs = Estoque.objects.select_related('id_produto', 'id_deposito').filter(ativo=True)
        if id_deposito:
            qs = qs.filter(id_deposito_id=id_deposito)

        itens = []
        for e in qs.order_by('id_produto__nome_produto'):
            qtd = e.quantidade or ZERO
            qtd_min = e.quantidade_minima or ZERO
            qtd_max = e.quantidade_maxima or ZERO
            situacao = 'OK'
            if qtd_min > 0 and qtd < qtd_min:
                situacao = 'ABAIXO_MINIMO'
            elif qtd_max > 0 and qtd > qtd_max:
                situacao = 'ACIMA_MAXIMO'
            elif qtd_min == 0 and qtd_max == 0:
                situacao = 'SEM_LIMITE'

            if filtro == 'abaixo_minimo' and situacao != 'ABAIXO_MINIMO':
                continue
            if filtro == 'acima_maximo' and situacao != 'ACIMA_MAXIMO':
                continue
            if filtro == 'sem_limite' and situacao != 'SEM_LIMITE':
                continue

            itens.append({
                'id_produto': e.id_produto_id,
                'codigo': e.id_produto.codigo_produto,
                'nome': e.id_produto.nome_produto,
                'deposito': e.id_deposito.nome_deposito if e.id_deposito else '',
                'quantidade': float(qtd),
                'quantidade_minima': float(qtd_min),
                'quantidade_maxima': float(qtd_max),
                'situacao': situacao,
            })

        resumo = {
            'total': len(itens),
            'abaixo_minimo': sum(1 for i in itens if i['situacao'] == 'ABAIXO_MINIMO'),
            'acima_maximo': sum(1 for i in itens if i['situacao'] == 'ACIMA_MAXIMO'),
            'sem_limite': sum(1 for i in itens if i['situacao'] == 'SEM_LIMITE'),
            'ok': sum(1 for i in itens if i['situacao'] == 'OK'),
        }
        return Response({'resumo': resumo, 'itens': itens})


class RelListaPrecoEstoqueView(APIView):
    """GET /api/relatorios/produtos/lista-preco/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_grupo = request.query_params.get('id_grupo')
        id_deposito = request.query_params.get('id_deposito')
        busca = request.query_params.get('busca', '').strip()

        qs = Estoque.objects.select_related(
            'id_produto', 'id_produto__id_grupo', 'id_deposito'
        ).filter(ativo=True)
        if id_grupo:
            qs = qs.filter(id_produto__id_grupo_id=id_grupo)
        if id_deposito:
            qs = qs.filter(id_deposito_id=id_deposito)
        if busca:
            qs = qs.filter(
                Q(id_produto__nome_produto__icontains=busca) |
                Q(id_produto__codigo_produto__icontains=busca) |
                Q(id_produto__gtin__icontains=busca)
            )

        itens = []
        for e in qs.order_by('id_produto__nome_produto'):
            itens.append({
                'id_produto': e.id_produto_id,
                'codigo': e.id_produto.codigo_produto,
                'gtin': e.id_produto.gtin or '',
                'nome': e.id_produto.nome_produto,
                'unidade': e.id_produto.unidade_medida or 'UN',
                'grupo': e.id_produto.id_grupo.nome_grupo if e.id_produto.id_grupo else '',
                'quantidade': float(e.quantidade or 0),
                'valor_venda': float(e.valor_venda or 0),
                'custo_medio': float(e.custo_medio or 0),
                'valor_ultima_compra': float(e.valor_ultima_compra or 0),
                'deposito': e.id_deposito.nome_deposito if e.id_deposito else '',
            })

        return Response({'total': len(itens), 'itens': itens})


class RelDevolucoesView(APIView):
    """GET /api/relatorios/produtos/devolucoes/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=90))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        tipo = request.query_params.get('tipo')  # venda, compra

        dt_inicio = timezone.make_aware(datetime.combine(data_inicio, datetime.min.time()))
        dt_fim = timezone.make_aware(datetime.combine(data_fim, datetime.max.time()))

        qs = Devolucao.objects.filter(
            data_devolucao__gte=dt_inicio,
            data_devolucao__lte=dt_fim,
            status__in=['aprovada', 'pendente'],
        )
        if tipo:
            qs = qs.filter(tipo=tipo)

        devs = qs.order_by('-data_devolucao')

        itens = []
        total_valor = ZERO
        for d in devs:
            d_itens = DevolucaoItem.objects.filter(devolucao=d)
            for di in d_itens:
                val = di.valor_total or ZERO
                total_valor += val
                itens.append({
                    'id_devolucao': d.id_devolucao,
                    'numero': d.numero_devolucao,
                    'data': d.data_devolucao.strftime('%Y-%m-%d') if d.data_devolucao else '',
                    'tipo': d.tipo,
                    'status': d.status,
                    'motivo': d.motivo or '',
                    'codigo_produto': di.codigo_produto or '',
                    'nome_produto': di.nome_produto or '',
                    'quantidade': float(di.quantidade_devolvida or 0),
                    'valor_unitario': float(di.valor_unitario or 0),
                    'valor_total': float(val),
                })

        # Ranking de produtos mais devolvidos
        from collections import Counter
        ranking_counter = Counter()
        for i in itens:
            ranking_counter[i['nome_produto']] += i['quantidade']
        ranking = [{'produto': k, 'quantidade': v} for k, v in ranking_counter.most_common(20)]

        return Response({
            'resumo': {
                'total_devolucoes': devs.count(),
                'total_itens': len(itens),
                'valor_total': float(total_valor),
            },
            'ranking': ranking,
            'itens': itens,
        })


class RelValorProdutosVendasView(APIView):
    """GET /api/relatorios/produtos/valor-vendas/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_grupo = request.query_params.get('id_grupo')

        dt_inicio = timezone.make_aware(datetime.combine(data_inicio, datetime.min.time()))
        dt_fim = timezone.make_aware(datetime.combine(data_fim, datetime.max.time()))

        qs = VendaItem.objects.filter(
            id_venda__data_documento__gte=dt_inicio,
            id_venda__data_documento__lte=dt_fim,
        )
        if id_grupo:
            qs = qs.filter(id_produto__id_grupo_id=id_grupo)

        dados = qs.values(
            'id_produto', 'id_produto__codigo_produto',
            'id_produto__nome_produto', 'id_produto__id_grupo__nome_grupo'
        ).annotate(
            qtd_vendida=Sum('quantidade'),
            total_vendas=Sum('valor_total'),
            preco_medio=Avg('valor_unitario'),
            num_vendas=Count('id_venda', distinct=True),
        ).order_by('-total_vendas')

        itens = []
        grand_total = ZERO
        for d in dados:
            tv = d['total_vendas'] or ZERO
            grand_total += tv
            itens.append({
                'id_produto': d['id_produto'],
                'codigo': d['id_produto__codigo_produto'],
                'nome': d['id_produto__nome_produto'],
                'grupo': d['id_produto__id_grupo__nome_grupo'] or '',
                'qtd_vendida': float(d['qtd_vendida'] or 0),
                'total_vendas': float(tv),
                'preco_medio': float(d['preco_medio'] or 0),
                'num_vendas': d['num_vendas'],
            })

        # % participação
        for i in itens:
            i['participacao'] = round(i['total_vendas'] / float(grand_total) * 100, 2) if grand_total else 0

        return Response({
            'resumo': {
                'total_produtos': len(itens),
                'valor_total_vendas': float(grand_total),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


class RelPisCofinsView(APIView):
    """GET /api/relatorios/produtos/pis-cofins/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_grupo = request.query_params.get('id_grupo')
        busca = request.query_params.get('busca', '').strip()

        qs = Produto.objects.select_related('id_grupo').all()
        if id_grupo:
            qs = qs.filter(id_grupo_id=id_grupo)
        if busca:
            qs = qs.filter(Q(nome_produto__icontains=busca) | Q(codigo_produto__icontains=busca))

        itens = []
        for p in qs.order_by('nome_produto'):
            trib = None
            try:
                trib = p.tributacao_detalhada
            except TributacaoProduto.DoesNotExist:
                pass

            itens.append({
                'id_produto': p.id_produto,
                'codigo': p.codigo_produto,
                'nome': p.nome_produto,
                'ncm': p.ncm or '',
                'cest': p.cest or '',
                'cst_pis_cofins': trib.cst_pis_cofins if trib else '',
                'pis_aliquota': float(trib.pis_aliquota or 0) if trib else 0,
                'cofins_aliquota': float(trib.cofins_aliquota or 0) if trib else 0,
                'cst_icms': trib.cst_icms if trib else '',
                'icms_aliquota': float(trib.icms_aliquota or 0) if trib else 0,
                'cfop': trib.cfop if trib else '',
            })

        return Response({'total': len(itens), 'itens': itens})


class RelEntradasSaidasView(APIView):
    """GET /api/relatorios/produtos/entradas-saidas/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        tipo = request.query_params.get('tipo')  # ENTRADA, SAIDA, TRANSFERENCIA, AJUSTE
        id_deposito = request.query_params.get('id_deposito')
        id_produto = request.query_params.get('id_produto')

        dt_inicio = timezone.make_aware(datetime.combine(data_inicio, datetime.min.time()))
        dt_fim = timezone.make_aware(datetime.combine(data_fim, datetime.max.time()))

        qs = EstoqueMovimentacao.objects.select_related(
            'id_produto', 'id_deposito'
        ).filter(
            data_movimentacao__gte=dt_inicio,
            data_movimentacao__lte=dt_fim,
        )
        if tipo:
            qs = qs.filter(tipo_movimentacao=tipo)
        if id_deposito:
            qs = qs.filter(id_deposito_id=id_deposito)
        if id_produto:
            qs = qs.filter(id_produto_id=id_produto)

        itens = []
        total_entrada = ZERO
        total_saida = ZERO
        for m in qs.order_by('-data_movimentacao')[:2000]:
            val = m.valor_total or ZERO
            if m.tipo_movimentacao == 'ENTRADA':
                total_entrada += val
            elif m.tipo_movimentacao == 'SAIDA':
                total_saida += val

            itens.append({
                'id': m.id_movimentacao,
                'data': m.data_movimentacao.strftime('%Y-%m-%d %H:%M') if m.data_movimentacao else '',
                'tipo': m.tipo_movimentacao,
                'documento_tipo': m.documento_tipo or '',
                'documento_numero': m.documento_numero or '',
                'produto_codigo': m.id_produto.codigo_produto if m.id_produto else '',
                'produto_nome': m.id_produto.nome_produto if m.id_produto else '',
                'deposito': m.id_deposito.nome_deposito if m.id_deposito else '',
                'quantidade': float(m.quantidade_movimentada or 0),
                'custo_unitario': float(m.custo_unitario or 0),
                'valor_total': float(val),
                'qtd_anterior': float(m.quantidade_anterior or 0),
                'qtd_atual': float(m.quantidade_atual or 0),
                'observacoes': m.observacoes or '',
            })

        # Resumo por tipo
        resumo_tipo = qs.values('tipo_movimentacao').annotate(
            total=Count('id_movimentacao'),
            valor=Coalesce(Sum('valor_total'), ZERO),
            qtd=Coalesce(Sum('quantidade_movimentada'), ZERO),
        )

        return Response({
            'resumo': {
                'total_movimentacoes': qs.count(),
                'valor_entradas': float(total_entrada),
                'valor_saidas': float(total_saida),
                'por_tipo': list(resumo_tipo),
            },
            'itens': itens,
        })


class RelGrupoProdutosView(APIView):
    """GET /api/relatorios/produtos/grupo-produtos/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        grupos = GrupoProduto.objects.all().order_by('nome_grupo')

        itens = []
        for g in grupos:
            produtos_grupo = Produto.objects.filter(id_grupo=g)
            qtd_produtos = produtos_grupo.count()

            estoque_info = Estoque.objects.filter(
                id_produto__id_grupo=g, ativo=True
            ).aggregate(
                qtd_total=Coalesce(Sum('quantidade'), ZERO),
                custo_total=Coalesce(Sum(F('custo_medio') * F('quantidade')), ZERO),
                venda_total=Coalesce(Sum(F('valor_venda') * F('quantidade')), ZERO),
            )

            itens.append({
                'id_grupo': g.id_grupo,
                'nome_grupo': g.nome_grupo,
                'descricao': g.descricao or '',
                'qtd_produtos': qtd_produtos,
                'qtd_estoque': float(estoque_info['qtd_total']),
                'custo_total': float(estoque_info['custo_total']),
                'valor_venda_total': float(estoque_info['venda_total']),
            })

        return Response({
            'total_grupos': len(itens),
            'itens': itens,
        })


class RelVencimentoEstoqueView(APIView):
    """GET /api/relatorios/produtos/vencimento-estoque/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dias = int(request.query_params.get('dias', 90))
        situacao = request.query_params.get('situacao')  # vencido, proximo, ok

        data_limite = date.today() + timedelta(days=dias)

        qs = LoteProduto.objects.select_related('id_produto').filter(
            ativo=True, quantidade__gt=0
        ).order_by('data_validade')

        itens = []
        for lote in qs:
            if not lote.data_validade:
                continue
            dias_vencer = (lote.data_validade - date.today()).days
            if dias_vencer < 0:
                sit = 'VENCIDO'
            elif dias_vencer <= dias:
                sit = 'PROXIMO'
            else:
                sit = 'OK'

            if situacao == 'vencido' and sit != 'VENCIDO':
                continue
            if situacao == 'proximo' and sit != 'PROXIMO':
                continue
            if situacao == 'ok' and sit != 'OK':
                continue

            # Mostrar apenas vencidos e próximos por padrão
            if not situacao and sit == 'OK':
                continue

            itens.append({
                'id_lote': lote.id_lote,
                'produto_nome': lote.id_produto.nome_produto,
                'produto_codigo': lote.id_produto.codigo_produto,
                'numero_lote': lote.numero_lote,
                'data_fabricacao': lote.data_fabricacao.strftime('%Y-%m-%d') if lote.data_fabricacao else '',
                'data_validade': lote.data_validade.strftime('%Y-%m-%d'),
                'quantidade': float(lote.quantidade or 0),
                'dias_para_vencer': dias_vencer,
                'situacao': sit,
            })

        resumo = {
            'total': len(itens),
            'vencidos': sum(1 for i in itens if i['situacao'] == 'VENCIDO'),
            'proximos': sum(1 for i in itens if i['situacao'] == 'PROXIMO'),
        }
        return Response({'resumo': resumo, 'itens': itens})


class RelLucroEstoqueView(APIView):
    """GET /api/relatorios/produtos/lucro-estoque/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_grupo = request.query_params.get('id_grupo')
        id_deposito = request.query_params.get('id_deposito')

        qs = Estoque.objects.select_related(
            'id_produto', 'id_produto__id_grupo', 'id_deposito'
        ).filter(ativo=True, quantidade__gt=0)
        if id_grupo:
            qs = qs.filter(id_produto__id_grupo_id=id_grupo)
        if id_deposito:
            qs = qs.filter(id_deposito_id=id_deposito)

        itens = []
        total_custo = ZERO
        total_venda = ZERO
        total_lucro = ZERO
        for e in qs.order_by('id_produto__nome_produto'):
            qtd = e.quantidade or ZERO
            custo = (e.custo_medio or ZERO) * qtd
            venda = (e.valor_venda or ZERO) * qtd
            lucro = venda - custo
            margem = (lucro / custo * 100) if custo > 0 else ZERO
            total_custo += custo
            total_venda += venda
            total_lucro += lucro

            itens.append({
                'id_produto': e.id_produto_id,
                'codigo': e.id_produto.codigo_produto,
                'nome': e.id_produto.nome_produto,
                'grupo': e.id_produto.id_grupo.nome_grupo if e.id_produto.id_grupo else '',
                'deposito': e.id_deposito.nome_deposito if e.id_deposito else '',
                'quantidade': float(qtd),
                'custo_medio': float(e.custo_medio or 0),
                'valor_venda': float(e.valor_venda or 0),
                'custo_total': float(custo),
                'venda_total': float(venda),
                'lucro': float(lucro),
                'margem': float(margem),
            })

        return Response({
            'resumo': {
                'total_itens': len(itens),
                'custo_total': float(total_custo),
                'venda_total': float(total_venda),
                'lucro_total': float(total_lucro),
                'margem_media': float((total_lucro / total_custo * 100) if total_custo else 0),
            },
            'itens': itens,
        })


class RelValorEstoqueView(APIView):
    """GET /api/relatorios/produtos/valor-estoque/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_deposito = request.query_params.get('id_deposito')
        tipo_valor = request.query_params.get('tipo_valor', 'custo')  # custo, venda, compra

        qs = Estoque.objects.select_related(
            'id_produto', 'id_produto__id_grupo', 'id_deposito'
        ).filter(ativo=True, quantidade__gt=0)
        if id_deposito:
            qs = qs.filter(id_deposito_id=id_deposito)

        itens = []
        total_valor = ZERO
        for e in qs.order_by('id_produto__nome_produto'):
            qtd = e.quantidade or ZERO
            if tipo_valor == 'venda':
                unit = e.valor_venda or ZERO
            elif tipo_valor == 'compra':
                unit = e.valor_ultima_compra or ZERO
            else:
                unit = e.custo_medio or ZERO
            valor = unit * qtd
            total_valor += valor

            itens.append({
                'id_produto': e.id_produto_id,
                'codigo': e.id_produto.codigo_produto,
                'nome': e.id_produto.nome_produto,
                'grupo': e.id_produto.id_grupo.nome_grupo if e.id_produto.id_grupo else '',
                'deposito': e.id_deposito.nome_deposito if e.id_deposito else '',
                'quantidade': float(qtd),
                'valor_unitario': float(unit),
                'valor_total': float(valor),
            })

        # % participação
        for i in itens:
            i['participacao'] = round(i['valor_total'] / float(total_valor) * 100, 2) if total_valor else 0

        # Resumo por grupo
        from collections import defaultdict
        por_grupo = defaultdict(float)
        for i in itens:
            por_grupo[i['grupo'] or 'Sem Grupo'] += i['valor_total']
        por_grupo_list = [{'grupo': k, 'valor': v} for k, v in sorted(por_grupo.items(), key=lambda x: -x[1])]

        # Resumo por deposito
        por_deposito = defaultdict(float)
        for i in itens:
            por_deposito[i['deposito'] or 'Sem Depósito'] += i['valor_total']
        por_deposito_list = [{'deposito': k, 'valor': v} for k, v in sorted(por_deposito.items(), key=lambda x: -x[1])]

        return Response({
            'resumo': {
                'total_itens': len(itens),
                'valor_total': float(total_valor),
                'tipo_valor': tipo_valor,
                'por_grupo': por_grupo_list,
                'por_deposito': por_deposito_list,
            },
            'itens': itens,
        })


class RelBaixaRotatividadeView(APIView):
    """GET /api/relatorios/produtos/baixa-rotatividade/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dias = int(request.query_params.get('dias', 90))
        id_grupo = request.query_params.get('id_grupo')

        data_limite = date.today() - timedelta(days=dias)
        dt_limite = timezone.make_aware(datetime.combine(data_limite, datetime.min.time()))

        # Produtos com estoque > 0
        qs_estoque = Estoque.objects.select_related(
            'id_produto', 'id_produto__id_grupo'
        ).filter(ativo=True, quantidade__gt=0)
        if id_grupo:
            qs_estoque = qs_estoque.filter(id_produto__id_grupo_id=id_grupo)

        # Produtos vendidos no período
        vendidos = set(VendaItem.objects.filter(
            id_venda__data_documento__gte=dt_limite
        ).values_list('id_produto_id', flat=True).distinct())

        itens = []
        for e in qs_estoque.order_by('id_produto__nome_produto'):
            pid = e.id_produto_id
            if pid in vendidos:
                continue

            # Última saída
            ultima_saida = e.data_ultima_saida
            dias_sem_saida = (timezone.now() - ultima_saida).days if ultima_saida else 999

            itens.append({
                'id_produto': pid,
                'codigo': e.id_produto.codigo_produto,
                'nome': e.id_produto.nome_produto,
                'grupo': e.id_produto.id_grupo.nome_grupo if e.id_produto.id_grupo else '',
                'quantidade': float(e.quantidade or 0),
                'valor_venda': float(e.valor_venda or 0),
                'custo_medio': float(e.custo_medio or 0),
                'valor_parado': float((e.custo_medio or ZERO) * (e.quantidade or ZERO)),
                'dias_sem_venda': dias_sem_saida,
                'ultima_saida': ultima_saida.strftime('%Y-%m-%d') if ultima_saida else 'Nunca',
            })

        total_parado = sum(i['valor_parado'] for i in itens)

        return Response({
            'resumo': {
                'total_produtos': len(itens),
                'valor_total_parado': total_parado,
                'dias_referencia': dias,
            },
            'itens': itens,
        })


class RelMaisVendidosView(APIView):
    """GET /api/relatorios/produtos/mais-vendidos/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_grupo = request.query_params.get('id_grupo')
        limite = int(request.query_params.get('limite', 50))

        dt_inicio = timezone.make_aware(datetime.combine(data_inicio, datetime.min.time()))
        dt_fim = timezone.make_aware(datetime.combine(data_fim, datetime.max.time()))

        qs = VendaItem.objects.filter(
            id_venda__data_documento__gte=dt_inicio,
            id_venda__data_documento__lte=dt_fim,
        )
        if id_grupo:
            qs = qs.filter(id_produto__id_grupo_id=id_grupo)

        dados = qs.values(
            'id_produto', 'id_produto__codigo_produto',
            'id_produto__nome_produto', 'id_produto__id_grupo__nome_grupo',
            'id_produto__unidade_medida'
        ).annotate(
            qtd_vendida=Sum('quantidade'),
            total_vendas=Sum('valor_total'),
            num_vendas=Count('id_venda', distinct=True),
            preco_medio=Avg('valor_unitario'),
        ).order_by('-qtd_vendida')[:limite]

        itens = []
        rank = 1
        for d in dados:
            itens.append({
                'ranking': rank,
                'id_produto': d['id_produto'],
                'codigo': d['id_produto__codigo_produto'],
                'nome': d['id_produto__nome_produto'],
                'grupo': d['id_produto__id_grupo__nome_grupo'] or '',
                'unidade': d['id_produto__unidade_medida'] or 'UN',
                'qtd_vendida': float(d['qtd_vendida'] or 0),
                'total_vendas': float(d['total_vendas'] or 0),
                'num_vendas': d['num_vendas'],
                'preco_medio': float(d['preco_medio'] or 0),
            })
            rank += 1

        total_geral = sum(i['total_vendas'] for i in itens)
        for i in itens:
            i['participacao'] = round(i['total_vendas'] / total_geral * 100, 2) if total_geral else 0

        return Response({
            'resumo': {
                'total_produtos': len(itens),
                'valor_total_vendas': total_geral,
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


class RelProdutosAlteradosView(APIView):
    """GET /api/relatorios/produtos/alterados/
    Produtos recém-alterados (baseado em updated_at ou data_ultima_entrada/saida)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())

        dt_inicio = timezone.make_aware(datetime.combine(data_inicio, datetime.min.time()))
        dt_fim = timezone.make_aware(datetime.combine(data_fim, datetime.max.time()))

        # Movimentações no período agrupadas por produto
        movs = EstoqueMovimentacao.objects.filter(
            data_movimentacao__gte=dt_inicio,
            data_movimentacao__lte=dt_fim,
        ).values(
            'id_produto', 'id_produto__codigo_produto',
            'id_produto__nome_produto', 'id_produto__id_grupo__nome_grupo',
        ).annotate(
            total_movimentacoes=Count('id_movimentacao'),
            entradas=Count('id_movimentacao', filter=Q(tipo_movimentacao='ENTRADA')),
            saidas=Count('id_movimentacao', filter=Q(tipo_movimentacao='SAIDA')),
            ajustes=Count('id_movimentacao', filter=Q(tipo_movimentacao='AJUSTE')),
            transferencias=Count('id_movimentacao', filter=Q(tipo_movimentacao='TRANSFERENCIA')),
            ultima_movimentacao=Max('data_movimentacao'),
        ).order_by('-ultima_movimentacao')

        itens = []
        for m in movs:
            itens.append({
                'id_produto': m['id_produto'],
                'codigo': m['id_produto__codigo_produto'],
                'nome': m['id_produto__nome_produto'],
                'grupo': m['id_produto__id_grupo__nome_grupo'] or '',
                'total_movimentacoes': m['total_movimentacoes'],
                'entradas': m['entradas'],
                'saidas': m['saidas'],
                'ajustes': m['ajustes'],
                'transferencias': m['transferencias'],
                'ultima_movimentacao': m['ultima_movimentacao'].strftime('%Y-%m-%d %H:%M') if m['ultima_movimentacao'] else '',
            })

        return Response({
            'resumo': {
                'total_produtos_alterados': len(itens),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })
