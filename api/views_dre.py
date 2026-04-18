"""
DRE Gerencial — Demonstrativo de Resultado do Exercício.

Consolida dados de Vendas, CMV, Devoluções, Despesas, Receitas não-operacionais
e Contas de Serviço para gerar um DRE mensal ou por período.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsStaffOrHasPermission
from django.db.models import Sum, Q, Subquery, OuterRef, DecimalField
from django.db.models.functions import Coalesce
from decimal import Decimal
import datetime

from django.utils import timezone

from .models import (
    Venda, VendaItem, Compra,
    FinanceiroConta, ContaServico, Estoque
)


def _dec(v):
    """Garante Decimal, converte None para 0."""
    if v is None:
        return Decimal('0')
    return Decimal(str(v))


def _parse_periodo(request):
    """Retorna (data_inicio, data_fim) a partir dos query params."""
    mes = request.query_params.get('mes')
    ano = request.query_params.get('ano')
    data_inicio = request.query_params.get('data_inicio')
    data_fim = request.query_params.get('data_fim')

    hoje = datetime.date.today()

    if data_inicio and data_fim:
        try:
            di = datetime.date.fromisoformat(data_inicio)
            df = datetime.date.fromisoformat(data_fim)
            return di, df
        except ValueError:
            pass

    if mes and ano:
        try:
            mes = int(mes)
            ano = int(ano)
            di = datetime.date(ano, mes, 1)
            import calendar
            ultimo_dia = calendar.monthrange(ano, mes)[1]
            df = datetime.date(ano, mes, ultimo_dia)
            return di, df
        except (ValueError, TypeError):
            pass

    # default: mês atual
    di = datetime.date(hoje.year, hoje.month, 1)
    import calendar
    ultimo_dia = calendar.monthrange(hoje.year, hoje.month)[1]
    df = datetime.date(hoje.year, hoje.month, ultimo_dia)
    return di, df


class DREGerarView(APIView):
    permission_classes = [IsStaffOrHasPermission]
    permission_required = 'relatorios_acessar'  # Só quem tem acesso a relatórios vê o DRE

    def get(self, request):
        di, df = _parse_periodo(request)

        # ── 1. RECEITA BRUTA DE VENDAS ─────────────────────────────────────────
        # Vendas no período (data_documento), excluindo NF-e canceladas
        # data_documento é DateTimeField — usamos range com datetime aware
        di_dt = timezone.make_aware(datetime.datetime.combine(di, datetime.time.min))
        df_dt = timezone.make_aware(datetime.datetime.combine(df, datetime.time(23, 59, 59)))

        vendas_qs = Venda.objects.filter(
            data_documento__gte=di_dt,
            data_documento__lte=df_dt,
        ).exclude(status_nfe='CANCELADA')

        receita_bruta = _dec(vendas_qs.aggregate(t=Sum('valor_total'))['t'])

        # ── 2. DEVOLUÇÕES ──────────────────────────────────────────────────────
        # Usa FinanceiroConta do tipo receber geradas por devolução (sem origem venda)
        # ou contas com operação de devolução. Simplificado: buscamos contas
        # a receber pagas em período cuja origem seja 'devolucao' via descrição ou
        # usamos o valor de trocas. Como o sistema não tem flag direto, buscamos
        # FinanceiroConta receber sem id_venda_origem que sejam glosas/devoluções.
        # Abordagem robusta: vendas com itens devolvidos (TrocaItem / DevolucaoItem)
        # são refletidas em novas Vendas com operação de devolução — já abatidas na
        # Receita Bruta. Deixamos devolucoes=0 por ora para não duplicar.
        devolucoes = Decimal('0')

        # ── 3. IMPOSTOS SOBRE VENDAS ───────────────────────────────────────────
        itens_qs = VendaItem.objects.filter(
            id_venda__in=vendas_qs
        )

        impostos_agg = itens_qs.aggregate(
            icms=Coalesce(Sum('valor_icms'), Decimal('0'), output_field=DecimalField()),
            icms_st=Coalesce(Sum('valor_icms_st'), Decimal('0'), output_field=DecimalField()),
            pis=Coalesce(Sum('valor_pis'), Decimal('0'), output_field=DecimalField()),
            cofins=Coalesce(Sum('valor_cofins'), Decimal('0'), output_field=DecimalField()),
            ipi=Coalesce(Sum('valor_ipi'), Decimal('0'), output_field=DecimalField()),
        )
        total_impostos_venda = (
            _dec(impostos_agg['icms']) +
            _dec(impostos_agg['icms_st']) +
            _dec(impostos_agg['pis']) +
            _dec(impostos_agg['cofins']) +
            _dec(impostos_agg['ipi'])
        )

        receita_liquida = receita_bruta - devolucoes - total_impostos_venda

        # ── 4. CMV — Custo da Mercadoria Vendida ──────────────────────────────
        # Subquery: busca custo_medio no estoque para cada produto
        # Multiplica pela quantidade vendida no período.
        # Como VendaItem não armazena custo histórico, usa custo_medio atual.
        estoque_custo = Estoque.objects.filter(
            id_produto=OuterRef('id_produto')
        ).values('custo_medio')[:1]

        itens_com_custo = itens_qs.annotate(
            custo_unit=Coalesce(
                Subquery(estoque_custo, output_field=DecimalField()),
                Decimal('0'),
                output_field=DecimalField()
            )
        )

        cmv = Decimal('0')
        for item in itens_com_custo.values('quantidade', 'custo_unit'):
            cmv += _dec(item['quantidade']) * _dec(item['custo_unit'])

        resultado_bruto = receita_liquida - cmv
        margem_bruta_perc = (resultado_bruto / receita_bruta * 100) if receita_bruta else Decimal('0')

        # ── 5. DESPESAS OPERACIONAIS ───────────────────────────────────────────
        # FinanceiroConta tipo='pagar', pago no período, excluindo compras
        # (compras já estão no CMV)
        despesas_qs = FinanceiroConta.objects.filter(
            tipo_conta='pagar',
            status_conta='Pago',
            data_pagamento__gte=di,
            data_pagamento__lte=df,
            id_compra_origem__isnull=True,  # excluir pagamentos de compras (CMV)
        )

        despesas_agg = despesas_qs.values(
            'id_departamento__nome_departamento'
        ).annotate(
            total=Coalesce(Sum('valor_parcela'), Decimal('0'), output_field=DecimalField())
        ).order_by('-total')

        total_despesas = _dec(despesas_qs.aggregate(t=Sum('valor_parcela'))['t'])

        despesas_por_depto = [
            {
                'departamento': d['id_departamento__nome_departamento'] or 'Sem Departamento',
                'total': str(d['total']),
            }
            for d in despesas_agg
        ]

        # ── 6. CONTAS DE SERVIÇOS PAGAS ────────────────────────────────────────
        servicos_qs = ContaServico.objects.filter(
            status='pago',
            data_pagamento__gte=di,
            data_pagamento__lte=df,
        )
        total_servicos = _dec(servicos_qs.aggregate(t=Sum('valor_total'))['t'])

        servicos_por_tipo = []
        for tipo_key, tipo_label in ContaServico.TIPO_CHOICES:
            sub_total = _dec(servicos_qs.filter(tipo=tipo_key).aggregate(t=Sum('valor_total'))['t'])
            if sub_total > 0:
                servicos_por_tipo.append({'tipo': tipo_label, 'total': str(sub_total)})

        # ── 7. RECEITAS NÃO OPERACIONAIS ──────────────────────────────────────
        rec_extra_qs = FinanceiroConta.objects.filter(
            tipo_conta='receber',
            status_conta='Pago',
            data_pagamento__gte=di,
            data_pagamento__lte=df,
            id_venda_origem__isnull=True,   # excluir recebimentos de vendas (já na receita)
            id_os_origem__isnull=True,
        )
        total_rec_extra = _dec(rec_extra_qs.aggregate(t=Sum('valor_parcela'))['t'])

        # ── 8. RESULTADO OPERACIONAL ───────────────────────────────────────────
        total_despesas_total = total_despesas + total_servicos
        resultado_operacional = resultado_bruto - total_despesas_total + total_rec_extra

        margem_operacional_perc = (
            resultado_operacional / receita_bruta * 100
        ) if receita_bruta else Decimal('0')

        # ── 9. DETALHAMENTO DE VENDAS POR MÊS (para gráfico) ─────────────────
        vendas_periodo = list(
            vendas_qs.values('data_documento__date')
            .annotate(total=Sum('valor_total'))
            .order_by('data_documento__date')
        )

        def s(v):
            return str(round(_dec(v), 2))

        return Response({
            'periodo': {
                'data_inicio': str(di),
                'data_fim': str(df),
            },
            'dre': {
                'receita_bruta': s(receita_bruta),
                'devolucoes': s(devolucoes),
                'impostos_sobre_vendas': {
                    'total': s(total_impostos_venda),
                    'icms': s(impostos_agg['icms']),
                    'icms_st': s(impostos_agg['icms_st']),
                    'pis': s(impostos_agg['pis']),
                    'cofins': s(impostos_agg['cofins']),
                    'ipi': s(impostos_agg['ipi']),
                },
                'receita_liquida': s(receita_liquida),
                'cmv': s(cmv),
                'resultado_bruto': s(resultado_bruto),
                'margem_bruta_perc': s(margem_bruta_perc),
                'despesas_operacionais': {
                    'total': s(total_despesas),
                    'por_departamento': despesas_por_depto,
                },
                'contas_servicos': {
                    'total': s(total_servicos),
                    'por_tipo': servicos_por_tipo,
                },
                'receitas_nao_operacionais': s(total_rec_extra),
                'resultado_operacional': s(resultado_operacional),
                'margem_operacional_perc': s(margem_operacional_perc),
            },
            'grafico_vendas_diarias': [
                {
                    'data': str(v['data_documento__date']),
                    'total': s(v['total']),
                }
                for v in vendas_periodo
            ],
            'totais_auxiliares': {
                'qtd_vendas': vendas_qs.count(),
                'ticket_medio': s(receita_bruta / vendas_qs.count()) if vendas_qs.count() else '0',
                'qtd_itens_vendidos': itens_qs.count(),
            },
        })
