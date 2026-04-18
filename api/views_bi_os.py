"""
views_bi_os.py — Dashboard BI de Ordem de Serviço
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, datetime, timedelta
from django.db.models import Sum, Count, Avg, F, Q, Value, CharField, Max, Min
from django.db.models.functions import ExtractYear, ExtractMonth, ExtractWeekDay, Coalesce
from django.utils import timezone
from decimal import Decimal

from api.models import (
    OrdemServico, OsItensProduto, OsItensServico, Tecnico, StatusOrdemServico
)


def _make_dt_range(dt_inicio, dt_fim):
    """Converte date em datetime aware para filtro MySQL sem timezone tables."""
    start = timezone.make_aware(datetime.combine(dt_inicio, datetime.min.time()))
    end = timezone.make_aware(datetime.combine(dt_fim, datetime.max.time()))
    return start, end


class DashboardBIOSView(APIView):
    """
    GET /api/bi/ordem-servico/?periodo=30&data_inicio=&data_fim=&id_tecnico=
    Dashboard BI completo de Ordens de Serviço
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        periodo = int(request.query_params.get('periodo', 30))
        data_inicio = request.query_params.get('data_inicio', '')
        data_fim = request.query_params.get('data_fim', '')
        id_tecnico = request.query_params.get('id_tecnico', '')

        hoje = date.today()
        if data_inicio and data_fim:
            dt_inicio = date.fromisoformat(data_inicio)
            dt_fim = date.fromisoformat(data_fim)
        else:
            dt_inicio = hoje - timedelta(days=periodo)
            dt_fim = hoje

        dt_start, dt_end = _make_dt_range(dt_inicio, dt_fim)

        filtros = Q(data_abertura__gte=dt_start, data_abertura__lte=dt_end)
        if id_tecnico:
            filtros &= Q(id_tecnico=id_tecnico)

        qs = OrdemServico.objects.filter(filtros)

        # ========== CARDS RESUMO ==========
        total_os = qs.count()
        total_faturamento = float(qs.aggregate(t=Sum('valor_total_os'))['t'] or 0)
        total_produtos = float(qs.aggregate(t=Sum('valor_total_produtos'))['t'] or 0)
        total_servicos = float(qs.aggregate(t=Sum('valor_total_servicos'))['t'] or 0)
        total_desconto = float(qs.aggregate(t=Sum('valor_desconto'))['t'] or 0)
        ticket_medio = total_faturamento / total_os if total_os else 0

        finalizadas = qs.filter(Q(status_os='Finalizada') | Q(id_status__nome_status__icontains='finaliz')).count()
        canceladas = qs.filter(Q(status_os='Cancelada') | Q(id_status__nome_status__icontains='cancel')).count()
        abertas = qs.filter(Q(status_os='Aberta') | Q(id_status__nome_status__icontains='abert')).count()
        em_andamento = qs.filter(Q(status_os='Em Andamento') | Q(id_status__nome_status__icontains='andamento')).count()
        aguardando = qs.filter(Q(status_os='Aguardando Peça') | Q(id_status__nome_status__icontains='aguardando')).count()

        taxa_finalizacao = round((finalizadas / total_os * 100) if total_os else 0, 1)

        # ========== POR STATUS (usando StatusOrdemServico customizado) ==========
        por_status_custom = list(
            qs.filter(id_status__isnull=False)
            .values('id_status__nome_status', 'id_status__cor')
            .annotate(qtd=Count('id_os'), valor=Sum('valor_total_os'))
            .order_by('-qtd')
        )
        # Fallback para status_os texto
        por_status_texto = list(
            qs.filter(id_status__isnull=True)
            .values('status_os')
            .annotate(qtd=Count('id_os'), valor=Sum('valor_total_os'))
            .order_by('-qtd')
        )
        por_status = []
        for s in por_status_custom:
            por_status.append({
                'status': s['id_status__nome_status'],
                'cor': s['id_status__cor'] or 'blue',
                'qtd': s['qtd'],
                'valor': float(s['valor'] or 0),
            })
        for s in por_status_texto:
            por_status.append({
                'status': s['status_os'] or 'Sem Status',
                'cor': 'grey',
                'qtd': s['qtd'],
                'valor': float(s['valor'] or 0),
            })

        # ========== EVOLUÇÃO MENSAL ==========
        evolucao_mensal = list(
            qs.annotate(
                ano=ExtractYear('data_abertura'),
                mes=ExtractMonth('data_abertura'),
            )
            .values('ano', 'mes')
            .annotate(
                qtd=Count('id_os'),
                valor=Sum('valor_total_os'),
                produtos=Sum('valor_total_produtos'),
                servicos=Sum('valor_total_servicos'),
            )
            .order_by('ano', 'mes')
        )
        import calendar
        meses = []
        for m in evolucao_mensal:
            if not m['ano'] or not m['mes']:
                continue
            d = date(m['ano'], m['mes'], 1)
            meses.append({
                'mes': d.strftime('%Y-%m'),
                'mes_nome': d.strftime('%b/%Y'),
                'qtd': m['qtd'],
                'valor': float(m['valor'] or 0),
                'produtos': float(m['produtos'] or 0),
                'servicos': float(m['servicos'] or 0),
            })

        # ========== RANKING TÉCNICOS ==========
        ranking_tecnicos = list(
            qs.exclude(id_tecnico__isnull=True)
            .values('id_tecnico', 'id_tecnico__nome_tecnico')
            .annotate(
                qtd=Count('id_os'),
                valor=Sum('valor_total_os'),
                servicos=Sum('valor_total_servicos'),
                ticket=Avg('valor_total_os'),
                finalizadas=Count('id_os', filter=Q(status_os='Finalizada') | Q(id_status__nome_status__icontains='finaliz')),
            )
            .order_by('-valor')
        )
        tecnicos = []
        for t in ranking_tecnicos:
            tecnicos.append({
                'id_tecnico': t['id_tecnico'],
                'nome': t['id_tecnico__nome_tecnico'] or '',
                'qtd': t['qtd'],
                'valor': float(t['valor'] or 0),
                'servicos': float(t['servicos'] or 0),
                'ticket_medio': round(float(t['ticket'] or 0), 2),
                'finalizadas': t['finalizadas'],
                'taxa_finalizacao': round((t['finalizadas'] / t['qtd'] * 100) if t['qtd'] else 0, 1),
            })

        # ========== TOP CLIENTES ==========
        top_clientes = list(
            qs.exclude(id_cliente__isnull=True)
            .values('id_cliente', 'id_cliente__nome_razao_social', 'id_cliente__cpf_cnpj', 'id_cliente__cidade')
            .annotate(
                qtd=Count('id_os'),
                valor=Sum('valor_total_os'),
            )
            .order_by('-valor')[:20]
        )
        clientes = []
        for c in top_clientes:
            clientes.append({
                'id_cliente': c['id_cliente'],
                'nome': c['id_cliente__nome_razao_social'] or '',
                'cpf_cnpj': c['id_cliente__cpf_cnpj'] or '',
                'cidade': c['id_cliente__cidade'] or '',
                'qtd': c['qtd'],
                'valor': float(c['valor'] or 0),
            })

        # ========== TOP SERVIÇOS ==========
        top_servicos = list(
            OsItensServico.objects.filter(
                id_os__data_abertura__gte=dt_start,
                id_os__data_abertura__lte=dt_end,
            )
            .values('descricao_servico')
            .annotate(
                qtd=Count('id_os_item_servico'),
                valor=Sum('valor_total'),
                qtd_total=Sum('quantidade'),
            )
            .order_by('-qtd')[:20]
        )
        servicos = []
        for s in top_servicos:
            servicos.append({
                'descricao': s['descricao_servico'] or '',
                'qtd': s['qtd'],
                'qtd_total': float(s['qtd_total'] or 0),
                'valor': float(s['valor'] or 0),
            })

        # ========== TOP PRODUTOS USADOS ==========
        top_produtos = list(
            OsItensProduto.objects.filter(
                id_os__data_abertura__gte=dt_start,
                id_os__data_abertura__lte=dt_end,
            )
            .values('id_produto', 'id_produto__nome_produto', 'id_produto__codigo_produto')
            .annotate(
                qtd=Count('id_os_item_produto'),
                qtd_total=Sum('quantidade'),
                valor=Sum('valor_total'),
            )
            .order_by('-qtd')[:20]
        )
        produtos = []
        for p in top_produtos:
            produtos.append({
                'id_produto': p['id_produto'],
                'nome': p['id_produto__nome_produto'] or '',
                'codigo': p['id_produto__codigo_produto'] or '',
                'qtd': p['qtd'],
                'qtd_total': float(p['qtd_total'] or 0),
                'valor': float(p['valor'] or 0),
            })

        # ========== TEMPO MÉDIO RESOLUÇÃO ==========
        os_com_datas = qs.filter(
            data_finalizacao__isnull=False,
        ).values('data_abertura', 'data_finalizacao')

        tempos = []
        for o in os_com_datas:
            if o['data_abertura'] and o['data_finalizacao']:
                abertura = o['data_abertura'].date() if hasattr(o['data_abertura'], 'date') else o['data_abertura']
                delta = (o['data_finalizacao'] - abertura).days
                if delta >= 0:
                    tempos.append(delta)

        tempo_medio = round(sum(tempos) / len(tempos), 1) if tempos else 0
        tempo_min = min(tempos) if tempos else 0
        tempo_max = max(tempos) if tempos else 0

        # ========== OS POR DIA DA SEMANA ==========
        por_dia_semana = list(
            qs.annotate(dia_semana=ExtractWeekDay('data_abertura'))
            .values('dia_semana')
            .annotate(qtd=Count('id_os'))
            .order_by('dia_semana')
        )
        dias_semana_nomes = {1: 'Domingo', 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado'}
        dias = []
        for d in por_dia_semana:
            dias.append({
                'dia': dias_semana_nomes.get(d['dia_semana'], '?'),
                'dia_num': d['dia_semana'],
                'qtd': d['qtd'],
            })

        # ========== NFS-e EMITIDAS ==========
        nfse_emitidas = qs.filter(numero_nfse__isnull=False).exclude(numero_nfse='').count()
        nfse_valor = float(qs.filter(numero_nfse__isnull=False).exclude(numero_nfse='').aggregate(t=Sum('valor_total_os'))['t'] or 0)

        # ========== PERÍODO COMPARATIVO (período anterior) ==========
        delta_dias = (dt_fim - dt_inicio).days
        dt_inicio_ant = dt_inicio - timedelta(days=delta_dias + 1)
        dt_fim_ant = dt_inicio - timedelta(days=1)
        dt_start_ant, dt_end_ant = _make_dt_range(dt_inicio_ant, dt_fim_ant)
        qs_ant = OrdemServico.objects.filter(
            data_abertura__gte=dt_start_ant,
            data_abertura__lte=dt_end_ant,
        )
        if id_tecnico:
            qs_ant = qs_ant.filter(id_tecnico=id_tecnico)

        total_os_ant = qs_ant.count()
        total_fat_ant = float(qs_ant.aggregate(t=Sum('valor_total_os'))['t'] or 0)

        var_qtd = round(((total_os - total_os_ant) / total_os_ant * 100) if total_os_ant else 0, 1)
        var_fat = round(((total_faturamento - total_fat_ant) / total_fat_ant * 100) if total_fat_ant else 0, 1)

        return Response({
            'periodo': {
                'data_inicio': dt_inicio.isoformat(),
                'data_fim': dt_fim.isoformat(),
                'dias': (dt_fim - dt_inicio).days,
            },
            'resumo': {
                'total_os': total_os,
                'total_faturamento': total_faturamento,
                'total_produtos': total_produtos,
                'total_servicos': total_servicos,
                'total_desconto': total_desconto,
                'ticket_medio': round(ticket_medio, 2),
                'finalizadas': finalizadas,
                'canceladas': canceladas,
                'abertas': abertas,
                'em_andamento': em_andamento,
                'aguardando': aguardando,
                'taxa_finalizacao': taxa_finalizacao,
                'nfse_emitidas': nfse_emitidas,
                'nfse_valor': nfse_valor,
                'tempo_medio_dias': tempo_medio,
                'tempo_min_dias': tempo_min,
                'tempo_max_dias': tempo_max,
            },
            'comparativo': {
                'total_os_anterior': total_os_ant,
                'total_faturamento_anterior': total_fat_ant,
                'variacao_qtd': var_qtd,
                'variacao_faturamento': var_fat,
            },
            'por_status': por_status,
            'evolucao_mensal': meses,
            'ranking_tecnicos': tecnicos,
            'top_clientes': clientes,
            'top_servicos': servicos,
            'top_produtos': produtos,
            'por_dia_semana': dias,
        })
