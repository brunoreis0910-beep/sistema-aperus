from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q, Min, Count, F
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

try:
    from .models_cotacao import Cotacao, CotacaoItem, CotacaoFornecedor, CotacaoResposta
    from .models import Produto, Fornecedor, Compra, CompraItem, Estoque
    from .serializers_cotacao import (
        CotacaoSerializer, CotacaoItemSerializer, CotacaoFornecedorSerializer,
        CotacaoRespostaSerializer, CotacaoCreateSerializer, CotacaoRespostaPublicSerializer,
        CotacaoConfirmarVencedorSerializer
    )
    COTACAO_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Aviso: Cotacao e seus modelos não puderam ser importados: {e}")
    Cotacao = None
    CotacaoItem = None
    CotacaoFornecedor = None
    CotacaoResposta = None
    COTACAO_AVAILABLE = False


# Placeholder para evitar erros de importação - versão simplificada
class CotacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar cotações - SIMPLIFICADO PARA MIGRAÇÕES"""

    def get_serializer_class(self):
        if not COTACAO_AVAILABLE:
            from rest_framework.serializers import Serializer
            return Serializer
        if self.action == 'create':
            return CotacaoCreateSerializer
        return CotacaoSerializer

    def get_queryset(self):
        if COTACAO_AVAILABLE:
            return Cotacao.objects.all().order_by('-data_cotacao')
        return []

    def list(self, request, *args, **kwargs):
        if not COTACAO_AVAILABLE:
            return Response(
                {'error': 'Cotacao models not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        return super().list(request, *args, **kwargs)

    def produtos_estoque_minimo(self, request):
        """Buscar produtos abaixo do estoque mínimo"""
        produtos = Produto.objects.filter(
            Q(id_produto__in=Estoque.objects.filter(
                quantidade__lt=F('id_produto__estoque_minimo')
            ).values('id_produto'))
        ).select_related('categoria')
        
        data = [{
            'id_produto': p.id_produto,
            'nome_produto': p.nome_produto,
            'unidade_medida': p.unidade_medida,
            'estoque_minimo': p.estoque_minimo,
            'estoque_atual': Estoque.objects.filter(id_produto=p).first().quantidade if Estoque.objects.filter(id_produto=p).exists() else 0,
            'quantidade_sugerida': max(0, p.estoque_minimo - (Estoque.objects.filter(id_produto=p).first().quantidade if Estoque.objects.filter(id_produto=p).exists() else 0))
        } for p in produtos]
        
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def enviar_cotacao(self, request, pk=None):
        """Enviar cotação para fornecedores (WhatsApp/Email)"""
        cotacao = self.get_object()
        
        if cotacao.status != 'Rascunho':
            return Response(
                {'error': 'Apenas cotações em rascunho podem ser enviadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        metodo_envio = request.data.get('metodo_envio', 'email')  # 'email', 'whatsapp' ou 'ambos'
        
        try:
            with transaction.atomic():
                fornecedores_enviados = []
                
                for cotacao_fornecedor in cotacao.fornecedores.all():
                    link_resposta = f"{request.build_absolute_uri('/api/cotacao/responder/')}{cotacao_fornecedor.token_acesso}/"
                    
                    # Aqui você implementaria o envio real via WhatsApp/Email
                    # Por enquanto, apenas marcamos como enviado
                    
                    if metodo_envio in ['email', 'ambos']:
                        cotacao_fornecedor.email_enviado = True
                        # TODO: Implementar envio de email
                        # send_email(
                        #     to=cotacao_fornecedor.id_fornecedor.email,
                        #     subject=f'Cotação {cotacao.numero_cotacao}',
                        #     body=f'Link para responder: {link_resposta}'
                        # )
                    
                    if metodo_envio in ['whatsapp', 'ambos']:
                        cotacao_fornecedor.whatsapp_enviado = True
                        # TODO: Implementar envio via WhatsApp
                        # send_whatsapp(
                        #     phone=cotacao_fornecedor.id_fornecedor.telefone,
                        #     message=f'Cotação {cotacao.numero_cotacao}: {link_resposta}'
                        # )
                    
                    cotacao_fornecedor.data_envio = timezone.now()
                    cotacao_fornecedor.save()
                    
                    fornecedores_enviados.append({
                        'fornecedor': cotacao_fornecedor.id_fornecedor.nome_razao_social,
                        'link': link_resposta
                    })
                
                # Atualizar status da cotação
                cotacao.status = 'Enviada'
                cotacao.save()
                
                return Response({
                    'message': 'Cotação enviada com sucesso',
                    'fornecedores': fornecedores_enviados
                })
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get', 'post'], permission_classes=[AllowAny], url_path='responder/(?P<token>[^/.]+)')
    def responder_cotacao(self, request, token=None):
        """Endpoint público para fornecedor responder cotação"""
        try:
            cotacao_fornecedor = CotacaoFornecedor.objects.get(token_acesso=token)
        except CotacaoFornecedor.DoesNotExist:
            return Response(
                {'error': 'Token inválido'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'GET':
            # Retornar dados da cotação para o fornecedor
            if not cotacao_fornecedor.data_visualizacao:
                cotacao_fornecedor.data_visualizacao = timezone.now()
                cotacao_fornecedor.status = 'Visualizada'
                cotacao_fornecedor.save()
            
            cotacao = cotacao_fornecedor.id_cotacao
            itens = CotacaoItem.objects.filter(id_cotacao=cotacao)
            
            data = {
                'cotacao': {
                    'numero_cotacao': cotacao.numero_cotacao,
                    'data_cotacao': cotacao.data_cotacao,
                    'prazo_resposta': cotacao.prazo_resposta,
                    'observacoes': cotacao.observacoes
                },
                'fornecedor': {
                    'nome': cotacao_fornecedor.id_fornecedor.nome_razao_social
                },
                'itens': [{
                    'id_cotacao_item': item.id_cotacao_item,
                    'produto': item.id_produto.nome_produto,
                    'unidade_medida': item.id_produto.unidade_medida,
                    'quantidade_solicitada': item.quantidade_solicitada,
                    'observacoes': item.observacoes
                } for item in itens],
                'respostas_enviadas': cotacao_fornecedor.status == 'Respondida'
            }
            
            return Response(data)
        
        elif request.method == 'POST':
            # Registrar respostas do fornecedor
            serializer = CotacaoRespostaPublicSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            try:
                with transaction.atomic():
                    # Deletar respostas antigas se existirem
                    CotacaoResposta.objects.filter(id_cotacao_fornecedor=cotacao_fornecedor).delete()
                    
                    # Criar novas respostas
                    for resposta_data in serializer.validated_data['respostas']:
                        CotacaoResposta.objects.create(
                            id_cotacao_fornecedor=cotacao_fornecedor,
                            id_cotacao_item_id=resposta_data['id_cotacao_item'],
                            valor_unitario=Decimal(resposta_data['valor_unitario']),
                            prazo_entrega_dias=resposta_data.get('prazo_entrega_dias'),
                            observacoes=resposta_data.get('observacoes', '')
                        )
                    
                    # Atualizar status do fornecedor
                    cotacao_fornecedor.data_resposta = timezone.now()
                    cotacao_fornecedor.status = 'Respondida'
                    cotacao_fornecedor.save()
                    
                    # Verificar se todos os fornecedores responderam
                    total_fornecedores = cotacao_fornecedor.id_cotacao.fornecedores.count()
                    respondidos = cotacao_fornecedor.id_cotacao.fornecedores.filter(status='Respondida').count()
                    
                    if respondidos == total_fornecedores:
                        cotacao_fornecedor.id_cotacao.status = 'Em Análise'
                        cotacao_fornecedor.id_cotacao.save()
                    
                    return Response({
                        'message': 'Respostas registradas com sucesso'
                    })
            
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    @action(detail=True, methods=['get'])
    def comparar_cotacoes(self, request, pk=None):
        """Comparar respostas dos fornecedores"""
        cotacao = self.get_object()
        
        if cotacao.status not in ['Em Análise', 'Finalizada']:
            return Response(
                {'error': 'Cotação ainda não está em análise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Estruturar dados para comparação
        itens = []
        for item in cotacao.itens.all():
            respostas = []
            menor_valor = None
            
            for resposta in item.respostas.all():
                resposta_data = {
                    'fornecedor': resposta.id_cotacao_fornecedor.id_fornecedor.nome_razao_social,
                    'id_fornecedor': resposta.id_cotacao_fornecedor.id_fornecedor.id_fornecedor,
                    'valor_unitario': resposta.valor_unitario,
                    'valor_total': resposta.valor_total,
                    'prazo_entrega_dias': resposta.prazo_entrega_dias,
                    'observacoes': resposta.observacoes,
                    'melhor_preco': False
                }
                
                if menor_valor is None or resposta.valor_unitario < menor_valor:
                    menor_valor = resposta.valor_unitario
                
                respostas.append(resposta_data)
            
            # Marcar melhor preço
            for resposta in respostas:
                if resposta['valor_unitario'] == menor_valor:
                    resposta['melhor_preco'] = True
            
            itens.append({
                'id_cotacao_item': item.id_cotacao_item,
                'produto': item.id_produto.nome_produto,
                'quantidade_solicitada': item.quantidade_solicitada,
                'unidade_medida': item.id_produto.unidade_medida,
                'respostas': respostas,
                'vencedor_atual': {
                    'id_fornecedor': item.fornecedor_vencedor.id_fornecedor if item.fornecedor_vencedor else None,
                    'valor': item.valor_vencedor
                } if item.fornecedor_vencedor else None
            })
        
        return Response({
            'cotacao': {
                'numero_cotacao': cotacao.numero_cotacao,
                'data_cotacao': cotacao.data_cotacao,
                'status': cotacao.status
            },
            'itens': itens
        })
    
    @action(detail=True, methods=['post'])
    def confirmar_vencedores(self, request, pk=None):
        """Confirmar vencedores e gerar pedido de compra"""
        cotacao = self.get_object()
        
        if cotacao.status != 'Em Análise':
            return Response(
                {'error': 'Cotação não está em análise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CotacaoConfirmarVencedorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                # Atualizar vencedores nos itens
                for vencedor_data in serializer.validated_data['vencedores']:
                    item = CotacaoItem.objects.get(id_cotacao_item=vencedor_data['id_cotacao_item'])
                    item.fornecedor_vencedor_id = vencedor_data['id_fornecedor']
                    item.valor_vencedor = Decimal(vencedor_data['valor_vencedor'])
                    item.save()
                
                # Atualizar status dos fornecedores
                fornecedores_vencedores = set([v['id_fornecedor'] for v in serializer.validated_data['vencedores']])
                
                for cotacao_fornecedor in cotacao.fornecedores.all():
                    if str(cotacao_fornecedor.id_fornecedor.id_fornecedor) in map(str, fornecedores_vencedores):
                        cotacao_fornecedor.status = 'Vencedor'
                    else:
                        cotacao_fornecedor.status = 'Não Vencedor'
                    cotacao_fornecedor.save()
                
                # Marcar cotação como finalizada
                cotacao.status = 'Finalizada'
                cotacao.save()
                
                # TODO: Enviar notificações apenas para vencedores
                # TODO: Gerar pedido de compra automaticamente (opcional)
                
                gerar_compra = request.data.get('gerar_compra', False)
                compra_criada = None
                
                if gerar_compra:
                    # Agrupar itens por fornecedor vencedor
                    itens_por_fornecedor = {}
                    for item in cotacao.itens.filter(fornecedor_vencedor__isnull=False):
                        fornecedor_id = item.fornecedor_vencedor.id_fornecedor
                        if fornecedor_id not in itens_por_fornecedor:
                            itens_por_fornecedor[fornecedor_id] = []
                        itens_por_fornecedor[fornecedor_id].append(item)
                    
                    # Criar uma compra para cada fornecedor
                    compras_criadas = []
                    for fornecedor_id, itens in itens_por_fornecedor.items():
                        compra = Compra.objects.create(
                            id_fornecedor_id=fornecedor_id,
                            data_compra=timezone.now().date(),
                            observacoes=f'Gerado automaticamente da cotação {cotacao.numero_cotacao}'
                        )
                        
                        for item in itens:
                            CompraItem.objects.create(
                                id_compra=compra,
                                id_produto=item.id_produto,
                                quantidade=item.quantidade_solicitada,
                                valor_unitario=item.valor_vencedor,
                                desconto=0
                            )
                        
                        compras_criadas.append({
                            'id_compra': compra.id_compra,
                            'fornecedor': compra.id_fornecedor.nome_razao_social
                        })
                    
                    compra_criada = compras_criadas
                
                return Response({
                    'message': 'Vencedores confirmados com sucesso',
                    'compras_criadas': compra_criada
                })
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar cotação"""
        cotacao = self.get_object()
        
        if cotacao.status == 'Finalizada':
            return Response(
                {'error': 'Não é possível cancelar uma cotação finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cotacao.status = 'Cancelada'
        cotacao.save()
        
        return Response({
            'message': 'Cotação cancelada com sucesso'
        })
