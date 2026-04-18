from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ControleCaixa, Venda, MovimentacaoCaixa, FinanceiroConta, UserParametros
from datetime import datetime
from django.utils import timezone
from django.db.models import Sum
from api.utils.caixa_utils import get_operador_pdv, get_operador_venda

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_caixa(request):
    """
    Verifica se o usuário tem um caixa aberto.
    """
    # Tenta obter o operador configurado (ex: Vendedor vinculado)
    operador_pdv = get_operador_pdv(request.user)
    
    # Verifica caixa aberto para o operador PDV
    caixa = ControleCaixa.objects.filter(operador=operador_pdv, status='ABERTO').first()
    
    # FALLBACK: Se não achou pro operador PDV, verifica pro próprio usuário logado
    # Isso resolve casos onde o caixa foi aberto sem o vinculo de vendedor ou com usuário diferente
    if not caixa and operador_pdv != request.user:
         caixa = ControleCaixa.objects.filter(operador=request.user, status='ABERTO').first()
    
    # 1. Obter operação do usuário para filtrar vendas corretamente
    id_operacao = None
    try:
        if hasattr(request.user, 'parametros'):
            # Prioridade: NFCe > Venda > Padrão
            id_operacao = request.user.parametros.id_operacao_nfce_id or \
                          request.user.parametros.id_operacao_venda_id or \
                          request.user.parametros.id_operacao_padrao_id
    except:
        pass

    # Verifica caixa aberto para o usuário
    # Se já encontrou no inicio da funcao, usa ele. Senao tenta de novo com filtros basicos
    if not caixa:
         caixa = ControleCaixa.objects.filter(operador=operador_pdv, status='ABERTO').first()
    
    if caixa:
        # Calcular total de vendas do caixa (vendas realizadas após abertura pelo usuário)
        # Usando criado_por e data_documento que são os campos reais do modelo Venda
        filters = {
            'criado_por': caixa.operador, # Usar operador do CAIXA encontrado, não o request.user
            'data_documento__gte': caixa.data_abertura
        }
        
        # Se tiver operação definida, filtra também por ela
        if id_operacao:
            filters['id_operacao_id'] = id_operacao

        vendas_qs = Venda.objects.filter(**filters)
        total_vendas = vendas_qs.aggregate(Sum('valor_total'))['valor_total__sum'] or 0.00

        # -- Calcular total de entradas REAIS no caixa (excluindo a prazo/boleto/crediário) --
        try:
            from django.db.models import Q
            venda_ids = vendas_qs.values_list('id_venda', flat=True)
            
            # Filtra contas financeiras dessas vendas que NÃO sejam a prazo
            termos_prazo = ['prazo', 'credi', 'boleto', 'duplicata', 'faturado']
            q_exclude = Q()
            for termo in termos_prazo:
                q_exclude |= Q(forma_pagamento__icontains=termo)
            
            contas_entrada = FinanceiroConta.objects.filter(id_venda_origem__in=venda_ids).exclude(q_exclude)
            
            # Soma valor_parcela (valor original) + juros (se houver) - desconto (se houver na conta)
            # Simplificando: somamos o valor da parcela que representa o recebimento
            total_entradas = contas_entrada.aggregate(Sum('valor_parcela'))['valor_parcela__sum'] or 0.00
            
            # Adiciona juros se houver
            total_juros = contas_entrada.aggregate(Sum('valor_juros'))['valor_juros__sum'] or 0.00
            total_entradas += total_juros
        except Exception as e:
            print(f"Erro ao calcular entradas reais: {e}")
            total_entradas = total_vendas # Fallback
            
        # Calcular suprimentos e sangrias
        # MovimentacaoCaixa deve ser importado
        try:
            total_suprimentos = MovimentacaoCaixa.objects.filter(
                caixa=caixa, tipo='SUPRIMENTO'
            ).aggregate(Sum('valor'))['valor__sum'] or 0.00
            
            total_sangrias = MovimentacaoCaixa.objects.filter(
                caixa=caixa, tipo='SANGRIA'
            ).aggregate(Sum('valor'))['valor__sum'] or 0.00
        except Exception as e:
            # Fallback caso a tabela ainda não tenha migrado corretamente ou erro de query
            total_suprimentos = 0.00
            total_sangrias = 0.00

        return Response({
            'status': 'ABERTO',
            'id_caixa': caixa.id_caixa,
            'data_abertura': caixa.data_abertura,
            'valor_abertura': caixa.valor_abertura,
            'total_vendas_sessao': total_vendas,
            'total_entradas_sessao': total_entradas, # Novo campo com entradas reais
            'total_suprimentos': total_suprimentos,
            'total_sangrias': total_sangrias
        })
    
    return Response({'status': 'FECHADO'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def abrir_caixa(request):
    """
    Abre um novo caixa para o usuário.
    Se já estiver aberto, retorna sucesso (200) mantendo o atual, em vez de erro (400).
    """
    operador = get_operador_pdv(request.user)

    caixa_existente = ControleCaixa.objects.filter(operador=operador, status='ABERTO').first()
    if caixa_existente:
        # Modificação solicitada: Se já estiver aberto, não retornar erro, mas sim sucesso informando que manteve o anterior.
        return Response({
            'message': 'Caixa já esta aberto. Mantendo sessão anterior.',
            'id_caixa': caixa_existente.id_caixa,
            'status': 'ABERTO',
            'data_abertura': caixa_existente.data_abertura
        }, status=status.HTTP_200_OK)

    try:
        valor_abertura = float(request.data.get('valor_abertura', 0.00))
    except (ValueError, TypeError):
        valor_abertura = 0.00
    
    caixa = ControleCaixa.objects.create(
        operador=operador,
        valor_abertura=valor_abertura,
        status='ABERTO',
        data_abertura=timezone.now()
    )
    
    return Response({
        'message': 'Caixa aberto com sucesso!',
        'id_caixa': caixa.id_caixa
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_movimentacao(request):
    """
    Registra suprimento ou sangria.
    Payload: { "tipo": "SUPRIMENTO" | "SANGRIA", "valor": 100.00, "observacao": "..." }
    """
    operador = get_operador_pdv(request.user)

    caixa = ControleCaixa.objects.filter(operador=operador, status='ABERTO').first()
    if not caixa:
        return Response({'error': 'Não há caixa aberto.'}, status=status.HTTP_400_BAD_REQUEST)

    tipo = request.data.get('tipo', '').upper()
    if tipo not in ['SUPRIMENTO', 'SANGRIA']:
        return Response({'error': 'Tipo inválido. Use SUPRIMENTO ou SANGRIA.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        valor = float(request.data.get('valor', 0.00))
        if valor <= 0:
            return Response({'error': 'Valor deve ser positivo.'}, status=status.HTTP_400_BAD_REQUEST)
    except:
        return Response({'error': 'Valor inválido.'}, status=status.HTTP_400_BAD_REQUEST)
    
    observacao = request.data.get('observacao', '')
    
    mov = MovimentacaoCaixa.objects.create(
        caixa=caixa,
        tipo=tipo,
        valor=valor,
        observacao=observacao,
        usuario=request.user, # Aqui mantemos o request.user para saber QUEM fez a movimentação (auditoria), mas o caixa é do operador
        data_movimentacao=timezone.now()
    )
    
    return Response({
        'message': f'{tipo} registrado com sucesso!',
        'id_movimentacao': mov.id_movimentacao,
        'valor': mov.valor
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fechar_caixa(request):
    """
    Fecha o caixa atual do usuário e retorna relatório.
    """
    operador = get_operador_pdv(request.user)

    caixa = ControleCaixa.objects.filter(operador=operador, status='ABERTO').first()
    if not caixa:
        return Response({'error': 'Não há caixa aberto para este usuário.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        valor_fechamento = float(request.data.get('valor_fechamento', 0.00))
    except (ValueError, TypeError):
        valor_fechamento = 0.00

    observacoes = request.data.get('observacoes', '')

    data_fechamento = timezone.now()

    # Calcular relatório antes de fechar para garantir consistência

    # 1. Filtros de Vendas (considerando operação do usuário)
    id_operacao = None
    try:
        if hasattr(request.user, 'parametros'):
             id_operacao = request.user.parametros.id_operacao_nfce_id or \
                           request.user.parametros.id_operacao_venda_id or \
                           request.user.parametros.id_operacao_padrao_id
    except:
        pass
    
    filters = {
        'criado_por': operador,
        'data_documento__gte': caixa.data_abertura,
        'data_documento__lte': data_fechamento
    }
    if id_operacao:
        filters['id_operacao_id'] = id_operacao

    # 1. Total de Vendas
    vendas = Venda.objects.filter(**filters)
    
    total_vendas = vendas.aggregate(Sum('valor_total'))['valor_total__sum'] or 0.00
    
    # 2. Vendas por forma de pagamento
    # Busca contas financeiras ligadas a estas vendas
    venda_ids = vendas.values_list('id_venda', flat=True)
    contas = FinanceiroConta.objects.filter(id_venda_origem__in=venda_ids)
    
    # Agrupamento manual para evitar problemas de compatibilidade ORM/DB
    resumo_pagamentos = {}
    for conta in contas:
        forma = conta.forma_pagamento or 'Não Informado'
        valor = float(conta.valor_juros or 0) + float(conta.valor_parcela) # Valor total da parcela
        # Note: valor_parcela geralmente é o valor principal. valor_liquidado é o pago.
        # Considerando venda, usamos o valor da parcela (previsto/realizado).
        
        if forma not in resumo_pagamentos:
            resumo_pagamentos[forma] = 0.0
        resumo_pagamentos[forma] += valor
        
    lista_pagamentos = [
        {'forma': k, 'valor': v} for k, v in resumo_pagamentos.items()
    ]

    # 3. Movimentações
    movs = MovimentacaoCaixa.objects.filter(caixa=caixa)
    total_suprimentos = movs.filter(tipo='SUPRIMENTO').aggregate(Sum('valor'))['valor__sum'] or 0.00
    total_sangrias = movs.filter(tipo='SANGRIA').aggregate(Sum('valor'))['valor__sum'] or 0.00

    # 4. Saldo Teórico (Abertura + Vendas + Suprimentos - Sangrias)
    # Nota: Vendas aqui é total bruto. Se houver devoluções ou cancelamentos isso deve ser tratado.
    # Assumindo Venda válida. 
    # Importante: Se 'total_vendas' incluir vendas a prazo/crediário, elas entram no saldo do caixa?
    # Para controle financeiro de caixa (conferência), somente 'Dinheiro' ou 'Cheque' (físicos) deveria contar.
    # Mas o requisito pede "todas as vendas". O operador fará a conferência.
    saldo_teorico = float(caixa.valor_abertura) + float(total_vendas) + float(total_suprimentos) - float(total_sangrias)
    diferenca = valor_fechamento - saldo_teorico

    # Atualizar dados do caixa e fechar
    caixa.status = 'FECHADO'
    caixa.data_fechamento = data_fechamento
    caixa.valor_fechamento = valor_fechamento
    caixa.observacoes = observacoes
    caixa.save()

    relatorio = gerar_relatorio_fechamento(caixa)

    return Response({
        'message': 'Caixa fechado com sucesso!',
        'id_caixa': caixa.id_caixa,
        'relatorio': relatorio
    }, status=status.HTTP_200_OK)

def gerar_relatorio_fechamento(caixa):
    """
    Gera o dicionário de dados para o relatório de fechamento de caixa.
    Reutilizável para reimpressão.
    """
    data_fechamento = caixa.data_fechamento or timezone.now()
    
    # 1. Filtros de Vendas (considerando operação do usuário)
    # Precisamos obter a operação do usuário dono do caixa (operador)
    operador = caixa.operador
    id_operacao = None
    try:
        # Tenta pegar parametros do operador
        param = UserParametros.objects.filter(id_user=operador).first()
        if param:
             id_operacao = param.id_operacao_nfce_id or \
                           param.id_operacao_venda_id or \
                           param.id_operacao_padrao_id
    except:
        pass
    
    filters = {
        'criado_por': operador,
        'data_documento__gte': caixa.data_abertura,
        # Se o caixa está fechado, usa a data de fechamento real, senão usa agora
        'data_documento__lte': data_fechamento
    }
    if id_operacao:
        filters['id_operacao_id'] = id_operacao

    # 1. Total de Vendas
    vendas = Venda.objects.filter(**filters)
    total_vendas = vendas.aggregate(Sum('valor_total'))['valor_total__sum'] or 0.00
    
    # 2. Vendas por forma de pagamento
    venda_ids = vendas.values_list('id_venda', flat=True)
    contas = FinanceiroConta.objects.filter(id_venda_origem__in=venda_ids)
    
    resumo_pagamentos = {}
    for conta in contas:
        forma = conta.forma_pagamento or 'Não Informado'
        val = float(conta.valor_juros or 0) + float(conta.valor_parcela) 
        if forma not in resumo_pagamentos:
            resumo_pagamentos[forma] = 0.0
        resumo_pagamentos[forma] += val
        
    lista_pagamentos = [
        {'forma': k, 'valor': v} for k, v in resumo_pagamentos.items()
    ]

    # 3. Movimentações
    movs = MovimentacaoCaixa.objects.filter(caixa=caixa)
    total_suprimentos = movs.filter(tipo='SUPRIMENTO').aggregate(Sum('valor'))['valor__sum'] or 0.00
    total_sangrias = movs.filter(tipo='SANGRIA').aggregate(Sum('valor'))['valor__sum'] or 0.00

    saldo_teorico = float(caixa.valor_abertura) + float(total_vendas) + float(total_suprimentos) - float(total_sangrias)
    
    valor_fechamento = float(caixa.valor_fechamento or 0.0)
    diferenca = valor_fechamento - saldo_teorico

    return {
        'id_caixa': caixa.id_caixa,
        'operador': caixa.operador.username if caixa.operador else 'Sistema',
        'status': caixa.status,
        'data_abertura': caixa.data_abertura,
        'data_fechamento': data_fechamento,
        'valor_abertura': float(caixa.valor_abertura),
        'total_vendas': float(total_vendas),
        'total_suprimentos': float(total_suprimentos),
        'total_sangrias': float(total_sangrias),
        'saldo_final_teorico': saldo_teorico,
        'saldo_final_informado': valor_fechamento,
        'diferenca': diferenca,
        'detalhe_pagamentos': lista_pagamentos,
        'observacoes': caixa.observacoes
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_fechamentos(request):
    """
    Lista os fechamentos de caixa do usuário logado.
    Opcional: ?data=YYYY-MM-DD
    """
    operador = get_operador_pdv(request.user)
    
    qs = ControleCaixa.objects.filter(operador=operador, status='FECHADO').order_by('-data_fechamento')
    
    # data_filtro = request.query_params.get('data')
    # if data_filtro:
    #     try:
    #         data = datetime.strptime(data_filtro, '%Y-%m-%d').date()
    #         # range do dia todo
    #         qs = qs.filter(data_fechamento__date=data)
    #     except ValueError:
    #         pass
            
    # # Limita aos últimos 20 se não tiver filtro de data, pra não pesar
    # if not data_filtro:
    #     qs = qs[:20]
    
    # --- DEBUG TEMPORÁRIO / CORREÇÃO DE DATA ---
    # Se o usuário mandar data, tentamos filtrar flexivelmente
    data_filtro = request.query_params.get('data')
    if data_filtro:
        try:
           # Filtra start/end do dia para evitar problemas de timezone com __date
           dt_start = datetime.strptime(data_filtro, '%Y-%m-%d')
           dt_end = dt_start.replace(hour=23, minute=59, second=59)
           
           # Se USE_TZ=True, precisamos tornar o datetime "aware"
           if timezone.is_naive(dt_start):
               current_tz = timezone.get_current_timezone()
               dt_start = timezone.make_aware(dt_start, current_tz)
               dt_end = timezone.make_aware(dt_end, current_tz)
               
           qs = qs.filter(data_fechamento__range=(dt_start, dt_end))
        except ValueError:
            pass
    else:
        qs = qs[:20]
        
    data = []
    for c in qs:
        data.append({
            'id_caixa': c.id_caixa,
            'data_abertura': c.data_abertura,
            'data_fechamento': c.data_fechamento,
            'valor_fechamento': c.valor_fechamento
        })
        
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reimprimir_fechamento(request, id_caixa):
    """
    Retorna os dados completos do relatório de um caixa fechado específico.
    """
    operador = get_operador_pdv(request.user)
    
    # Garante que só acessa caixas do próprio operador (segurança básica)
    caixa = ControleCaixa.objects.filter(id_caixa=id_caixa, operador=operador).first()
    
    if not caixa:
         return Response({'error': 'Caixa não encontrado ou acesso não autorizado.'}, status=status.HTTP_404_NOT_FOUND)
         
    relatorio = gerar_relatorio_fechamento(caixa)
    
    return Response(relatorio)


# ============================================================================
# VIEWS PARA VENDA RÁPIDA (usa parâmetros de VENDA ao invés de NFC-e)
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_caixa_venda(request):
    """
    Verifica se o usuário tem um caixa aberto (contexto Venda Rápida).
    Usa parâmetros de Venda ao invés de NFC-e.
    """
    operador = get_operador_venda(request.user)
    
    # Obter operação do usuário (prioridade: Venda > Padrão)
    id_operacao = None
    try:
        if hasattr(request.user, 'parametros'):
            id_operacao = request.user.parametros.id_operacao_venda_id or \
                          request.user.parametros.id_operacao_padrao_id
    except:
        pass

    caixa = ControleCaixa.objects.filter(operador=operador, status='ABERTO').first()
    
    if caixa:
        filters = {
            'criado_por': operador,
            'data_documento__gte': caixa.data_abertura
        }
        
        if id_operacao:
            filters['id_operacao_id'] = id_operacao

        vendas_qs = Venda.objects.filter(**filters)
        total_vendas = vendas_qs.aggregate(Sum('valor_total'))['valor_total__sum'] or 0.00

        # Calcular entradas reais (excluindo a prazo)
        try:
            from django.db.models import Q
            venda_ids = vendas_qs.values_list('id_venda', flat=True)
            
            termos_prazo = ['prazo', 'credi', 'boleto', 'duplicata', 'faturado']
            q_exclude = Q()
            for termo in termos_prazo:
                q_exclude |= Q(forma_pagamento__icontains=termo)
            
            contas_entrada = FinanceiroConta.objects.filter(id_venda_origem__in=venda_ids).exclude(q_exclude)
            total_entradas = contas_entrada.aggregate(Sum('valor_parcela'))['valor_parcela__sum'] or 0.00
            total_juros = contas_entrada.aggregate(Sum('valor_juros'))['valor_juros__sum'] or 0.00
            total_entradas += total_juros
        except Exception as e:
            print(f"Erro ao calcular entradas reais: {e}")
            total_entradas = total_vendas
            
        try:
            total_suprimentos = MovimentacaoCaixa.objects.filter(
                caixa=caixa, tipo='SUPRIMENTO'
            ).aggregate(Sum('valor'))['valor__sum'] or 0.00
            
            total_sangrias = MovimentacaoCaixa.objects.filter(
                caixa=caixa, tipo='SANGRIA'
            ).aggregate(Sum('valor'))['valor__sum'] or 0.00
        except Exception as e:
            total_suprimentos = 0.00
            total_sangrias = 0.00

        return Response({
            'status': 'ABERTO',
            'id_caixa': caixa.id_caixa,
            'data_abertura': caixa.data_abertura,
            'valor_abertura': caixa.valor_abertura,
            'total_vendas_sessao': total_vendas,
            'total_entradas_sessao': total_entradas,
            'total_suprimentos': total_suprimentos,
            'total_sangrias': total_sangrias
        })
    
    return Response({'status': 'FECHADO'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def abrir_caixa_venda(request):
    """
    Abre um novo caixa para o usuário (contexto Venda Rápida).
    """
    operador = get_operador_venda(request.user)

    if ControleCaixa.objects.filter(operador=operador, status='ABERTO').exists():
        return Response({'error': 'Você já possui um caixa aberto.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        valor_abertura = float(request.data.get('valor_abertura', 0.00))
    except (ValueError, TypeError):
        valor_abertura = 0.00
    
    caixa = ControleCaixa.objects.create(
        operador=operador,
        valor_abertura=valor_abertura,
        status='ABERTO',
        data_abertura=timezone.now()
    )
    
    return Response({
        'message': 'Caixa aberto com sucesso!',
        'id_caixa': caixa.id_caixa
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registrar_movimentacao_venda(request):
    """
    Registra suprimento ou sangria (contexto Venda Rápida).
    """
    operador = get_operador_venda(request.user)

    caixa = ControleCaixa.objects.filter(operador=operador, status='ABERTO').first()
    if not caixa:
        return Response({'error': 'Não há caixa aberto.'}, status=status.HTTP_400_BAD_REQUEST)

    tipo = request.data.get('tipo', '').upper()
    if tipo not in ['SUPRIMENTO', 'SANGRIA']:
        return Response({'error': 'Tipo inválido. Use SUPRIMENTO ou SANGRIA.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        valor = float(request.data.get('valor', 0.00))
    except (ValueError, TypeError):
        return Response({'error': 'Valor inválido.'}, status=status.HTTP_400_BAD_REQUEST)
    
    observacao = request.data.get('observacao', '')
    
    mov = MovimentacaoCaixa.objects.create(
        caixa=caixa,
        tipo=tipo,
        valor=valor,
        observacao=observacao,
        usuario=request.user,
        data_movimentacao=timezone.now()
    )
    
    return Response({
        'message': f'{tipo} registrado com sucesso!',
        'id_movimentacao': mov.id_movimentacao,
        'valor': mov.valor
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fechar_caixa_venda(request):
    """
    Fecha o caixa atual do usuário e retorna relatório (contexto Venda Rápida).
    """
    operador = get_operador_venda(request.user)

    caixa = ControleCaixa.objects.filter(operador=operador, status='ABERTO').first()
    if not caixa:
        return Response({'error': 'Não há caixa aberto para este usuário.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        valor_fechamento = float(request.data.get('valor_fechamento', 0.00))
    except (ValueError, TypeError):
        valor_fechamento = 0.00

    observacoes = request.data.get('observacoes', '')
    data_fechamento = timezone.now()

    # Gera relatório usando a função comum (ela detecta operação do operador)
    relatorio = gerar_relatorio_fechamento(caixa)
    
    # Fecha o caixa
    caixa.status = 'FECHADO'
    caixa.data_fechamento = data_fechamento
    caixa.valor_fechamento = valor_fechamento
    caixa.observacoes = observacoes
    caixa.save()

    return Response({
        'message': 'Caixa fechado com sucesso!',
        'id_caixa': caixa.id_caixa,
        'relatorio': relatorio
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_fechamentos_venda(request):
    """
    Lista os fechamentos de caixa do usuário logado (contexto Venda Rápida).
    """
    operador = get_operador_venda(request.user)
    
    qs = ControleCaixa.objects.filter(operador=operador, status='FECHADO').order_by('-data_fechamento')
    
    data_filtro = request.query_params.get('data')
    if data_filtro:
        try:
           dt_start = datetime.strptime(data_filtro, '%Y-%m-%d')
           dt_end = dt_start.replace(hour=23, minute=59, second=59)
           
           if timezone.is_naive(dt_start):
               current_tz = timezone.get_current_timezone()
               dt_start = timezone.make_aware(dt_start, current_tz)
               dt_end = timezone.make_aware(dt_end, current_tz)
               
           qs = qs.filter(data_fechamento__range=(dt_start, dt_end))
        except ValueError:
            pass
    else:
        qs = qs[:20]
        
    data = []
    for c in qs:
        data.append({
            'id_caixa': c.id_caixa,
            'data_abertura': c.data_abertura,
            'data_fechamento': c.data_fechamento,
            'valor_fechamento': c.valor_fechamento
        })
        
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reimprimir_fechamento_venda(request, id_caixa):
    """
    Retorna os dados completos do relatório de um caixa fechado específico (contexto Venda Rápida).
    """
    operador = get_operador_venda(request.user)
    
    caixa = ControleCaixa.objects.filter(id_caixa=id_caixa, operador=operador).first()
    
    if not caixa:
         return Response({'error': 'Caixa não encontrado ou acesso não autorizado.'}, status=status.HTTP_404_NOT_FOUND)
         
    relatorio = gerar_relatorio_fechamento(caixa)
    
    return Response(relatorio)
