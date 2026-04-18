"""
Views para Conciliação Bancária
Compara movimentações bancárias com lançamentos do sistema financeiro
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime, date
from calendar import monthrange
from ofxparse import OfxParser

from .models import FinanceiroBancario, FinanceiroConta, ContaBancaria
from .serializers_movimentacao_bancaria import FinanceiroBancarioSerializer


class ConciliacaoBancariaView(APIView):
    """
    View para Conciliação Bancária
    
    GET /api/financeiro/conciliacao/
    Parâmetros:
    - mes (int): Mês para conciliação (1-12)
    - ano (int): Ano para conciliação
    - conta_bancaria (int, opcional): Filtrar por conta bancária específica
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Obter parâmetros
        mes = request.query_params.get('mes')
        ano = request.query_params.get('ano')
        conta_bancaria_id = request.query_params.get('conta_bancaria')
        
        # Validações
        if not mes or not ano:
            hoje = date.today()
            mes = hoje.month
            ano = hoje.year
        else:
            try:
                mes = int(mes)
                ano = int(ano)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Mês e ano devem ser números inteiros'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if mes < 1 or mes > 12:
            return Response(
                {'error': 'Mês deve estar entre 1 e 12'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcular período
        primeiro_dia = date(ano, mes, 1)
        ultimo_dia = date(ano, mes, monthrange(ano, mes)[1])
        
        # Buscar movimentações bancárias do período
        query_bancario = Q(data_pagamento__gte=primeiro_dia) & Q(data_pagamento__lte=ultimo_dia)
        if conta_bancaria_id:
            query_bancario &= Q(id_conta_bancaria=conta_bancaria_id)
        
        movimentacoes = FinanceiroBancario.objects.filter(query_bancario).select_related(
            'id_conta_bancaria',
            'id_cliente_fornecedor'
        ).order_by('data_pagamento', 'id_movimento')
        
        # Buscar contas financeiras do período (para verificar conciliação)
        contas_pagas = FinanceiroConta.objects.filter(
            data_pagamento__gte=primeiro_dia,
            data_pagamento__lte=ultimo_dia,
            status_conta__in=['Pago', 'Liquidado', 'Paga'] # Incluindo 'Paga'
        ).select_related('id_conta_baixa', 'id_cliente_fornecedor').order_by('data_pagamento', 'id_conta')
        
        # --- Lógica de Conciliação (Matching) ---
        # 1. Indexar Movimentações Bancárias (Extrato)
        banco_map = {} # Chave -> Lista de Movimentações
        for mov in movimentacoes:
            valor = float(mov.valor_movimento)
            if mov.tipo_movimento == 'D':
                valor = -abs(valor)
            chave = f"{mov.data_pagamento}_{valor:.2f}"
            if chave not in banco_map:
                banco_map[chave] = []
            banco_map[chave].append(mov)

        # 2. Indexar Contas do Sistema (Razão)
        sistema_map = {} # Chave -> Lista de Contas
        for conta in contas_pagas:
            valor = float(conta.valor_liquidado or conta.valor_parcela)
            # Ajustar sinal sistema: Pagar = Saída (-), Receber = Entrada (+)
            if conta.tipo_conta == 'Pagar':
                valor = -abs(valor)
            else:
                valor = abs(valor)
            
            chave = f"{conta.data_pagamento}_{valor:.2f}"
            if chave not in sistema_map:
                sistema_map[chave] = []
            sistema_map[chave].append(conta)

        # 3. Cruzar dados e montar resposta unificada
        lancamentos = []
        total_creditos = 0
        total_debitos = 0
        total_conciliados = 0
        
        # Processar Movimentações do Banco
        for mov in movimentacoes:
            valor = float(mov.valor_movimento)
            if mov.tipo_movimento == 'D': 
                valor = -abs(valor)
                total_debitos += valor
            else: 
                valor = abs(valor)
                total_creditos += valor
            
            chave = f"{mov.data_pagamento}_{valor:.2f}"
            # Conciliado = marcado manualmente OU encontrou correspondência automática no sistema
            conciliado_auto = False
            if chave in sistema_map and sistema_map[chave]:
                conciliado_auto = True
                sistema_map[chave].pop(0)

            conciliado = mov.conciliado or conciliado_auto
            if conciliado:
                total_conciliados += 1

            lancamentos.append({
                'id': f"bco_{mov.id_movimento}",
                'id_movimento': mov.id_movimento,
                'data': mov.data_pagamento.isoformat(),
                'descricao': mov.descricao or 'Sem descrição',
                'documento': mov.documento_numero or '',
                'valor': valor,
                'conciliado': conciliado,
                'origem': 'BANCO',
                'tipo': 'debito' if valor < 0 else 'credito'
            })

        # Processar Contas do Sistema que SOBRARAM (Não conciliadas ou sem extrato)
        # Se banco_map estiver vazio (sem extrato importado), todas as contas aparecerão aqui
        for chave, lista_contas in sistema_map.items():
            for conta in lista_contas:
                valor = float(conta.valor_liquidado or conta.valor_parcela)
                if conta.tipo_conta == 'Pagar': 
                    valor = -abs(valor)
                    total_debitos += valor
                else: 
                    valor = abs(valor)
                    total_creditos += valor
                
                lancamentos.append({
                    'id': f"sis_{conta.id_conta}",
                    'data': conta.data_pagamento.isoformat(),
                    'descricao': f"[SISTEMA] {conta.descricao}",
                    'documento': conta.documento_numero or '',
                    'valor': valor,
                    'conciliado': False, # Se sobrou aqui, não achou no banco
                    'origem': 'SISTEMA',
                    'tipo': 'debito' if valor < 0 else 'credito'
                })

        # Ordenar final por data
        lancamentos.sort(key=lambda x: x['data'])
        
        # Montar resposta
        response_data = {
            'periodo': {
                'mes': mes,
                'ano': ano,
                'data_inicio': primeiro_dia.isoformat(),
                'data_fim': ultimo_dia.isoformat()
            },
            'lancamentos': lancamentos,
            'resumo': {
                'total_creditos': total_creditos,
                'total_debitos': total_debitos,
                'saldo_periodo': total_creditos + total_debitos,
                'total_lancamentos': len(lancamentos),
                'conciliados': total_conciliados,
                'pendentes': len(lancamentos) - total_conciliados,
                'percentual_conciliado': round((total_conciliados / total_conciliados) * 100) if total_conciliados > 0 else 0
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Recebe um arquivo OFX e importa as movimentações bancárias.
        """
        try:
            arquivo = request.FILES.get('extrato')
            if not arquivo:
                return Response({'error': 'Arquivo "extrato" não fornecido.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validar e ler arquivo
            nome_arquivo = arquivo.name.lower()
            if not nome_arquivo.endswith('.ofx'):
                return Response({'error': 'Apenas arquivos OFX (.ofx) são suportados.'}, status=status.HTTP_400_BAD_REQUEST)

            # Tenta ler como texto para passar para o parser, se necessário
            # OfxParser espera um objeto file-like ou string
            
            ofx = OfxParser.parse(arquivo)
            
            # Identificação da Conta Bancária
            conta_id = request.data.get('conta_bancaria')
            conta_bancaria = None
            
            if conta_id:
                conta_bancaria = ContaBancaria.objects.filter(pk=conta_id).first()
            
            if not conta_bancaria:
                # Tenta pelo número da conta no OFX
                numero_conta_ofx = getattr(ofx.account, 'number', '').replace('-', '').strip()
                if numero_conta_ofx:
                   conta_bancaria = ContaBancaria.objects.filter(conta__icontains=numero_conta_ofx).first()
            
            if not conta_bancaria:
                # Tenta pegar a primeira conta cadastrada (fallback p/ desenvolvimento)
                contas = ContaBancaria.objects.all()
                if contas.count() == 1:
                    conta_bancaria = contas.first()
                elif contas.count() > 1:
                    return Response({'error': 'Múltiplas contas bancárias cadastradas. Selecione a conta destino.'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({'error': 'Nenhuma conta bancária cadastrada no sistema.'}, status=status.HTTP_400_BAD_REQUEST)

            # Processar Transações
            transacoes = ofx.account.statement.transactions
            importados = 0
            duplicados = 0
            erros = 0
            conciliados_auto = 0
            
            for t in transacoes:
                try:
                    valor = float(t.amount)
                    data = t.date # datetime
                    data_pagamento = data.date() if isinstance(data, datetime) else data
                    descricao = str(t.memo).strip() or "Movimento OFX"
                    doc = str(t.id).strip()
                    tipo = 'C' if valor > 0 else 'D'
                    
                    # Verificar duplicidade
                    existe = FinanceiroBancario.objects.filter(
                        id_conta_bancaria=conta_bancaria,
                        data_pagamento=data_pagamento,
                        valor_movimento=abs(valor),
                        documento_numero=doc
                    ).exists()
                    
                    if existe:
                        duplicados += 1
                        continue

                    # --- CONCILIAÇÃO AUTOMÁTICA ---
                    # Buscar correspondência nas contas do sistema
                    cliente_vinculado = None
                    conciliado_automaticamente = False
                    
                    # Definir tipo de conta para busca
                    tipo_conta_busca = 'Receber' if valor > 0 else 'Pagar'
                    valor_abs = abs(valor)
                    
                    # Buscar contas próximas à data (+/- 5 dias) com valor exato
                    from datetime import timedelta
                    janela_dias = 5
                    data_inicio = data_pagamento - timedelta(days=janela_dias)
                    data_fim = data_pagamento + timedelta(days=janela_dias)
                    
                    contas_candidatas = FinanceiroConta.objects.filter(
                        tipo_conta=tipo_conta_busca,
                        data_pagamento__gte=data_inicio,
                        data_pagamento__lte=data_fim,
                        status_conta__in=['Pago', 'Paga', 'Liquidado']
                    ).select_related('id_cliente_fornecedor')
                    
                    # Tentar match por valor exato primeiro
                    for conta in contas_candidatas:
                        valor_conta = float(conta.valor_liquidado or conta.valor_parcela)
                        if abs(valor_conta - valor_abs) < 0.01:  # Match por valor
                            # Verificar se nome do cliente aparece na descrição do extrato
                            if conta.id_cliente_fornecedor:
                                nome_cliente = conta.id_cliente_fornecedor.nome_completo.lower()
                                descricao_lower = descricao.lower()
                                
                                # Verificar se o nome ou parte dele está na descrição
                                palavras_nome = nome_cliente.split()
                                match_nome = any(palavra in descricao_lower for palavra in palavras_nome if len(palavra) > 3)
                                
                                if match_nome:
                                    cliente_vinculado = conta.id_cliente_fornecedor
                                    conciliado_automaticamente = True
                                    break
                            else:
                                # Se não tem cliente mas valor e data batem, também concilia
                                conciliado_automaticamente = True
                                break

                    movimento = FinanceiroBancario.objects.create(
                        id_conta_bancaria=conta_bancaria,
                        data_pagamento=data_pagamento,
                        valor_movimento=abs(valor),
                        tipo_movimento=tipo,
                        descricao=descricao,
                        documento_numero=doc,
                        forma_pagamento='OFX',
                        id_cliente_fornecedor=cliente_vinculado,
                        conciliado=conciliado_automaticamente
                    )
                    
                    importados += 1
                    if conciliado_automaticamente:
                        conciliados_auto += 1
                        
                except Exception as e:
                    print(f"Erro ao importar transação OFX: {e}")
                    erros += 1
            
            return Response({
                'message': 'Importação de extrato concluída.',
                'detalhes': {
                    'conta': str(conta_bancaria),
                    'importados': importados,
                    'duplicados': duplicados,
                    'conciliados_automaticamente': conciliados_auto,
                    'erros': erros if erros > 0 else 0
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': f'Erro ao processar arquivo: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        """
        Alterna o status de conciliação de um lançamento bancário.
        Body: { "id_movimento": <int>, "conciliado": <bool> }
        """
        id_movimento = request.data.get('id_movimento')
        conciliado = request.data.get('conciliado')

        if id_movimento is None or conciliado is None:
            return Response({'error': 'Campos id_movimento e conciliado são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            mov = FinanceiroBancario.objects.get(pk=id_movimento)
            mov.conciliado = bool(conciliado)
            mov.save(update_fields=['conciliado'])
            return Response({'id_movimento': id_movimento, 'conciliado': mov.conciliado}, status=status.HTTP_200_OK)
        except FinanceiroBancario.DoesNotExist:
            return Response({'error': 'Movimento não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
