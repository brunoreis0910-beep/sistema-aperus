from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta
from django.db.models import Sum, F, Q, Avg, Count
from django.utils import timezone
import hashlib
from django.shortcuts import render
from django.http import Http404, HttpResponseForbidden

from api.models import FinanceiroConta, Estoque, Cashback, Cliente, VendaItem, Venda, Compra, Fornecedor, SaaSCliente, SaaSClienteContrato, EmpresaConfig
from api.models_pix import ConfiguracaoPix
from api.services.pix_service import PixService
from django.urls import reverse

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
            tipo_conta__iexact='receber',
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

        # 2. Contas a Pagar Vencidas
        pagar_vencidas = FinanceiroConta.objects.filter(
            tipo_conta='Pagar',
            status_conta='Pendente',
            data_vencimento__lt=hoje
        )
        if pagar_vencidas.exists():
            qtd = pagar_vencidas.count()
            total = pagar_vencidas.aggregate(sum=Sum('valor_parcela'))['sum'] or 0
            notificacoes.append({
                'id': _id,
                'type': 'error',
                'title': 'Contas a Pagar Vencidas',
                'message': f'⚠️ Atenção: Você tem {qtd} conta(s) a pagar vencida(s) (Total: R$ {total:,.2f}).',
                'icon': 'WarningAmber',
                'link': '/financeiro'
            })
            _id += 1

        # 2.5 Contas a Pagar Vencendo Hoje
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

        # 5. Contrato SaaS Pendente
        try:
            empresa = EmpresaConfig.objects.exclude(cpf_cnpj='').first() or EmpresaConfig.objects.first()
            if empresa and empresa.cpf_cnpj:
                import re
                cnpj_limpo = re.sub(r'\D', '', str(empresa.cpf_cnpj))
                
                # Certificar que a conexão com o banco central está configurada
                from django.conf import settings
                db_name = 'aperus_central'
                if db_name not in settings.DATABASES:
                    import copy
                    default_db = settings.DATABASES['default']
                    settings.DATABASES[db_name] = copy.deepcopy(default_db)
                    settings.DATABASES[db_name]['NAME'] = db_name
                
                # Buscar se há cliente com este CNPJ no banco central
                cliente_saas = SaaSCliente.objects.using(db_name).filter(cnpj=cnpj_limpo).first()
                if cliente_saas:
                    # Buscar se o ultimo contrato gerado esta pendente de assinatura
                    ultimo_contrato = SaaSClienteContrato.objects.using(db_name).filter(
                        saas_cliente=cliente_saas
                    ).order_by('-data_geracao').first()
                    
                    if ultimo_contrato and not ultimo_contrato.assinado:
                        notificacoes.append({
                            'id': _id,
                            'type': 'warning',
                            'title': 'Contrato Pendente',
                            'message': 'Você tem um contrato da Central SaaS pendente de assinatura.',
                            'icon': 'WarningAmber',
                            'link': '/saas-contrato-config'
                        })
                        _id += 1

                    # Buscar se ha mensalidades pendentes de pagamento
                    from api.models import SaaSClienteMensalidade
                    mensalidades_pendentes = SaaSClienteMensalidade.objects.using(db_name).filter(
                        saas_cliente=cliente_saas,
                        status_pagamento__in=['PENDENTE', 'VENCIDO']
                    ).order_by('data_vencimento')
                    
                    if mensalidades_pendentes.exists():
                        qtd = mensalidades_pendentes.count()
                        notificacoes.append({
                            'id': _id,
                            'type': 'error',
                            'title': 'Mensalidade em Aberto',
                            'message': f'Voce tem {qtd} mensalidade(s) da Central SaaS pendente(s) de pagamento.',
                            'icon': 'Payment',
                            'link': '/financeiro'
                        })
                        _id += 1
        except Exception as e:
            print(f"Erro ao buscar contrato pendente SaaS: {e}")
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
    Retorna detalhes de contas a receber vencidas agrupadas por cliente com produtos e documentos.
    
    POST /api/notificacoes/inadimplencia/
    Gera link de cobrança Pix dinâmico para uma parcela/conta específica.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            hoje = date.today()
            contas_vencidas = FinanceiroConta.objects.filter(
                tipo_conta__iexact='receber',
                status_conta='Pendente',
                data_vencimento__lt=hoje
            ).select_related('id_cliente_fornecedor').order_by('id_cliente_fornecedor', 'data_vencimento')

            # Buscar vendas de origem para obter os produtos comprados
            venda_ids = [c.id_venda_origem for c in contas_vencidas if c.id_venda_origem]
            vendas_map = {}
            if venda_ids:
                vendas_qs = Venda.objects.filter(id_venda__in=venda_ids).prefetch_related('itens__id_produto')
                for v in vendas_qs:
                    vendas_map[v.id_venda] = {
                        'documento': v.numero_documento or f"Venda #{v.id_venda}",
                        'produtos': [item.id_produto.descricao for item in v.itens.all() if item.id_produto]
                    }

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
                        'parcelas': [],
                        'link_fatura_unificada': ''
                    }
                
                dias_atraso = (hoje - conta.data_vencimento).days
                
                # Resgatar informações da venda associada (produtos e documento oficial)
                venda_info = vendas_map.get(conta.id_venda_origem, {}) if conta.id_venda_origem else {}
                doc_num = conta.documento_numero or venda_info.get('documento') or f"Lançamento #{conta.id_conta}"
                prods = venda_info.get('produtos', [])

                token_fatura = hashlib.md5(f"aperus_fatura_{conta.id_conta}".encode()).hexdigest()[:10]
                url_path = reverse('fatura-publica', args=[conta.id_conta, token_fatura])
                link_fatura = request.build_absolute_uri(url_path)

                clientes_dict[id_cli]['total_devido'] += float(conta.valor_parcela or 0)
                clientes_dict[id_cli]['parcelas'].append({
                    'id_conta': conta.id_conta,
                    'descricao': conta.descricao,
                    'valor': float(conta.valor_parcela or 0),
                    'data_vencimento': conta.data_vencimento.isoformat(),
                    'dias_atraso': dias_atraso,
                    'parcela': f"{conta.parcela_numero or 1}/{conta.parcela_total or 1}",
                    'documento': doc_num,
                    'produtos': prods,
                    'link_fatura': link_fatura
                })

            for client_id, cdata in clientes_dict.items():
                if cdata['parcelas']:
                    ids_list = [str(p['id_conta']) for p in cdata['parcelas']]
                    ids_str = ",".join(ids_list)
                    token_unificada = hashlib.md5(f"aperus_unificada_{ids_str}".encode()).hexdigest()[:10]
                    url_path_unif = reverse('fatura-unificada') + f"?ids={ids_str}&token={token_unificada}"
                    cdata['link_fatura_unificada'] = request.build_absolute_uri(url_path_unif)

            resultado = sorted(clientes_dict.values(), key=lambda x: x['total_devido'], reverse=True)
            return Response(resultado)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    def post(self, request):
        try:
            id_conta = request.data.get('id_conta')
            if not id_conta:
                return Response({'error': 'ID da conta não informado.'}, status=400)
            
            try:
                conta = FinanceiroConta.objects.get(pk=id_conta)
            except FinanceiroConta.DoesNotExist:
                return Response({'error': 'Conta não encontrada.'}, status=404)
            
            # Buscar configuração Pix ativa
            config = ConfiguracaoPix.objects.filter(ativo=True).first()
            if not config:
                return Response({'error': 'Nenhuma configuração Pix ativa encontrada no sistema.'}, status=400)
            
            # Gerar via PixService
            svc = PixService(config)
            cliente = conta.id_cliente_fornecedor
            nome_pagador = cliente.nome_razao_social if cliente else 'Cliente Aperus'
            cpf_cnpj_pagador = cliente.cpf_cnpj if cliente else ''
            
            cobranca = svc.gerar(
                valor=conta.valor_parcela,
                descricao=f"Pgto {conta.descricao[:50]}",
                nome_pagador=nome_pagador,
                cpf_cnpj_pagador=cpf_cnpj_pagador,
                id_cliente=cliente.id_cliente if cliente else None,
                id_venda=conta.id_venda_origem,
                expiracao_segundos=86400 * 7, # Vencimento em 7 dias
            )
            
            return Response({
                'sucesso': True,
                'copia_e_cola': cobranca.qr_code_payload,
                'status': cobranca.status
            })
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


def visualizar_fatura_publica(request, pk, token):
    # Validar token de segurança
    expected_token = hashlib.md5(f"aperus_fatura_{pk}".encode()).hexdigest()[:10]
    if token != expected_token:
        return HttpResponseForbidden("Link de cobrança inválido ou expirado.")
    
    try:
        conta = FinanceiroConta.objects.get(pk=pk)
    except FinanceiroConta.DoesNotExist:
        raise Http404("Fatura não encontrada.")
    
    # Detalhes da venda de origem
    venda = None
    produtos = []
    if conta.id_venda_origem:
        try:
            venda = Venda.objects.prefetch_related('itens__id_produto').get(pk=conta.id_venda_origem)
            produtos = [
                {
                    'descricao': item.id_produto.descricao,
                    'quantidade': float(item.quantidade),
                    'valor_unitario': float(item.valor_unitario),
                    'valor_total': float(item.quantidade * item.valor_unitario)
                }
                for item in venda.itens.all() if item.id_produto
            ]
        except Venda.DoesNotExist:
            pass

    # Empresa Config
    empresa = EmpresaConfig.objects.first()
    
    # Tentar obter ou gerar Pix dinâmico
    copia_e_cola = ""
    qr_code_base64 = ""
    chave_manual = ""
    
    config = ConfiguracaoPix.objects.filter(ativo=True).first()
    if config:
        if config.psp == 'MANUAL':
            chave_manual = config.chave_pix
        else:
            try:
                # Verificar se já existe uma cobrança Pix recente gerada para esta venda/cliente
                cobranca = CobrancaPix.objects.filter(
                    id_venda=conta.id_venda_origem,
                    valor=conta.valor_parcela,
                    status='ATIVA'
                ).first()
                
                if not cobranca:
                    svc = PixService(config)
                    cliente = conta.id_cliente_fornecedor
                    nome_pagador = cliente.nome_razao_social if cliente else 'Cliente Aperus'
                    cpf_cnpj_pagador = cliente.cpf_cnpj if cliente else ''
                    
                    cobranca = svc.gerar(
                        valor=conta.valor_parcela,
                        descricao=f"Pgto {conta.descricao[:50]}",
                        nome_pagador=nome_pagador,
                        cpf_cnpj_pagador=cpf_cnpj_pagador,
                        id_cliente=cliente.id_cliente if cliente else None,
                        id_venda=conta.id_venda_origem,
                        expiracao_segundos=86400 * 7,
                    )
                
                copia_e_cola = cobranca.qr_code_payload
                qr_code_base64 = cobranca.qr_code_imagem_base64
            except Exception as e:
                print(f"Erro ao obter/gerar Pix dinamico: {e}")
                # Fallback para chave manual se houver erro ou manual configurada
                chave_manual = config.chave_pix

    context = {
        'conta': conta,
        'venda': venda,
        'produtos': produtos,
        'empresa': empresa,
        'copia_e_cola': copia_e_cola,
        'qr_code_base64': qr_code_base64,
        'chave_manual': chave_manual,
        'hoje': date.today(),
    }
    return render(request, 'api/fatura_publica.html', context)


def visualizar_fatura_unificada(request):
    ids_str = request.GET.get('ids', '')
    token = request.GET.get('token', '')
    
    if not ids_str or not token:
        return HttpResponseForbidden("Link de cobrança incompleto.")
        
    # Validar token
    expected_token = hashlib.md5(f"aperus_unificada_{ids_str}".encode()).hexdigest()[:10]
    if token != expected_token:
        return HttpResponseForbidden("Link de cobrança inválido ou expirado.")
        
    try:
        id_list = [int(x) for x in ids_str.split(',') if x.strip().isdigit()]
    except ValueError:
        return HttpResponseForbidden("Lista de faturas inválida.")
        
    contas = FinanceiroConta.objects.filter(pk__in=id_list).select_related('id_cliente_fornecedor')
    if not contas.exists():
        raise Http404("Faturas não encontradas.")
        
    total_devido = sum(float(c.valor_parcela) for c in contas)
    
    # Detalhes das vendas de origem
    venda_ids = [c.id_venda_origem for c in contas if c.id_venda_origem]
    vendas_map = {}
    if venda_ids:
        try:
            vendas_qs = Venda.objects.prefetch_related('itens__id_produto').filter(id_venda__in=venda_ids)
            for v in vendas_qs:
                vendas_map[v.id_venda] = {
                    'documento': v.numero_documento or f"Venda #{v.id_venda}",
                    'produtos': [
                        {
                            'descricao': item.id_produto.descricao,
                            'quantidade': float(item.quantidade),
                            'valor_unitario': float(item.valor_unitario),
                            'valor_total': float(item.quantidade * item.valor_unitario)
                        }
                        for item in v.itens.all() if item.id_produto
                    ]
                }
        except Exception:
            pass

    detalhes_contas = []
    for conta in contas:
        venda_info = vendas_map.get(conta.id_venda_origem, {}) if conta.id_venda_origem else {}
        doc_num = conta.documento_numero or venda_info.get('documento') or f"Lançamento #{conta.id_conta}"
        prods = venda_info.get('produtos', [])
        detalhes_contas.append({
            'conta': conta,
            'documento': doc_num,
            'produtos': prods,
            'valor': float(conta.valor_parcela),
            'vencimento': conta.data_vencimento
        })

    # Empresa Config
    empresa = EmpresaConfig.objects.first()
    
    # Tentar obter ou gerar Pix dinâmico para o valor total
    copia_e_cola = ""
    qr_code_base64 = ""
    chave_manual = ""
    
    config = ConfiguracaoPix.objects.filter(ativo=True).first()
    if config:
        if config.psp == 'MANUAL':
            chave_manual = config.chave_pix
        else:
            try:
                svc = PixService(config)
                cliente = contas.first().id_cliente_fornecedor
                nome_pagador = cliente.nome_razao_social if cliente else 'Cliente Aperus'
                cpf_cnpj_pagador = cliente.cpf_cnpj if cliente else ''
                
                cobranca = svc.gerar(
                    valor=total_devido,
                    descricao=f"Pgto Unificado Aperus faturas",
                    nome_pagador=nome_pagador,
                    cpf_cnpj_pagador=cpf_cnpj_pagador,
                    id_cliente=cliente.id_cliente if cliente else None,
                    id_venda=None,
                    expiracao_segundos=86400 * 7,
                )
                
                copia_e_cola = cobranca.qr_code_payload
                qr_code_base64 = cobranca.qr_code_imagem_base64
            except Exception as e:
                print(f"Erro ao obter/gerar Pix dinamico unificado: {e}")
                chave_manual = config.chave_pix

    context = {
        'contas_detalhadas': detalhes_contas,
        'total_devido': round(total_devido, 2),
        'empresa': empresa,
        'copia_e_cola': copia_e_cola,
        'qr_code_base64': qr_code_base64,
        'chave_manual': chave_manual,
        'cliente': contas.first().id_cliente_fornecedor,
        'hoje': date.today(),
    }
    return render(request, 'api/fatura_unificada.html', context)

