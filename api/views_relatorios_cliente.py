"""
views_relatorios_cliente.py — Endpoints para Relatórios de Cliente
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from django.db.models import Sum, Count, Avg, F, Q, Value, CharField, Max, Min
from django.db.models.functions import TruncMonth, Coalesce, ExtractYear, ExtractMonth
from decimal import Decimal

from api.models import (
    Cliente, FinanceiroConta, Venda, VendaItem, Estoque
)
from api.models_devolucao import Devolucao, CreditoCliente
from api.models_recorrencia import ContratoRecorrencia


class RelatorioTotalPagamentosView(APIView):
    """
    GET /api/relatorios/clientes/total-pagamentos/
    Ranking de clientes por total de pagamentos recebidos
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        cidade = request.query_params.get('cidade', '').strip()
        estado = request.query_params.get('estado', '').strip()
        valor_min = request.query_params.get('valor_min')
        valor_max = request.query_params.get('valor_max')
        ordenar_por = request.query_params.get('ordenar_por', 'total_pago')
        limite = request.query_params.get('limite')
        busca = request.query_params.get('busca', '').strip()

        filtros = Q(tipo_conta='Receber') & Q(status_conta__in=['Paga', 'Pago', 'Liquidada', 'Liquidado'])
        if data_inicio:
            filtros &= Q(data_pagamento__gte=data_inicio)
        if data_fim:
            filtros &= Q(data_pagamento__lte=data_fim)
        if cidade:
            filtros &= Q(id_cliente_fornecedor__cidade__icontains=cidade)
        if estado:
            filtros &= Q(id_cliente_fornecedor__estado__iexact=estado)
        if busca:
            filtros &= (Q(id_cliente_fornecedor__nome_razao_social__icontains=busca) | Q(id_cliente_fornecedor__cpf_cnpj__icontains=busca))

        dados = (
            FinanceiroConta.objects
            .filter(filtros)
            .values(
                'id_cliente_fornecedor',
                'id_cliente_fornecedor__nome_razao_social',
                'id_cliente_fornecedor__cpf_cnpj',
                'id_cliente_fornecedor__telefone',
                'id_cliente_fornecedor__cidade',
                'id_cliente_fornecedor__estado',
            )
            .annotate(
                total_pago=Coalesce(Sum('valor_liquidado'), Sum('valor_parcela'), Value(Decimal('0'))),
                qtd_pagamentos=Count('id_conta'),
                ultimo_pagamento=Max('data_pagamento'),
            )
            .order_by('-total_pago')
        )

        resultado = []
        for d in dados:
            if not d['id_cliente_fornecedor']:
                continue
            total_pago = float(d['total_pago'] or 0)
            if valor_min and total_pago < float(valor_min):
                continue
            if valor_max and total_pago > float(valor_max):
                continue
            resultado.append({
                'id_cliente': d['id_cliente_fornecedor'],
                'nome_cliente': d['id_cliente_fornecedor__nome_razao_social'] or '',
                'cpf_cnpj': d['id_cliente_fornecedor__cpf_cnpj'] or '',
                'telefone': d['id_cliente_fornecedor__telefone'] or '',
                'cidade': d['id_cliente_fornecedor__cidade'] or '',
                'estado': d['id_cliente_fornecedor__estado'] or '',
                'total_pago': total_pago,
                'qtd_pagamentos': d['qtd_pagamentos'],
                'ultimo_pagamento': d['ultimo_pagamento'].isoformat() if d['ultimo_pagamento'] else None,
            })

        # Ordenação
        ordem_map = {'total_pago': 'total_pago', 'nome': 'nome_cliente', 'qtd': 'qtd_pagamentos', 'cidade': 'cidade'}
        campo = ordem_map.get(ordenar_por, 'total_pago')
        resultado.sort(key=lambda x: x.get(campo, 0) if isinstance(x.get(campo, 0), (int, float)) else str(x.get(campo, '')), reverse=(campo != 'nome_cliente' and campo != 'cidade'))

        if limite:
            resultado = resultado[:int(limite)]

        total_geral = sum(r['total_pago'] for r in resultado)
        return Response({
            'clientes': resultado,
            'total_geral': total_geral,
            'qtd_clientes': len(resultado),
        })


class RelatorioExtratoClienteView(APIView):
    """
    GET /api/relatorios/clientes/extrato/?id_cliente=X
    Extrato financeiro completo de um cliente
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_cliente = request.query_params.get('id_cliente')
        if not id_cliente:
            return Response({'error': 'id_cliente é obrigatório'}, status=400)

        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')

        try:
            cliente = Cliente.objects.get(pk=id_cliente)
        except Cliente.DoesNotExist:
            return Response({'error': 'Cliente não encontrado'}, status=404)

        filtros = Q(id_cliente_fornecedor=id_cliente)
        if data_inicio:
            filtros &= Q(data_vencimento__gte=data_inicio)
        if data_fim:
            filtros &= Q(data_vencimento__lte=data_fim)

        contas = FinanceiroConta.objects.filter(filtros).order_by('data_vencimento')

        movimentacoes = []
        saldo = Decimal('0')
        total_debitos = Decimal('0')
        total_creditos = Decimal('0')

        for c in contas:
            valor = c.valor_parcela or Decimal('0')
            valor_pago = c.valor_liquidado or Decimal('0')

            if c.tipo_conta == 'Receber':
                total_debitos += valor
                if c.status_conta in ('Paga', 'Pago', 'Liquidada', 'Liquidado'):
                    total_creditos += valor_pago or valor
                    saldo -= valor_pago or valor
                else:
                    saldo += valor
            else:
                total_creditos += valor

            movimentacoes.append({
                'id_conta': c.id_conta,
                'data_vencimento': c.data_vencimento.isoformat() if c.data_vencimento else None,
                'data_pagamento': c.data_pagamento.isoformat() if c.data_pagamento else None,
                'descricao': c.descricao or '',
                'documento': c.documento_numero or '',
                'parcela': f"{c.parcela_numero or 1}/{c.parcela_total or 1}",
                'tipo': c.tipo_conta,
                'valor': float(valor),
                'valor_pago': float(valor_pago),
                'juros': float(c.valor_juros or 0),
                'multa': float(c.valor_multa or 0),
                'desconto': float(c.valor_desconto or 0),
                'status': c.status_conta,
            })

        return Response({
            'cliente': {
                'id': cliente.id_cliente,
                'nome': cliente.nome_razao_social,
                'cpf_cnpj': cliente.cpf_cnpj or '',
                'telefone': cliente.telefone or '',
                'email': cliente.email or '',
                'cidade': cliente.cidade or '',
                'estado': cliente.estado or '',
            },
            'movimentacoes': movimentacoes,
            'resumo': {
                'total_debitos': float(total_debitos),
                'total_creditos': float(total_creditos),
                'saldo': float(saldo),
                'qtd_movimentacoes': len(movimentacoes),
            }
        })


class RelatorioTotalGastosView(APIView):
    """
    GET /api/relatorios/clientes/total-gastos/
    Ranking de clientes por total de compras/gastos
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        cidade = request.query_params.get('cidade', '').strip()
        estado = request.query_params.get('estado', '').strip()
        valor_min = request.query_params.get('valor_min')
        valor_max = request.query_params.get('valor_max')
        ordenar_por = request.query_params.get('ordenar_por', 'total_gasto')
        limite = request.query_params.get('limite')
        busca = request.query_params.get('busca', '').strip()

        filtros = Q()
        if data_inicio:
            filtros &= Q(data_documento__gte=data_inicio)
        if data_fim:
            filtros &= Q(data_documento__lte=data_fim)
        if cidade:
            filtros &= Q(id_cliente__cidade__icontains=cidade)
        if estado:
            filtros &= Q(id_cliente__estado__iexact=estado)
        if busca:
            filtros &= (Q(id_cliente__nome_razao_social__icontains=busca) | Q(id_cliente__cpf_cnpj__icontains=busca))

        dados = (
            Venda.objects
            .filter(filtros)
            .exclude(id_cliente__isnull=True)
            .values(
                'id_cliente',
                'id_cliente__nome_razao_social',
                'id_cliente__cpf_cnpj',
                'id_cliente__telefone',
                'id_cliente__cidade',
                'id_cliente__estado',
            )
            .annotate(
                total_gasto=Sum('valor_total'),
                qtd_compras=Count('id_venda'),
                ticket_medio=Avg('valor_total'),
            )
            .order_by('-total_gasto')
        )

        resultado = []
        for d in dados:
            total_gasto = float(d['total_gasto'] or 0)
            if valor_min and total_gasto < float(valor_min):
                continue
            if valor_max and total_gasto > float(valor_max):
                continue
            resultado.append({
                'id_cliente': d['id_cliente'],
                'nome_cliente': d['id_cliente__nome_razao_social'] or '',
                'cpf_cnpj': d['id_cliente__cpf_cnpj'] or '',
                'telefone': d['id_cliente__telefone'] or '',
                'cidade': d['id_cliente__cidade'] or '',
                'estado': d['id_cliente__estado'] or '',
                'total_gasto': total_gasto,
                'qtd_compras': d['qtd_compras'],
                'ticket_medio': round(float(d['ticket_medio'] or 0), 2),
            })

        ordem_map = {'total_gasto': 'total_gasto', 'nome': 'nome_cliente', 'qtd': 'qtd_compras', 'ticket': 'ticket_medio', 'cidade': 'cidade'}
        campo = ordem_map.get(ordenar_por, 'total_gasto')
        resultado.sort(key=lambda x: x.get(campo, 0) if isinstance(x.get(campo, 0), (int, float)) else str(x.get(campo, '')), reverse=(campo not in ('nome_cliente', 'cidade')))

        if limite:
            resultado = resultado[:int(limite)]

        total_geral = sum(r['total_gasto'] for r in resultado)
        return Response({
            'clientes': resultado,
            'total_geral': total_geral,
            'qtd_clientes': len(resultado),
        })


class RelatorioVendas12MesesView(APIView):
    """
    GET /api/relatorios/clientes/vendas-12-meses/?id_cliente=X (opcional)
    Vendas mês a mês dos últimos 12 meses
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        id_cliente = request.query_params.get('id_cliente')
        hoje = date.today()
        inicio = hoje - relativedelta(months=12)

        filtros = Q(data_documento__gte=inicio)
        if id_cliente:
            filtros &= Q(id_cliente=id_cliente)

        vendas_mes = (
            Venda.objects
            .filter(filtros)
            .annotate(
                ano=ExtractYear('data_documento'),
                mes_num=ExtractMonth('data_documento'),
            )
            .values('ano', 'mes_num')
            .annotate(
                total=Sum('valor_total'),
                qtd=Count('id_venda'),
            )
            .order_by('ano', 'mes_num')
        )

        import calendar
        meses = []
        for v in vendas_mes:
            ano = v['ano']
            mes_num = v['mes_num']
            if not ano or not mes_num:
                continue
            d = date(ano, mes_num, 1)
            meses.append({
                'mes': d.strftime('%Y-%m'),
                'mes_nome': d.strftime('%b/%Y'),
                'total': float(v['total'] or 0),
                'qtd': v['qtd'],
            })

        # Top clientes (se não filtrado por cliente)
        top_clientes = []
        if not id_cliente:
            top = (
                Venda.objects
                .filter(data_documento__gte=inicio)
                .exclude(id_cliente__isnull=True)
                .values('id_cliente', 'id_cliente__nome_razao_social')
                .annotate(total=Sum('valor_total'), qtd=Count('id_venda'))
                .order_by('-total')[:20]
            )
            for t in top:
                top_clientes.append({
                    'id_cliente': t['id_cliente'],
                    'nome': t['id_cliente__nome_razao_social'] or '',
                    'total': float(t['total'] or 0),
                    'qtd': t['qtd'],
                })

        # Info do cliente se filtrado
        info_cliente = None
        if id_cliente:
            try:
                cli = Cliente.objects.get(pk=id_cliente)
                info_cliente = {
                    'id': cli.id_cliente,
                    'nome': cli.nome_razao_social,
                    'cpf_cnpj': cli.cpf_cnpj or '',
                }
            except Cliente.DoesNotExist:
                pass

        total_geral = sum(m['total'] for m in meses)
        return Response({
            'meses': meses,
            'top_clientes': top_clientes,
            'cliente': info_cliente,
            'total_geral': total_geral,
        })


class RelatorioDesempenhoClienteView(APIView):
    """
    GET /api/relatorios/clientes/desempenho/
    Desempenho dos clientes: vendas, margem, devoluções
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        cidade = request.query_params.get('cidade', '').strip()
        estado = request.query_params.get('estado', '').strip()
        ordenar_por = request.query_params.get('ordenar_por', 'total_vendas')
        limite = request.query_params.get('limite')
        busca = request.query_params.get('busca', '').strip()

        filtros_venda = Q()
        if data_inicio:
            filtros_venda &= Q(data_documento__gte=data_inicio)
        if data_fim:
            filtros_venda &= Q(data_documento__lte=data_fim)
        if cidade:
            filtros_venda &= Q(id_cliente__cidade__icontains=cidade)
        if estado:
            filtros_venda &= Q(id_cliente__estado__iexact=estado)
        if busca:
            filtros_venda &= (Q(id_cliente__nome_razao_social__icontains=busca) | Q(id_cliente__cpf_cnpj__icontains=busca))

        # Vendas por cliente
        vendas_por_cliente = dict(
            Venda.objects
            .filter(filtros_venda)
            .exclude(id_cliente__isnull=True)
            .values('id_cliente')
            .annotate(
                total_vendas=Sum('valor_total'),
                qtd_vendas=Count('id_venda'),
                ticket_medio=Avg('valor_total'),
            )
            .values_list('id_cliente', 'total_vendas', 'qtd_vendas', 'ticket_medio')
            .order_by()
            # Return as dict entries
        )
        # Re-query properly
        vendas_data = (
            Venda.objects
            .filter(filtros_venda)
            .exclude(id_cliente__isnull=True)
            .values(
                'id_cliente',
                'id_cliente__nome_razao_social',
                'id_cliente__cpf_cnpj',
                'id_cliente__cidade',
            )
            .annotate(
                total_vendas=Sum('valor_total'),
                qtd_vendas=Count('id_venda'),
                ticket_medio=Avg('valor_total'),
            )
            .order_by('-total_vendas')
        )

        # Devoluções por cliente
        filtros_dev = Q(tipo='venda', status='aprovada')
        if data_inicio:
            filtros_dev &= Q(data_devolucao__gte=data_inicio)
        if data_fim:
            filtros_dev &= Q(data_devolucao__lte=data_fim)

        dev_por_cliente = {}
        for d in Devolucao.objects.filter(filtros_dev).values('id_cliente').annotate(
            total_dev=Sum('valor_total_devolucao'),
            qtd_dev=Count('id_devolucao')
        ):
            dev_por_cliente[d['id_cliente']] = {
                'total': float(d['total_dev'] or 0),
                'qtd': d['qtd_dev'],
            }

        resultado = []
        for v in vendas_data:
            id_cli = v['id_cliente']
            total_v = float(v['total_vendas'] or 0)
            dev = dev_por_cliente.get(id_cli, {'total': 0, 'qtd': 0})
            total_liquido = total_v - dev['total']
            perc_devolucao = (dev['total'] / total_v * 100) if total_v > 0 else 0

            resultado.append({
                'id_cliente': id_cli,
                'nome_cliente': v['id_cliente__nome_razao_social'] or '',
                'cpf_cnpj': v['id_cliente__cpf_cnpj'] or '',
                'cidade': v['id_cliente__cidade'] or '',
                'total_vendas': total_v,
                'qtd_vendas': v['qtd_vendas'],
                'ticket_medio': round(float(v['ticket_medio'] or 0), 2),
                'total_devolucoes': dev['total'],
                'qtd_devolucoes': dev['qtd'],
                'total_liquido': round(total_liquido, 2),
                'perc_devolucao': round(perc_devolucao, 2),
            })

        # Ordenação
        ordem_map = {'total_vendas': 'total_vendas', 'nome': 'nome_cliente', 'liquido': 'total_liquido', 'devolucoes': 'total_devolucoes', 'ticket': 'ticket_medio'}
        campo = ordem_map.get(ordenar_por, 'total_vendas')
        resultado.sort(key=lambda x: x.get(campo, 0) if isinstance(x.get(campo, 0), (int, float)) else str(x.get(campo, '')), reverse=(campo != 'nome_cliente'))

        if limite:
            resultado = resultado[:int(limite)]

        return Response({
            'clientes': resultado,
            'total_vendas': sum(r['total_vendas'] for r in resultado),
            'total_devolucoes': sum(r['total_devolucoes'] for r in resultado),
            'total_liquido': sum(r['total_liquido'] for r in resultado),
        })


class RelatorioTipoClienteView(APIView):
    """
    GET /api/relatorios/clientes/tipo-cliente/
    Classificação ABC de clientes por faturamento
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        meses = int(request.query_params.get('meses', 12))
        inicio = date.today() - relativedelta(months=meses)

        dados = (
            Venda.objects
            .filter(data_documento__gte=inicio)
            .exclude(id_cliente__isnull=True)
            .values(
                'id_cliente',
                'id_cliente__nome_razao_social',
                'id_cliente__cpf_cnpj',
                'id_cliente__cidade',
                'id_cliente__data_cadastro',
            )
            .annotate(
                total=Sum('valor_total'),
                qtd=Count('id_venda'),
            )
            .order_by('-total')
        )

        total_geral = sum(float(d['total'] or 0) for d in dados)
        if total_geral == 0:
            return Response({'clientes': [], 'resumo': {}})

        resultado = []
        acumulado = 0
        for d in dados:
            total_cli = float(d['total'] or 0)
            acumulado += total_cli
            perc_acumulado = (acumulado / total_geral) * 100

            if perc_acumulado <= 80:
                classificacao = 'A'
            elif perc_acumulado <= 95:
                classificacao = 'B'
            else:
                classificacao = 'C'

            resultado.append({
                'id_cliente': d['id_cliente'],
                'nome_cliente': d['id_cliente__nome_razao_social'] or '',
                'cpf_cnpj': d['id_cliente__cpf_cnpj'] or '',
                'cidade': d['id_cliente__cidade'] or '',
                'data_cadastro': d['id_cliente__data_cadastro'].strftime('%Y-%m-%d') if d['id_cliente__data_cadastro'] else None,
                'total': total_cli,
                'qtd': d['qtd'],
                'percentual': round((total_cli / total_geral) * 100, 2),
                'perc_acumulado': round(perc_acumulado, 2),
                'classificacao': classificacao,
            })

        qtd_a = sum(1 for r in resultado if r['classificacao'] == 'A')
        qtd_b = sum(1 for r in resultado if r['classificacao'] == 'B')
        qtd_c = sum(1 for r in resultado if r['classificacao'] == 'C')
        val_a = sum(r['total'] for r in resultado if r['classificacao'] == 'A')
        val_b = sum(r['total'] for r in resultado if r['classificacao'] == 'B')
        val_c = sum(r['total'] for r in resultado if r['classificacao'] == 'C')

        return Response({
            'clientes': resultado,
            'resumo': {
                'total_geral': total_geral,
                'tipo_a': {'qtd': qtd_a, 'total': val_a, 'perc': round(val_a / total_geral * 100, 2) if total_geral else 0},
                'tipo_b': {'qtd': qtd_b, 'total': val_b, 'perc': round(val_b / total_geral * 100, 2) if total_geral else 0},
                'tipo_c': {'qtd': qtd_c, 'total': val_c, 'perc': round(val_c / total_geral * 100, 2) if total_geral else 0},
            }
        })


class RelatorioCaracteristicasView(APIView):
    """
    GET /api/relatorios/clientes/caracteristicas/
    Demografia e características dos clientes
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        clientes = Cliente.objects.filter(ativo=True)
        total = clientes.count()

        # Por sexo
        por_sexo = list(
            clientes.exclude(sexo__isnull=True).exclude(sexo='')
            .values('sexo')
            .annotate(qtd=Count('id_cliente'))
            .order_by('-qtd')
        )

        # Por cidade (top 20)
        por_cidade = list(
            clientes.exclude(cidade__isnull=True).exclude(cidade='')
            .values('cidade', 'estado')
            .annotate(qtd=Count('id_cliente'))
            .order_by('-qtd')[:20]
        )

        # Por estado
        por_estado = list(
            clientes.exclude(estado__isnull=True).exclude(estado='')
            .values('estado')
            .annotate(qtd=Count('id_cliente'))
            .order_by('-qtd')
        )

        # Por faixa etária
        hoje = date.today()
        faixas = {'0-17': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56-65': 0, '65+': 0, 'Não informado': 0}
        for c in clientes:
            if not c.data_nascimento:
                faixas['Não informado'] += 1
                continue
            idade = (hoje - c.data_nascimento).days // 365
            if idade < 18:
                faixas['0-17'] += 1
            elif idade <= 25:
                faixas['18-25'] += 1
            elif idade <= 35:
                faixas['26-35'] += 1
            elif idade <= 45:
                faixas['36-45'] += 1
            elif idade <= 55:
                faixas['46-55'] += 1
            elif idade <= 65:
                faixas['56-65'] += 1
            else:
                faixas['65+'] += 1

        por_faixa = [{'faixa': k, 'qtd': v} for k, v in faixas.items() if v > 0]

        # Clientes com/sem email, whatsapp
        com_email = clientes.exclude(email__isnull=True).exclude(email='').count()
        com_whatsapp = clientes.exclude(whatsapp__isnull=True).exclude(whatsapp='').count()
        com_data_nasc = clientes.exclude(data_nascimento__isnull=True).count()

        return Response({
            'total_clientes': total,
            'por_sexo': por_sexo,
            'por_cidade': por_cidade,
            'por_estado': por_estado,
            'por_faixa_etaria': por_faixa,
            'contato': {
                'com_email': com_email,
                'sem_email': total - com_email,
                'com_whatsapp': com_whatsapp,
                'sem_whatsapp': total - com_whatsapp,
                'com_data_nascimento': com_data_nasc,
                'sem_data_nascimento': total - com_data_nasc,
            }
        })


class RelatorioDebitoContaView(APIView):
    """
    GET /api/relatorios/clientes/debito-conta/
    Clientes com débitos pendentes (contas a receber em aberto)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = date.today()
        cidade = request.query_params.get('cidade', '').strip()
        estado = request.query_params.get('estado', '').strip()
        situacao = request.query_params.get('situacao', '').strip()
        dias_atraso_min = request.query_params.get('dias_atraso_min')
        busca = request.query_params.get('busca', '').strip()
        ordenar_por = request.query_params.get('ordenar_por', 'total_debito')

        filtros = Q(tipo_conta='Receber', status_conta='Pendente')
        filtros &= ~Q(id_cliente_fornecedor__isnull=True)
        if cidade:
            filtros &= Q(id_cliente_fornecedor__cidade__icontains=cidade)
        if estado:
            filtros &= Q(id_cliente_fornecedor__estado__iexact=estado)
        if busca:
            filtros &= (Q(id_cliente_fornecedor__nome_razao_social__icontains=busca) | Q(id_cliente_fornecedor__cpf_cnpj__icontains=busca))

        dados = (
            FinanceiroConta.objects
            .filter(filtros)
            .values(
                'id_cliente_fornecedor',
                'id_cliente_fornecedor__nome_razao_social',
                'id_cliente_fornecedor__cpf_cnpj',
                'id_cliente_fornecedor__telefone',
                'id_cliente_fornecedor__whatsapp',
                'id_cliente_fornecedor__cidade',
            )
            .annotate(
                total_debito=Sum('valor_parcela'),
                qtd_parcelas=Count('id_conta'),
                vencimento_mais_antigo=Min('data_vencimento'),
            )
            .order_by('-total_debito')
        )

        resultado = []
        for d in dados:
            venc_antigo = d['vencimento_mais_antigo']
            dias_atraso = (hoje - venc_antigo).days if venc_antigo and venc_antigo < hoje else 0

            resultado.append({
                'id_cliente': d['id_cliente_fornecedor'],
                'nome_cliente': d['id_cliente_fornecedor__nome_razao_social'] or '',
                'cpf_cnpj': d['id_cliente_fornecedor__cpf_cnpj'] or '',
                'telefone': d['id_cliente_fornecedor__telefone'] or '',
                'whatsapp': d['id_cliente_fornecedor__whatsapp'] or '',
                'cidade': d['id_cliente_fornecedor__cidade'] or '',
                'total_debito': float(d['total_debito'] or 0),
                'qtd_parcelas': d['qtd_parcelas'],
                'vencimento_mais_antigo': venc_antigo.isoformat() if venc_antigo else None,
                'dias_atraso': dias_atraso,
                'situacao': 'Vencido' if dias_atraso > 0 else 'A Vencer',
            })

        # Filtros pós-query
        if situacao:
            resultado = [r for r in resultado if r['situacao'] == situacao]
        if dias_atraso_min:
            resultado = [r for r in resultado if r['dias_atraso'] >= int(dias_atraso_min)]

        ordem_map = {'total_debito': 'total_debito', 'nome': 'nome_cliente', 'dias_atraso': 'dias_atraso', 'parcelas': 'qtd_parcelas'}
        campo = ordem_map.get(ordenar_por, 'total_debito')
        resultado.sort(key=lambda x: x.get(campo, 0) if isinstance(x.get(campo, 0), (int, float)) else str(x.get(campo, '')), reverse=(campo != 'nome_cliente'))

        total_geral = sum(r['total_debito'] for r in resultado)
        total_vencido = sum(r['total_debito'] for r in resultado if r['situacao'] == 'Vencido')
        total_a_vencer = total_geral - total_vencido

        return Response({
            'clientes': resultado,
            'resumo': {
                'total_geral': total_geral,
                'total_vencido': total_vencido,
                'total_a_vencer': total_a_vencer,
                'qtd_clientes': len(resultado),
            }
        })


class RelatorioCreditoClienteView(APIView):
    """
    GET /api/relatorios/clientes/credito-cliente/
    Clientes com créditos disponíveis
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filtro = request.query_params.get('status', '').strip()
        busca = request.query_params.get('busca', '').strip()

        filtros = Q(saldo__gt=0)
        if status_filtro:
            filtros &= Q(status=status_filtro)

        creditos = (
            CreditoCliente.objects
            .filter(filtros)
            .order_by('-saldo')
        )

        # Buscar nomes dos clientes
        cliente_ids = set(c.id_cliente for c in creditos if c.id_cliente)
        clientes_map = {}
        if cliente_ids:
            for cli in Cliente.objects.filter(id_cliente__in=cliente_ids):
                clientes_map[cli.id_cliente] = cli

        resultado = []
        for c in creditos:
            cli = clientes_map.get(c.id_cliente)
            nome = cli.nome_razao_social if cli else 'Sem cliente'
            cpf = cli.cpf_cnpj if cli else ''
            if busca and busca.lower() not in (nome or '').lower() and busca not in (cpf or ''):
                continue
            resultado.append({
                'id_credito': c.id_credito,
                'id_cliente': c.id_cliente,
                'nome_cliente': cli.nome_razao_social if cli else 'Sem cliente',
                'cpf_cnpj': cli.cpf_cnpj if cli else '',
                'telefone': cli.telefone if cli else '',
                'saldo': float(c.saldo or 0),
                'valor_original': float(c.valor_credito or 0),
                'valor_utilizado': float(c.valor_utilizado or 0),
                'data_geracao': c.data_criacao.isoformat() if c.data_criacao else None,
                'data_validade': c.data_validade.isoformat() if c.data_validade else None,
                'status': c.status or '',
            })

        total_creditos = sum(r['saldo'] for r in resultado)
        return Response({
            'creditos': resultado,
            'total_creditos': total_creditos,
            'qtd_clientes': len(set(r['id_cliente'] for r in resultado if r['id_cliente'])),
        })


class RelatorioContratosClienteView(APIView):
    """
    GET /api/relatorios/clientes/contratos/
    Contratos de recorrência dos clientes
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filtro = request.query_params.get('status', '')
        busca = request.query_params.get('busca', '').strip()
        periodicidade = request.query_params.get('periodicidade', '').strip()

        filtros = Q()
        if status_filtro:
            filtros &= Q(status=status_filtro)
        if busca:
            filtros &= (Q(cliente__nome_razao_social__icontains=busca) | Q(descricao__icontains=busca))
        if periodicidade:
            filtros &= Q(periodicidade__iexact=periodicidade)

        contratos = (
            ContratoRecorrencia.objects
            .filter(filtros)
            .select_related('cliente', 'responsavel')
            .order_by('status', 'cliente__nome_razao_social')
        )

        resultado = []
        for c in contratos:
            resultado.append({
                'id_contrato': c.id_contrato,
                'numero': c.numero,
                'id_cliente': c.cliente.id_cliente if c.cliente else None,
                'nome_cliente': c.cliente.nome_razao_social if c.cliente else '',
                'descricao': c.descricao or '',
                'valor_mensal': float(c.valor_mensal or 0),
                'periodicidade': c.periodicidade,
                'status': c.status,
                'data_inicio': c.data_inicio.isoformat() if c.data_inicio else None,
                'data_fim': c.data_fim.isoformat() if c.data_fim else None,
                'dia_vencimento': c.dia_vencimento,
                'proximo_faturamento': c.proximo_faturamento.isoformat() if c.proximo_faturamento else None,
            })

        ativos = sum(1 for r in resultado if r['status'] == 'ATIVO')
        valor_mensal_total = sum(r['valor_mensal'] for r in resultado if r['status'] == 'ATIVO')

        return Response({
            'contratos': resultado,
            'resumo': {
                'total': len(resultado),
                'ativos': ativos,
                'valor_mensal_total': valor_mensal_total,
            }
        })


class RelatorioIndicacoesView(APIView):
    """
    GET /api/relatorios/clientes/indicacoes/
    Clientes que mais compraram e podem ser indicadores
    Ranking de clientes por frequência e recência
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoje = date.today()
        meses_param = int(request.query_params.get('meses', 12))
        ultimos = hoje - relativedelta(months=meses_param)
        potencial_filtro = request.query_params.get('potencial', '').strip()
        cidade = request.query_params.get('cidade', '').strip()
        estado = request.query_params.get('estado', '').strip()
        busca = request.query_params.get('busca', '').strip()
        limite = int(request.query_params.get('limite', 50))

        filtros = Q(data_documento__gte=ultimos) & ~Q(id_cliente__isnull=True)
        if cidade:
            filtros &= Q(id_cliente__cidade__icontains=cidade)
        if estado:
            filtros &= Q(id_cliente__estado__iexact=estado)
        if busca:
            filtros &= (Q(id_cliente__nome_razao_social__icontains=busca) | Q(id_cliente__cpf_cnpj__icontains=busca))

        dados = (
            Venda.objects
            .filter(filtros)
            .values(
                'id_cliente',
                'id_cliente__nome_razao_social',
                'id_cliente__cpf_cnpj',
                'id_cliente__telefone',
                'id_cliente__whatsapp',
                'id_cliente__cidade',
                'id_cliente__data_cadastro',
            )
            .annotate(
                total_compras=Sum('valor_total'),
                qtd_compras=Count('id_venda'),
                ultima_compra=Max('data_documento'),
            )
            .order_by('-qtd_compras', '-total_compras')
        )

        resultado = []
        for d in dados:
            ultima = d['ultima_compra']
            dias_ultima = (hoje - ultima.date()).days if ultima else 999
            qtd = d['qtd_compras']
            total = float(d['total_compras'] or 0)

            # Score de indicação: frequência + recência + valor
            score = (qtd * 10) + (max(0, 365 - dias_ultima) / 10) + (total / 1000)

            if score >= 50:
                potencial = 'Alto'
            elif score >= 20:
                potencial = 'Médio'
            else:
                potencial = 'Baixo'

            resultado.append({
                'id_cliente': d['id_cliente'],
                'nome_cliente': d['id_cliente__nome_razao_social'] or '',
                'cpf_cnpj': d['id_cliente__cpf_cnpj'] or '',
                'telefone': d['id_cliente__telefone'] or '',
                'whatsapp': d['id_cliente__whatsapp'] or '',
                'cidade': d['id_cliente__cidade'] or '',
                'data_cadastro': d['id_cliente__data_cadastro'].strftime('%Y-%m-%d') if d['id_cliente__data_cadastro'] else None,
                'total_compras': total,
                'qtd_compras': qtd,
                'ultima_compra': ultima.strftime('%Y-%m-%d') if ultima else None,
                'dias_ultima_compra': dias_ultima,
                'score': round(score, 1),
                'potencial': potencial,
            })

        resultado.sort(key=lambda x: x['score'], reverse=True)

        if potencial_filtro:
            resultado = [r for r in resultado if r['potencial'] == potencial_filtro]

        return Response({
            'clientes': resultado[:limite],
            'resumo': {
                'alto': sum(1 for r in resultado if r['potencial'] == 'Alto'),
                'medio': sum(1 for r in resultado if r['potencial'] == 'Médio'),
                'baixo': sum(1 for r in resultado if r['potencial'] == 'Baixo'),
                'total': len(resultado),
            }
        })


class RelatorioDadosCompletosView(APIView):
    """
    GET /api/relatorios/clientes/dados-completos/?busca=&cidade=&estado=&ativo=&sexo=&ordenar_por=&limite=
    Lista todos os dados cadastrais de clientes
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        busca = request.query_params.get('busca', '')
        cidade = request.query_params.get('cidade', '')
        estado = request.query_params.get('estado', '')
        ativo = request.query_params.get('ativo', '')
        sexo = request.query_params.get('sexo', '')
        ordenar_por = request.query_params.get('ordenar_por', 'nome')
        limite = request.query_params.get('limite', '')

        qs = Cliente.objects.all()

        if busca:
            qs = qs.filter(
                Q(nome_razao_social__icontains=busca) |
                Q(cpf_cnpj__icontains=busca) |
                Q(email__icontains=busca) |
                Q(telefone__icontains=busca)
            )
        if cidade:
            qs = qs.filter(cidade__icontains=cidade)
        if estado:
            qs = qs.filter(estado=estado)
        if ativo == '1':
            qs = qs.filter(ativo=True)
        elif ativo == '0':
            qs = qs.filter(ativo=False)
        if sexo:
            qs = qs.filter(sexo=sexo)

        ordem_map = {
            'nome': 'nome_razao_social',
            'cidade': 'cidade',
            'data_cadastro': '-data_cadastro',
            'cpf_cnpj': 'cpf_cnpj',
        }
        qs = qs.order_by(ordem_map.get(ordenar_por, 'nome_razao_social'))

        if limite:
            qs = qs[:int(limite)]

        clientes = []
        for c in qs:
            clientes.append({
                'id_cliente': c.id_cliente,
                'nome_razao_social': c.nome_razao_social or '',
                'nome_fantasia': c.nome_fantasia or '',
                'cpf_cnpj': c.cpf_cnpj or '',
                'inscricao_estadual': c.inscricao_estadual or '',
                'endereco': c.endereco or '',
                'numero': c.numero or '',
                'bairro': c.bairro or '',
                'cidade': c.cidade or '',
                'estado': c.estado or '',
                'cep': c.cep or '',
                'telefone': c.telefone or '',
                'whatsapp': c.whatsapp or '',
                'email': c.email or '',
                'sexo': c.sexo or '',
                'data_nascimento': c.data_nascimento.strftime('%Y-%m-%d') if c.data_nascimento else None,
                'data_cadastro': c.data_cadastro.strftime('%Y-%m-%d') if c.data_cadastro else None,
                'limite_credito': float(c.limite_credito or 0),
                'ativo': c.ativo,
                'data_inativacao': c.data_inativacao.strftime('%Y-%m-%d') if c.data_inativacao else None,
                'motivo_inativacao': c.motivo_inativacao or '',
                'codigo_municipio_ibge': c.codigo_municipio_ibge or '',
            })

        return Response({
            'clientes': clientes,
            'total': len(clientes),
        })
