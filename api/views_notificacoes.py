from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta
from django.db.models import Sum, F, Q, Avg, Count
from django.utils import timezone

from api.models import FinanceiroConta, Estoque, Cashback, Cliente, VendaItem, Compra, Fornecedor

class NotificacoesIniciaisView(APIView):
    def get(self, request):
        hoje = date.today()
        notificacoes = []
        _id = 1

        # 0. Aniversariantes do Dia
        try:
            aniversariantes = Cliente.objects.filter(
                data_nascimento__day=hoje.day,
                data_nascimento__month=hoje.month
            )
            if aniversariantes.exists():
                qtd = aniversariantes.count()
                
                # Mensagem personalizada
                if qtd == 1:
                    nome = aniversariantes.first().nome_razao_social
                    msg = f'Hoje e o aniversario de {nome}. De os parabens!'
                else:
                    msg = f'{qtd} clientes estao fazendo aniversario hoje! Nao esqueca de parabeniza-los.'

                notificacoes.append({
                    'id': _id,
                    'type': 'info',
                    'title': 'Aniversariantes',
                    'message': msg,
                    'icon': 'Cake',
                    'link': '/clientes'
                })
                _id += 1
        except Exception as e:
            print(f"Erro ao buscar aniversariantes: {e}")
            pass

        # 1. Contas a Receber Vencidas
        receber_vencidas = FinanceiroConta.objects.filter(
            tipo_conta='Receber',
            status_conta='Pendente',
            data_vencimento__lt=hoje
        )
        if receber_vencidas.exists():
            qtd = receber_vencidas.count()
            total = receber_vencidas.aggregate(sum=Sum('valor_parcela'))['sum'] or 0
            notificacoes.append({
                'id': _id,
                'type': 'error',
                'title': 'Inadimplencia',
                'message': f'Voce tem {qtd} contas a receber vencidas (Total: R$ {total:,.2f}).',
                'icon': 'MoneyOff',
                'link': '/financeiro'
            })
            _id += 1

        # 2. Contas a Pagar Vencendo Hoje
        pagar_hoje = FinanceiroConta.objects.filter(
            tipo_conta='Pagar',
            status_conta='Pendente',
            data_vencimento=hoje
        )
        if pagar_hoje.exists():
            qtd = pagar_hoje.count()
            total = pagar_hoje.aggregate(sum=Sum('valor_parcela'))['sum'] or 0
            notificacoes.append({
                'id': _id,
                'type': 'warning',
                'title': 'Vencimentos Hoje',
                'message': f'Voce tem {qtd} contas a pagar hoje no valor de R$ {total:,.2f}.',
                'icon': 'EventBusy',
                'link': '/financeiro'
            })
            _id += 1
            
        # 3. Ruptura de Estoque
        try:
            estoque_baixo = Estoque.objects.filter(
                Q(quantidade__lte=F('quantidade_minima')) | Q(quantidade__lte=5, quantidade_minima=0)
            ).filter(ativo=True)
            if estoque_baixo.exists():
                qtd = estoque_baixo.count()
                notificacoes.append({
                    'id': _id,
                    'type': 'info',
                    'title': 'Estoque Critico',
                    'message': f'Atencao: {qtd} produtos estao com 5 ou menos unidades em estoque.',
                    'icon': 'Inventory',
                    'link': '/produtos'
                })
                _id += 1
        except Exception:
            pass

        # 4. Cashback Prestes a Vencer
        try:
            agora = timezone.now()
            daqui_7_dias = agora + timedelta(days=7)
            
            # Buscar cashbacks ativos que vencem nos próximos 7 dias
            cashbacks_vencendo = Cashback.objects.filter(
                ativo=True,
                saldo__gt=0,
                data_validade__gte=agora,
                data_validade__lte=daqui_7_dias
            )
            
            if cashbacks_vencendo.exists():
                qtd = cashbacks_vencendo.count()
                total = cashbacks_vencendo.aggregate(sum=Sum('saldo'))['sum'] or 0
                notificacoes.append({
                    'id': _id,
                    'type': 'warning',
                    'title': 'Cashback Vencendo',
                    'message': f'{qtd} cashback(s) prestes a vencer nos proximos 7 dias (Total: R$ {total:,.2f}). Avise os clientes!',
                    'icon': 'LocalOffer',
                    'link': '/relatorios/cashback'
                })
                _id += 1
        except Exception as e:
            print(f"Erro ao buscar cashbacks vencendo: {e}")
            pass

        return Response(notificacoes)


class CashbacksVencendoView(APIView):
    """
    GET /api/notificacoes/cashbacks-vencendo/
    Retorna detalhes dos cashbacks que estão vencendo nos próximos 7 dias
    com informações do cliente para envio de WhatsApp
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            agora = timezone.now()
            daqui_7_dias = agora + timedelta(days=7)
            
            # Buscar cashbacks ativos que vencem nos próximos 7 dias
            cashbacks_vencendo = Cashback.objects.filter(
                ativo=True,
                saldo__gt=0,
                data_validade__gte=agora,
                data_validade__lte=daqui_7_dias
            ).select_related('id_cliente').order_by('data_validade')
            
            # Montar lista com dados do cliente
            cashbacks_lista = []
            for cashback in cashbacks_vencendo:
                cliente = cashback.id_cliente
                cashbacks_lista.append({
                    'id_cashback': cashback.id_cashback,
                    'id_cliente': cliente.id_cliente if cliente else None,
                    'nome_cliente': cliente.nome_razao_social if cliente else 'Cliente não identificado',
                    'whatsapp_cliente': cliente.whatsapp if cliente and hasattr(cliente, 'whatsapp') else '',
                    'telefone_cliente': cliente.telefone if cliente else '',
                    'saldo': float(cashback.saldo),
                    'valor_gerado': float(cashback.valor_gerado),
                    'data_geracao': cashback.data_geracao.isoformat() if cashback.data_geracao else None,
                    'data_validade': cashback.data_validade.isoformat() if cashback.data_validade else None,
                })
            
            return Response(cashbacks_lista)
            
        except Exception as e:
            print(f"Erro ao buscar cashbacks vencendo: {e}")
            return Response(
                {'error': str(e)},
                status=500
            )


class InadimplenciaDetalhadaView(APIView):
    """
    GET /api/notificacoes/inadimplencia/
    Retorna detalhes de contas a receber vencidas agrupadas por cliente
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            hoje = date.today()
            contas_vencidas = FinanceiroConta.objects.filter(
                tipo_conta='Receber',
                status_conta='Pendente',
                data_vencimento__lt=hoje
            ).select_related('id_cliente_fornecedor').order_by('id_cliente_fornecedor', 'data_vencimento')

            # Agrupar por cliente
            clientes_dict = {}
            for conta in contas_vencidas:
                cliente = conta.id_cliente_fornecedor
                id_cli = cliente.id_cliente if cliente else 0
                if id_cli not in clientes_dict:
                    clientes_dict[id_cli] = {
                        'id_cliente': id_cli,
                        'nome_cliente': cliente.nome_razao_social if cliente else 'Sem cliente',
                        'whatsapp': cliente.whatsapp if cliente else '',
                        'telefone': cliente.telefone if cliente else '',
                        'total_devido': 0,
                        'parcelas': []
                    }
                dias_atraso = (hoje - conta.data_vencimento).days
                clientes_dict[id_cli]['total_devido'] += float(conta.valor_parcela or 0)
                clientes_dict[id_cli]['parcelas'].append({
                    'id_conta': conta.id_conta,
                    'descricao': conta.descricao,
                    'valor': float(conta.valor_parcela or 0),
                    'data_vencimento': conta.data_vencimento.isoformat(),
                    'dias_atraso': dias_atraso,
                    'parcela': f"{conta.parcela_numero or 1}/{conta.parcela_total or 1}",
                    'documento': conta.documento_numero or '',
                })

            resultado = sorted(clientes_dict.values(), key=lambda x: x['total_devido'], reverse=True)
            return Response(resultado)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class EstoqueCriticoDetalhadoView(APIView):
    """
    GET /api/notificacoes/estoque-critico/
    Retorna produtos com estoque crítico, quantidade vendida nos últimos 30/60/90 dias
    e sugestão de compra
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            hoje = date.today()
            ultimos_30 = hoje - timedelta(days=30)
            ultimos_90 = hoje - timedelta(days=90)

            # Buscar estoque crítico
            estoque_critico = Estoque.objects.filter(
                Q(quantidade__lte=F('quantidade_minima')) | Q(quantidade__lte=5, quantidade_minima=0)
            ).filter(ativo=True).select_related('id_produto', 'id_deposito')

            resultado = []
            for est in estoque_critico:
                produto = est.id_produto
                if not produto:
                    continue

                # Vendas dos últimos 30 dias
                vendas_30 = VendaItem.objects.filter(
                    id_produto=produto,
                    id_venda__data_documento__gte=ultimos_30
                ).aggregate(
                    total_qtd=Sum('quantidade'),
                    total_vendas=Count('id_item')
                )

                # Vendas dos últimos 90 dias
                vendas_90 = VendaItem.objects.filter(
                    id_produto=produto,
                    id_venda__data_documento__gte=ultimos_90
                ).aggregate(
                    total_qtd=Sum('quantidade')
                )

                qtd_vendida_30 = float(vendas_30['total_qtd'] or 0)
                qtd_vendida_90 = float(vendas_90['total_qtd'] or 0)
                media_mensal = qtd_vendida_90 / 3 if qtd_vendida_90 > 0 else qtd_vendida_30

                # Sugestão de compra: média mensal * 2 - estoque atual
                estoque_atual = float(est.quantidade or 0)
                sugestao_compra = max(0, (media_mensal * 2) - estoque_atual)

                # Buscar último fornecedor (pela última compra)
                ultima_compra = Compra.objects.filter(
                    itens__id_produto=produto
                ).select_related('id_fornecedor').order_by('-data_documento').first()

                fornecedor_info = None
                if ultima_compra and ultima_compra.id_fornecedor:
                    forn = ultima_compra.id_fornecedor
                    fornecedor_info = {
                        'id': forn.id_fornecedor,
                        'nome': forn.nome_razao_social,
                        'email': forn.email or '',
                        'whatsapp': forn.whatsapp or '',
                        'telefone': forn.telefone or '',
                    }

                resultado.append({
                    'id_produto': produto.id_produto,
                    'codigo_produto': produto.codigo_produto,
                    'nome_produto': produto.nome_produto or produto.descricao or '',
                    'deposito': est.id_deposito.nome_deposito if est.id_deposito else '',
                    'estoque_atual': estoque_atual,
                    'estoque_minimo': float(est.quantidade_minima or 0),
                    'vendas_30_dias': qtd_vendida_30,
                    'vendas_90_dias': qtd_vendida_90,
                    'media_mensal': round(media_mensal, 2),
                    'sugestao_compra': round(sugestao_compra, 2),
                    'custo_medio': float(est.custo_medio or 0),
                    'valor_venda': float(est.valor_venda or 0),
                    'fornecedor': fornecedor_info,
                })

            resultado.sort(key=lambda x: x['estoque_atual'])
            return Response(resultado)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)


class FornecedoresEstoqueCriticoView(APIView):
    """
    GET /api/notificacoes/fornecedores-estoque-critico/
    Agrupa os produtos com estoque crítico por fornecedor para cotação
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            hoje = date.today()
            ultimos_90 = hoje - timedelta(days=90)

            # Buscar estoque crítico
            estoque_critico = Estoque.objects.filter(
                Q(quantidade__lte=F('quantidade_minima')) | Q(quantidade__lte=5, quantidade_minima=0)
            ).filter(ativo=True).select_related('id_produto')

            fornecedores_dict = {}
            sem_fornecedor = []

            for est in estoque_critico:
                produto = est.id_produto
                if not produto:
                    continue

                # Média mensal de vendas
                vendas_90 = VendaItem.objects.filter(
                    id_produto=produto,
                    id_venda__data_documento__gte=ultimos_90
                ).aggregate(total_qtd=Sum('quantidade'))
                media_mensal = float(vendas_90['total_qtd'] or 0) / 3
                estoque_atual = float(est.quantidade or 0)
                sugestao = max(0, (media_mensal * 2) - estoque_atual)

                item_info = {
                    'id_produto': produto.id_produto,
                    'codigo_produto': produto.codigo_produto,
                    'nome_produto': produto.nome_produto or produto.descricao or '',
                    'estoque_atual': estoque_atual,
                    'sugestao_compra': round(sugestao, 2),
                    'media_mensal': round(media_mensal, 2),
                    'custo_medio': float(est.custo_medio or 0),
                }

                # Buscar fornecedor da última compra
                ultima_compra = Compra.objects.filter(
                    itens__id_produto=produto
                ).select_related('id_fornecedor').order_by('-data_documento').first()

                if ultima_compra and ultima_compra.id_fornecedor:
                    forn = ultima_compra.id_fornecedor
                    forn_id = forn.id_fornecedor
                    if forn_id not in fornecedores_dict:
                        fornecedores_dict[forn_id] = {
                            'id_fornecedor': forn_id,
                            'nome': forn.nome_razao_social,
                            'email': forn.email or '',
                            'whatsapp': forn.whatsapp or '',
                            'telefone': forn.telefone or '',
                            'produtos': [],
                            'valor_estimado': 0,
                        }
                    fornecedores_dict[forn_id]['produtos'].append(item_info)
                    fornecedores_dict[forn_id]['valor_estimado'] += round(sugestao * float(est.custo_medio or 0), 2)
                else:
                    sem_fornecedor.append(item_info)

            resultado = {
                'fornecedores': sorted(fornecedores_dict.values(), key=lambda x: len(x['produtos']), reverse=True),
                'sem_fornecedor': sem_fornecedor,
            }
            return Response(resultado)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

