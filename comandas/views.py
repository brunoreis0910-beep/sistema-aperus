from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from django.db import transaction
import logging
from .models import Mesa, Comanda, ItemComanda, TransferenciaMesa
from .serializers import MesaSerializer, ComandaSerializer, ItemComandaSerializer, TransferenciaMesaSerializer

logger = logging.getLogger(__name__)


class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all()
    serializer_class = MesaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        queryset = Mesa.objects.all()
        status_filter = self.request.query_params.get('status', None)
        ativa = self.request.query_params.get('ativa', None)

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if ativa is not None:
            queryset = queryset.filter(ativa=ativa.lower() == 'true')

        return queryset.order_by('numero')

    @action(detail=True, methods=['post'])
    def mudar_status(self, request, pk=None):
        """Muda o status da mesa"""
        mesa = self.get_object()
        novo_status = request.data.get('status')

        if novo_status not in dict(Mesa.STATUS_CHOICES):
            return Response({'error': 'Status invalido'}, status=status.HTTP_400_BAD_REQUEST)

        mesa.status = novo_status
        mesa.save()

        return Response(MesaSerializer(mesa).data)


class ComandaViewSet(viewsets.ModelViewSet):
    queryset = Comanda.objects.all()
    serializer_class = ComandaSerializer
    permission_classes = [IsAuthenticated]

    def paginate_queryset(self, queryset):
        # Desativa paginação se filtrar por status 'Aberta', para garantir que a comanda ativa
        # de uma mesa sempre apareça, mesmo que seja antiga.
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter.lower() == 'aberta':
            return None
        return super().paginate_queryset(queryset)

    @action(detail=False, methods=['get'])
    def buscar_cliente(self, request):
        """Busca dados do cliente pelo ID, CPF/CNPJ ou Nome"""
        from api.models import Cliente
        from django.db.models import Q
        
        cliente_id = request.query_params.get('id')
        cpf_cnpj = request.query_params.get('cpf_cnpj')
        nome = request.query_params.get('nome')
        
        if not cliente_id and not cpf_cnpj and not nome:
            return Response(
                {'error': 'Informe o ID, CPF/CNPJ ou Nome do cliente'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if cliente_id:
                # Busca por ID (único)
                cliente = Cliente.objects.get(id_cliente=cliente_id)
                dados_cliente = {
                    'id_cliente': cliente.id_cliente,
                    'nome_razao_social': cliente.nome_razao_social,
                    'nome_fantasia': cliente.nome_fantasia or '',
                    'cpf_cnpj': cliente.cpf_cnpj,
                    'telefone': cliente.telefone or '',
                    'whatsapp': cliente.whatsapp or '',
                    'email': cliente.email or '',
                    'endereco': cliente.endereco or '',
                    'numero': cliente.numero or '',
                    'bairro': cliente.bairro or '',
                    'cidade': cliente.cidade or '',
                    'estado': cliente.estado or '',
                    'cep': cliente.cep or '',
                    'limite_credito': float(cliente.limite_credito) if cliente.limite_credito else 0.0,
                }
                return Response(dados_cliente)
            
            elif cpf_cnpj:
                # Busca por CPF/CNPJ
                cpf_cnpj_limpo = ''.join(filter(str.isdigit, cpf_cnpj))
                cliente = Cliente.objects.get(cpf_cnpj__contains=cpf_cnpj_limpo)
                dados_cliente = {
                    'id_cliente': cliente.id_cliente,
                    'nome_razao_social': cliente.nome_razao_social,
                    'nome_fantasia': cliente.nome_fantasia or '',
                    'cpf_cnpj': cliente.cpf_cnpj,
                    'telefone': cliente.telefone or '',
                    'whatsapp': cliente.whatsapp or '',
                    'email': cliente.email or '',
                    'endereco': cliente.endereco or '',
                    'numero': cliente.numero or '',
                    'bairro': cliente.bairro or '',
                    'cidade': cliente.cidade or '',
                    'estado': cliente.estado or '',
                    'cep': cliente.cep or '',
                    'limite_credito': float(cliente.limite_credito) if cliente.limite_credito else 0.0,
                }
                return Response(dados_cliente)
            
            elif nome:
                # Busca por nome (pode retornar múltiplos)
                clientes = Cliente.objects.filter(
                    Q(nome_razao_social__icontains=nome) | 
                    Q(nome_fantasia__icontains=nome)
                ).order_by('nome_razao_social')[:20]  # Limita a 20 resultados
                
                if not clientes.exists():
                    return Response(
                        {'error': 'Nenhum cliente encontrado com esse nome'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Se encontrou apenas um, retorna direto
                if clientes.count() == 1:
                    cliente = clientes.first()
                    dados_cliente = {
                        'id_cliente': cliente.id_cliente,
                        'nome_razao_social': cliente.nome_razao_social,
                        'nome_fantasia': cliente.nome_fantasia or '',
                        'cpf_cnpj': cliente.cpf_cnpj,
                        'telefone': cliente.telefone or '',
                        'whatsapp': cliente.whatsapp or '',
                        'email': cliente.email or '',
                        'endereco': cliente.endereco or '',
                        'numero': cliente.numero or '',
                        'bairro': cliente.bairro or '',
                        'cidade': cliente.cidade or '',
                        'estado': cliente.estado or '',
                        'cep': cliente.cep or '',
                        'limite_credito': float(cliente.limite_credito) if cliente.limite_credito else 0.0,
                    }
                    return Response(dados_cliente)
                
                # Se encontrou múltiplos, retorna lista
                lista_clientes = [{
                    'id_cliente': c.id_cliente,
                    'nome_razao_social': c.nome_razao_social,
                    'nome_fantasia': c.nome_fantasia or '',
                    'cpf_cnpj': c.cpf_cnpj,
                    'telefone': c.telefone or '',
                    'cidade': c.cidade or '',
                } for c in clientes]
                
                return Response({
                    'multiplos': True,
                    'total': clientes.count(),
                    'clientes': lista_clientes
                })
                
        except Cliente.DoesNotExist:
            return Response(
                {'error': 'Cliente não encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Cliente.MultipleObjectsReturned:
            return Response(
                {'error': 'Múltiplos clientes encontrados. Use o ID.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_queryset(self):
        queryset = Comanda.objects.select_related('mesa', 'cliente', 'garcom').prefetch_related('itens')

        status_filter = self.request.query_params.get('status', None)
        mesa = self.request.query_params.get('mesa', None)
        data_inicio = self.request.query_params.get('data_inicio', None)
        data_fim = self.request.query_params.get('data_fim', None)

        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter)
        if mesa:
            queryset = queryset.filter(mesa__numero=mesa)
        if data_inicio:
            queryset = queryset.filter(data_abertura__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_abertura__lte=data_fim)

        return queryset.order_by('-data_abertura')

    def create(self, request, *args, **kwargs):
        """Cria nova comanda e marca mesa como ocupada"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Atribui garçom automaticamente se não informado
        if 'garcom' not in request.data:
            serializer.validated_data['garcom'] = request.user

        comanda = serializer.save()

        # Marca mesa como ocupada
        if comanda.mesa:
            comanda.mesa.status = 'Ocupada'
            comanda.mesa.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def fechar(self, request, pk=None):
        """Fecha a comanda"""
        from api.models import FinanceiroConta, ParametrosUsuario
        from datetime import date
        from .models import PagamentoComanda

        comanda = self.get_object()

        if comanda.status == 'Fechada':
            return Response({'error': 'Comanda já está fechada'}, status=status.HTTP_400_BAD_REQUEST)

        # 🎯 BUSCAR VENDEDOR DOS PARÂMETROS DO USUÁRIO (id_vendedor_nfce)
        vendedor_nfce = None
        try:
            user_params = ParametrosUsuario.objects.filter(usuario=request.user).first()
            if user_params and user_params.id_vendedor_nfce:
                vendedor_nfce = user_params.id_vendedor_nfce
                logger.info(f"✅ Vendedor NFCe encontrado: {vendedor_nfce.nome}")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao buscar vendedor NFCe: {e}")

        # Se forem enviadas formas detalhadas, cria registros em pagamentos_comanda
        pagamentos_data = request.data.get('pagamentos', [])

        # Usa transação para garantir consistência
        with transaction.atomic():
            # Atualiza campo forma_pagamento como string de resumo (sem formatação de valores)
            if pagamentos_data:
                formas_resumo = ', '.join([pag.get('forma', 'Não informado') for pag in pagamentos_data])
                comanda.forma_pagamento = formas_resumo
            
            # Registra pagamentos detalhados, se houver
            if pagamentos_data:
                for pag in pagamentos_data:
                    forma = pag.get('forma') or pag.get('forma_pagamento') or pag.get('formaPagamento') or 'Não informado'
                    try:
                        valor = float(pag.get('valor', 0))
                    except Exception:
                        valor = 0
                    PagamentoComanda.objects.create(
                        comanda=comanda,
                        forma_pagamento=forma,
                        valor=valor
                    )

            # 🎯 ATRIBUI O VENDEDOR BUSCADO DOS PARÂMETROS DO USUÁRIO
            if vendedor_nfce:
                comanda.id_vendedor = vendedor_nfce
                logger.info(f"✅ Vendedor atribuído à comanda: {vendedor_nfce.nome}")

            comanda.status = 'Fechada'
            comanda.data_fechamento = timezone.now()
            comanda.save()

            # Libera a mesa
            if comanda.mesa:
                comanda.mesa.status = 'Livre'
                comanda.mesa.save()

            # Cria entrada(s) no Contas a Receber de forma organizada
            if comanda.total > 0 and pagamentos_data:
                # Usa os pagamentos enviados pelo frontend (forma limpa)
                total_parcelas = len(pagamentos_data)
                
                for idx, pag in enumerate(pagamentos_data, 1):
                    forma = pag.get('forma', 'Não informado')
                    try:
                        valor = float(pag.get('valor', 0))
                    except:
                        valor = 0
                    
                    if valor <= 0:
                        continue
                    
                    status_financeiro = 'Paga' if forma != 'Fiado' else 'Pend'
                    data_pagamento = date.today() if status_financeiro == 'Paga' else None
                    
                    # Calcula proporção do desconto para esta parcela
                    proporcao = valor / float(comanda.total) if comanda.total > 0 else 0
                    desconto_parcela = float(comanda.desconto or 0) * proporcao
                    
                    FinanceiroConta.objects.create(
                        tipo_conta='Receber',
                        id_cliente_fornecedor=comanda.cliente,
                        descricao=f'Comanda {comanda.numero} - Mesa {comanda.mesa.numero if comanda.mesa else "S/N"}{" - " + forma if total_parcelas > 1 else ""}',
                        valor_parcela=valor,
                        valor_liquidado=valor if status_financeiro == 'Paga' else 0,
                        valor_desconto=round(desconto_parcela, 2),
                        data_vencimento=date.today(),
                        data_pagamento=data_pagamento,
                        status_conta=status_financeiro,
                        forma_pagamento=forma,
                        documento_numero=f'CMD-{comanda.numero}',
                        parcela_numero=idx,
                        parcela_total=total_parcelas,
                        gerencial=0
                    )
            elif comanda.total > 0:
                # Fallback: se não houver pagamentos detalhados, usa forma_pagamento text
                forma_pagamento = comanda.forma_pagamento or 'Dinheiro'
                status_financeiro = 'Paga' if forma_pagamento != 'Fiado' else 'Pend'
                data_pagamento = date.today() if status_financeiro == 'Paga' else None
                
                FinanceiroConta.objects.create(
                    tipo_conta='Receber',
                    id_cliente_fornecedor=comanda.cliente,
                    descricao=f'Comanda {comanda.numero} - Mesa {comanda.mesa.numero if comanda.mesa else "S/N"}',
                    valor_parcela=comanda.total,
                    valor_liquidado=comanda.total if status_financeiro == 'Paga' else 0,
                    valor_desconto=comanda.desconto or 0,
                    data_vencimento=date.today(),
                    data_pagamento=data_pagamento,
                    status_conta=status_financeiro,
                    forma_pagamento=forma_pagamento,
                    documento_numero=f'CMD-{comanda.numero}',
                    parcela_numero=1,
                    parcela_total=1,
                    gerencial=0
                )

        return Response(ComandaSerializer(comanda).data)

    @action(detail=True, methods=['post'])
    def gerar_nfce(self, request, pk=None):
        """
        Gera NFC-e a partir de uma comanda já fechada.
        Cria uma Venda com operação modelo 65, produtos da comanda, formas de pagamento e cliente consumidor.
        URL: POST /api/comandas/comandas/<id>/gerar_nfce/
        """
        from api.models import Venda, VendaItem, Operacao, Cliente, FinanceiroConta, FormaPagamento
        from api.services.nfce_service import NFCeService
        from decimal import Decimal
        import re

        comanda = self.get_object()

        if comanda.status != 'Fechada':
            return Response(
                {'sucesso': False, 'mensagem': 'A comanda precisa estar fechada para gerar NFC-e.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        itens_comanda = list(
            comanda.itens.select_related('produto').exclude(status='Cancelado').all()
        )
        if not itens_comanda:
            return Response(
                {'sucesso': False, 'mensagem': 'A comanda não possui itens válidos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # 1. 🎯 BUSCAR OPERAÇÃO MODELO 65 (NFC-e) ESPECIFICAMENTE
                operacao = None
                operacao_origem = 'Não definida'
                vendedor_nfce = None
                
                # 🎯 BUSCAR PARÂMETROS DO USUÁRIO (VENDEDOR E OPERAÇÃO)
                try:
                    from api.models import ParametrosUsuario
                    user_params = ParametrosUsuario.objects.filter(usuario=request.user).first()
                    if user_params:
                        # Buscar vendedor NFC-e (SEMPRE)
                        if user_params.id_vendedor_nfce:
                            vendedor_nfce = user_params.id_vendedor_nfce
                            logger.info(f"✅ Vendedor NFC-e do usuário: {vendedor_nfce.nome_vendedor}")
                except Exception as e:
                    logger.warning(f"Erro ao buscar parâmetros do usuário: {e}")
                
                # Prioridade 1: Operação da comanda com modelo 65
                if comanda.id_operacao_nfce:
                    if comanda.id_operacao_nfce.modelo_documento == '65':
                        operacao = comanda.id_operacao_nfce
                        operacao_origem = 'Comanda (Modelo 65)'
                        logger.info(f"✅ Usando operação da comanda: {operacao.nome_operacao} (Modelo 65)")
                
                # Prioridade 2: Operação NFC-e do usuário com modelo 65
                if not operacao:
                    try:
                        from api.models import ParametrosUsuario
                        user_params = ParametrosUsuario.objects.filter(usuario=request.user).first()
                        if user_params:
                            # Buscar operação NFC-e
                            if user_params.id_operacao_nfce:
                                if user_params.id_operacao_nfce.modelo_documento == '65':
                                    operacao = user_params.id_operacao_nfce
                                    operacao_origem = 'Parâmetros do Usuário (Modelo 65)'
                                    logger.info(f"✅ Usando operação do usuário: {operacao.nome_operacao} (Modelo 65)")
                    except Exception as e:
                        logger.warning(f"Erro ao buscar operação do usuário: {e}")
                
                # Prioridade 3: BUSCAR OPERAÇÃO COM MODELO 65 EXPLICITAMENTE
                if not operacao:
                    operacao = Operacao.objects.filter(modelo_documento='65').first()
                    if operacao:
                        operacao_origem = 'Primeira operação Modelo 65'
                        logger.info(f"✅ Usando operação modelo 65: {operacao.nome_operacao}")
                
                # Prioridade 4: Buscar por nome contendo NFC-e
                if not operacao:
                    operacao = Operacao.objects.filter(nome_operacao__icontains='NFCE').first()
                    if operacao:
                        operacao_origem = 'Operação com nome NFC-e'
                        logger.info(f"⚠️ Usando operação por nome: {operacao.nome_operacao}")
                
                if not operacao:
                    return Response(
                        {'sucesso': False, 'mensagem': 'Nenhuma operação modelo 65 (NFC-e) encontrada. Configure uma operação NFC-e primeiro.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 2. 🎯 CLIENTE CONSUMIDOR PADRÃO
                cliente = None
                # Buscar por ID 8 (consumidor padrão)
                cliente = Cliente.objects.filter(pk=8).first()
                if not cliente:
                    # Buscar por nome contendo CONSUMIDOR
                    cliente = Cliente.objects.filter(nome_razao_social__icontains='CONSUMIDOR').first()
                if not cliente:
                    # Se cliente da comanda existe, usar
                    if comanda.cliente:
                        cliente = comanda.cliente
                    else:
                        # Último recurso: primeiro cliente
                        cliente = Cliente.objects.first()
                
                if not cliente:
                    return Response(
                        {'sucesso': False, 'mensagem': 'Nenhum cliente encontrado. Cadastre um cliente consumidor padrão.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                logger.info(f"✅ Cliente: {cliente.nome_razao_social}")

                # 3. 🎯 CRIAR VENDA COM OPERAÇÃO MODELO 65
                venda = Venda()
                venda.id_operacao = operacao
                venda.id_cliente = cliente
                venda.criado_por = request.user
                venda.valor_total = comanda.total
                venda.vista = 1  # Vista para NFC-e
                
                # 🎯 ATRIBUIR VENDEDOR NFC-e DOS PARÂMETROS DO USUÁRIO
                if vendedor_nfce:
                    venda.id_vendedor1 = vendedor_nfce
                    logger.info(f"✅ Vendedor atribuído à venda: {vendedor_nfce.nome_vendedor}")
                
                venda.save()

                logger.info(f"✅ Venda criada (ID: {venda.id_venda}) - Operação: {operacao.nome_operacao} - Cliente: {cliente.nome_razao_social}")

                # 4. 🎯 CRIAR ITENS DA VENDA
                for item in itens_comanda:
                    vi = VendaItem()
                    vi.id_venda = venda
                    vi.id_produto = item.produto
                    vi.quantidade = item.quantidade
                    vi.valor_unitario = item.valor_unitario
                    vi.desconto_valor = Decimal('0.00')
                    vi.valor_total = item.subtotal
                    vi.save()
                
                logger.info(f"✅ {len(itens_comanda)} itens adicionados à venda")

                # 5. 🎯 PROCESSAR FORMAS DE PAGAMENTO DA COMANDA
                # Buscar pagamentos detalhados da tabela PagamentoComanda
                from .models import PagamentoComanda
                pagamentos_comanda = PagamentoComanda.objects.filter(comanda=comanda)
                
                formas_pagamento = []
                if pagamentos_comanda.exists():
                    logger.info(f"💰 Encontrados {pagamentos_comanda.count()} pagamentos na comanda")
                    for pag in pagamentos_comanda:
                        formas_pagamento.append({
                            'nome': pag.forma_pagamento,
                            'valor': pag.valor
                        })
                        logger.info(f"💰 Pagamento: {pag.forma_pagamento} - R$ {pag.valor}")
                else:
                    # Fallback: tentar parse da string forma_pagamento (formato antigo)
                    if comanda.forma_pagamento:
                        logger.info(f"💰 Forma pagamento (string): {comanda.forma_pagamento}")
                        # Parse formas de pagamento (ex: "Dinheiro: R$ 50.00, PIX: R$ 30.00")
                        pattern = r'([^:,]+):\s*R\$?\s*([\d,\.]+)'
                        matches = re.findall(pattern, comanda.forma_pagamento)
                        
                        for nome_forma, valor_str in matches:
                            nome_forma = nome_forma.strip()
                            valor_str = valor_str.replace('.', '').replace(',', '.')
                            try:
                                valor = Decimal(valor_str)
                                formas_pagamento.append({'nome': nome_forma, 'valor': valor})
                            except:
                                logger.warning(f"⚠️ Valor inválido ignorado: {valor_str}")
                    
                    # Se não tem nenhum pagamento, usa valor total da comanda
                    if not formas_pagamento:
                        logger.warning(f"⚠️ Nenhuma forma de pagamento encontrada, usando total da comanda")
                        formas_pagamento.append({
                            'nome': comanda.forma_pagamento or 'Dinheiro',
                            'valor': comanda.total
                        })
                
                # Criar registros FinanceiroConta para cada forma
                if formas_pagamento:
                    from datetime import date
                    for forma in formas_pagamento:
                        # Garantir que o valor seja Decimal
                        valor_pagamento = Decimal(str(forma['valor']))
                        
                        fin = FinanceiroConta()
                        fin.tipo_conta = 'RECEBER'  # 🎯 TIPO DE CONTA
                        fin.id_venda_origem = venda.pk  # 🎯 VÍNCULO COM A VENDA
                        fin.id_operacao = operacao
                        fin.id_cliente_fornecedor = cliente
                        fin.forma_pagamento = forma['nome']
                        fin.valor_parcela = valor_pagamento  # 🎯 VALOR DA PARCELA
                        fin.descricao = f"NFC-e Comanda {comanda.numero} - {forma['nome']}"
                        fin.data_vencimento = date.today()
                        fin.data_pagamento = date.today()  # Já pago (à vista)
                        fin.status_conta = 'Pago'  # Status pago
                        fin.valor_liquidado = valor_pagamento  # Valor já liquidado
                        fin.documento_numero = str(comanda.numero)
                        fin.save()
                        logger.info(f"💰 Pagamento NFC-e registrado: {forma['nome']} - R$ {valor_pagamento} (Venda ID: {venda.pk})")

                # 6. 🎯 EMITIR NFC-e (TRANSMITIR CUPOM)
                logger.info(f"📤 Iniciando transmissão NFC-e...")
                service = NFCeService()
                result = service.emitir_nfce(venda)

                if 'mensagem' in result:
                    result['message'] = result['mensagem']

                if result.get('sucesso'):
                    logger.info(f"✅ NFC-e transmitida com sucesso! Número: {venda.numero_nfe}")
                    return Response({
                        'sucesso': True,
                        'message': result.get('message', 'NFC-e emitida com sucesso!'),
                        'venda_id': venda.pk,
                        'chave_nfe': venda.chave_nfe,
                        'numero_nfe': venda.numero_nfe,
                    })
                else:
                    logger.error(f"❌ Erro na transmissão: {result.get('message')}")
                    raise Exception(result.get('message', 'Erro desconhecido ao emitir NFC-e.'))

        except Exception as e:
            logger.error(f"❌ Erro ao gerar NFC-e: {str(e)}")
            return Response({'sucesso': False, 'mensagem': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def transferir_mesa(self, request, pk=None):
        """Transfere comanda para outra mesa"""
        comanda = self.get_object()
        nova_mesa_id = request.data.get('nova_mesa_id')
        motivo = request.data.get('motivo', '')

        if not nova_mesa_id:
            return Response({'error': 'Mesa de destino não informada'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            nova_mesa = Mesa.objects.get(id=nova_mesa_id)
        except Mesa.DoesNotExist:
            return Response({'error': 'Mesa não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        if nova_mesa.status == 'Ocupada':
            return Response({'error': 'Mesa de destino está ocupada'}, status=status.HTTP_400_BAD_REQUEST)

        # Registra transferência
        mesa_antiga = comanda.mesa
        TransferenciaMesa.objects.create(
            comanda=comanda,
            mesa_origem=mesa_antiga,
            mesa_destino=nova_mesa,
            usuario=request.user,
            motivo=motivo
        )

        # Atualiza status das mesas
        if mesa_antiga:
            mesa_antiga.status = 'Livre'
            mesa_antiga.save()

        nova_mesa.status = 'Ocupada'
        nova_mesa.save()

        # Transfere comanda
        comanda.mesa = nova_mesa
        comanda.save()

        return Response(ComandaSerializer(comanda).data)

    @action(detail=True, methods=['post'])
    def adicionar_item(self, request, pk=None):
        """Adiciona item à comanda"""
        comanda = self.get_object()

        if comanda.status != 'Aberta':
            return Response({'error': 'Comanda não está aberta'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ItemComandaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(comanda=comanda)

        return Response(ComandaSerializer(comanda).data)

    @action(detail=True, methods=['post'])
    def unir_comandas(self, request, pk=None):
        """Une múltiplas comandas em uma única comanda principal"""
        comanda_principal = self.get_object()
        comandas_ids = request.data.get('comandas_ids', [])
        mesa_final_id = request.data.get('mesa_final_id', None)

        if not comandas_ids:
            return Response({'error': 'Nenhuma comanda para unir foi informada'}, status=status.HTTP_400_BAD_REQUEST)

        if comanda_principal.status != 'Aberta':
            return Response({'error': 'Comanda principal não está aberta'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Busca as comandas a serem unidas
                comandas_unir = Comanda.objects.filter(id__in=comandas_ids, status='Aberta')
                
                if not comandas_unir.exists():
                    return Response({'error': 'Nenhuma comanda válida encontrada para unir'}, status=status.HTTP_400_BAD_REQUEST)

                mesas_liberadas = []
                total_itens_transferidos = 0

                # Para cada comanda a ser unida
                for comanda in comandas_unir:
                    # Transfere todos os itens para a comanda principal
                    itens = comanda.itens.all()
                    for item in itens:
                        item.comanda = comanda_principal
                        item.save()
                        total_itens_transferidos += 1

                    # Guarda a mesa para liberar depois
                    if comanda.mesa and comanda.mesa not in mesas_liberadas:
                        mesas_liberadas.append(comanda.mesa)

                    # Cancela a comanda original
                    comanda.status = 'Cancelada'
                    comanda.observacoes = (comanda.observacoes or '') + f'\n[Unida à comanda {comanda_principal.numero}]'
                    comanda.save()

                # Se foi especificada uma mesa final, atualiza
                if mesa_final_id:
                    try:
                        mesa_final = Mesa.objects.get(id=mesa_final_id)
                        # Se a comanda principal tinha mesa, libera
                        if comanda_principal.mesa:
                            comanda_principal.mesa.status = 'Livre'
                            comanda_principal.mesa.save()
                        
                        comanda_principal.mesa = mesa_final
                        mesa_final.status = 'Ocupada'
                        mesa_final.save()
                    except Mesa.DoesNotExist:
                        pass

                # Libera todas as mesas das comandas unidas
                for mesa in mesas_liberadas:
                    if mesa != comanda_principal.mesa:
                        mesa.status = 'Livre'
                        mesa.save()

                # Recalcula o total da comanda principal
                comanda_principal.calcular_total()

                return Response({
                    'message': f'{len(comandas_unir)} comanda(s) unida(s) com sucesso',
                    'itens_transferidos': total_itens_transferidos,
                    'mesas_liberadas': len(mesas_liberadas),
                    'comanda': ComandaSerializer(comanda_principal).data
                })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




    @action(detail=False, methods=['get'])
    def fechamento_caixa(self, request):
        """Gera relatório de fechamento de caixa do dia"""
        from api.models import EmpresaConfig
        from django.db.models import Sum, Count
        from datetime import datetime, date
        
        # Pega a data solicitada ou usa hoje
        data_param = request.query_params.get('data', None)
        if data_param:
            try:
                data_filtro = datetime.strptime(data_param, '%Y-%m-%d').date()
            except ValueError:
                data_filtro = date.today()
        else:
            data_filtro = date.today()

        # Define o início e fim do dia considerando timezone
        from django.utils import timezone
        inicio_dia = timezone.make_aware(datetime.combine(data_filtro, datetime.min.time()))
        fim_dia = timezone.make_aware(datetime.combine(data_filtro, datetime.max.time()))

        # Busca comandas fechadas na data (usando range para resolver problema de timezone)
        comandas_fechadas = Comanda.objects.filter(
            status='Fechada',
            data_fechamento__range=(inicio_dia, fim_dia)
        )

        # Total geral do dia
        totais = comandas_fechadas.aggregate(
            total_vendas=Sum('total'),
            total_subtotal=Sum('subtotal'),
            total_desconto=Sum('desconto'),
            total_taxa_servico=Sum('taxa_servico'),
            quantidade_comandas=Count('id')
        )

        # Totais por forma de pagamento - busca do financeiro_contas
        from api.models import FinanceiroConta
        pagamentos = {}
        
        if comandas_fechadas.exists():
            # Gera lista de documento_numero das comandas fechadas
            numeros_comandas = [f'CMD-{cmd.numero}' for cmd in comandas_fechadas]
            
            # Busca registros financeiros dessas comandas filtrados pela data de fechamento
            financeiro_comandas = FinanceiroConta.objects.filter(
                documento_numero__in=numeros_comandas,
                data_vencimento__range=(data_filtro, data_filtro)  # Filtra pela data de vencimento também
            )
            
            # Agrupa por forma de pagamento
            formas_pagamento = financeiro_comandas.values('forma_pagamento').annotate(
                total=Sum('valor_parcela'),
                quantidade=Count('id_conta')
            ).order_by('forma_pagamento')
            
            for item in formas_pagamento:
                forma = item['forma_pagamento']
                if forma:  # Ignora formas vazias/null
                    # Limpa o nome da forma se contiver formatação
                    forma_limpa = forma.split(':')[0].strip() if ':' in forma else forma.strip()
                    
                    pagamentos[forma_limpa] = {
                        'quantidade': item['quantidade'],
                        'total': float(item['total'] or 0)
                    }

        # Comandas ainda abertas (para alerta)
        comandas_abertas = Comanda.objects.filter(status='Aberta').count()

        # Resumo por hora (opcional)
        comandas_por_hora = []
        for hora in range(24):
            qtd = comandas_fechadas.filter(
                data_fechamento__hour=hora
            ).count()
            if qtd > 0:
                total_hora = comandas_fechadas.filter(
                    data_fechamento__hour=hora
                ).aggregate(total=Sum('total'))['total'] or 0
                
                comandas_por_hora.append({
                    'hora': f'{hora:02d}:00',
                    'quantidade': qtd,
                    'total': float(total_hora)
                })

        # Buscar dados da empresa
        empresa = EmpresaConfig.get_ativa()
        empresa_nome = empresa.nome_fantasia if empresa and empresa.nome_fantasia else (empresa.nome_razao_social if empresa else 'EMPRESA')

        return Response({
            'empresa': empresa_nome,
            'data': data_filtro.strftime('%Y-%m-%d'),
            'data_formatada': data_filtro.strftime('%d/%m/%Y'),
            'totais': {
                'vendas': float(totais['total_vendas'] or 0),
                'subtotal': float(totais['total_subtotal'] or 0),
                'desconto': float(totais['total_desconto'] or 0),
                'taxa_servico': float(totais['total_taxa_servico'] or 0),
                'quantidade_comandas': totais['quantidade_comandas'] or 0
            },
            'pagamentos': pagamentos,
            'comandas_abertas': comandas_abertas,
            'por_hora': comandas_por_hora,
            'detalhes_comandas': ComandaSerializer(comandas_fechadas, many=True).data
        })


class ItemComandaViewSet(viewsets.ModelViewSet):
    queryset = ItemComanda.objects.all()
    serializer_class = ItemComandaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ItemComanda.objects.select_related('comanda', 'produto')

        comanda = self.request.query_params.get('comanda', None)
        status_filter = self.request.query_params.get('status', None)

        if comanda:
            queryset = queryset.filter(comanda__numero=comanda)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('-criado_em')

    @action(detail=True, methods=['post'])
    def mudar_status(self, request, pk=None):
        """Muda status do item (Pendente  Preparando  Pronto  Entregue)"""
        item = self.get_object()
        novo_status = request.data.get('status')

        if novo_status not in dict(ItemComanda.STATUS_CHOICES):
            return Response({'error': 'Status invalido'}, status=status.HTTP_400_BAD_REQUEST)

        item.status = novo_status
        item.save()

        return Response(ItemComandaSerializer(item).data)


class TransferenciaMesaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TransferenciaMesa.objects.all()
    serializer_class = TransferenciaMesaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TransferenciaMesa.objects.select_related('comanda', 'mesa_origem', 'mesa_destino', 'usuario')

        comanda = self.request.query_params.get('comanda', None)
        if comanda:
            queryset = queryset.filter(comanda__numero=comanda)

        return queryset.order_by('-data_transferencia')

# ===== VIEWS DE BACKUP =====

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.http import JsonResponse, FileResponse
import os
from django.conf import settings


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_manager(request):
    '''Gerencia backups do banco de dados'''
    from comandas.backup_utils import create_database_backup, list_backups
    
    if request.method == 'POST':
        compress = request.data.get('compress', True)
        backup_file = create_database_backup(compress=compress)
        
        if backup_file:
            return JsonResponse({
                'success': True,
                'message': 'Backup criado com sucesso',
                'filename': os.path.basename(backup_file)
            })
        return JsonResponse({'success': False, 'error': 'Erro ao criar backup'}, status=500)
    
    backups = list_backups()
    return JsonResponse({'success': True, 'backups': backups})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_info(request):
    '''Retorna informações sobre backups'''
    from comandas.backup_utils import list_backups
    import sqlite3
    
    backups = list_backups()
    db_path = settings.DATABASES['default']['NAME']
    db_size_mb = os.path.getsize(db_path) / (1024 * 1024) if os.path.exists(db_path) else 0
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = len(cursor.fetchall())
        conn.close()
        db_type = 'MySQL'
    except:
        tables = 0
        db_type = 'Unknown'
    
    total_size = sum(b['size_mb'] for b in backups)
    
    return JsonResponse({
        'success': True,
        'database': {
            'type': db_type,
            'size_mb': round(db_size_mb, 2),
            'tables': tables
        },
        'backups': {
            'total': len(backups),
            'total_size_mb': round(total_size, 2),
            'latest': backups[0] if backups else None
        }
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_delete(request, filename):
    '''Deleta um backup'''
    from comandas.backup_utils import delete_backup
    
    success = delete_backup(filename)
    if success:
        return JsonResponse({'success': True, 'message': 'Backup removido'})
    return JsonResponse({'success': False, 'error': 'Erro ao remover backup'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_restore(request, filename):
    '''Restaura um backup'''
    from comandas.backup_utils import restore_database_backup
    
    success = restore_database_backup(filename)
    if success:
        return JsonResponse({'success': True, 'message': 'Backup restaurado'})
    return JsonResponse({'success': False, 'error': 'Erro ao restaurar backup'}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_scheduler_control(request):
    '''Controla o agendador de backups'''
    from comandas.backup_scheduler import BackupSchedulerService
    
    scheduler = BackupSchedulerService()
    
    if request.method == 'POST':
        action = request.data.get('action', 'start')
        schedule_config = request.data.get('schedule', {})
        
        if action == 'stop':
            scheduler.stop_scheduler()
        else:
            hour = schedule_config.get('hour', 2)
            minute = schedule_config.get('minute', 0)
            scheduler.start_scheduler(hour=hour, minute=minute)
    
    status_info = scheduler.get_scheduler_status()
    return JsonResponse({'success': True, 'scheduler': status_info})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def backup_now(request):
    '''Executa backup imediatamente'''
    from comandas.backup_utils import create_database_backup
    
    try:
        backup_file = create_database_backup(compress=True)
        if backup_file:
            return JsonResponse({
                'success': True,
                'message': 'Backup executado com sucesso',
                'filename': os.path.basename(backup_file)
            })
        return JsonResponse({'success': False, 'error': 'Erro ao criar backup'}, status=500)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
