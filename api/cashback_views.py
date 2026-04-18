# -*- coding: utf-8 -*-
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from api.models import Cashback, Cliente
from django.db.models import Q, Sum
from datetime import datetime, date
from django.utils import timezone
import re


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def relatorio_cashback(request):
    """
    Relatório de cashback com filtros
    """

    # Buscar todos os cashbacks
    cashbacks = Cashback.objects.select_related('id_cliente').all()

    # Filtro por cliente
    cliente_filtro = request.GET.get('cliente', '').strip()
    if cliente_filtro:
        try:
            cliente_id = int(cliente_filtro)
            cashbacks = cashbacks.filter(id_cliente_id=cliente_id)
        except ValueError:
            cashbacks = cashbacks.filter(
                Q(id_cliente__nome_razao_social__icontains=cliente_filtro) |
                Q(id_cliente__nome_fantasia__icontains=cliente_filtro)
            )

    # Filtro por status de utilização
    utilizado = request.GET.get('utilizado', '').lower()
    if utilizado == 'sim':
        cashbacks = cashbacks.filter(valor_utilizado__gt=0, saldo=0)
    elif utilizado == 'nao':
        cashbacks = cashbacks.filter(valor_utilizado=0)
    elif utilizado == 'parcial':
        cashbacks = cashbacks.filter(valor_utilizado__gt=0, saldo__gt=0)

    # Filtro por disponibilidade
    status = request.GET.get('status', '').lower()
    if status == 'disponivel':
        cashbacks = cashbacks.filter(ativo=True, saldo__gt=0, data_validade__gte=timezone.now())
    elif status == 'expirado':
        cashbacks = cashbacks.filter(Q(data_validade__lt=timezone.now()) | Q(ativo=False))
    elif status == 'utilizado':
        cashbacks = cashbacks.filter(saldo=0)

    # Filtro por data de geração
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    if data_inicio:
        cashbacks = cashbacks.filter(data_geracao__gte=data_inicio)
    if data_fim:
        cashbacks = cashbacks.filter(data_geracao__lte=data_fim)

    # Filtro por data de vencimento
    vencimento_inicio = request.GET.get('vencimento_inicio')
    vencimento_fim = request.GET.get('vencimento_fim')
    if vencimento_inicio:
        cashbacks = cashbacks.filter(data_validade__gte=vencimento_inicio)
    if vencimento_fim:
        cashbacks = cashbacks.filter(data_validade__lte=vencimento_fim)

    # Ordenar
    cashbacks = cashbacks.order_by('-data_geracao')

    # Preparar dados para o relatório
    dados = []
    total_gerado = 0
    total_utilizado = 0
    total_disponivel = 0

    for cb in cashbacks:
        # Verificar se está vencido
        vencido = cb.data_validade < timezone.now() if cb.data_validade else False

        # Status
        if cb.saldo == 0:
            status_cb = 'Totalmente Utilizado'
        elif vencido:
            status_cb = 'Expirado'
        elif cb.valor_utilizado > 0:
            status_cb = 'Parcialmente Utilizado'
        else:
            status_cb = 'Disponível'

        # Extrair nome sem CPF/CNPJ do início
        nome_completo = cb.id_cliente.nome_razao_social or ''
        # Remove CPF (xxx.xxx.xxx-xx) ou CNPJ (xx.xxx.xxx/xxxx-xx) do início
        nome_limpo = re.sub(r'^\d{2,3}\.\d{3}\.\d{3}[/-]\d{2,4}[-/]?\d{0,2}\s*', '', nome_completo).strip()
        
        dados.append({
            'id': cb.id_cashback,
            'cliente_id': cb.id_cliente.id_cliente,
            'cliente_nome': nome_limpo,
            'cliente_fantasia': cb.id_cliente.nome_fantasia or '',
            'valor_gerado': float(cb.valor_gerado),
            'valor_utilizado': float(cb.valor_utilizado),
            'saldo': float(cb.saldo),
            'data_geracao': cb.data_geracao.isoformat() if cb.data_geracao else None,
            'data_validade': cb.data_validade.isoformat() if cb.data_validade else None,
            'data_utilizacao': cb.data_utilizacao.isoformat() if cb.data_utilizacao else None,
            'percentual_origem': float(cb.percentual_origem) if cb.percentual_origem else 0,
            'ativo': cb.ativo,
            'vencido': vencido,
            'status': status_cb
        })

        total_gerado += float(cb.valor_gerado)
        total_utilizado += float(cb.valor_utilizado)
        total_disponivel += float(cb.saldo) if not vencido else 0

    return JsonResponse({
        'success': True,
        'dados': dados,
        'totais': {
            'total_gerado': round(total_gerado, 2),
            'total_utilizado': round(total_utilizado, 2),
            'total_disponivel': round(total_disponivel, 2),
            'quantidade': len(dados)
        }
    })