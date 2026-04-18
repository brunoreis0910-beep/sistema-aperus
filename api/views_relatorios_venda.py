"""
views_relatorios_venda.py — Endpoints para Relatórios de Venda
Relatórios: Histórico de Vendas, Lucro, Agrupado por Dia,
Agrupado por Dia c/ Desc., Recibos Gerados, Ped. Venda/OS por Data,
Total Vendas c/ Quantidade, Ped. Venda/OS Aberta, Cobranças Pendentes,
Vendas por Cliente, Vendas por Cidade/Vendedor, Lucro por Venda/Vendedor,
Vendas por Característica, Última Compra do Cliente, Custo Venda Cartão, Frete
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta, datetime
from django.db.models import (
    Sum, Count, Avg, F, Q, Value, CharField, Max, Min,
    DecimalField, Case, When, Subquery, OuterRef
)
from django.db.models.functions import Coalesce, TruncDate
from django.db.models import Func, DateField


class _DateFunc(Func):
    """Usa DATE() nativa do MySQL sem conversão de timezone."""
    function = 'DATE'
    output_field = DateField()
from django.utils import timezone
from decimal import Decimal
import logging

from api.models import (
    Produto, Estoque, Venda, VendaItem, Vendedor, Cliente,
    FinanceiroConta, RecebimentoCartao, FormaPagamento, GrupoProduto,
)

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


def _make_dt_range(data_inicio, data_fim):
    dt_inicio = timezone.make_aware(datetime.combine(data_inicio, datetime.min.time()))
    dt_fim = timezone.make_aware(datetime.combine(data_fim, datetime.max.time()))
    return dt_inicio, dt_fim


# ==================== 1) HISTÓRICO DE VENDAS ====================
class RelHistoricoVendasView(APIView):
    """GET /api/relatorios/vendas/historico/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_cliente = request.query_params.get('id_cliente')
        id_vendedor = request.query_params.get('id_vendedor')
        status_nfe = request.query_params.get('status_nfe')
        origem = request.query_params.get('origem')
        forma = request.query_params.get('forma')
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = Venda.objects.select_related(
            'id_cliente', 'id_vendedor1', 'id_operacao'
        ).filter(data_documento__gte=dt_inicio, data_documento__lte=dt_fim)

        if id_cliente:
            qs = qs.filter(id_cliente_id=id_cliente)
        if id_vendedor:
            qs = qs.filter(Q(id_vendedor1_id=id_vendedor) | Q(id_vendedor2_id=id_vendedor))
        if status_nfe:
            qs = qs.filter(status_nfe=status_nfe)
        if origem:
            qs = qs.filter(origem=origem)
        if forma:
            qs = qs.filter(vista=int(forma))
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)

        itens = []
        total_geral = ZERO
        for v in qs.order_by('-data_documento'):
            vt = v.valor_total or ZERO
            total_geral += vt
            itens.append({
                'id_venda': v.id_venda,
                'numero': v.numero_documento or str(v.id_venda),
                'data': v.data_documento.strftime('%Y-%m-%d %H:%M') if v.data_documento else '',
                'cliente': v.id_cliente.nome_razao_social if v.id_cliente else 'Consumidor',
                'vendedor': v.id_vendedor1.nome if v.id_vendedor1 else '',
                'operacao': v.id_operacao.nome_operacao if v.id_operacao else '',
                'valor_total': float(vt),
                'status_nfe': v.status_nfe or '',
                'numero_nfe': v.numero_nfe or '',
                'forma': 'À Vista' if v.vista == 1 else 'A Prazo',
                'origem': v.origem or '',
            })

        return Response({
            'resumo': {
                'total_vendas': len(itens),
                'valor_total': float(total_geral),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 2) LUCRO ====================
class RelLucroVendasView(APIView):
    """GET /api/relatorios/vendas/lucro/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_vendedor = request.query_params.get('id_vendedor')
        id_operacao = request.query_params.get('id_operacao')
        origem = request.query_params.get('origem')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = Venda.objects.select_related(
            'id_cliente', 'id_vendedor1'
        ).filter(data_documento__gte=dt_inicio, data_documento__lte=dt_fim)

        if id_vendedor:
            qs = qs.filter(Q(id_vendedor1_id=id_vendedor) | Q(id_vendedor2_id=id_vendedor))
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)
        if origem:
            qs = qs.filter(origem=origem)

        itens = []
        total_vendas = ZERO
        total_custo = ZERO
        total_lucro = ZERO
        for v in qs.order_by('-data_documento'):
            vt = v.valor_total or ZERO
            custo_venda = ZERO
            for vi in v.itens.select_related('id_produto').all():
                if vi.id_produto:
                    est = Estoque.objects.filter(id_produto=vi.id_produto, ativo=True).first()
                    custo_unit = est.custo_medio if est and est.custo_medio else ZERO
                    custo_venda += custo_unit * (vi.quantidade or ZERO)

            lucro = vt - custo_venda
            margem = (lucro / vt * 100) if vt > 0 else ZERO
            total_vendas += vt
            total_custo += custo_venda
            total_lucro += lucro

            itens.append({
                'id_venda': v.id_venda,
                'numero': v.numero_documento or str(v.id_venda),
                'data': v.data_documento.strftime('%Y-%m-%d') if v.data_documento else '',
                'cliente': v.id_cliente.nome_razao_social if v.id_cliente else 'Consumidor',
                'vendedor': v.id_vendedor1.nome if v.id_vendedor1 else '',
                'valor_venda': float(vt),
                'custo': float(custo_venda),
                'lucro': float(lucro),
                'margem': float(margem),
            })

        margem_media = float((total_lucro / total_vendas * 100) if total_vendas else 0)

        return Response({
            'resumo': {
                'total_vendas': float(total_vendas),
                'total_custo': float(total_custo),
                'total_lucro': float(total_lucro),
                'margem_media': margem_media,
                'qtd_vendas': len(itens),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 3) AGRUPADO POR DIA ====================
class RelAgrupadoDiaView(APIView):
    """GET /api/relatorios/vendas/agrupado-dia/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=90))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_operacao = request.query_params.get('id_operacao')
        id_vendedor = request.query_params.get('id_vendedor')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = Venda.objects.filter(
            data_documento__gte=dt_inicio, data_documento__lte=dt_fim
        )
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)
        if id_vendedor:
            qs = qs.filter(Q(id_vendedor1_id=id_vendedor) | Q(id_vendedor2_id=id_vendedor))

        dados = qs.annotate(
            dia=_DateFunc('data_documento')
        ).values('dia').annotate(
            qtd_vendas=Count('id_venda'),
            soma_valor=Coalesce(Sum('valor_total'), ZERO),
            media_valor=Coalesce(Avg('valor_total'), ZERO),
        ).order_by('dia')

        _DIAS_PT = {0: 'Segunda', 1: 'Terça', 2: 'Quarta', 3: 'Quinta', 4: 'Sexta', 5: 'Sábado', 6: 'Domingo'}
        itens = []
        total_geral = ZERO
        total_vendas = 0
        for d in dados:
            vt = d['soma_valor'] or ZERO
            total_geral += vt
            total_vendas += d['qtd_vendas']
            itens.append({
                'dia': d['dia'].strftime('%d/%m/%Y') if d['dia'] else '',
                'dia_semana': _DIAS_PT.get(d['dia'].weekday(), '') if d['dia'] else '',
                'qtd_vendas': d['qtd_vendas'],
                'valor_total': float(vt),
                'ticket_medio': float(d['media_valor'] or 0),
            })

        return Response({
            'resumo': {
                'total_dias': len(itens),
                'total_vendas': total_vendas,
                'valor_total': float(total_geral),
                'media_diaria': float(total_geral / len(itens)) if itens else 0,
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 4) AGRUPADO POR DIA C/ DESC/ENCAM ====================
class RelAgrupadoDiaDescView(APIView):
    """GET /api/relatorios/vendas/agrupado-dia-desc/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = Venda.objects.filter(
            data_documento__gte=dt_inicio, data_documento__lte=dt_fim
        )
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)
        vendas = qs.annotate(dia=_DateFunc('data_documento'))

        from collections import defaultdict
        dias_dict = defaultdict(lambda: {
            'qtd_vendas': 0, 'valor_bruto': ZERO, 'desconto_total': ZERO,
            'valor_liquido': ZERO, 'taxa_entrega': ZERO,
        })

        for v in vendas:
            dia_str = v.dia.strftime('%d/%m/%Y') if v.dia else ''
            d = dias_dict[dia_str]
            d['qtd_vendas'] += 1
            vt = v.valor_total or ZERO
            taxa = v.taxa_entrega or ZERO
            desc_venda = ZERO
            for vi in v.itens.all():
                desc_venda += vi.desconto_valor or ZERO
            d['valor_bruto'] += vt + desc_venda
            d['desconto_total'] += desc_venda
            d['valor_liquido'] += vt
            d['taxa_entrega'] += taxa

        itens = []
        for dia_str in sorted(dias_dict.keys(), reverse=True):
            d = dias_dict[dia_str]
            itens.append({
                'dia': dia_str,
                'qtd_vendas': d['qtd_vendas'],
                'valor_bruto': float(d['valor_bruto']),
                'desconto_total': float(d['desconto_total']),
                'valor_liquido': float(d['valor_liquido']),
                'taxa_entrega': float(d['taxa_entrega']),
            })

        total_bruto = sum(i['valor_bruto'] for i in itens)
        total_desc = sum(i['desconto_total'] for i in itens)
        total_liq = sum(i['valor_liquido'] for i in itens)

        return Response({
            'resumo': {
                'total_dias': len(itens),
                'valor_bruto': total_bruto,
                'desconto_total': total_desc,
                'valor_liquido': total_liq,
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 5) RECIBOS GERADOS (NFe emitidas) ====================
class RelRecibosGeradosView(APIView):
    """GET /api/relatorios/vendas/recibos/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = Venda.objects.select_related('id_cliente').filter(
            data_documento__gte=dt_inicio, data_documento__lte=dt_fim,
            status_nfe='EMITIDA',
            numero_nfe__isnull=False,
        ).exclude(numero_nfe=0)
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)
        qs = qs.order_by('-data_documento')

        itens = []
        total = ZERO
        for v in qs:
            vt = v.valor_total or ZERO
            total += vt
            itens.append({
                'id_venda': v.id_venda,
                'numero_nfe': v.numero_nfe,
                'serie': v.serie_nfe or 1,
                'chave': v.chave_nfe or '',
                'data': v.data_documento.strftime('%Y-%m-%d %H:%M') if v.data_documento else '',
                'cliente': v.id_cliente.nome_razao_social if v.id_cliente else 'Consumidor',
                'valor_total': float(vt),
                'protocolo': v.protocolo_nfe or '',
            })

        return Response({
            'resumo': {
                'total_notas': len(itens),
                'valor_total': float(total),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 6) PED. VENDA / O.S. - POR DATA ====================
class RelPedidoVendaPorDataView(APIView):
    """GET /api/relatorios/vendas/pedidos-por-data/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_vendedor = request.query_params.get('id_vendedor')
        id_operacao = request.query_params.get('id_operacao')
        origem = request.query_params.get('origem')
        forma = request.query_params.get('forma')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = Venda.objects.select_related(
            'id_cliente', 'id_vendedor1', 'id_operacao'
        ).filter(data_documento__gte=dt_inicio, data_documento__lte=dt_fim)

        if id_vendedor:
            qs = qs.filter(Q(id_vendedor1_id=id_vendedor) | Q(id_vendedor2_id=id_vendedor))
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)
        if origem:
            qs = qs.filter(origem=origem)
        if forma:
            qs = qs.filter(vista=int(forma))

        itens = []
        total = ZERO
        for v in qs.order_by('data_documento'):
            vt = v.valor_total or ZERO
            total += vt
            qtd_itens = v.itens.count()
            itens.append({
                'id_venda': v.id_venda,
                'numero': v.numero_documento or str(v.id_venda),
                'data': v.data_documento.strftime('%Y-%m-%d %H:%M') if v.data_documento else '',
                'cliente': v.id_cliente.nome_razao_social if v.id_cliente else 'Consumidor',
                'vendedor': v.id_vendedor1.nome if v.id_vendedor1 else '',
                'operacao': v.id_operacao.nome_operacao if v.id_operacao else '',
                'qtd_itens': qtd_itens,
                'valor_total': float(vt),
                'forma': 'À Vista' if v.vista == 1 else 'A Prazo',
                'status_nfe': v.status_nfe or 'PENDENTE',
            })

        return Response({
            'resumo': {
                'total_pedidos': len(itens),
                'valor_total': float(total),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 7) TOTAL VENDAS C/ QUANTIDADE ====================
class RelTotalVendasQuantidadeView(APIView):
    """GET /api/relatorios/vendas/total-quantidade/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_grupo = request.query_params.get('id_grupo')
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = VendaItem.objects.filter(
            id_venda__data_documento__gte=dt_inicio,
            id_venda__data_documento__lte=dt_fim,
        )
        if id_grupo:
            qs = qs.filter(id_produto__id_grupo_id=id_grupo)
        if id_operacao:
            qs = qs.filter(id_venda__id_operacao_id=id_operacao)

        dados = qs.values(
            'id_produto', 'id_produto__codigo_produto',
            'id_produto__nome_produto', 'id_produto__unidade_medida',
            'id_produto__id_grupo__nome_grupo',
        ).annotate(
            qtd_vendida=Sum('quantidade'),
            valor_total=Sum('valor_total'),
            desconto_total=Sum('desconto_valor'),
            num_vendas=Count('id_venda', distinct=True),
            preco_medio=Avg('valor_unitario'),
        ).order_by('-qtd_vendida')

        itens = []
        grand_total = ZERO
        grand_qtd = ZERO
        for d in dados:
            vt = d['valor_total'] or ZERO
            grand_total += vt
            grand_qtd += d['qtd_vendida'] or ZERO
            itens.append({
                'codigo': d['id_produto__codigo_produto'],
                'nome': d['id_produto__nome_produto'],
                'unidade': d['id_produto__unidade_medida'] or 'UN',
                'grupo': d['id_produto__id_grupo__nome_grupo'] or '',
                'qtd_vendida': float(d['qtd_vendida'] or 0),
                'num_vendas': d['num_vendas'],
                'preco_medio': float(d['preco_medio'] or 0),
                'desconto_total': float(d['desconto_total'] or 0),
                'valor_total': float(vt),
            })

        return Response({
            'resumo': {
                'total_produtos': len(itens),
                'total_quantidade': float(grand_qtd),
                'valor_total': float(grand_total),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 8) PED. VENDA / O.S. - ABERTA ====================
class RelPedidoVendaAbertaView(APIView):
    """GET /api/relatorios/vendas/pedidos-abertos/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_vendedor = request.query_params.get('id_vendedor')
        id_operacao = request.query_params.get('id_operacao')

        qs = Venda.objects.select_related(
            'id_cliente', 'id_vendedor1', 'id_operacao'
        ).filter(
            Q(status_nfe='PENDENTE') | Q(status_nfe__isnull=True) | Q(status_nfe=''),
        )

        if id_vendedor:
            qs = qs.filter(Q(id_vendedor1_id=id_vendedor) | Q(id_vendedor2_id=id_vendedor))
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)

        itens = []
        total = ZERO
        for v in qs.order_by('-data_documento'):
            vt = v.valor_total or ZERO
            total += vt
            dias = (timezone.now() - v.data_documento).days if v.data_documento else 0
            itens.append({
                'id_venda': v.id_venda,
                'numero': v.numero_documento or str(v.id_venda),
                'data': v.data_documento.strftime('%Y-%m-%d %H:%M') if v.data_documento else '',
                'cliente': v.id_cliente.nome_razao_social if v.id_cliente else 'Consumidor',
                'vendedor': v.id_vendedor1.nome if v.id_vendedor1 else '',
                'operacao': v.id_operacao.nome_operacao if v.id_operacao else '',
                'valor_total': float(vt),
                'dias_aberto': dias,
                'forma': 'À Vista' if v.vista == 1 else 'A Prazo',
            })

        return Response({
            'resumo': {
                'total_abertos': len(itens),
                'valor_total': float(total),
            },
            'itens': itens,
        })


# ==================== 9) COBRANÇAS PENDENTES ====================
class RelCobrancasPendentesView(APIView):
    """GET /api/relatorios/vendas/cobrancas/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status = request.query_params.get('status', 'aberto')
        id_cliente = request.query_params.get('id_cliente')
        id_operacao = request.query_params.get('id_operacao')

        qs = FinanceiroConta.objects.select_related(
            'id_cliente_fornecedor'
        ).filter(tipo_conta='RECEBER')
        if id_operacao:
            qs = qs.filter(id_venda_origem__id_operacao_id=id_operacao)

        if status == 'aberto':
            qs = qs.filter(status_conta='aberto')
        elif status == 'vencido':
            qs = qs.filter(status_conta='aberto', data_vencimento__lt=date.today())
        elif status == 'pago':
            qs = qs.filter(status_conta='pago')

        if id_cliente:
            qs = qs.filter(id_cliente_fornecedor_id=id_cliente)

        itens = []
        total = ZERO
        total_vencido = ZERO
        for c in qs.order_by('data_vencimento'):
            val = c.valor_parcela or ZERO
            total += val
            vencido = c.data_vencimento and c.data_vencimento < date.today() and c.status_conta == 'aberto'
            if vencido:
                total_vencido += val
            dias_atraso = (date.today() - c.data_vencimento).days if vencido else 0
            itens.append({
                'id_conta': c.id_conta,
                'documento': c.documento_numero or '',
                'cliente': c.id_cliente_fornecedor.nome_razao_social if c.id_cliente_fornecedor else '',
                'descricao': c.descricao or '',
                'parcela': f'{c.parcela_numero}/{c.parcela_total}' if c.parcela_total else '1/1',
                'valor': float(val),
                'valor_liquidado': float(c.valor_liquidado or 0),
                'data_emissao': c.data_emissao.strftime('%Y-%m-%d') if c.data_emissao else '',
                'data_vencimento': c.data_vencimento.strftime('%Y-%m-%d') if c.data_vencimento else '',
                'data_pagamento': c.data_pagamento.strftime('%Y-%m-%d') if c.data_pagamento else '',
                'status': c.status_conta or '',
                'forma_pagamento': c.forma_pagamento or '',
                'dias_atraso': dias_atraso,
                'vencido': vencido,
            })

        return Response({
            'resumo': {
                'total_registros': len(itens),
                'valor_total': float(total),
                'valor_vencido': float(total_vencido),
            },
            'itens': itens,
        })


# ==================== 10) VENDAS POR CLIENTE ====================
class RelVendasPorClienteView(APIView):
    """GET /api/relatorios/vendas/por-cliente/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        limite = int(request.query_params.get('limite', 100))
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs_base = Venda.objects.filter(
            data_documento__gte=dt_inicio, data_documento__lte=dt_fim,
        )
        if id_operacao:
            qs_base = qs_base.filter(id_operacao_id=id_operacao)
        dados = qs_base.values(
            'id_cliente', 'id_cliente__nome_razao_social',
            'id_cliente__cpf_cnpj', 'id_cliente__cidade',
        ).annotate(
            qtd_vendas=Count('id_venda'),
            soma_valor=Coalesce(Sum('valor_total'), ZERO),
            media_valor=Coalesce(Avg('valor_total'), ZERO),
            ultima_compra=Max('data_documento'),
        ).order_by('-soma_valor')[:limite]

        itens = []
        grand_total = ZERO
        for d in dados:
            vt = d['soma_valor'] or ZERO
            grand_total += vt
            itens.append({
                'id_cliente': d['id_cliente'],
                'nome': d['id_cliente__nome_razao_social'] or 'Consumidor',
                'cpf_cnpj': d['id_cliente__cpf_cnpj'] or '',
                'cidade': d['id_cliente__cidade'] or '',
                'qtd_vendas': d['qtd_vendas'],
                'valor_total': float(vt),
                'ticket_medio': float(d['media_valor'] or 0),
                'ultima_compra': d['ultima_compra'].strftime('%Y-%m-%d') if d['ultima_compra'] else '',
            })

        for i in itens:
            i['participacao'] = round(i['valor_total'] / float(grand_total) * 100, 2) if grand_total else 0

        return Response({
            'resumo': {
                'total_clientes': len(itens),
                'valor_total': float(grand_total),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 11) VENDAS POR CIDADE/VENDEDOR ====================
class RelVendasCidadeVendedorView(APIView):
    """GET /api/relatorios/vendas/cidade-vendedor/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        agrupar = request.query_params.get('agrupar', 'cidade')  # cidade ou vendedor
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = Venda.objects.filter(
            data_documento__gte=dt_inicio, data_documento__lte=dt_fim,
        )
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)

        if agrupar == 'vendedor':
            dados = qs.values(
                'id_vendedor1', 'id_vendedor1__nome'
            ).annotate(
                qtd_vendas=Count('id_venda'),
                soma_valor=Coalesce(Sum('valor_total'), ZERO),
                media_valor=Coalesce(Avg('valor_total'), ZERO),
            ).order_by('-soma_valor')

            itens = []
            grand_total = ZERO
            for d in dados:
                vt = d['soma_valor'] or ZERO
                grand_total += vt
                itens.append({
                    'grupo': d['id_vendedor1__nome'] or 'Sem Vendedor',
                    'qtd_vendas': d['qtd_vendas'],
                    'valor_total': float(vt),
                    'ticket_medio': float(d['media_valor'] or 0),
                })
        else:
            dados = qs.values(
                'id_cliente__cidade'
            ).annotate(
                qtd_vendas=Count('id_venda'),
                soma_valor=Coalesce(Sum('valor_total'), ZERO),
                media_valor=Coalesce(Avg('valor_total'), ZERO),
                qtd_clientes=Count('id_cliente', distinct=True),
            ).order_by('-soma_valor')

            itens = []
            grand_total = ZERO
            for d in dados:
                vt = d['soma_valor'] or ZERO
                grand_total += vt
                itens.append({
                    'grupo': d['id_cliente__cidade'] or 'Sem Cidade',
                    'qtd_vendas': d['qtd_vendas'],
                    'valor_total': float(vt),
                    'ticket_medio': float(d['media_valor'] or 0),
                    'qtd_clientes': d.get('qtd_clientes', 0),
                })

        for i in itens:
            i['participacao'] = round(i['valor_total'] / float(grand_total) * 100, 2) if grand_total else 0

        return Response({
            'resumo': {
                'total_grupos': len(itens),
                'valor_total': float(grand_total),
                'agrupamento': agrupar,
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 12) LUCRO POR VENDA/VENDEDOR ====================
class RelLucroVendedorView(APIView):
    """GET /api/relatorios/vendas/lucro-vendedor/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        vendedores = Vendedor.objects.all()
        itens = []
        total_vendas = ZERO
        total_custo = ZERO
        total_lucro = ZERO

        for vend in vendedores:
            vendas = Venda.objects.filter(
                data_documento__gte=dt_inicio, data_documento__lte=dt_fim,
                id_vendedor1=vend,
            )
            if id_operacao:
                vendas = vendas.filter(id_operacao_id=id_operacao)
            valor_vendas = ZERO
            custo_total = ZERO
            qtd_vendas = 0
            for v in vendas:
                qtd_vendas += 1
                valor_vendas += v.valor_total or ZERO
                for vi in v.itens.select_related('id_produto').all():
                    if vi.id_produto:
                        est = Estoque.objects.filter(id_produto=vi.id_produto, ativo=True).first()
                        custo_unit = est.custo_medio if est and est.custo_medio else ZERO
                        custo_total += custo_unit * (vi.quantidade or ZERO)

            if qtd_vendas == 0:
                continue

            lucro = valor_vendas - custo_total
            margem = (lucro / valor_vendas * 100) if valor_vendas > 0 else ZERO
            comissao = vend.percentual_comissao or ZERO
            valor_comissao = valor_vendas * comissao / 100
            total_vendas += valor_vendas
            total_custo += custo_total
            total_lucro += lucro

            itens.append({
                'id_vendedor': vend.id_vendedor,
                'vendedor': vend.nome,
                'qtd_vendas': qtd_vendas,
                'valor_vendas': float(valor_vendas),
                'custo_total': float(custo_total),
                'lucro': float(lucro),
                'margem': float(margem),
                'comissao_perc': float(comissao),
                'valor_comissao': float(valor_comissao),
            })

        itens.sort(key=lambda x: x['valor_vendas'], reverse=True)

        return Response({
            'resumo': {
                'total_vendas': float(total_vendas),
                'total_custo': float(total_custo),
                'total_lucro': float(total_lucro),
                'margem_media': float((total_lucro / total_vendas * 100) if total_vendas else 0),
                'qtd_vendedores': len(itens),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 13) VENDAS POR CARACTERÍSTICA (GRUPO) ====================
class RelVendasCaracteristicaView(APIView):
    """GET /api/relatorios/vendas/por-caracteristica/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs_itens = VendaItem.objects.filter(
            id_venda__data_documento__gte=dt_inicio,
            id_venda__data_documento__lte=dt_fim,
        )
        if id_operacao:
            qs_itens = qs_itens.filter(id_venda__id_operacao_id=id_operacao)
        dados = qs_itens.values(
            'id_produto__id_grupo', 'id_produto__id_grupo__nome_grupo'
        ).annotate(
            qtd_produtos=Count('id_produto', distinct=True),
            qtd_vendida=Sum('quantidade'),
            valor_total=Coalesce(Sum('valor_total'), ZERO),
            desconto_total=Coalesce(Sum('desconto_valor'), ZERO),
            num_vendas=Count('id_venda', distinct=True),
        ).order_by('-valor_total')

        itens = []
        grand_total = ZERO
        for d in dados:
            vt = d['valor_total'] or ZERO
            grand_total += vt
            itens.append({
                'grupo': d['id_produto__id_grupo__nome_grupo'] or 'Sem Grupo',
                'qtd_produtos': d['qtd_produtos'],
                'qtd_vendida': float(d['qtd_vendida'] or 0),
                'num_vendas': d['num_vendas'],
                'desconto_total': float(d['desconto_total'] or 0),
                'valor_total': float(vt),
            })

        for i in itens:
            i['participacao'] = round(i['valor_total'] / float(grand_total) * 100, 2) if grand_total else 0

        return Response({
            'resumo': {
                'total_grupos': len(itens),
                'valor_total': float(grand_total),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })


# ==================== 14) ÚLTIMA COMPRA DO CLIENTE ====================
class RelUltimaCompraClienteView(APIView):
    """GET /api/relatorios/vendas/ultima-compra-cliente/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dias_sem_compra = int(request.query_params.get('dias', 90))
        busca = request.query_params.get('busca', '').strip()

        data_limite = timezone.now() - timedelta(days=dias_sem_compra)

        clientes = Cliente.objects.annotate(
            ultima_compra=Max('venda__data_documento'),
            total_compras=Count('venda__id_venda'),
            soma_valor=Coalesce(Sum('venda__valor_total'), ZERO),
        ).filter(total_compras__gt=0)

        if busca:
            clientes = clientes.filter(
                Q(nome_razao_social__icontains=busca) | Q(cpf_cnpj__icontains=busca)
            )

        itens_recentes = []
        itens_inativos = []
        for c in clientes.order_by('-ultima_compra'):
            item = {
                'id_cliente': c.id_cliente,
                'nome': c.nome_razao_social,
                'cpf_cnpj': c.cpf_cnpj or '',
                'cidade': c.cidade or '',
                'telefone': c.telefone or '',
                'total_compras': c.total_compras,
                'valor_total': float(c.soma_valor),
                'ultima_compra': c.ultima_compra.strftime('%Y-%m-%d') if c.ultima_compra else '',
                'dias_sem_compra': (timezone.now() - c.ultima_compra).days if c.ultima_compra else 999,
            }
            if c.ultima_compra and c.ultima_compra < data_limite:
                itens_inativos.append(item)
            else:
                itens_recentes.append(item)

        return Response({
            'resumo': {
                'total_clientes': len(itens_recentes) + len(itens_inativos),
                'clientes_ativos': len(itens_recentes),
                'clientes_inativos': len(itens_inativos),
                'dias_referencia': dias_sem_compra,
            },
            'itens_recentes': itens_recentes,
            'itens_inativos': itens_inativos,
        })


# ==================== 15) CUSTO VENDA CARTÃO ====================
class RelCustoVendaCartaoView(APIView):
    """GET /api/relatorios/vendas/custo-cartao/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        bandeira = request.query_params.get('bandeira')
        tipo_cartao = request.query_params.get('tipo_cartao')
        id_operacao = request.query_params.get('id_operacao')

        qs = RecebimentoCartao.objects.select_related('id_venda').filter(
            data_venda__gte=data_inicio, data_venda__lte=data_fim,
        )
        if bandeira:
            qs = qs.filter(bandeira__icontains=bandeira)
        if tipo_cartao:
            qs = qs.filter(tipo_cartao=tipo_cartao)
        if id_operacao:
            qs = qs.filter(id_venda__id_operacao_id=id_operacao)

        itens = []
        total_bruto = ZERO
        total_taxa = ZERO
        total_liquido = ZERO
        for r in qs.order_by('-data_venda'):
            bruto = r.valor_bruto or ZERO
            taxa = r.valor_taxa or ZERO
            liquido = r.valor_liquido or ZERO
            total_bruto += bruto
            total_taxa += taxa
            total_liquido += liquido
            itens.append({
                'id_recebimento': r.id_recebimento,
                'id_venda': r.id_venda_id,
                'data_venda': r.data_venda.strftime('%Y-%m-%d') if r.data_venda else '',
                'bandeira': r.bandeira or '',
                'tipo_cartao': r.tipo_cartao or '',
                'nsu': r.nsu or '',
                'valor_bruto': float(bruto),
                'taxa_percentual': float(r.taxa_percentual or 0),
                'valor_taxa': float(taxa),
                'valor_liquido': float(liquido),
                'data_previsao': r.data_previsao.strftime('%Y-%m-%d') if r.data_previsao else '',
                'data_pagamento': r.data_pagamento.strftime('%Y-%m-%d') if r.data_pagamento else '',
                'status': r.status or '',
            })

        # Resumo por bandeira
        por_bandeira = qs.values('bandeira').annotate(
            qtd=Count('id_recebimento'),
            total_bruto=Coalesce(Sum('valor_bruto'), ZERO),
            total_taxa=Coalesce(Sum('valor_taxa'), ZERO),
            total_liquido=Coalesce(Sum('valor_liquido'), ZERO),
        ).order_by('-total_bruto')

        return Response({
            'resumo': {
                'total_registros': len(itens),
                'total_bruto': float(total_bruto),
                'total_taxa': float(total_taxa),
                'total_liquido': float(total_liquido),
                'taxa_media': float((total_taxa / total_bruto * 100) if total_bruto else 0),
                'periodo': f'{data_inicio} a {data_fim}',
                'por_bandeira': list(por_bandeira),
            },
            'itens': itens,
        })


# ==================== 16) FRETE ====================
class RelFreteView(APIView):
    """GET /api/relatorios/vendas/frete/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = _parse_date(request.query_params.get('data_inicio'), date.today() - timedelta(days=30))
        data_fim = _parse_date(request.query_params.get('data_fim'), date.today())
        tipo_frete = request.query_params.get('tipo_frete')
        id_operacao = request.query_params.get('id_operacao')
        dt_inicio, dt_fim = _make_dt_range(data_inicio, data_fim)

        qs = Venda.objects.select_related(
            'id_cliente', 'transportadora'
        ).filter(
            data_documento__gte=dt_inicio, data_documento__lte=dt_fim,
        )
        if tipo_frete is not None and tipo_frete != '':
            qs = qs.filter(tipo_frete=int(tipo_frete))
        if id_operacao:
            qs = qs.filter(id_operacao_id=id_operacao)

        # Apenas vendas com frete
        qs = qs.filter(
            Q(taxa_entrega__gt=0) | Q(peso_bruto__gt=0) | Q(transportadora__isnull=False)
        )

        itens = []
        total_frete = ZERO
        total_peso = ZERO
        for v in qs.order_by('-data_documento'):
            frete = v.taxa_entrega or ZERO
            total_frete += frete
            peso = v.peso_bruto or ZERO
            total_peso += peso

            tipo_desc = {0: 'Remetente', 1: 'Destinatário', 9: 'Sem Frete'}.get(v.tipo_frete, 'Outro')
            itens.append({
                'id_venda': v.id_venda,
                'numero': v.numero_documento or str(v.id_venda),
                'data': v.data_documento.strftime('%Y-%m-%d') if v.data_documento else '',
                'cliente': v.id_cliente.nome_razao_social if v.id_cliente else 'Consumidor',
                'transportadora': v.transportadora.nome_razao_social if v.transportadora else '',
                'tipo_frete': tipo_desc,
                'valor_venda': float(v.valor_total or 0),
                'valor_frete': float(frete),
                'peso_bruto': float(peso),
                'peso_liquido': float(v.peso_liquido or 0),
                'volumes': v.quantidade_volumes or 0,
                'placa': v.placa_veiculo or '',
            })

        return Response({
            'resumo': {
                'total_registros': len(itens),
                'total_frete': float(total_frete),
                'total_peso': float(total_peso),
                'periodo': f'{data_inicio} a {data_fim}',
            },
            'itens': itens,
        })
