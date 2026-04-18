"""
Comissões de Vendedores — Relatório de vendas e comissões por vendedor.

Calcula o total de vendas por vendedor no período e aplica o percentual
de comissão configurado em cada Vendedor.percentual_comissao.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import Coalesce
from decimal import Decimal
import datetime, calendar

from django.utils import timezone
from .models import Venda, Vendedor


def _dec(v):
    if v is None:
        return Decimal('0')
    return Decimal(str(v))


def _parse_periodo(request):
    mes = request.query_params.get('mes')
    ano = request.query_params.get('ano')
    data_inicio = request.query_params.get('data_inicio')
    data_fim = request.query_params.get('data_fim')
    hoje = datetime.date.today()

    if data_inicio and data_fim:
        try:
            return datetime.date.fromisoformat(data_inicio), datetime.date.fromisoformat(data_fim)
        except ValueError:
            pass

    if mes and ano:
        try:
            mes, ano = int(mes), int(ano)
            di = datetime.date(ano, mes, 1)
            df = datetime.date(ano, mes, calendar.monthrange(ano, mes)[1])
            return di, df
        except (ValueError, TypeError):
            pass

    di = datetime.date(hoje.year, hoje.month, 1)
    df = datetime.date(hoje.year, hoje.month, calendar.monthrange(hoje.year, hoje.month)[1])
    return di, df


class RelatorioComissoesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        di, df = _parse_periodo(request)
        id_vendedor = request.query_params.get('id_vendedor')

        # Converte para datetime aware para garantir compatibilidade de timezone
        dt_inicio = datetime.datetime.combine(di, datetime.time.min)
        dt_fim = datetime.datetime.combine(df, datetime.time.max)
        
        if timezone.is_naive(dt_inicio):
            dt_inicio = timezone.make_aware(dt_inicio)
        if timezone.is_naive(dt_fim):
            dt_fim = timezone.make_aware(dt_fim)

        # Vendas no período (excluir canceladas)
        vendas_qs = Venda.objects.filter(
            data_documento__range=(dt_inicio, dt_fim),
        ).exclude(status_nfe='CANCELADA')

        # Selecionar vendedores:
        # Se id_vendedor for passado, filtra apenas ele.
        # Caso contrário, traz todos os vendedores (para mostrar mesmo os que não venderam neste mês).
        if id_vendedor:
            vendedores = Vendedor.objects.filter(id_vendedor=id_vendedor)
        else:
            # Opção 1: Mostrar todos os vendedores cadastrados
            vendedores = Vendedor.objects.all()
            
            # Opção 2: Mostrar apenas os que venderam (descomentar se preferir ocultar zerados)
            # vendedores = Vendedor.objects.filter(
            #     Q(vendas_vendedor1__in=vendas_qs) | Q(vendas_vendedor2__in=vendas_qs)
            # ).distinct()

        resultado = []

        for vendedor in vendedores:
            # Vendas onde o vendedor é primário ou secundário
            v1_qs = vendas_qs.filter(id_vendedor1=vendedor)
            v2_qs = vendas_qs.filter(id_vendedor2=vendedor)

            total_v1 = _dec(v1_qs.aggregate(t=Sum('valor_total'))['t'])
            total_v2 = _dec(v2_qs.aggregate(t=Sum('valor_total'))['t'])
            total_geral = total_v1 + total_v2

            qtd_v1 = v1_qs.count()
            qtd_v2 = v2_qs.count()

            perc = _dec(vendedor.percentual_comissao or 0)
            comissao_calc = total_geral * perc / Decimal('100')

            ticket_medio_v1 = (total_v1 / qtd_v1) if qtd_v1 else Decimal('0')

            # Vendas por dia (para mini-gráfico)
            vendas_dia = list(
                v1_qs.values('data_documento__date')
                .annotate(total=Sum('valor_total'))
                .order_by('data_documento__date')
            )

            def s(v): return str(round(_dec(v), 2))

            resultado.append({
                'id_vendedor': vendedor.id_vendedor,
                'nome': vendedor.nome,
                'nome_reduzido': vendedor.nome_reduzido or vendedor.nome.split()[0],
                'percentual_comissao': s(perc),
                'total_vendas_primario': s(total_v1),
                'qtd_vendas_primario': qtd_v1,
                'total_vendas_secundario': s(total_v2),
                'qtd_vendas_secundario': qtd_v2,
                'total_vendas': s(total_geral),
                'qtd_total_vendas': qtd_v1 + qtd_v2,
                'ticket_medio': s(ticket_medio_v1),
                'comissao_calculada': s(comissao_calc),
                'vendas_por_dia': [
                    {'data': str(v['data_documento__date']), 'total': s(v['total'])}
                    for v in vendas_dia
                ],
            })

        # Ordenar por total de vendas
        resultado.sort(key=lambda x: Decimal(x['total_vendas']), reverse=True)

        # Totais gerais
        total_geral_periodo = sum(Decimal(v['total_vendas']) for v in resultado)
        total_comissoes = sum(Decimal(v['comissao_calculada']) for v in resultado)

        return Response({
            'periodo': {
                'data_inicio': str(di),
                'data_fim': str(df),
            },
            'vendedores': resultado,
            'totais': {
                'total_vendas': str(round(total_geral_periodo, 2)),
                'total_comissoes': str(round(total_comissoes, 2)),
                'qtd_vendedores': len(resultado),
            },
        })
