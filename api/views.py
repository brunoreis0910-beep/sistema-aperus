# Em: C:\Projetos\SistemaGerencial\api\views.py

from rest_framework import viewsets, generics, permissions, filters, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import re
import requests
from bs4 import BeautifulSoup
import json
try:
    from google import genai
    from google.genai import types
    from decouple import config as decouple_config
    GEMINI_API_KEY = decouple_config('GEMINI_API_KEY', default='')
except Exception:
    GEMINI_API_KEY = ''

from . import models  # Import do módulo models completo para referências models.X
from . import serializers  # Import do módulo serializers completo para referências serializers.X
from .models import (
    Cliente, GrupoProduto, Produto,
    Operacao, Departamento, CentroCusto, ContaBancaria,
    FinanceiroConta, EmpresaConfig,
    Funcao, Vendedor, UserParametros, UserPermissoes, SolicitacaoAprovacao,
    FormaPagamento,
    Deposito, Estoque, EstoqueMovimentacao,  # <-- NOVOS (Gestão de Estoque)
    Pet, TipoServico, Agendamento, Avaliacao, SessaoAgendamento,  # <-- NOVOS (Pet Shop)
    LogAuditoria,  # <-- NOVO (Auditoria)
    UserAtalho,
    MapaCarga, MapaCargaItem, ConfiguracaoBancaria, Boleto  # <-- Sistema de Logística e Boletos
)

from .serializers import (
    ClienteSerializer, 
    GrupoProdutoSerializer, 
    ProdutoSerializer, 
    OperacaoSerializer, 
    DepartamentoSerializer, 
    CentroCustoSerializer, 
    ContaBancariaSerializer, 
    FinanceiroContaSerializer,
    EmpresaConfigSerializer,
    FuncaoSerializer,
    VendedorSerializer,
    UserSerializer,
    SolicitacaoAprovacaoSerializer,
    FormaPagamentoSerializer,
    DepositoSerializer, EstoqueSerializer, EstoqueMovimentacaoSerializer,  # <-- NOVOS (Gestão de Estoque)
    PetSerializer, TipoServicoSerializer, AgendamentoSerializer, AvaliacaoSerializer, SessaoAgendamentoSerializer,  # <-- NOVOS (Pet Shop)
    LogAuditoriaSerializer,  # <-- NOVO (Auditoria)
    UserAtalhoSerializer
)

# Permissão customizada: permite GET sem autenticação, outras operações requerem login
class ReadOnlyOrAuthenticated(permissions.BasePermission):
    """
    Permite leitura (GET, HEAD, OPTIONS) sem autenticação.
    Outras operações (POST, PUT, PATCH, DELETE) requerem autenticação.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome_razao_social', 'cpf_cnpj', 'email']
    ordering_fields = ['nome_razao_social']

    def get_queryset(self):
        queryset = super().get_queryset()
        ativo = self.request.query_params.get('ativo')
        if ativo is not None:
            queryset = queryset.filter(ativo=ativo.lower() in ('true', '1', 'sim'))
        return queryset

    @action(detail=True, methods=['post'])
    def inativar(self, request, pk=None):
        from django.utils import timezone
        cliente = self.get_object()
        if not cliente.ativo:
            return Response({'erro': 'Cliente já está inativo.'}, status=status.HTTP_400_BAD_REQUEST)
        cliente.ativo = False
        cliente.data_inativacao = timezone.now()
        cliente.motivo_inativacao = request.data.get('observacoes', '')
        cliente.save(update_fields=['ativo', 'data_inativacao', 'motivo_inativacao'])
        return Response({'mensagem': f'Cliente {cliente.nome_razao_social} inativado com sucesso.'})

    @action(detail=True, methods=['post'])
    def reativar(self, request, pk=None):
        cliente = self.get_object()
        if cliente.ativo:
            return Response({'erro': 'Cliente já está ativo.'}, status=status.HTTP_400_BAD_REQUEST)
        cliente.ativo = True
        cliente.data_inativacao = None
        cliente.motivo_inativacao = None
        cliente.save(update_fields=['ativo', 'data_inativacao', 'motivo_inativacao'])
        return Response({'mensagem': f'Cliente {cliente.nome_razao_social} reativado com sucesso.'})

class GrupoProdutoViewSet(viewsets.ModelViewSet):
    queryset = GrupoProduto.objects.all()
    serializer_class = GrupoProdutoSerializer
    permission_classes = [ReadOnlyOrAuthenticated]  # Permite GET sem autenticação 
    pagination_class = None  # Retorna todos os grupos sem paginação

class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['codigo_produto', 'id_produto']
    search_fields = ['descricao', 'codigo_produto']
    ordering_fields = ['descricao', 'codigo_produto']
    
    def get_queryset(self):
        from django.db.models import Q, Sum
        queryset = super().get_queryset()
        
        # Filtro de pesquisa customizado
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(codigo_produto__icontains=search) |
                Q(nome_produto__icontains=search) |
                Q(descricao__icontains=search) |
                Q(marca__icontains=search) |
                Q(ncm__icontains=search) |
                Q(gtin__icontains=search)
            )
        
        # Filtro de data início (data de cadastro/criação)
        data_inicio = self.request.query_params.get('data_inicio', None)
        if data_inicio and hasattr(Produto, 'created_at'):
            queryset = queryset.filter(created_at__gte=data_inicio)
        
        # Filtro de data fim (data de cadastro/criação)
        data_fim = self.request.query_params.get('data_fim', None)
        if data_fim and hasattr(Produto, 'created_at'):
            queryset = queryset.filter(created_at__lte=data_fim)
        
        # Filtro de grupo
        grupo = self.request.query_params.get('grupo', None)
        if grupo:
            queryset = queryset.filter(id_grupo=grupo)
        
        # Filtro de status de estoque
        estoque_status = self.request.query_params.get('estoque_status', None)
        if estoque_status and estoque_status != 'todos':
            if estoque_status == 'disponivel':
                # Produtos com estoque > 0
                queryset = queryset.annotate(
                    estoque_total=Sum('produtodeposito__quantidade')
                ).filter(estoque_total__gt=0)
            elif estoque_status == 'baixo':
                # Produtos com estoque baixo (assumindo que existe campo quantidade_minima)
                queryset = queryset.annotate(
                    estoque_total=Sum('produtodeposito__quantidade')
                ).filter(
                    estoque_total__lte=models.F('produtodeposito__quantidade_minima'),
                    estoque_total__gt=0
                )
            elif estoque_status == 'zerado':
                # Produtos sem estoque
                queryset = queryset.annotate(
                    estoque_total=Sum('produtodeposito__quantidade')
                ).filter(Q(estoque_total=0) | Q(estoque_total__isnull=True))
        
        # Filtro por produto_pai (para buscar variações)
        produto_pai_id = self.request.query_params.get('produto_pai', None)
        if produto_pai_id:
            queryset = queryset.filter(produto_pai_id=produto_pai_id)

        # Limite de registros
        limit = self.request.query_params.get('limit', None)
        if limit and limit != 'unlimited':
            try:
                limit_int = int(limit)
                queryset = queryset[:limit_int]
            except ValueError:
                pass
        
        return queryset.order_by('-id_produto')
    
    @action(detail=False, methods=['get'], url_path='marcas', permission_classes=[ReadOnlyOrAuthenticated])
    def listar_marcas(self, request):
        """Retorna lista de marcas únicas de produtos"""
        marcas = Produto.objects.values_list('marca', flat=True).distinct().order_by('marca')
        # Filtrar valores vazios/nulos
        marcas_filtradas = [marca for marca in marcas if marca and marca.strip()]
        return Response(marcas_filtradas)
    
    @action(detail=False, methods=['get'], url_path='categorias', permission_classes=[ReadOnlyOrAuthenticated])
    def listar_categorias(self, request):
        """Retorna lista de categorias únicas de produtos"""
        categorias = Produto.objects.values_list('classificacao', flat=True).distinct().order_by('classificacao')
        # Filtrar valores vazios/nulos
        categorias_filtradas = [cat for cat in categorias if cat and cat.strip()]
        return Response(categorias_filtradas)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

class FinanceiroContaViewSet(viewsets.ModelViewSet):
    queryset = FinanceiroConta.objects.all().order_by('-id_conta')  # Ordenar por ID decrescente (mais recentes primeiro)
    serializer_class = FinanceiroContaSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = {
        'tipo_conta': ['exact'],
        'status_conta': ['exact'],
        'data_pagamento': ['gte', 'lte', 'exact'],
        'data_vencimento': ['gte', 'lte', 'exact'],
        'id_conta_baixa': ['exact'],
        'id_venda_origem': ['exact'],  # Adicionado para filtrar por venda
        'id_compra_origem': ['exact'],  # Adicionado para filtrar por compra
        'id_cliente_fornecedor': ['exact'],  # Adicionado para filtrar por cliente/fornecedor
    }
    ordering_fields = ['data_vencimento', 'data_pagamento', 'descricao']

    def create(self, request, *args, **kwargs):
        # Popula forma_pagamento (CharField) a partir do id_forma_pagamento recebido no payload
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        id_forma_pag = data.get('id_forma_pagamento')
        forma_pagamento_obj = None
        if id_forma_pag:
            from .models import FormaPagamento
            forma_pagamento_obj = FormaPagamento.objects.filter(pk=id_forma_pag).first()
            if forma_pagamento_obj and not data.get('forma_pagamento'):
                data['forma_pagamento'] = forma_pagamento_obj.nome_forma
        elif data.get('forma_pagamento'):
            # Fallback: busca pelo nome quando id_forma_pagamento não foi enviado (ex: Vendas.jsx)
            from .models import FormaPagamento
            nome_forma = str(data['forma_pagamento']).strip()
            forma_pagamento_obj = FormaPagamento.objects.filter(nome_forma__iexact=nome_forma).first()

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        fin = serializer.save()

        # Cria RecebimentoCartao automaticamente se a forma de pagamento tem taxa de operadora
        if (forma_pagamento_obj and
                fin.tipo_conta.lower() == 'receber' and
                forma_pagamento_obj.taxa_operadora and
                forma_pagamento_obj.taxa_operadora > 0):
            from decimal import Decimal
            from datetime import timedelta
            from .models import RecebimentoCartao, Venda
            taxa = Decimal(str(forma_pagamento_obj.taxa_operadora))
            dias_repasse = int(forma_pagamento_obj.dias_repasse or 1)
            valor_bruto = fin.valor_parcela
            valor_taxa = (valor_bruto * taxa / Decimal('100')).quantize(Decimal('0.01'))
            valor_liquido = valor_bruto - valor_taxa
            data_venda = fin.data_emissao
            data_previsao = data_venda + timedelta(days=dias_repasse)
            codigo_tpag = forma_pagamento_obj.codigo_t_pag or '99'
            tipo_cartao = 'DEBITO' if codigo_tpag == '04' else 'CREDITO'
            venda_obj = None
            if fin.id_venda_origem:
                venda_obj = Venda.objects.filter(pk=fin.id_venda_origem).first()
            RecebimentoCartao.objects.create(
                id_venda=venda_obj,
                id_financeiro=fin,
                data_venda=data_venda,
                valor_bruto=valor_bruto,
                taxa_percentual=taxa,
                valor_taxa=valor_taxa,
                valor_liquido=valor_liquido,
                data_previsao=data_previsao,
                bandeira=forma_pagamento_obj.nome_forma,
                tipo_cartao=tipo_cartao,
                status='PENDENTE',
            )
            print(f'[FINANCEIRO] RecebimentoCartao gerado: {forma_pagamento_obj.nome_forma} - R${valor_bruto} (taxa {taxa}%)')

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def estornar(self, request, pk=None):
        from decimal import Decimal
        conta = self.get_object()

        if conta.status_conta != 'Paga':
            return Response({'error': 'Somente contas pagas podem ser estornadas.'}, status=status.HTTP_400_BAD_REQUEST)

        # Cria lançamento de estorno no bancário
        if conta.id_conta_baixa:
            # Para contas a receber: cria débito (Pagar)
            # Para contas a pagar: cria crédito (Receber)
            tipo_estorno = 'Pagar' if conta.tipo_conta == 'Receber' else 'Receber'
            
            conta_estorno = FinanceiroConta.objects.create(
                tipo_conta=tipo_estorno,
                descricao=f'ESTORNO - {conta.descricao}',
                valor_parcela=conta.valor_liquidado,
                valor_liquidado=conta.valor_liquidado,
                data_emissao=timezone.now().date(),
                data_vencimento=timezone.now().date(),
                data_pagamento=timezone.now().date(),
                status_conta='Paga',
                id_conta_baixa=conta.id_conta_baixa,
                forma_pagamento=conta.forma_pagamento,
                documento_numero=f'ESTORNO-{conta.documento_numero or conta.id_conta}',
                parcela_numero=1,
                parcela_total=1,
                gerencial=1
            )
            # Usar _id para evitar problema de ForeignKey
            if conta.id_cliente_fornecedor_id:
                conta_estorno.id_cliente_fornecedor_id = conta.id_cliente_fornecedor_id
                conta_estorno.save()

        # Volta a conta para pendente
        conta.status_conta = 'Pendente'
        conta.data_pagamento = None
        conta.valor_liquidado = Decimal('0.00')
        conta.valor_juros = Decimal('0.00')
        conta.valor_multa = Decimal('0.00')
        conta.valor_desconto = Decimal('0.00')
        conta.id_conta_baixa = None
        # conta.forma_pagamento = None  # Preservada para facilitar nova baixa
        conta.save()

        return Response({'message': 'Estorno realizado com sucesso'}, status=status.HTTP_200_OK)


    def destroy(self, request, *args, **kwargs):
        # BLOQUEIA exclusão de contas pagas para TODOS (incluindo admin)
        conta = self.get_object()
        if conta.status_conta == 'Paga':
            return Response(
                {'error': 'Não é permitido excluir contas pagas. Use o botão ESTORNO para reverter o pagamento.'},
                status=status.HTTP_403_FORBIDDEN
            )
                
        return super().destroy(request, *args, **kwargs)
class OperacaoViewSet(viewsets.ModelViewSet):
    queryset = Operacao.objects.all()
    serializer_class = OperacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None # Retorna todos os registros sem paginacao
    
    def retrieve(self, request, *args, **kwargs):
        """Customiza o retrieve para logar os valores retornados"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Log detalhado dos valores
        print(f"[BUSCA] RETRIEVE Operacao ID {instance.id_operacao}:")
        print(f"   - nome: {instance.nome_operacao}")
        print(f"   - validar_estoque (MODEL): {instance.validar_estoque}")
        print(f"   - acao_estoque (MODEL): {instance.acao_estoque}")
        print(f"   - validar_estoque (SERIALIZER): {serializer.data.get('validar_estoque')}")
        print(f"   - acao_estoque (SERIALIZER): {serializer.data.get('acao_estoque')}")
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Intercepta IntegrityError em exclusões e retorna um erro legível ao frontend.

        Motivo: em produção algumas tabelas legacy têm constraints que causam
        tentativa de setar id_operacao=NULL em colunas NOT NULL, gerando 500.
        Capturamos o erro e retornamos 400 com a mensagem SQL para diagnóstico.
        """
        from django.db import IntegrityError

        operacao = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except IntegrityError as ie:
            # Não re-levantar para evitar 500; devolve payload legível para frontend/dev
            return Response({
                'error': 'IntegrityError',
                'detail': str(ie),
                'message': 'Exclusão bloqueada por restrição de integridade referencial. Verifique colunas id_operacao não nulas em tabelas relacionadas.'
            }, status=status.HTTP_400_BAD_REQUEST)

class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

class CentroCustoViewSet(viewsets.ModelViewSet):
    queryset = CentroCusto.objects.all()
    serializer_class = CentroCustoSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContaBancariaViewSet(viewsets.ModelViewSet):
    queryset = ContaBancaria.objects.all()
    serializer_class = ContaBancariaSerializer
    permission_classes = [permissions.IsAuthenticated]

class EmpresaConfigViewSet(viewsets.ModelViewSet):
    # Alterado para 'id_empresa' (ASC) para garantir que retornamos a configuração original (ID 1)
    # que é a mesma editada pela visualização ConfigNFceView.
    queryset = EmpresaConfig.objects.all().order_by('id_empresa')
    serializer_class = EmpresaConfigSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        response = super().list(request, *args, **kwargs)
        
        # Log para debug
        if response.data and len(response.data.get('results', [])) > 0:
            config = response.data['results'][0]
            logger.info(f"API EMPRESA GET: sped_conjuntos_selecionados = '{config.get('sped_conjuntos_selecionados')}'")
        
        return response

    @action(detail=False, methods=['post', 'patch'])
    def atualizar_inscricao_municipal(self, request):
        """Endpoint para atualizar inscrição municipal"""
        inscricao = request.data.get('inscricao_municipal')
        
        if not inscricao:
            return Response({'error': 'inscricao_municipal é obrigatório'}, status=400)
        
        try:
            config = EmpresaConfig.get_ativa()
            if not config:
                return Response({'error': 'Configuração da empresa não encontrada'}, status=404)
            
            config.inscricao_municipal = inscricao
            config.save()
            
            return Response({
                'success': True,
                'inscricao_municipal': config.inscricao_municipal,
                'message': 'Inscrição municipal atualizada com sucesso'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=False, methods=['post'])
    def upload_logo(self, request):
        """Endpoint para fazer upload da logo da empresa"""
        import os
        from django.conf import settings
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        
        logo_file = request.FILES.get('logo')
        if not logo_file:
            return Response({'error': 'Nenhum arquivo enviado'}, status=400)
        
        # Validar extensão
        allowed_extensions = ['.png', '.jpg', '.jpeg', '.gif']
        file_extension = os.path.splitext(logo_file.name)[1].lower()
        if file_extension not in allowed_extensions:
            return Response({'error': 'Formato não suportado. Use PNG, JPG ou GIF'}, status=400)
        
        # Criar pasta logos se não existir
        logos_dir = os.path.join(settings.BASE_DIR, 'frontend', 'public', 'logos')
        os.makedirs(logos_dir, exist_ok=True)
        
        # Salvar arquivo com nome fixo 'logo' + extensão
        filename = f'logo{file_extension}'
        filepath = os.path.join(logos_dir, filename)
        
        # Salvar o arquivo
        with open(filepath, 'wb+') as destination:
            for chunk in logo_file.chunks():
                destination.write(chunk)
        
        return Response({
            'success': True,
            'filename': filename,
            'path': f'/logos/{filename}'
        })

    @action(detail=False, methods=['post'], url_path='proximo_numero_nfe')
    def proximo_numero_nfe(self, request):
        """
        Reserva e retorna o próximo número de NF-e (Modelo 55) de forma thread-safe.
        Incrementa ultimo_numero_nfe via SELECT FOR UPDATE para evitar duplicidade.

        Retorna:
          { "numero": <int>, "serie": "<str>" }
        """
        try:
            config = EmpresaConfig.get_ativa()
            if not config:
                return Response({'error': 'Configuração da empresa não encontrada'}, status=404)

            numero = config.proximo_numero_nfe()
            return Response({
                'numero': numero,
                'serie': config.serie_nfe_padrao or '1',
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class FuncaoViewSet(viewsets.ModelViewSet):
    queryset = Funcao.objects.all()
    serializer_class = FuncaoSerializer
    permission_classes = [permissions.IsAuthenticated]

class VendedorViewSet(viewsets.ModelViewSet):
    serializer_class = VendedorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Vendedor.objects.all()
        funcao = self.request.query_params.get('funcao', None)
        if funcao:
            queryset = queryset.filter(funcoes__nome_funcao__iexact=funcao)
        return queryset

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated] 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_staff'] 

    def destroy(self, request, *args, **kwargs):
        from django.db.models import ProtectedError
        from django.db import IntegrityError, OperationalError, ProgrammingError
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            return Response(
                {'detail': f'Não é possível excluir o usuário "{instance.username}" pois existem registros vinculados (caixa, aluguéis, etc). Desative o usuário ao invés de excluí-lo.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except (IntegrityError, OperationalError, ProgrammingError) as e:
            return Response(
                {'detail': f'Não é possível excluir o usuário "{instance.username}" pois existem registros vinculados no banco de dados. Desative o usuário ao invés de excluí-lo.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'detail': f'Erro ao excluir o usuário "{instance.username}": {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserMeView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user 


@method_decorator(csrf_exempt, name='dispatch')
class UserParametrosView(generics.RetrieveAPIView):
    """
    Retorna os parâmetros do usuário logado com dados de operação e vendedor
    """
    authentication_classes = [JWTAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [permissions.AllowAny]
    
    def retrieve(self, request, *args, **kwargs):
        user = request.user
        
        # Debug para verificar usuário recebido
        print(f"UserParametrosView - User: {user} | Auth: {user.is_authenticated}")

        if not user.is_authenticated:
            return Response({
                'usuario': {'id': None, 'username': 'Visitante (Não Autenticado)'},
                'operacao': {'nome': 'Realize login para carregar'},
                'vendedor': {'nome': 'Realize login para carregar'},
                'debug_auth': 'Falha de autenticação - Cookies não recebidos'
            }, status=200) # Retorna 200 para o frontend não dar erro de console e mostrar a msg
        
        try:
            parametros = UserParametros.objects.get(id_user=user)

        except UserParametros.DoesNotExist:
            return Response({
                'operacao': None,
                'vendedor': None,
                'usuario': {
                    'id': user.id,
                    'username': user.username
                }
            })
        
        # Montar resposta com operação e vendedor
        response_data = {
            'usuario': {
                'id': user.id,
                'username': user.username
            }
        }
        
        # Operação NFCe
        if parametros.id_operacao_nfce:
            operacao = parametros.id_operacao_nfce  # É um ForeignKey, já retorna o objeto
            response_data['operacao'] = {
                'id': operacao.id_operacao,
                'nome': operacao.nome_operacao,
                'abreviacao': operacao.abreviacao if hasattr(operacao, 'abreviacao') else ''
            }
        else:
            response_data['operacao'] = None
        
        # Vendedor NFCe
        if parametros.id_vendedor_nfce:
            vendedor = parametros.id_vendedor_nfce  # É um ForeignKey, já retorna o objeto
            response_data['vendedor'] = {
                'id': vendedor.id_vendedor,
                'nome': vendedor.nome  # Campo correto é 'nome'
            }
        else:
            response_data['vendedor'] = None
        
        return Response(response_data)


class SolicitacaoAprovacaoViewSet(viewsets.ModelViewSet):
    queryset = SolicitacaoAprovacao.objects.all()
    serializer_class = SolicitacaoAprovacaoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Retorna solicitações baseado no tipo de usuário:
        - Supervisor: vê solicitações pendentes direcionadas a ele
        - Usuário comum: vê suas próprias solicitações
        """
        user = self.request.user
        
        # Se for staff, vê tudo
        if user.is_staff:
            return SolicitacaoAprovacao.objects.all()
        
        # Se for supervisor, vê solicitações para ele
        solicitacoes_supervisor = SolicitacaoAprovacao.objects.filter(
            id_usuario_supervisor=user
        )
        
        # Vê também suas próprias solicitações
        solicitacoes_proprias = SolicitacaoAprovacao.objects.filter(
            id_usuario_solicitante=user
        )
        
        return (solicitacoes_supervisor | solicitacoes_proprias).distinct()

    def perform_create(self, serializer):
        serializer.save(id_usuario_solicitante=self.request.user)

    def get_serializer_context(self):
        return {'request': self.request}

    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        """Aprova uma solicitação pendente"""
        from datetime import datetime
        import json
        
        try:
            solicitacao = self.get_object()
            
            # Verificar se o usuário é o supervisor
            if solicitacao.id_usuario_supervisor != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Você não tem permissão para aprovar esta solicitação'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if solicitacao.status != 'Pendente':
                return Response(
                    {'error': f'Solicitação já está com status: {solicitacao.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Aprovar
            solicitacao.status = 'Aprovada'
            solicitacao.data_aprovacao = datetime.now()
            solicitacao.observacao_supervisor = request.data.get('observacao', '')
            solicitacao.save()
            
            serializer = self.get_serializer(solicitacao)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao aprovar solicitação: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def rejeitar(self, request, pk=None):
        """Rejeita uma solicitação pendente"""
        from datetime import datetime
        
        try:
            solicitacao = self.get_object()
            
            # Verificar se o usuário é o supervisor
            if solicitacao.id_usuario_supervisor != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Você não tem permissão para rejeitar esta solicitação'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if solicitacao.status != 'Pendente':
                return Response(
                    {'error': f'Solicitação já está com status: {solicitacao.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Rejeitar
            solicitacao.status = 'Rejeitada'
            solicitacao.data_aprovacao = datetime.now()
            solicitacao.observacao_supervisor = request.data.get('observacao', '')
            solicitacao.save()
            
            serializer = self.get_serializer(solicitacao)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao rejeitar solicitação: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def pendentes(self, request):
        """Lista apenas solicitações pendentes para o supervisor"""
        user = request.user
        queryset = SolicitacaoAprovacao.objects.filter(
            id_usuario_supervisor=user,
            status='Pendente'
        ).order_by('-data_solicitacao')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def minhas_solicitacoes(self, request):
        """Lista solicitações criadas pelo usuário logado"""
        user = request.user
        queryset = SolicitacaoAprovacao.objects.filter(
            id_usuario_solicitante=user
        ).order_by('-data_solicitacao')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# --- ViewSet ATUALIZADA ---
class FormaPagamentoViewSet(viewsets.ModelViewSet):
    queryset = FormaPagamento.objects.all()
    serializer_class = FormaPagamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- 4. VIEWSETS DE GESTÃO DE ESTOQUE ---

class DepositoViewSet(viewsets.ModelViewSet):
    """ViewSet para Depósitos.

    Removido o tratamento temporário de ProgrammingError — a tabela `depositos`
    deve existir (migrações aplicadas ou criada manualmente). Mantemos a
    configuração padrão do ModelViewSet.
    """
    queryset = Deposito.objects.all()
    serializer_class = DepositoSerializer
    permission_classes = [ReadOnlyOrAuthenticated]  # Permite GET sem autenticação
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estoque_baixo', 'estoque_incremento']
    search_fields = ['nome_deposito', 'descricao']
    ordering_fields = ['nome_deposito', 'data_criacao']
    ordering = ['nome_deposito']

class EstoqueViewSet(viewsets.ModelViewSet):
    queryset = Estoque.objects.select_related('id_produto', 'id_deposito').all()
    serializer_class = EstoqueSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_produto', 'id_deposito']
    search_fields = ['id_produto__nome_produto', 'id_produto__codigo_produto', 'id_deposito__nome_deposito']
    ordering_fields = ['quantidade', 'quantidade_minima']
    ordering = ['id_estoque']

    def get_queryset(self):
        """Otimizar queryset com relacionamentos"""
        return super().get_queryset().select_related(
            'id_produto__id_grupo',
            'id_deposito'
        )
    
    def create(self, request, *args, **kwargs):
        """
        Sobrescreve create para permitir update caso o registro ja exista (upsert)
        Evita erro 400 se o frontend tentar criar um estoque que ja existe.
        """
        id_produto = request.data.get('id_produto')
        id_deposito = request.data.get('id_deposito')

        # Se temos os IDs unicos, tentamos encontrar o objeto existente
        if id_produto and id_deposito:
            try:
                instance = Estoque.objects.get(id_produto=id_produto, id_deposito=id_deposito)
                # Se existe, atualizamos (PUT parcial)
                serializer = self.get_serializer(instance, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(serializer.data)
            except Estoque.DoesNotExist:
                # Se nao existe, continua com create padrao
                pass
        
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def ajustar(self, request):
        """
        Ajusta a quantidade de estoque para um valor específico.
        Cria movimentação de ajuste (entrada ou saída).
        
        Payload esperado:
        {
            "id_produto": 1,
            "id_deposito": 1,
            "quantidade_nova": 10,
            "observacoes": "Ajuste de inventário"
        }
        """
        from decimal import Decimal
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f'? Recebido request de ajuste: {request.data}')
        
        id_produto = request.data.get('id_produto')
        id_deposito = request.data.get('id_deposito')
        quantidade_nova = request.data.get('quantidade_nova')
        observacoes = request.data.get('observacoes', 'Ajuste manual de estoque')
        
        logger.info(f'Dados extraídos - Produto: {id_produto}, Depósito: {id_deposito}, Qtd: {quantidade_nova}')
        
        if not all([id_produto, id_deposito, quantidade_nova is not None]):
            logger.error('Dados incompletos no request')
            return Response(
                {'error': 'Informe id_produto, id_deposito e quantidade_nova'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantidade_nova = Decimal(str(quantidade_nova))
            if quantidade_nova < 0:
                logger.error(f'Quantidade negativa: {quantidade_nova}')
                return Response(
                    {'error': 'Quantidade não pode ser negativa'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f'Erro ao converter quantidade: {e}')
            return Response(
                {'error': 'Quantidade inválida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Buscar ou criar registro de estoque
            logger.info(f'Buscando/criando estoque para produto {id_produto} e depósito {id_deposito}')
            estoque, created = Estoque.objects.get_or_create(
                id_produto_id=id_produto,
                id_deposito_id=id_deposito,
                defaults={'quantidade': Decimal('0')}
            )
            logger.info(f'Estoque {"criado" if created else "encontrado"}: {estoque.id_estoque}')
            
            quantidade_anterior = estoque.quantidade
            diferenca = quantidade_nova - quantidade_anterior
            
            logger.info(f'Quantidade anterior: {quantidade_anterior}, Nova: {quantidade_nova}, Diferença: {diferenca}')
            
            # Atualizar quantidade
            estoque.quantidade = quantidade_nova
            estoque.save()
            logger.info(f'Estoque atualizado com sucesso')
            
            # Criar movimentação com os campos corretos do modelo
            tipo_mov = 'ENTRADA' if diferenca > 0 else 'SAIDA' if diferenca < 0 else 'AJUSTE'
            quantidade_mov = abs(diferenca)
            
            if diferenca != 0:
                logger.info(f'Criando movimentação: {tipo_mov} de {quantidade_mov}')
                EstoqueMovimentacao.objects.create(
                    id_estoque=estoque,
                    id_produto_id=id_produto,
                    id_deposito_id=id_deposito,
                    tipo_movimentacao=tipo_mov,
                    quantidade_anterior=quantidade_anterior,
                    quantidade_movimentada=quantidade_mov,
                    quantidade_atual=quantidade_nova,
                    custo_unitario=Decimal('0'),
                    valor_total=Decimal('0'),
                    documento_numero='AJUSTE-MANUAL',
                    documento_tipo='AJUSTE',
                    observacoes=f'{observacoes} (Anterior: {quantidade_anterior}, Nova: {quantidade_nova})',
                    usuario_responsavel=request.user.username
                )
                logger.info('Movimentação criada com sucesso')
            
            response_data = {
                'message': 'Estoque ajustado com sucesso',
                'quantidade_anterior': float(quantidade_anterior),
                'quantidade_nova': float(quantidade_nova),
                'diferenca': float(diferenca),
                'tipo_movimentacao': tipo_mov
            }
            logger.info(f'[OK] Ajuste concluído: {response_data}')
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'[ERRO] Erro ao processar ajuste: {str(e)}', exc_info=True)
            return Response(
                {'error': f'Erro ao processar ajuste: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EstoqueMovimentacaoViewSet(viewsets.ModelViewSet):
    queryset = EstoqueMovimentacao.objects.select_related('id_estoque__id_produto', 'id_estoque__id_deposito', 'id_produto', 'id_deposito').all()
    serializer_class = EstoqueMovimentacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_estoque', 'tipo_movimentacao', 'id_produto', 'id_deposito']
    search_fields = ['observacoes', 'documento_numero', 'id_produto__nome_produto', 'usuario_responsavel']
    ordering_fields = ['data_movimentacao', 'quantidade_movimentada']
    ordering = ['-data_movimentacao']

    def get_queryset(self):
        """Otimizar queryset com relacionamentos"""
        return super().get_queryset().select_related(
            'id_estoque__id_produto__id_grupo',
            'id_estoque__id_deposito',
            'id_produto__id_grupo',
            'id_deposito'
        )

    def perform_create(self, serializer):
        """Definir automaticamente o usuário responsável"""
        serializer.save(usuario_responsavel=self.request.user.username)


# API para consultar placas de veículos
@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Permitir sem autenticação para testes
def consultar_placa(request, placa):
    """
    Endpoint para consultar dados de veículos por placa.
    Evita problemas de CORS fazendo a requisição pelo backend.
    """
    try:
        # Limpar placa (remover caracteres especiais)
        placa_limpa = ''.join(filter(str.isalnum, placa.upper()))
        
        if len(placa_limpa) < 7:
            return Response(
                {'error': 'Placa inválida. Deve ter no mínimo 7 caracteres.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tentar múltiplas APIs em sequência (todas gratuitas, sem token)
        dados_veiculo = None

        # API 0: Gemini + Google Search (mais atualizado, gratuito com cota)
        if GEMINI_API_KEY and not dados_veiculo:
            try:
                gemini_client = genai.Client(api_key=GEMINI_API_KEY)
                prompt = (
                    f'Consulte no SINTEGRA ou DETRAN dados do veículo com placa brasileira {placa_limpa}. '
                    f'Retorne APENAS um JSON válido (sem markdown, sem explicação) com exatamente estas chaves: '
                    f'marca, modelo, ano, cor, combustivel, tipo_veiculo, chassi, renavam, municipio, uf, motor. '
                    f'Se não encontrar dados reais, retorne {{"erro": "nao_encontrado"}}.'
                )
                response = gemini_client.models.generate_content(
                    model='models/gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(google_search=types.GoogleSearch())],
                        temperature=0.1,
                    )
                )
                raw_text = getattr(response, 'text', None) or ''
                print(f'[Gemini placa] Resposta bruta: {raw_text[:500]}')
                texto = raw_text.strip()
                # Extrair JSON do texto (Gemini pode retornar texto com JSON embutido)
                inicio = texto.find('{')
                fim = texto.rfind('}')
                if inicio != -1 and fim != -1 and fim > inicio:
                    texto = texto[inicio:fim + 1]
                data = json.loads(texto)
                if isinstance(data, dict) and not data.get('erro') and (data.get('marca') or data.get('modelo')):
                    dados_veiculo = {
                        'placa': placa_limpa,
                        'marca': data.get('marca', ''),
                        'modelo': data.get('modelo', ''),
                        'ano': str(data.get('ano', '')),
                        'ano_modelo': str(data.get('ano_modelo', '') or data.get('ano', '')),
                        'cor': data.get('cor', ''),
                        'combustivel': data.get('combustivel', ''),
                        'tipo_veiculo': data.get('tipo_veiculo', ''),
                        'chassi': data.get('chassi', ''),
                        'renavam': str(data.get('renavam', '')),
                        'municipio': data.get('municipio', ''),
                        'uf': data.get('uf', ''),
                        'motor': data.get('motor', ''),
                        'potencia': data.get('potencia', ''),
                        'cilindradas': data.get('cilindradas', ''),
                        'fonte': 'Gemini + Google Search'
                    }
                    print(f'[OK] Dados via Gemini: {dados_veiculo}')
            except Exception as e:
                print(f'Erro no Gemini: {e}')

        # API 1: BrasilAPI (DENATRAN) — gratuita, sem autenticação, fonte oficial
        if not dados_veiculo:
            try:
                url_brasil_api = f'https://brasilapi.com.br/api/veiculo/v1/{placa_limpa}'
                response = requests.get(url_brasil_api, headers={'Accept': 'application/json'}, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data and isinstance(data, dict) and (data.get('marca') or data.get('modelo')):
                        dados_veiculo = {
                            'placa': placa_limpa,
                            'marca': data.get('marca', ''),
                            'modelo': data.get('modelo', ''),
                            'ano': str(data.get('ano', '') or data.get('anoFabricacao', '') or data.get('ano_fabricacao', '')),
                            'ano_modelo': str(data.get('ano_modelo', '') or data.get('anoModelo', '')),
                            'cor': data.get('cor', ''),
                            'combustivel': data.get('combustivel', ''),
                            'tipo_veiculo': data.get('tipo', ''),
                            'chassi': data.get('chassi', ''),
                            'renavam': str(data.get('renavam', '')),
                            'municipio': data.get('municipio', '') or data.get('municipioEmplacamento', ''),
                            'uf': data.get('uf', '') or data.get('ufEmplacamento', ''),
                            'motor': data.get('motor', ''),
                            'potencia': data.get('potencia', ''),
                            'cilindradas': data.get('cilindradas', ''),
                            'fonte': 'BrasilAPI (DENATRAN)'
                        }
                        print(f'[OK] Dados BrasilAPI: {dados_veiculo}')
            except Exception as e:
                print(f'Erro na BrasilAPI: {e}')

        # API 2: FIPE API (Parallelum) — gratuita, sem autenticação
        # Obs: retorna dados cadastrais a partir da placa via endpoint não oficial
        if not dados_veiculo:
            try:
                url_fipe = f'https://veiculos.fipe.org.br/api/veiculos/ConsultarInformacoesPlaca'
                payload = {'codigoTabelaReferencia': 0, 'placa': placa_limpa}
                headers_fipe = {
                    'Content-Type': 'application/json',
                    'Referer': 'https://veiculos.fipe.org.br/',
                    'User-Agent': 'Mozilla/5.0'
                }
                response = requests.post(url_fipe, json=payload, headers=headers_fipe, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict) and data.get('Marca'):
                        dados_veiculo = {
                            'placa': placa_limpa,
                            'marca': data.get('Marca', ''),
                            'modelo': data.get('Modelo', ''),
                            'ano': str(data.get('AnoFabricacao', '')),
                            'ano_modelo': str(data.get('AnoModelo', '')),
                            'cor': data.get('Cor', ''),
                            'combustivel': data.get('Combustivel', ''),
                            'tipo_veiculo': data.get('TipoVeiculo', ''),
                            'chassi': data.get('Chassi', ''),
                            'renavam': str(data.get('Renavam', '')),
                            'municipio': data.get('Municipio', ''),
                            'uf': data.get('UF', ''),
                            'motor': data.get('Motor', ''),
                            'potencia': data.get('Potencia', ''),
                            'cilindradas': data.get('Cilindradas', ''),
                            'fonte': 'FIPE API'
                        }
                        print(f'[OK] Dados FIPE API: {dados_veiculo}')
            except Exception as e:
                print(f'Erro na FIPE API: {e}')

        # API 3: WD API (fallback gratuito)
        if not dados_veiculo:
            try:
                url_consulta = f'https://wdapi2.com.br/consulta/{placa_limpa}/99999999999999999999999999999999'
                response = requests.get(url_consulta, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data and not data.get('erro'):
                        dados_veiculo = {
                            'placa': placa_limpa,
                            'marca': data.get('MARCA', '') or data.get('marca', ''),
                            'modelo': data.get('MODELO', '') or data.get('modelo', ''),
                            'ano': str(data.get('ano', '') or data.get('ANO', '') or data.get('anoFabricacao', '')),
                            'ano_modelo': str(data.get('anoModelo', '') or data.get('ano_modelo', '')),
                            'cor': data.get('cor', '') or data.get('COR', ''),
                            'chassi': data.get('chassi', '') or data.get('CHASSI', ''),
                            'renavam': str(data.get('renavam', '') or data.get('RENAVAM', '')),
                            'combustivel': data.get('combustivel', '') or data.get('COMBUSTIVEL', ''),
                            'tipo_veiculo': data.get('tipo', '') or data.get('TIPO', ''),
                            'municipio': data.get('municipio', '') or data.get('MUNICIPIO', ''),
                            'uf': data.get('uf', '') or data.get('UF', ''),
                            'motor': data.get('motor', ''),
                            'potencia': data.get('potencia', ''),
                            'cilindradas': data.get('cilindradas', ''),
                            'fonte': 'WD API'
                        }
                        print(f'[OK] Dados WD API: {dados_veiculo}')
            except Exception as e:
                print(f'Erro na WD API: {e}')
        
        if dados_veiculo:
            return Response(dados_veiculo, status=status.HTTP_200_OK)
        else:
            # Retorna 200 com dados parciais (somente a placa) para que o
            # frontend consiga ao menos preencher o campo placa e deixar
            # o usuário completar os demais campos manualmente.
            return Response(
                {
                    'placa': placa_limpa,
                    'marca': '',
                    'modelo': '',
                    'ano': '',
                    'cor': '',
                    'combustivel': '',
                    'tipo_veiculo': '',
                    'chassi': '',
                    'renavam': '',
                    'municipio': '',
                    'uf': '',
                    'motor': '',
                    'potencia': '',
                    'cilindradas': '',
                    'fonte': 'Não encontrado — preencha manualmente',
                    'nao_encontrado': True
                },
                status=status.HTTP_200_OK
            )
            
    except Exception as e:
        return Response(
            {'error': f'Erro ao consultar placa: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# API para consultar dados de CNPJ (com fallback e retry - "Mal Tratativa")
@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Dados públicos, não requer autenticação
def consultar_cnpj(request, cnpj):
    """
    Endpoint para consultar dados de CNPJ em múltiplas APIs públicas.
    Tenta contornar instabilidades e falta de dados de endereço.
    """
    import re
    try:
        # Limpar CNPJ (apenas números)
        cnpj_limpo = re.sub(r'[^0-9]', '', str(cnpj))
        
        if len(cnpj_limpo) != 14:
            return Response(
                {'error': 'CNPJ inválido. Deve ter 14 dígitos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        dados_empresa = None
        erro_ultima_tentativa = None

        # Tentativa 1: ReceitaWS (Mais confiável para endereço completo)
        try:
            print(f"[BUSCA] Consultando CNPJ {cnpj_limpo} na ReceitaWS...")
            url_receitaws = f'https://www.receitaws.com.br/v1/cnpj/{cnpj_limpo}'
            response = requests.get(url_receitaws, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') != 'ERROR':
                    # Formatar endereço completo
                    endereco_completo = f"{data.get('logradouro', '')}, {data.get('numero', 's/n')}"
                    if data.get('complemento'):
                        endereco_completo += f" - {data.get('complemento')}"
                    endereco_completo += f" - {data.get('bairro', '')} - {data.get('municipio', '')}/{data.get('uf', '')}"
                    
                    # Extrair atividade principal (é uma lista de dicts na ReceitaWS)
                    atividade = ''
                    if data.get('atividade_principal'):
                        atividade = data.get('atividade_principal')[0].get('text', '')

                    dados_empresa = {
                        'cnpj': cnpj_limpo,
                        'razao_social': data.get('nome', ''),
                        'nome_fantasia': data.get('fantasia', '') or data.get('nome', ''),
                        'logradouro': data.get('logradouro', ''),
                        'numero': data.get('numero', ''),
                        'complemento': data.get('complemento', ''),
                        'bairro': data.get('bairro', ''),
                        'cidade': data.get('municipio', ''),
                        'municipio': data.get('municipio', ''),
                        'uf': data.get('uf', ''),
                        'cep': re.sub(r'[^0-9]', '', data.get('cep', '')),
                        'telefone': data.get('telefone', ''),
                        'email': data.get('email', ''),
                        'atividade_principal': atividade,
                        'data_abertura': data.get('abertura', ''),
                        'situacao': data.get('situacao', ''),
                        'endereco_completo': endereco_completo,
                        'codigo_municipio_ibge': '',
                        'cnae_fiscal': '',
                        'fonte': 'ReceitaWS'
                    }
                    print(f"[OK] CNPJ encontrado na ReceitaWS: {dados_empresa.get('razao_social')}")
                    
                    # ⚠️ IMPORTANTE: Se logradouro vier vazio, não considerar sucesso total
                    if not dados_empresa.get('logradouro'):
                        print(f"[AVISO] ReceitaWS retornou sem endereço, tentando outra API...")
                        dados_empresa = None  # Força fallback
                else:
                    print(f"[AVISO] ReceitaWS retornou ERROR: {data.get('message')}")
        except Exception as e:
            print(f"[AVISO] Erro na ReceitaWS: {e}")
            erro_ultima_tentativa = str(e)

        # Tentativa 2: Brasil API (Fallback - rápido mas pode ter rate limit)
        if not dados_empresa:
            try:
                print(f"[BUSCA] Consultando CNPJ {cnpj_limpo} na BrasilAPI...")
                url_brasilapi = f'https://brasilapi.com.br/api/cnpj/v1/{cnpj_limpo}'
                response = requests.get(url_brasilapi, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Formatar endereço completo
                    endereco_completo = f"{data.get('logradouro', '')}, {data.get('numero', 's/n')}"
                    if data.get('complemento'):
                        endereco_completo += f" - {data.get('complemento')}"
                    endereco_completo += f" - {data.get('bairro', '')} - {data.get('municipio', '')}/{data.get('uf', '')}"

                    dados_empresa = {
                        'cnpj': cnpj_limpo,
                        'razao_social': data.get('razao_social', ''),
                        'nome_fantasia': data.get('nome_fantasia', '') or data.get('razao_social', ''),
                        'logradouro': data.get('logradouro', ''),
                        'numero': data.get('numero', ''),
                        'complemento': data.get('complemento', ''),
                        'bairro': data.get('bairro', ''),
                        'cidade': data.get('municipio', ''),
                        'municipio': data.get('municipio', ''),
                        'uf': data.get('uf', ''),
                        'cep': re.sub(r'[^0-9]', '', data.get('cep', '')),
                        'telefone': data.get('ddd_telefone_1', '') or data.get('telefone', ''),
                        'email': data.get('email', ''),
                        'atividade_principal': data.get('cnae_fiscal_descricao', ''),
                        'data_abertura': data.get('data_inicio_atividade', ''),
                        'situacao': data.get('descricao_situacao_cadastral', ''),
                        'endereco_completo': endereco_completo,
                        'codigo_municipio_ibge': str(data.get('codigo_municipio_ibge', '')),
                        'cnae_fiscal': str(data.get('cnae_fiscal', '')),
                        'fonte': 'Brasil API'
                    }
                    print(f"[OK] CNPJ encontrado na BrasilAPI: {dados_empresa.get('razao_social')}")
                    
                    # Se logradouro vier vazio, tentar próxima API
                    if not dados_empresa.get('logradouro'):
                        print(f"[AVISO] BrasilAPI retornou sem endereço, tentando Minha Receita...")
                        dados_empresa = None
            except Exception as e:
                print(f"[AVISO] Erro na BrasilAPI: {e}")
                erro_ultima_tentativa = str(e)
        
        # Tentativa 3: Minha Receita (Outra API pública gratuita) - Fallback final
        if not dados_empresa:
            try:
                print(f"[BUSCA] Consultando CNPJ {cnpj_limpo} na Minha Receita...")
                url_minhareceita = f'https://minhareceita.org/{cnpj_limpo}'
                response = requests.get(url_minhareceita, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Formatar endereço completo
                    endereco_completo = f"{data.get('descricao_tipo_de_logradouro', '')} {data.get('logradouro', '')}, {data.get('numero', '')}"
                    if data.get('complemento'):
                        endereco_completo += f" - {data.get('complemento')}"
                    endereco_completo += f" - {data.get('bairro', '')} - {data.get('municipio', '')}/{data.get('uf', '')}"

                    dados_empresa = {
                        'cnpj': cnpj_limpo,
                        'razao_social': data.get('razao_social', ''),
                        'nome_fantasia': data.get('nome_fantasia', '') or data.get('razao_social', ''),
                        'logradouro': f"{data.get('descricao_tipo_de_logradouro', '')} {data.get('logradouro', '')}".strip(),
                        'numero': data.get('numero', ''),
                        'complemento': data.get('complemento', ''),
                        'bairro': data.get('bairro', ''),
                        'cidade': data.get('municipio', ''),
                        'municipio': data.get('municipio', ''),
                        'uf': data.get('uf', ''),
                        'cep': re.sub(r'[^0-9]', '', str(data.get('cep', ''))),
                        'telefone': data.get('ddd_telefone_1', '') or data.get('telefone', ''),
                        'email': data.get('email', ''),
                        'atividade_principal': data.get('cnae_fiscal_descricao', ''),
                        'data_abertura': data.get('data_inicio_atividade', ''),
                        'situacao': data.get('descricao_situacao_cadastral', ''),
                        'endereco_completo': endereco_completo,
                        'codigo_municipio_ibge': str(data.get('codigo_municipio_ibge', '')),
                        'cnae_fiscal': str(data.get('cnae_fiscal', '')),
                        'fonte': 'Minha Receita'
                    }
                    print(f"[OK] CNPJ encontrado na Minha Receita: {dados_empresa.get('razao_social')}")
            except Exception as e:
                print(f"[AVISO] Erro na Minha Receita: {e}")
                erro_ultima_tentativa = str(e)

        if dados_empresa:
            return Response(dados_empresa, status=status.HTTP_200_OK)
        else:
            return Response(
                {
                    'error': 'CNPJ não encontrado nas bases de dados disponíveis.',
                    'cnpj': cnpj_limpo,
                    'details': erro_ultima_tentativa
                },
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        return Response(
            {'error': f'Erro ao consultar CNPJ: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# --- VIEWSETS PET SHOP ---

class PetViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de pets"""
    queryset = Pet.objects.all()
    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_cliente', 'sexo', 'raca']
    search_fields = ['nome_pet', 'id_cliente__nome_razao_social']
    ordering_fields = ['nome_pet', 'data_cadastro']


class TipoServicoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de serviços"""
    queryset = TipoServico.objects.all()
    serializer_class = TipoServicoSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['nome_servico']
    ordering_fields = ['preco_base', 'duracao_minutos']
    
    def perform_create(self, serializer):
        """Criar novo tipo de serviço"""
        serializer.save()
    
    def perform_update(self, serializer):
        """Atualizar tipo de serviço"""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Excluir tipo de serviço"""
        instance.delete()


class AgendamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para agendamentos de pet shop"""
    queryset = Agendamento.objects.all()
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_cliente', 'id_pet', 'status', 'id_tipo_servico']
    search_fields = ['id_pet__nome_pet', 'id_cliente__nome_razao_social']
    ordering_fields = ['data_agendamento', 'status']
    
    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        """Marcar agendamento como concluído"""
        agendamento = self.get_object()
        agendamento.status = 'Concluído'
        agendamento.data_conclusao = timezone.now()
        agendamento.save()
        return Response({'status': 'Agendamento concluído'})
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar agendamento"""
        agendamento = self.get_object()
        agendamento.status = 'Cancelado'
        agendamento.save()
        return Response({'status': 'Agendamento cancelado'})


class AvaliacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para avaliações de serviços"""
    queryset = Avaliacao.objects.all()
    serializer_class = AvaliacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['id_cliente', 'nota']
    ordering_fields = ['data_avaliacao', 'nota']


class SessaoAgendamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar sessões individuais de pacotes"""
    queryset = SessaoAgendamento.objects.all()
    serializer_class = SessaoAgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['id_agendamento', 'status', 'numero_sessao']
    ordering_fields = ['data_sessao', 'numero_sessao']
    
    @action(detail=True, methods=['post'])
    def marcar_concluida(self, request, pk=None):
        """Marcar sessão como concluída"""
        sessao = self.get_object()
        sessao.status = 'Concluída'
        sessao.data_realizacao = timezone.now()
        sessao.save()
        return Response({'status': 'Sessão marcada como concluída'})
    
    @action(detail=True, methods=['post'])
    def marcar_cancelada(self, request, pk=None):
        """Cancelar sessão"""
        sessao = self.get_object()
        sessao.status = 'Cancelada'
        sessao.save()
        return Response({'status': 'Sessão cancelada'})


class LogAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualização de logs de auditoria
    Apenas leitura - não permite criação/edição manual
    """
    from .models import LogAuditoria
    from .serializers import LogAuditoriaSerializer
    
    queryset = LogAuditoria.objects.all()
    serializer_class = LogAuditoriaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Filtros disponíveis
    filterset_fields = {
        'usuario': ['exact'],
        'tipo_acao': ['exact'],
        'modulo': ['exact', 'icontains'],
        'descricao': ['icontains'],
        'data_hora': ['gte', 'lte', 'date'],
        'tabela': ['exact'],
    }
    
    # Busca por texto
    search_fields = ['descricao', 'usuario_nome', 'modulo', 'ip_address']
    
    # Ordenação
    ordering_fields = ['data_hora', 'usuario_nome', 'tipo_acao', 'modulo']
    ordering = ['-data_hora']  # Padrão: mais recentes primeiro
    
    def get_queryset(self):
        """
        Customiza queryset para permitir filtros adicionais via query params
        """
        from datetime import datetime, timedelta
        queryset = super().get_queryset()
        
        # Filtro por data inicial
        data_inicio = self.request.query_params.get('data_inicio', None)
        if data_inicio:
            try:
                data_inicio_dt = datetime.strptime(data_inicio, '%Y-%m-%d')
                # Usar timezone aware datetime
                data_inicio_aware = timezone.make_aware(data_inicio_dt)
                queryset = queryset.filter(data_hora__gte=data_inicio_aware)
            except ValueError:
                pass
        
        # Filtro por data final
        data_fim = self.request.query_params.get('data_fim', None)
        if data_fim:
            try:
                data_fim_dt = datetime.strptime(data_fim, '%Y-%m-%d')
                # Adicionar 1 dia e subtrair 1 segundo para incluir todo o dia final
                data_fim_dt = data_fim_dt + timedelta(days=1) - timedelta(seconds=1)
                # Usar timezone aware datetime
                data_fim_aware = timezone.make_aware(data_fim_dt)
                queryset = queryset.filter(data_hora__lte=data_fim_aware)
            except ValueError:
                pass
        
        # Filtro por período (últimos X dias)
        periodo = self.request.query_params.get('periodo', None)
        if periodo:
            from datetime import timedelta
            try:
                dias = int(periodo)
                data_limite = timezone.now() - timedelta(days=dias)
                queryset = queryset.filter(data_hora__gte=data_limite)
            except ValueError:
                pass
        
        # Filtro por username do usuário
        username = self.request.query_params.get('username', None)
        if username:
            queryset = queryset.filter(usuario__username__icontains=username)
        
        return queryset.select_related('usuario')
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """
        Retorna estatísticas gerais dos logs
        """
        from django.db.models import Count
        from datetime import timedelta
        
        # Período padrão: últimos 30 dias
        periodo_dias = int(request.query_params.get('periodo', 30))
        data_limite = timezone.now() - timedelta(days=periodo_dias)
        
        queryset = self.get_queryset().filter(data_hora__gte=data_limite)
        
        # Contagem por tipo de ação
        por_tipo = queryset.values('tipo_acao').annotate(
            total=Count('id_log')
        ).order_by('-total')
        
        # Contagem por módulo
        por_modulo = queryset.values('modulo').annotate(
            total=Count('id_log')
        ).order_by('-total')[:10]
        
        # Contagem por usuário
        por_usuario = queryset.values('usuario_nome').annotate(
            total=Count('id_log')
        ).order_by('-total')[:10]
        
        # Total geral
        total_logs = queryset.count()
        
        return Response({
            'periodo_dias': periodo_dias,
            'total_logs': total_logs,
            'por_tipo_acao': list(por_tipo),
            'por_modulo': list(por_modulo),
            'por_usuario': list(por_usuario),
        })
    
    @action(detail=False, methods=['get'])
    def ultimas_acoes(self, request):
        """
        Retorna as últimas N ações (padrão: 50)
        """
        limite = int(request.query_params.get('limite', 50))
        queryset = self.get_queryset()[:limite]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def minhas_acoes(self, request):
        """
        Retorna ações do usuário logado
        """
        queryset = self.get_queryset().filter(usuario=request.user)
        
        # Aplicar paginação
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# --- Endpoint para verificar senha de supervisor ---
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verificar_senha_supervisor(request):
    """
    Verifica se a senha fornecida pertence a um usuário supervisor (is_superuser=True)
    Body: { "username": "nome_usuario", "password": "senha" }
    """
    from django.contrib.auth import authenticate
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'success': False,
            'message': 'Usuário e senha são obrigatórios'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Tenta autenticar
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response({
            'success': False,
            'message': 'Usuário ou senha inválidos'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Verifica se é supervisor
    if not user.is_superuser:
        return Response({
            'success': False,
            'message': 'Usuário não possui permissão de supervisor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'success': True,
        'message': 'Senha validada com sucesso',
        'supervisor': {
            'id': user.id,
            'username': user.username,
            'nome': f'{user.first_name} {user.last_name}'.strip() or user.username
        }
    })


# --- Endpoint para verificar limite de crédito do cliente ---
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verificar_limite_cliente(request):
    """
    Verifica se o cliente possui limite de crédito disponível
    Body: { "id_cliente": 123, "valor_venda": 1500.00 }
    """
    from decimal import Decimal
    from django.db.models import Sum
    
    id_cliente = request.data.get('id_cliente')
    valor_venda = request.data.get('valor_venda', 0)
    
    if not id_cliente:
        return Response({
            'success': False,
            'message': 'ID do cliente é obrigatório'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        cliente = Cliente.objects.get(id_cliente=id_cliente)
    except Cliente.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Cliente não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Pega o limite de crédito do cliente
    limite_credito = cliente.limite_credito or Decimal('0.00')
    valor_venda = Decimal(str(valor_venda))
    
    # Calcula o saldo devedor atual (contas a receber pendentes)
    saldo_devedor = FinanceiroConta.objects.filter(
        id_cliente_fornecedor=id_cliente,
        tipo_conta='Receber',
        status_conta__in=['Pendente', 'Vencida']
    ).aggregate(
        total=Sum('valor_parcela')
    )['total'] or Decimal('0.00')
    
    # Calcula o crédito disponível
    credito_disponivel = limite_credito - saldo_devedor
    credito_apos_venda = credito_disponivel - valor_venda
    
    # Verifica se ultrapassou o limite
    ultrapassa_limite = credito_apos_venda < 0
    
    return Response({
        'success': True,
        'cliente': {
            'id': cliente.id_cliente,
            'nome': cliente.nome_razao_social,
            'limite_credito': float(limite_credito),
            'saldo_devedor': float(saldo_devedor),
            'credito_disponivel': float(credito_disponivel),
            'credito_apos_venda': float(credito_apos_venda)
        },
        'valor_venda': float(valor_venda),
        'ultrapassa_limite': ultrapassa_limite,
        'valor_excedente': float(abs(credito_apos_venda)) if ultrapassa_limite else 0,
        'bloqueada': ultrapassa_limite
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validar_cliente_atraso(request):
    """
    Verifica se o cliente possui títulos em atraso além da tolerância
    Body: { "id_cliente": 123, "dias_tolerancia": 5 }
    """
    from datetime import date, timedelta
    
    id_cliente = request.data.get('id_cliente')
    dias_tolerancia = request.data.get('dias_tolerancia', 0)
    
    if not id_cliente:
        return Response({
            'success': False,
            'message': 'ID do cliente é obrigatório'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        cliente = Cliente.objects.get(id_cliente=id_cliente)
    except Cliente.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Cliente não encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Data limite: hoje - dias_tolerancia
    data_limite = date.today() - timedelta(days=int(dias_tolerancia))
    
    # Busca títulos em atraso (vencidos e não pagos)
    titulos_em_atraso = FinanceiroConta.objects.filter(
        id_cliente_fornecedor=id_cliente,
        tipo_conta='Receber',
        status_conta__in=['Pendente', 'Vencida'],
        data_vencimento__lt=data_limite
    ).order_by('data_vencimento')
    
    # Se encontrou títulos em atraso
    if titulos_em_atraso.exists():
        # Pega o título mais antigo
        titulo_mais_antigo = titulos_em_atraso.first()
        dias_atraso = (date.today() - titulo_mais_antigo.data_vencimento).days
        
        # Soma o valor total em atraso
        from decimal import Decimal
        from django.db.models import Sum
        valor_total_atraso = titulos_em_atraso.aggregate(
            total=Sum('valor_parcela')
        )['total'] or Decimal('0.00')
        
        return Response({
            'success': True,
            'em_atraso': True,
            'cliente': {
                'id': cliente.id_cliente,
                'nome': cliente.nome_razao_social
            },
            'qtd_titulos': titulos_em_atraso.count(),
            'valor_total_atraso': float(valor_total_atraso),
            'titulo_mais_antigo': {
                'documento_numero': titulo_mais_antigo.documento_numero,
                'data_vencimento': titulo_mais_antigo.data_vencimento.strftime('%d/%m/%Y'),
                'dias_atraso': dias_atraso,
                'valor': float(titulo_mais_antigo.valor_parcela)
            },
            'dias_tolerancia': dias_tolerancia
        })
    else:
        return Response({
            'success': True,
            'em_atraso': False,
            'cliente': {
                'id': cliente.id_cliente,
                'nome': cliente.nome_razao_social
            },
            'dias_tolerancia': dias_tolerancia
        })


# --- ViewSet TabelaComercial ---
class TabelaComercialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Tabelas Comerciais (Tabelas de Preço)
    
    Funcionalidades:
    - CRUD completo (Create, Read, Update, Delete)
    - Listar apenas tabelas ativas
    - Ativar/desativar tabelas
    - Definir tabela padrão
    """
    from .models import TabelaComercial
    from .serializers import TabelaComercialSerializer
    
    queryset = TabelaComercial.objects.all()
    serializer_class = TabelaComercialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativo', 'padrao']
    search_fields = ['nome']
    ordering_fields = ['nome', 'percentual', 'data_criacao']
    ordering = ['nome']
    
    def get_queryset(self):
        """
        Opcionalmente filtra apenas tabelas ativas
        """
        queryset = super().get_queryset()
        
        # Se passou ?apenas_ativas=true, filtrar
        apenas_ativas = self.request.query_params.get('apenas_ativas', None)
        if apenas_ativas and apenas_ativas.lower() == 'true':
            queryset = queryset.filter(ativo=True)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def definir_padrao(self, request, pk=None):
        """
        Define esta tabela como padrão (desmarca as outras)
        """
        from .models import TabelaComercial
        tabela = self.get_object()
        
        # Desmarcar todas as outras
        TabelaComercial.objects.filter(padrao=True).update(padrao=False)
        
        # Marcar esta
        tabela.padrao = True
        tabela.save()
        
        return Response({'message': 'Tabela definida como padrão'})


# =====================================================
# VIEWS DE ALUGUEL DE EQUIPAMENTOS
# =====================================================

from .models import Equipamento, Aluguel, ConfiguracaoContrato
from .serializers import EquipamentoSerializer, AluguelSerializer, AluguelListSerializer, ConfiguracaoContratoSerializer
from datetime import date, timedelta

class EquipamentoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de equipamentos"""
    
    queryset = Equipamento.objects.all()
    serializer_class = EquipamentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'categoria']
    search_fields = ['codigo', 'nome', 'descricao', 'marca', 'modelo', 'numero_serie']
    ordering_fields = ['codigo', 'nome', 'valor_diaria', 'data_cadastro']
    ordering = ['nome']
    
    @action(detail=False, methods=['get'])
    def disponiveis(self, request):
        """Retorna apenas equipamentos disponíveis para aluguel"""
        equipamentos = self.queryset.filter(status='disponivel')
        
        # Filtrar por categoria se fornecido
        categoria = request.query_params.get('categoria', None)
        if categoria:
            equipamentos = equipamentos.filter(categoria=categoria)
        
        serializer = self.get_serializer(equipamentos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categorias(self, request):
        """Retorna lista de categorias únicas"""
        categorias = Equipamento.objects.values_list('categoria', flat=True).distinct().order_by('categoria')
        return Response([cat for cat in categorias if cat])
    
    @action(detail=True, methods=['post'])
    def mudar_status(self, request, pk=None):
        """Altera o status do equipamento"""
        equipamento = self.get_object()
        novo_status = request.data.get('status')
        
        if novo_status not in ['disponivel', 'alugado', 'manutencao', 'inativo']:
            return Response(
                {'error': 'Status inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verifica se o equipamento está alugado
        if equipamento.status == 'alugado' and novo_status != 'alugado':
            aluguel_ativo = Aluguel.objects.filter(
                id_equipamento=equipamento,
                status='ativo'
            ).first()
            
            if aluguel_ativo:
                return Response(
                    {'error': 'Equipamento possui aluguel ativo. Finalize o aluguel primeiro.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        equipamento.status = novo_status
        equipamento.save()
        
        serializer = self.get_serializer(equipamento)
        return Response(serializer.data)


class AluguelViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de aluguéis com múltiplos equipamentos"""
    
    queryset = Aluguel.objects.all().prefetch_related('itens', 'itens__id_equipamento')
    serializer_class = AluguelSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'id_cliente']
    search_fields = ['numero_aluguel', 'id_cliente__nome_razao_social']
    ordering_fields = ['data_inicio', 'data_fim_prevista', 'valor_total', 'data_cadastro']
    ordering = ['-data_cadastro']
    
    def get_serializer_class(self):
        """Usa serializer simplificado para listagem"""
        if self.action == 'list':
            return AluguelListSerializer
        return AluguelSerializer
    
    def perform_create(self, serializer):
        """Adiciona o usuário atual ao criar aluguel"""
        serializer.save(id_usuario=self.request.user)
    
    @action(detail=False, methods=['get'])
    def ativos(self, request):
        """Retorna apenas aluguéis ativos"""
        alugueis = self.queryset.filter(status='ativo')
        
        # Filtrar por cliente se fornecido
        id_cliente = request.query_params.get('id_cliente', None)
        if id_cliente:
            alugueis = alugueis.filter(id_cliente=id_cliente)
        
        serializer = AluguelListSerializer(alugueis, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def devolver_item(self, request, pk=None):
        """Devolve um item específico do aluguel"""
        from .models import AluguelItem
        
        aluguel = self.get_object()
        id_item = request.data.get('id_item')
        
        if not id_item:
            return Response(
                {'error': 'Informe o id_item'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item = AluguelItem.objects.get(id_item=id_item, id_aluguel=aluguel)
        except AluguelItem.DoesNotExist:
            return Response(
                {'error': 'Item não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if item.status != 'ativo':
            return Response(
                {'error': 'Item já foi devolvido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Registra data de devolução
        data_devolucao = request.data.get('data_devolucao_real')
        if data_devolucao:
            from datetime import datetime
            item.data_devolucao_real = datetime.strptime(data_devolucao, '%Y-%m-%d').date()
        else:
            item.data_devolucao_real = date.today()
        
        # Calcula multa por atraso se houver
        if item.data_devolucao_real > item.data_devolucao_prevista:
            dias_atraso = (item.data_devolucao_real - item.data_devolucao_prevista).days
            # Multa de 10% do valor da diária por dia de atraso
            multa_por_dia = item.valor_diaria * 0.10
            item.valor_multa = multa_por_dia * dias_atraso
        
        item.status = 'devolvido'
        item.save()
        
        # Libera o equipamento
        equipamento = item.id_equipamento
        equipamento.status = 'disponivel'
        equipamento.save()
        
        # Atualiza totais do aluguel
        aluguel.valor_multa = sum(i.valor_multa for i in aluguel.itens.all())
        aluguel.calcular_valor_final()
        aluguel.save()
        
        # Se todos os itens foram devolvidos, finaliza o aluguel
        if not aluguel.itens.filter(status='ativo').exists():
            aluguel.status = 'finalizado'
            aluguel.save()
        
        serializer = self.get_serializer(aluguel)
        return Response({
            'message': 'Item devolvido com sucesso',
            'aluguel': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finaliza um aluguel (devolve todos os itens ativos)"""
        from .models import AluguelItem
        
        aluguel = self.get_object()
        
        if aluguel.status != 'ativo':
            return Response(
                {'error': 'Apenas aluguéis ativos podem ser finalizados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Devolve todos os itens ativos
        itens_ativos = aluguel.itens.filter(status='ativo')
        
        for item in itens_ativos:
            item.data_devolucao_real = date.today()
            
            # Calcula multa por atraso se houver
            if item.data_devolucao_real > item.data_devolucao_prevista:
                dias_atraso = (item.data_devolucao_real - item.data_devolucao_prevista).days
                multa_por_dia = item.valor_diaria * 0.10
                item.valor_multa = multa_por_dia * dias_atraso
            
            item.status = 'devolvido'
            item.save()
            
            # Libera o equipamento
            equipamento = item.id_equipamento
            equipamento.status = 'disponivel'
            equipamento.save()
        
        # Aplica desconto se fornecido
        desconto = request.data.get('valor_desconto')
        if desconto:
            aluguel.valor_desconto = float(desconto)
        
        # Atualiza totais
        aluguel.valor_multa = sum(i.valor_multa for i in aluguel.itens.all())
        aluguel.calcular_valor_final()
        
        # Finaliza o aluguel
        aluguel.status = 'finalizado'
        aluguel.save()
        
        serializer = self.get_serializer(aluguel)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def gerar_financeiro(self, request, pk=None):
        """Gera conta a receber no financeiro para o aluguel"""
        from .models import FinanceiroConta, AluguelItem
        
        aluguel = self.get_object()
        
        # Verifica se já tem financeiro gerado
        ja_existe = FinanceiroConta.objects.filter(
            id_aluguel_origem=aluguel.id_aluguel
        ).exists()
        
        if ja_existe:
            return Response(
                {'error': 'Financeiro já foi gerado para este aluguel'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Pega forma de pagamento do request
        forma_pagamento = request.data.get('forma_pagamento', 'A definir')
        
        # Monta descrição com os equipamentos
        equipamentos = ', '.join([
            item.id_equipamento.nome for item in aluguel.itens.all()[:3]
        ])
        if aluguel.itens.count() > 3:
            equipamentos += f' (+{aluguel.itens.count() - 3} itens)'
        
        # Cria conta a receber
        conta = FinanceiroConta(
            tipo_conta='receber',
            id_cliente_fornecedor=aluguel.id_cliente,
            descricao=f'Aluguel {aluguel.numero_aluguel} - {equipamentos}',
            valor_parcela=aluguel.valor_final,
            valor_liquidado=0,
            valor_juros=0,
            valor_multa=aluguel.valor_multa,
            valor_desconto=aluguel.valor_desconto,
            data_vencimento=aluguel.data_fim_prevista,
            status_conta='Pendente',
            forma_pagamento=forma_pagamento,
            id_aluguel_origem=aluguel.id_aluguel,
            documento_numero=aluguel.numero_aluguel,
            parcela_numero=1,
            parcela_total=1
        )
        conta.save()
        
        return Response({
            'message': 'Financeiro gerado com sucesso',
            'id_conta': conta.id_conta,
            'valor': float(conta.valor_parcela),
            'forma_pagamento': forma_pagamento
        })
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela um aluguel"""
        from .models import AluguelItem
        
        aluguel = self.get_object()
        
        if aluguel.status != 'ativo':
            return Response(
                {'error': 'Apenas aluguéis ativos podem ser cancelados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        motivo = request.data.get('motivo', '')
        aluguel.observacoes = f"{aluguel.observacoes or ''}\nCANCELADO: {motivo}".strip()
        aluguel.status = 'cancelado'
        aluguel.save()
        
        # Cancela todos os itens e libera equipamentos
        for item in aluguel.itens.filter(status='ativo'):
            item.status = 'cancelado'
            item.save()
            
            equipamento = item.id_equipamento
            equipamento.status = 'disponivel'
            equipamento.save()
        
        serializer = self.get_serializer(aluguel)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def gerar_contrato(self, request, pk=None):
        """Gera contrato HTML do aluguel para impressão"""
        from .models import ConfiguracaoContrato, EmpresaConfig
        from django.template import Template, Context
        
        aluguel = self.get_object()
        
        # Busca template de contrato
        try:
            config_contrato = ConfiguracaoContrato.objects.get(tipo_contrato='aluguel', ativo=True)
        except ConfiguracaoContrato.DoesNotExist:
            # Template padrão caso não exista configuração
            config_contrato = None
        
        # Busca dados da empresa
        try:
            empresa = EmpresaConfig.get_ativa()
        except:
            empresa = None
        
        # Prepara dados para o template
        itens_lista = []
        for item in aluguel.itens.all():
            itens_lista.append({
                'codigo': item.id_equipamento.codigo,
                'nome': item.id_equipamento.nome,
                'descricao': item.id_equipamento.descricao or '',
                'quantidade_dias': item.quantidade_dias,
                'valor_diaria': item.valor_diaria,
                'valor_total': item.valor_total,
                'data_devolucao_prevista': item.data_devolucao_prevista.strftime('%d/%m/%Y'),
                'status': item.get_status_display()
            })
        
        contexto = {
            'numero_aluguel': aluguel.numero_aluguel,
            'data_emissao': date.today().strftime('%d/%m/%Y'),
            'data_inicio': aluguel.data_inicio.strftime('%d/%m/%Y'),
            'data_fim_prevista': aluguel.data_fim_prevista.strftime('%d/%m/%Y'),
            'cliente_nome': aluguel.id_cliente.nome_razao_social,
            'cliente_cpf_cnpj': aluguel.id_cliente.cpf_cnpj,
            'cliente_telefone': aluguel.id_cliente.telefone or '',
            'cliente_endereco': aluguel.id_cliente.endereco or '',
            'cliente_cidade': aluguel.id_cliente.cidade or '',
            'cliente_estado': aluguel.id_cliente.estado or '',
            'itens': itens_lista,
            'total_itens': len(itens_lista),
            'valor_total': float(aluguel.valor_total),
            'valor_desconto': float(aluguel.valor_desconto),
            'valor_final': float(aluguel.valor_final),
            'observacoes': aluguel.observacoes or '',
            'empresa_nome': empresa.nome_razao_social if empresa else 'Empresa',
            'empresa_cnpj': empresa.cpf_cnpj if empresa else '',
            'empresa_telefone': empresa.telefone if empresa else '',
            'empresa_endereco': empresa.endereco if empresa else '',
        }
        
        # Gera HTML
        if config_contrato and config_contrato.template_html:
            template = Template(config_contrato.template_html)
            html_content = template.render(Context(contexto))
        else:
            # Template padrão
            html_content = self._gerar_template_padrao(contexto)
        
        return Response({
            'html': html_content,
            'titulo': config_contrato.titulo if config_contrato else 'Contrato de Aluguel'
        })
    
    def _gerar_template_padrao(self, ctx):
        """Template padrão de contrato"""
        itens_html = ''.join([f'''
                    <tr>
                        <td>{item['codigo']}</td>
                        <td>{item['nome']}</td>
                        <td>{item['quantidade_dias']}</td>
                        <td>R$ {item['valor_diaria']:.2f}</td>
                        <td>{item['data_devolucao_prevista']}</td>
                        <td>R$ {item['valor_total']:.2f}</td>
                    </tr>
                    ''' for item in ctx['itens']])
        
        desconto_html = f'''<tr>
                        <td colspan="5" class="total">Desconto:</td>
                        <td>- R$ {ctx['valor_desconto']:.2f}</td>
                    </tr>''' if ctx['valor_desconto'] > 0 else ''
        
        obs_html = f"<div class='info-box'><h3>OBSERVAÇÕES</h3><p>{ctx['observacoes']}</p></div>" if ctx['observacoes'] else ''
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Contrato de Aluguel - {ctx['numero_aluguel']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .header h1 {{ margin: 0; color: #333; }}
                .info-box {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; }}
                .info-box h3 {{ margin-top: 0; color: #555; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f4f4f4; }}
                .total {{ font-weight: bold; text-align: right; }}
                .assinatura {{ margin-top: 50px; }}
                .assinatura-linha {{ margin-top: 60px; border-top: 1px solid #000; width: 300px; }}
                @media print {{
                    .no-print {{ display: none; }}
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>CONTRATO DE ALUGUEL DE EQUIPAMENTOS</h1>
                <p><strong>Nº {ctx['numero_aluguel']}</strong></p>
                <p>Data de Emissão: {ctx['data_emissao']}</p>
            </div>
            
            <div class="info-box">
                <h3>LOCADOR</h3>
                <p><strong>{ctx['empresa_nome']}</strong></p>
                <p>CNPJ: {ctx['empresa_cnpj']}</p>
                <p>Telefone: {ctx['empresa_telefone']}</p>
                <p>Endereço: {ctx['empresa_endereco']}</p>
            </div>
            
            <div class="info-box">
                <h3>LOCATÁRIO</h3>
                <p><strong>{ctx['cliente_nome']}</strong></p>
                <p>CPF/CNPJ: {ctx['cliente_cpf_cnpj']}</p>
                <p>Telefone: {ctx['cliente_telefone']}</p>
                <p>Endereço: {ctx['cliente_endereco']}, {ctx['cliente_cidade']}/{ctx['cliente_estado']}</p>
            </div>
            
            <div class="info-box">
                <h3>PERÍODO DO ALUGUEL</h3>
                <p>Data de Início: <strong>{ctx['data_inicio']}</strong></p>
                <p>Data de Término Prevista: <strong>{ctx['data_fim_prevista']}</strong></p>
            </div>
            
            <h3>EQUIPAMENTOS LOCADOS</h3>
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Equipamento</th>
                        <th>Dias</th>
                        <th>Valor Diária</th>
                        <th>Devolução Prevista</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {itens_html}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" class="total">Valor Total:</td>
                        <td><strong>R$ {ctx['valor_total']:.2f}</strong></td>
                    </tr>
                    {desconto_html}
                    <tr>
                        <td colspan="5" class="total">Valor Final:</td>
                        <td><strong>R$ {ctx['valor_final']:.2f}</strong></td>
                    </tr>
                </tfoot>
            </table>
            
            {obs_html}
            
            <div class="info-box">
                <h3>CLÁUSULAS</h3>
                <p>1. O LOCATÁRIO se compromete a devolver os equipamentos nas datas previstas e em perfeito estado de conservação.</p>
                <p>2. Em caso de atraso na devolução, será cobrada multa diária de 10% sobre o valor da diária.</p>
                <p>3. O LOCATÁRIO é responsável por quaisquer danos causados aos equipamentos durante o período de locação.</p>
                <p>4. A devolução antecipada não gera direito a reembolso proporcional.</p>
            </div>
            
            <div class="assinatura">
                <div style="display: flex; justify-content: space-between; margin-top: 60px;">
                    <div style="text-align: center;">
                        <div class="assinatura-linha"></div>
                        <p>LOCADOR<br>{ctx['empresa_nome']}</p>
                    </div>
                    <div style="text-align: center;">
                        <div class="assinatura-linha"></div>
                        <p>LOCATÁRIO<br>{ctx['cliente_nome']}</p>
                    </div>
                </div>
            </div>
            
            <button class="no-print" onclick="window.print()" style="position: fixed; bottom: 20px; right: 20px; padding: 15px 30px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                🖨️ Imprimir
            </button>
        </body>
        </html>
        """
        
        # Cria conta a receber
        conta = FinanceiroConta(
            tipo_conta='receber',
            id_cliente_fornecedor=aluguel.id_cliente,
            descricao=f'Aluguel {aluguel.numero_aluguel} - {aluguel.id_equipamento.nome}',
            valor_parcela=aluguel.valor_final,
            valor_liquidado=0,
            valor_juros=0,
            valor_multa=aluguel.valor_multa,
            valor_desconto=aluguel.valor_desconto,
            data_vencimento=aluguel.data_fim_prevista,
            status_conta='Pendente',
            forma_pagamento=forma_pagamento,
            id_aluguel_origem=aluguel.id_aluguel,
            documento_numero=aluguel.numero_aluguel,
            parcela_numero=1,
            parcela_total=1
        )
        conta.save()
        
        return Response({
            'message': 'Financeiro gerado com sucesso',
            'id_conta': conta.id_conta,
            'valor': float(conta.valor_parcela),
            'forma_pagamento': forma_pagamento
        })
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela um aluguel"""
        aluguel = self.get_object()
        
        if aluguel.status != 'ativo':
            return Response(
                {'error': 'Apenas aluguéis ativos podem ser cancelados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        motivo = request.data.get('motivo', '')
        aluguel.observacoes = f"{aluguel.observacoes or ''}\nCANCELADO: {motivo}".strip()
        aluguel.status = 'cancelado'
        aluguel.save()
        
        # Libera o equipamento
        equipamento = aluguel.id_equipamento
        equipamento.status = 'disponivel'
        equipamento.save()
        
        serializer = self.get_serializer(aluguel)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def prorrogar(self, request, pk=None):
        """Prorroga a data de devolução de um aluguel"""
        aluguel = self.get_object()
        
        if aluguel.status != 'ativo':
            return Response(
                {'error': 'Apenas aluguéis ativos podem ser prorrogados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        nova_data = request.data.get('nova_data_fim')
        if not nova_data:
            return Response(
                {'error': 'Informe a nova data de fim (nova_data_fim)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from datetime import datetime
        nova_data_obj = datetime.strptime(nova_data, '%Y-%m-%d').date()
        
        if nova_data_obj <= aluguel.data_fim_prevista:
            return Response(
                {'error': 'A nova data deve ser posterior à data atual de devolução'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcula dias adicionais
        dias_adicionais = (nova_data_obj - aluguel.data_fim_prevista).days
        
        # Atualiza valores
        aluguel.data_fim_prevista = nova_data_obj
        aluguel.quantidade_dias += dias_adicionais
        aluguel.valor_total = aluguel.valor_diaria * aluguel.quantidade_dias
        aluguel.calcular_valor_final()
        aluguel.save()
        
        serializer = self.get_serializer(aluguel)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def relatorio_periodo(self, request):
        """Relatório de aluguéis em um período"""
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        
        if not data_inicio or not data_fim:
            return Response(
                {'error': 'Informe data_inicio e data_fim'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alugueis = self.queryset.filter(
            data_inicio__range=[data_inicio, data_fim]
        )
        
        # Estatísticas
        total_alugueis = alugueis.count()
        total_faturado = sum(a.valor_final for a in alugueis)
        total_multas = sum(a.valor_multa for a in alugueis)
        
        # Aluguéis por status


# ====================================================
# ViewSets para Mapa de Carga (Logística)
# ====================================================

class MapaCargaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Mapas de Carga.
    Permite criar, listar, atualizar e excluir mapas de entrega.
    """
    queryset = models.MapaCarga.objects.all().select_related(
        'id_veiculo', 'id_motorista', 'id_mdfe'
    ).prefetch_related('itens__id_venda__id_cliente')
    serializer_class = serializers.MapaCargaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'id_veiculo', 'id_motorista', 'data_criacao', 'data_saida']
    search_fields = ['numero_mapa', 'id_veiculo__placa', 'id_motorista__nome']
    ordering_fields = ['data_criacao', 'data_saida', 'numero_mapa', 'status']
    ordering = ['-data_criacao']
    
    def get_queryset(self):
        """Filtra por empresa do usuário"""
        queryset = super().get_queryset()
        user = self.request.user
        
        if hasattr(user, 'id_empresa') and user.id_empresa:
            queryset = queryset.filter(id_veiculo__id_empresa=user.id_empresa)
        
        # Filtros adicionais via query params
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        
        if data_inicio and data_fim:
            queryset = queryset.filter(data_criacao__range=[data_inicio, data_fim])
        
        return queryset
    
    def perform_create(self, serializer):
        """Gera número do mapa automaticamente"""
        ultimo_mapa = models.MapaCarga.objects.order_by('-id_mapa').first()
        proximo_n = (ultimo_mapa.id_mapa + 1) if ultimo_mapa else 1
        numero_mapa = f'MC-{proximo_n:06d}'
        serializer.save(numero_mapa=numero_mapa)
    
    @action(detail=True, methods=['post'])
    def adicionar_venda(self, request, pk=None):
        """Adiciona uma venda ao mapa de carga"""
        mapa = self.get_object()
        
        if mapa.status != 'EM_MONTAGEM':
            return Response(
                {'error': 'Só é possível adicionar vendas em mapas EM_MONTAGEM'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        id_venda = request.data.get('id_venda')
        if not id_venda:
            return Response(
                {'error': 'Informe o id_venda'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            venda = models.Venda.objects.get(id_venda=id_venda)
        except models.Venda.DoesNotExist:
            return Response(
                {'error': 'Venda não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verifica se venda já está em outro mapa
        if models.MapaCargaItem.objects.filter(id_venda=venda).exists():
            return Response(
                {'error': 'Esta venda já está em outro mapa de carga'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcula ordem de entrega (última + 1)
        from django.db.models import Max as _Max
        ultima_ordem = mapa.itens.aggregate(
            max_ordem=_Max('ordem_entrega')
        )['max_ordem'] or 0
        
        # Cria item do mapa
        item = models.MapaCargaItem.objects.create(
            id_mapa=mapa,
            id_venda=venda,
            ordem_entrega=ultima_ordem + 1,
            status_entrega='PENDENTE'
        )
        
        # Atualiza totalizadores do mapa
        mapa.recalcular_totais()
        
        serializer = serializers.MapaCargaItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def remover_venda(self, request, pk=None):
        """Remove uma venda do mapa de carga"""
        mapa = self.get_object()
        
        if mapa.status != 'EM_MONTAGEM':
            return Response(
                {'error': 'Só é possível remover vendas em mapas EM_MONTAGEM'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        id_venda = request.data.get('id_venda')
        try:
            item = mapa.itens.get(id_venda=id_venda)
            item.delete()
            
            # Recalcula totais e reordena
            mapa.recalcular_totais()
            mapa.reordenar_entregas()
            
            return Response({'success': 'Venda removida do mapa'})
        except models.MapaCargaItem.DoesNotExist:
            return Response(
                {'error': 'Venda não encontrada neste mapa'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def reordenar(self, request, pk=None):
        """Reordena as entregas do mapa"""
        mapa = self.get_object()
        
        if mapa.status != 'EM_MONTAGEM':
            return Response(
                {'error': 'Só é possível reordenar em mapas EM_MONTAGEM'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Recebe array de IDs na ordem desejada
        ordem_ids = request.data.get('ordem', [])
        
        if not ordem_ids:
            return Response(
                {'error': 'Informe a ordem dos itens no array "ordem"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Atualiza ordem de cada item
        for idx, item_id in enumerate(ordem_ids, start=1):
            models.MapaCargaItem.objects.filter(
                id_item_mapa=item_id,
                id_mapa=mapa
            ).update(ordem_entrega=idx)
        
        # Retorna mapa atualizado
        serializer = self.get_serializer(mapa)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def gerar_mdfe(self, request, pk=None):
        """Gera MDF-e automaticamente a partir do mapa de carga"""
        mapa = self.get_object()
        
        if mapa.status == 'CANCELADO':
            return Response(
                {'error': 'Não é possível gerar MDF-e de mapa cancelado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if mapa.id_mdfe:
            return Response(
                {'error': 'Este mapa já possui um MDF-e vinculado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Importa módulo de MDF-e
        try:
            from mdfe import models as mdfe_models
            
            # Cria MDF-e baseado no mapa
            mdfe = mdfe_models.ManifestoEletronico.objects.create(
                id_veiculo=mapa.id_veiculo,
                id_motorista=mapa.id_motorista,
                peso_total_kg=mapa.peso_total_kg,
                valor_total_carga=mapa.valor_total_carga,
                data_emissao=timezone.now(),
                status='EM_DIGITACAO'
            )
            
            # Adiciona documentos fiscais (vendas com NF-e)
            for item in mapa.itens.all():
                if hasattr(item.id_venda, 'nfe_chave_acesso'):
                    mdfe_models.DocumentoFiscal.objects.create(
                        id_mdfe=mdfe,
                        chave_nfe=item.id_venda.nfe_chave_acesso,
                        valor=item.id_venda.valor_total
                    )
            
            # Vincula MDF-e ao mapa
            mapa.id_mdfe = mdfe
            mapa.save()
            
            return Response({
                'success': 'MDF-e gerado com sucesso',
                'id_mdfe': mdfe.id_mdfe,
                'numero_mdfe': mdfe.numero_mdfe
            }, status=status.HTTP_201_CREATED)
            
        except ImportError:
            return Response(
                {'error': 'Módulo de MDF-e não disponível'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Erro ao gerar MDF-e: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def iniciar_rota(self, request, pk=None):
        """Marca o mapa como EM_ROTA (saiu para entrega)"""
        mapa = self.get_object()
        
        if mapa.status != 'EM_MONTAGEM':
            return Response(
                {'error': 'Apenas mapas EM_MONTAGEM podem iniciar rota'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not mapa.itens.exists():
            return Response(
                {'error': 'Adicione pelo menos uma venda ao mapa'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mapa.status = 'EM_ROTA'
        mapa.data_saida = timezone.now()
        mapa.save()
        
        serializer = self.get_serializer(mapa)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """Finaliza o mapa (todas entregas concluídas)"""
        mapa = self.get_object()
        
        if mapa.status != 'EM_ROTA':
            return Response(
                {'error': 'Apenas mapas EM_ROTA podem ser finalizados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verifica se todas entregas foram realizadas
        pendentes = mapa.itens.filter(
            status_entrega__in=['PENDENTE', 'EM_ROTA']
        ).count()
        
        if pendentes > 0:
            return Response(
                {'error': f'Ainda há {pendentes} entregas pendentes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        mapa.status = 'ENTREGUE'
        mapa.save()
        
        serializer = self.get_serializer(mapa)
        return Response(serializer.data)


class MapaCargaItemViewSet(viewsets.ModelViewSet):
    """ViewSet para itens do mapa de carga"""
    queryset = models.MapaCargaItem.objects.all().select_related(
        'id_mapa', 'id_venda', 'id_venda__id_cliente'
    )
    serializer_class = serializers.MapaCargaItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['id_mapa', 'status_entrega']
    ordering = ['id_mapa', 'ordem_entrega']
    
    @action(detail=True, methods=['post'])
    def marcar_entregue(self, request, pk=None):
        """Marca um item como entregue"""
        item = self.get_object()
        
        if item.status_entrega == 'ENTREGUE':
            return Response(
                {'error': 'Este item já foi marcado como entregue'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        item.status_entrega = 'ENTREGUE'
        item.data_entrega_realizada = timezone.now()
        
        # Salva assinatura se fornecida
        assinatura = request.data.get('assinatura_recebimento')
        if assinatura:
            item.assinatura_recebimento = assinatura
        
        item.save()
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)


# ====================================================
# ViewSets para Integração Bancária (Boletos)
# ====================================================

class ConfiguracaoBancariaViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações bancárias"""
    queryset = models.ConfiguracaoBancaria.objects.all()
    serializer_class = serializers.ConfiguracaoBancariaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['banco', 'ativo', 'ambiente']
    search_fields = ['nome_configuracao', 'agencia', 'conta']
    ordering = ['-ativo', 'nome_configuracao']
    
    @action(detail=True, methods=['post'])
    def testar_conexao(self, request, pk=None):
        """Testa a conexão com a API do banco"""
        config = self.get_object()
        
        try:
            from .services_bancarios import criar_integracao_bancaria
            integracao = criar_integracao_bancaria(config)
            
            # Tenta gerar token
            token = integracao.gerar_token()
            
            if token:
                return Response({
                    'success': 'Conexão estabelecida com sucesso',
                    'token_valido': True,
                    'expira_em': config.token_expira_em.isoformat() if config.token_expira_em else None
                })
            else:
                return Response(
                    {'error': 'Falha ao obter token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Erro na conexão: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def renovar_token(self, request, pk=None):
        """Força renovação do token de acesso"""
        config = self.get_object()
        
        try:
            from .services_bancarios import criar_integracao_bancaria
            integracao = criar_integracao_bancaria(config)
            
            # Limpa token atual para forçar renovação
            config.access_token = None
            config.save()
            
            # Gera novo token
            token = integracao.gerar_token()
            
            if token:
                return Response({
                    'success': 'Token renovado com sucesso',
                    'expira_em': config.token_expira_em.isoformat()
                })
            else:
                return Response(
                    {'error': 'Falha ao renovar token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Erro: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BoletoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de boletos"""
    queryset = models.Boleto.objects.all().select_related(
        'id_conta', 'id_conta__id_cliente', 'id_config_bancaria'
    )
    serializer_class = serializers.BoletoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'id_config_bancaria', 'data_vencimento', 'id_conta']
    search_fields = ['nosso_numero', 'numero_documento', 'pagador_nome', 'pagador_cpf_cnpj']
    ordering_fields = ['data_vencimento', 'data_emissao', 'data_registro_banco', 'valor_nominal']
    ordering = ['-data_vencimento']
    
    def get_queryset(self):
        """Filtra boletos com filtros adicionais"""
        queryset = super().get_queryset()
        
        # Filtro por período
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        mes = self.request.query_params.get('mes')
        ano = self.request.query_params.get('ano')

        if data_inicio and data_fim:
            queryset = queryset.filter(data_vencimento__range=[data_inicio, data_fim])
        elif mes and ano:
            queryset = queryset.filter(
                data_vencimento__month=mes,
                data_vencimento__year=ano,
            )
        
        # Filtro por vencidos
        vencidos = self.request.query_params.get('vencidos')
        if vencidos == 'true':
            from django.utils import timezone
            queryset = queryset.filter(
                data_vencimento__lt=timezone.now().date(),
                status__in=['REGISTRADO', 'PENDENTE']
            )
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def registrar(self, request):
        """Registra um novo boleto no banco"""
        id_conta = request.data.get('id_conta')
        id_config = request.data.get('id_config_bancaria')
        
        if not id_conta or not id_config:
            return Response(
                {'error': 'Informe id_conta e id_config_bancaria'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            conta = models.FinanceiroConta.objects.get(id_conta=id_conta)
            config = models.ConfiguracaoBancaria.objects.get(id_config=id_config)
            
            if not config.ativo:
                return Response(
                    {'error': 'Configuração bancária inativa'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valida se cliente tem código IBGE
            if not conta.id_cliente.codigo_ibge:
                return Response(
                    {'error': 'Cliente não possui código IBGE cadastrado. Este campo é obrigatório para registro de boletos.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Cria integração e registra boleto
            from .services_bancarios import criar_integracao_bancaria
            integracao = criar_integracao_bancaria(config)
            
            boleto = integracao.registrar_boleto(conta)
            
            serializer = self.get_serializer(boleto)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except models.FinanceiroConta.DoesNotExist:
            return Response(
                {'error': 'Conta a receber não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except models.ConfiguracaoBancaria.DoesNotExist:
            return Response(
                {'error': 'Configuração bancária não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def consultar(self, request, pk=None):
        """Consulta situação do boleto no banco"""
        boleto = self.get_object()
        
        if not boleto.nosso_numero:
            return Response(
                {'error': 'Boleto não possui nosso_numero registrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .services_bancarios import criar_integracao_bancaria
            integracao = criar_integracao_bancaria(boleto.id_config_bancaria)
            
            dados = integracao.consultar_boleto(boleto.nosso_numero)
            
            # Atualiza status se pago
            if dados.get('status') == 'PAGO':
                boleto.status = 'PAGO'
                boleto.data_pagamento = dados.get('data_pagamento')
                boleto.valor_pago = dados.get('valor_pago')
                boleto.save()
            
            return Response(dados)
            
        except Exception as e:
            return Response(
                {'error': f'Erro na consulta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela/baixa um boleto no banco"""
        boleto = self.get_object()
        
        if boleto.status in ['PAGO', 'CANCELADO', 'BAIXADO']:
            return Response(
                {'error': f'Boleto já está {boleto.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .services_bancarios import criar_integracao_bancaria
            integracao = criar_integracao_bancaria(boleto.id_config_bancaria)
            
            sucesso = integracao.cancelar_boleto(boleto.nosso_numero)
            
            if sucesso:
                return Response({'success': 'Boleto cancelado com sucesso'})
            else:
                return Response(
                    {'error': 'Erro ao cancelar boleto'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': f'Erro: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Retorna URL para visualização do PDF do boleto"""
        boleto = self.get_object()
        
        if not boleto.url_boleto:
            return Response(
                {'error': 'URL do boleto não disponível'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'url': boleto.url_boleto,
            'nosso_numero': boleto.nosso_numero,
            'linha_digitavel': boleto.linha_digitavel
        })
    
    @action(detail=True, methods=['get'])
    def pix_qr_code(self, request, pk=None):
        """Retorna QR Code PIX do boleto"""
        boleto = self.get_object()
        
        if not boleto.pix_qr_code:
            return Response(
                {'error': 'PIX não disponível para este boleto'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'qr_code': boleto.pix_qr_code,
            'emv': boleto.pix_emv,
            'txid': boleto.pix_txid
        })
    
    @action(detail=False, methods=['post'])
    def verificar_pagamentos(self, request):
        """
        Verifica pagamentos de boletos pendentes via API bancária
        Executa baixa automática dos boletos pagos
        """
        try:
            from .services_baixa_automatica import servico_baixa_automatica
            
            resultado = servico_baixa_automatica.verificar_boletos_pendentes()
            
            return Response({
                'success': True,
                'processados': resultado['processados'],
                'baixados': resultado['baixados'],
                'erros': resultado['erros'],
                'timestamp': resultado['timestamp']
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao verificar pagamentos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def webhook_pagamento(self, request):
        """
        Endpoint para receber webhooks de pagamento dos bancos
        Formato dos dados varia conforme o banco
        """
        try:
            from .services_baixa_automatica import servico_baixa_automatica
            
            # Processa webhook
            resultado = servico_baixa_automatica.processar_webhook_pagamento(request.data)
            
            if resultado['sucesso']:
                return Response(resultado, status=status.HTTP_200_OK)
            else:
                return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Erro ao processar webhook: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def relatorio_baixas_automaticas(self, request):
        """
        Relatório de boletos baixados automaticamente via API
        Filtros: data_inicio, data_fim, banco, conta_bancaria
        """
        try:
            from .services_baixa_automatica import servico_baixa_automatica
            
            # Extrai filtros
            data_inicio = request.query_params.get('data_inicio')
            data_fim = request.query_params.get('data_fim')
            banco = request.query_params.get('banco')
            conta_bancaria = request.query_params.get('conta_bancaria')
            
            # Gera relatório
            boletos = servico_baixa_automatica.gerar_relatorio_baixas_automaticas(
                data_inicio=data_inicio,
                data_fim=data_fim,
                banco=banco,
                conta_bancaria=conta_bancaria
            )
            
            # Serializa dados
            serializer = self.get_serializer(boletos, many=True)
            
            # Calcula totalizadores
            total_boletos = boletos.count()
            valor_total = sum(float(b.valor_pago or 0) for b in boletos)
            
            return Response({
                'boletos': serializer.data,
                'totalizadores': {
                    'total_boletos': total_boletos,
                    'valor_total': valor_total,
                    'data_inicio': data_inicio,
                    'data_fim': data_fim
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao gerar relatório: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        por_status = {}
        for s in ['ativo', 'finalizado', 'cancelado']:
            por_status[s] = alugueis.filter(status=s).count()
        
        serializer = AluguelListSerializer(alugueis, many=True)
        
        return Response({
            'alugueis': serializer.data,
            'estatisticas': {
                'total_alugueis': total_alugueis,
                'total_faturado': float(total_faturado),
                'total_multas': float(total_multas),
                'por_status': por_status,
            }
        })


class ConfiguracaoContratoViewSet(viewsets.ModelViewSet):
    """ViewSet para configuração de templates de contratos"""
    
    queryset = ConfiguracaoContrato.objects.all()
    serializer_class = ConfiguracaoContratoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo_contrato', 'ativo']
    search_fields = ['tipo_contrato', 'titulo']


from .models import Veiculo
from .serializers import VeiculoSerializer

class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.all()
    serializer_class = VeiculoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['id_cliente']
    search_fields = ['placa', 'modelo', 'marca']
    pagination_class = None



# --- ViewSet de Atalhos ---
class UserAtalhoViewSet(viewsets.ModelViewSet):
    '''
    Endpoint para gerenciar atalhos de teclado do usuário logado.
    '''
    serializer_class = UserAtalhoSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication, SessionAuthentication, BasicAuthentication]
    pagination_class = None

    def get_queryset(self):
        if hasattr(self.request, 'user') and self.request.user.is_authenticated:
            return UserAtalho.objects.filter(user=self.request.user)
        return UserAtalho.objects.none()

    def perform_create(self, serializer):
        # Garante que o atalho seja associado ao usuário logado
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='sync')
    def sync_atalhos(self, request):
        """
        Recebe um JSON { "F1": "/caminho", "F2": "/caminho" ... }
        Substitui todos os atalhos do usuário pelos fornecidos.
        """
        user = request.user
        data = request.data
        
        # Validação básica
        if not isinstance(data, dict):
             return Response({"error": "Formato inválido. Esperado objeto JSON."}, status=400)

        # Remove atalhos antigos
        UserAtalho.objects.filter(user=user).delete()

        # Cria novos
        novos_atalhos = []
        for tecla, caminho in data.items():
            if not caminho: continue # Ignora vazios
            novos_atalhos.append(UserAtalho(
                user=user,
                tecla=tecla,
                caminho=caminho,
                descricao=f"Atalho para {caminho}"
            ))
        
        if novos_atalhos:
            UserAtalho.objects.bulk_create(novos_atalhos)
        
        return Response({"status": "success", "count": len(novos_atalhos)})

    @action(detail=False, methods=['get'], url_path='map')
    def get_map(self, request):
        """
        Retorna um JSON { "F1": "/caminho", ... } para o frontend
        """
        user = request.user
        atalhos = UserAtalho.objects.filter(user=user)
        mapa = {a.tecla: a.caminho for a in atalhos}
        return Response(mapa)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_preferencias_view(request):
    """
    GET  /api/user-preferencias/  → retorna todas as preferências do usuário como {chave: valor}
    PATCH /api/user-preferencias/ → atualiza/cria preferências enviadas como {chave: valor}
    """
    if request.method == 'GET':
        prefs = UserPreferencia.objects.filter(user=request.user)
        return Response({p.chave: p.valor for p in prefs})

    # PATCH
    data = request.data
    if not isinstance(data, dict):
        return Response({'error': 'Esperado objeto JSON.'}, status=400)

    for chave, valor in data.items():
        if valor is None:
            UserPreferencia.objects.filter(user=request.user, chave=chave).delete()
        else:
            UserPreferencia.objects.update_or_create(
                user=request.user,
                chave=chave,
                defaults={'valor': valor}
            )
    return Response({'status': 'ok'})


class ConfiguracaoImpressaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para configurações de impressão por módulo.
    Suporta GET e PATCH/PUT por módulo.
    """
    queryset = models.ConfiguracaoImpressao.objects.all()
    serializer_class = serializers.ConfiguracaoImpressaoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='modulo/(?P<modulo>[^/.]+)')
    def por_modulo(self, request, modulo=None):
        """
        Retorna (ou cria com defaults) a configuração de um módulo específico.
        GET /api/configuracao-impressao/modulo/venda_rapida/
        """
        MODULOS_VALIDOS = [m[0] for m in models.ConfiguracaoImpressao.MODULO_CHOICES]
        if modulo not in MODULOS_VALIDOS:
            return Response(
                {'erro': f'Módulo inválido. Opções: {MODULOS_VALIDOS}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj, _ = models.ConfiguracaoImpressao.objects.get_or_create(modulo=modulo)
        serializer = self.get_serializer(obj)
        return Response(serializer.data)

    @action(detail=False, methods=['patch', 'put'], url_path='modulo/(?P<modulo>[^/.]+)/salvar')
    def salvar_modulo(self, request, modulo=None):
        """
        Cria ou atualiza a configuração de um módulo.
        PATCH /api/configuracao-impressao/modulo/venda_rapida/salvar/
        """
        MODULOS_VALIDOS = [m[0] for m in models.ConfiguracaoImpressao.MODULO_CHOICES]
        if modulo not in MODULOS_VALIDOS:
            return Response(
                {'erro': f'Módulo inválido. Opções: {MODULOS_VALIDOS}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj, _ = models.ConfiguracaoImpressao.objects.get_or_create(modulo=modulo)
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ----- Controle de Lotes de Produto -----

class LoteProdutoViewSet(viewsets.ModelViewSet):
    """
    CRUD para lotes de produto.
    GET  /api/lote-produto/?id_produto=123   → lotes do produto (ativos primeiro)
    POST /api/lote-produto/                  → criar lote
    PATCH/PUT /api/lote-produto/{id}/        → atualizar lote
    GET /api/lote-produto/por_produto/?id_produto=123 → apenas lotes ativos com estoque
    """
    queryset = models.LoteProduto.objects.all()
    serializer_class = serializers.LoteProdutoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_produto', 'ativo']
    search_fields = ['numero_lote', 'observacoes']
    ordering_fields = ['data_validade', 'numero_lote']
    ordering = ['data_validade']
    pagination_class = None

    @action(detail=False, methods=['get'], url_path='por_produto')
    def por_produto(self, request):
        """
        Retorna lotes ativos com quantidade > 0 para um produto específico,
        ordenados por data_validade (FEFO - First Expired First Out).
        GET /api/lote-produto/por_produto/?id_produto=123
        """
        id_produto = request.query_params.get('id_produto')
        if not id_produto:
            return Response({'erro': 'Parâmetro id_produto obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

        lotes = models.LoteProduto.objects.filter(
            id_produto=id_produto,
            ativo=True,
            quantidade__gt=0
        ).order_by('data_validade')

        serializer = self.get_serializer(lotes, many=True)
        return Response(serializer.data)


# ====================================================
# API de Desconto Inteligente
# ====================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simular_desconto(request):
    """
    Simula um desconto inteligente para um produto e cliente específicos.
    Prioriza:
    1. Promoções ativas para o produto.
    2. Desconto preferencial do cliente.
    3. Desconto máximo do produto.
    4. Regra geral (ex: 5% de desconto).

    Payload esperado:
    {
        "id_cliente": 1,
        "id_produto": 1,
        "valor_tabela": 100.00
    }
    """
    from decimal import Decimal
    from .models import Cliente, Produto, Promocao, PromocaoProduto, ClienteGrupoExcecao

    id_cliente = request.data.get('id_cliente')
    id_produto = request.data.get('id_produto')
    valor_tabela = Decimal(str(request.data.get('valor_tabela', 0)))

    if not id_cliente or not id_produto or valor_tabela is None:
        return Response({'error': 'id_cliente, id_produto e valor_tabela são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cliente = Cliente.objects.get(id_cliente=id_cliente)
        produto = Produto.objects.get(id_produto=id_produto)
    except (Cliente.DoesNotExist, Produto.DoesNotExist):
        return Response({'error': 'Cliente ou Produto não encontrados.'}, status=status.HTTP_404_NOT_FOUND)

    desconto_aplicado = Decimal('0.00')
    desconto_percentual = Decimal('0.00')
    travado = False
    motivo = "Nenhum desconto aplicado"

    # Extrai descontos de forma segura (tratando None)
    desconto_cliente = cliente.valor_desconto if (cliente.tipo_desconto == 'PERCENTUAL' and cliente.valor_desconto) else Decimal('0')
    desconto_produto = produto.desconto_maximo_percentual if produto.desconto_maximo_percentual else Decimal('0')
    priorizar_cliente = cliente.priorizar_desconto_cliente if cliente.priorizar_desconto_cliente else False

    # Verifica exceção de grupo do cliente
    excecao_grupo = None
    if produto.id_grupo:
        excecao_grupo = ClienteGrupoExcecao.objects.filter(cliente=cliente, grupo=produto.id_grupo).first()
    
    desconto_excecao = excecao_grupo.desconto_percentual if excecao_grupo and excecao_grupo.desconto_percentual else Decimal('0')

    # 1. Verificar promoções ativas para o produto
    promocoes_ativas = Promocao.objects.filter(
        data_inicio__lte=timezone.now(),
        data_fim__gte=timezone.now(),
        status='ativa',
        promocao_produtos__id_produto=produto
    ).first()

    if promocoes_ativas:
        promo_produto = PromocaoProduto.objects.filter(id_promocao=promocoes_ativas, id_produto=produto).first()
        if promo_produto and promo_produto.quantidade_minima <= 1: # Assumindo 1 para simulação inicial
            desconto_percentual = promo_produto.valor_desconto_produto if promo_produto.valor_desconto_produto is not None else promocoes_ativas.valor_desconto
            desconto_aplicado = valor_tabela * (desconto_percentual / 100)
            travado = True
            motivo = f"Promoção: {promocoes_ativas.nome_promocao}"
    elif desconto_cliente > 0:
        desconto_percentual = desconto_cliente
        desconto_aplicado = valor_tabela * (desconto_percentual / 100)
        travado = True
        motivo = f"Desconto preferencial do cliente ({desconto_cliente}%)"
    elif desconto_produto > 0:
        desconto_percentual = desconto_produto
        desconto_aplicado = valor_tabela * (desconto_percentual / 100)
        motivo = f"Desconto máximo do produto ({desconto_produto}%)"
    else:
        # Regra geral: 5% de desconto padrão se nada mais se aplicar
        desconto_percentual = Decimal('5.00')
        desconto_aplicado = valor_tabela * (desconto_percentual / 100)
        motivo = "Desconto padrão (5%)"

    return Response({
        'desconto_aplicado': float(desconto_aplicado),
        'desconto_percentual': float(desconto_percentual),
        'travado': travado,
        'motivo': motivo
    })


# ====================================================
# SaaS Central Billing & Licensing Views
# ====================================================

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import check_user_permission, HasPermission
from rest_framework.response import Response
from django.utils import timezone
from datetime import date, timedelta
import calendar
import re

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def clean_cnpj(cnpj_str):
    if not cnpj_str:
        return ""
    return re.sub(r'\D', '', str(cnpj_str))


def obter_nome_banco(cliente):
    import re
    from django.db import connection
    
    cnpj_limpo = re.sub(r'\D', '', str(cliente.cnpj))
    candidatos = []
    
    if cliente.schema_name == 'central':
        candidatos = ['aperus_central']
    elif cliente.schema_name == 'testes':
        candidatos = ['aperus_testes', 'sistema_gerencial', f"aperus_{cnpj_limpo}"]
    else:
        candidatos = [f"aperus_{cliente.schema_name}", f"aperus_{cnpj_limpo}", 'sistema_gerencial']
        
    with connection.cursor() as cursor:
        cursor.execute("SHOW DATABASES")
        dbs_existentes = {row[0] for row in cursor.fetchall()}
        
    for db in candidatos:
        if db in dbs_existentes:
            return db
            
    # Default fallback
    if cliente.schema_name == 'central':
        return 'aperus_central'
    elif cliente.schema_name == 'testes':
        return 'aperus_testes'
    return f"aperus_{cliente.schema_name}"


def realizar_backup_banco(cliente):
    from django.conf import settings
    import os
    import subprocess
    from django.utils import timezone
    
    db_config = settings.DATABASES['default']
    engine = db_config.get('ENGINE', '').lower()
    host = db_config.get('HOST', '127.0.0.1')
    port = db_config.get('PORT', '3306')
    user = db_config.get('USER', 'root')
    password = db_config.get('PASSWORD', '')
    
    db_name = obter_nome_banco(cliente)
    
    backup_dir = os.path.join(settings.BASE_DIR, 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    
    if 'mysql' in engine:
        backup_filename = f"backup_{db_name}_{timestamp}.sql"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Procura o executável do mysqldump em caminhos comuns no Windows
        mysqldump_bin = 'mysqldump'
        candidatos_mysqldump = [
            r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
            r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
            r"C:\Program Files\MySQL\MySQL Server 8.1\bin\mysqldump.exe",
            r"C:\Program Files\MySQL\MySQL Server 8.2\bin\mysqldump.exe",
            r"C:\Program Files\MySQL\MySQL Server 8.3\bin\mysqldump.exe",
            r"C:\xampp\mysql\bin\mysqldump.exe",
        ]
        for path in candidatos_mysqldump:
            if os.path.exists(path):
                mysqldump_bin = f'"{path}"'
                break
                
        cmd = f'{mysqldump_bin} -h {host} -P {port} -u {user} {db_name}'
        
        env = os.environ.copy()
        if password:
            env['MYSQL_PWD'] = password
            
        with open(backup_path, 'w', encoding='utf-8', errors='ignore') as f:
            result = subprocess.run(
                cmd,
                env=env,
                stdout=f,
                stderr=subprocess.PIPE,
                text=True,
                shell=True,
                timeout=120
            )
            
        if result.returncode != 0 or not os.path.exists(backup_path) or os.path.getsize(backup_path) == 0:
            err_msg = result.stderr if result.returncode != 0 else "Arquivo de backup vazio (0 KB)."
            if os.path.exists(backup_path):
                try:
                    os.remove(backup_path)
                except Exception:
                    pass
            raise Exception(f"Falha no mysqldump para o banco '{db_name}': {err_msg}")
            
        return backup_path
        
    elif 'sqlserver' in engine or 'mssql' in engine or 'pyodbc' in engine:
        backup_filename = f"backup_{db_name}_{timestamp}.bak"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        from django.db import connection
        with connection.cursor() as cursor:
            sql = f"BACKUP DATABASE [{db_name}] TO DISK = %s WITH FORMAT"
            cursor.execute(sql, [backup_path])
            
        if not os.path.exists(backup_path) or os.path.getsize(backup_path) == 0:
            raise Exception(f"Falha no backup do SQL Server para '{db_name}'. Arquivo não gerado ou vazio.")
            
        return backup_path
        
    else:
        raise Exception(f"Motor de banco de dados não suportado para backup automático: {engine}")


class SaaSClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de clientes SaaS (Aperus Mãe).
    """
    queryset = models.SaaSCliente.objects.all().order_by('-data_cadastro')
    serializer_class = serializers.SaaSClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    filterset_fields = ['status_licenca', 'dia_vencimento']
    search_fields = ['cnpj', 'razao_social']

    def get_next_available_port(self):
        import socket
        port = 8007
        while True:
            if not models.SaaSCliente.objects.filter(db_port=str(port)).exists():
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                try:
                    s.bind(('127.0.0.1', port))
                    s.close()
                    return str(port)
                except socket.error:
                    pass
            port += 1

    def perform_create(self, serializer):
        db_port = serializer.validated_data.get('db_port', '8005')
        schema_name = serializer.validated_data.get('schema_name', '')
        
        if schema_name not in ['central', 'testes']:
            if db_port == '8005' or models.SaaSCliente.objects.filter(db_port=db_port).exists():
                db_port = self.get_next_available_port()
                
        serializer.save(banco_criado=False, db_port=db_port)

    @action(detail=True, methods=['post'])
    def reparar_servico(self, request, pk=None):
        if not request.user.is_superuser:
            return Response({'error': 'Apenas superusuários podem reparar serviços.'}, status=403)
        cliente = self.get_object()
        from api.services.tenant_service import registrar_servico_windows_nssm
        sucesso, msg = registrar_servico_windows_nssm(cliente.schema_name, cliente.db_port)
        return Response({'sucesso': sucesso, 'mensagem': msg})

    @action(detail=True, methods=['post'])
    def criar_banco_dados(self, request, pk=None):
        if not check_user_permission(request.user, 'pode_criar_banco'):
            return Response({'error': 'Você não tem permissão para criar banco de dados.'}, status=status.HTTP_403_FORBIDDEN)

        """
        Action para provisionar o banco de dados físico, gerar pasta de arquivos no Windows Server,
        injetar dados da empresa e criar usuário ADMIN / _APERUS#.
        """
        cliente = self.get_object()
        if cliente.schema_name == 'central':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'O banco de dados central não pode ser recriado.'})

        import re
        cnpj_limpo = re.sub(r'\D', '', str(cliente.cnpj))
        if cliente.banco_criado:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'O banco de dados para este cliente já foi criado.'})

        try:
            # 1. Cria o banco de dados físico no MySQL/SQL Server e roda as migrações
            self.provisionar_banco_cliente(cliente)
            
            # 2. Gera a pasta de arquivos no Windows Server copiando o template SistemaAperus e configurando .env/portas
            import os
            import re
            import shutil
            from django.conf import settings
            
            default_db = settings.DATABASES['default']
            if cliente.schema_name == 'central':
                db_name = 'aperus_central'
            elif cliente.schema_name == 'testes':
                db_name = 'aperus_testes'
            else:
                db_name = f"aperus_{cliente.schema_name}"
                
            # Procura a pasta template do sistema em caminhos comuns e relativos
            candidatos_template = [
                r"C:\APERUS\arquivos_clientes\aperus_perm_cliente",
                os.path.abspath(os.path.join(settings.BASE_DIR, '..', 'SistemaAperus')),
                r"C:\Projetos\SistemaGerencial\SistemaAperus",
                r"C:\APERUS\SistemaAperus",
                r"C:\aperus\SistemaAperus",
            ]
            template_dir = None
            for path in candidatos_template:
                if os.path.exists(path) and os.path.exists(os.path.join(path, "manage.py")):
                    template_dir = path
                    break
                    
            if not template_dir:
                raise Exception(
                    "Diretório de template 'SistemaAperus' não encontrado ou incompleto no servidor. "
                    f"Caminhos verificados: {candidatos_template}"
                )

            arquivos_dir = f"C:\\APERUS\\arquivos_clientes\\{db_name}"
            
            # Remove a pasta existente (se houver tentativa anterior corrompida)
            if os.path.exists(arquivos_dir):
                try:
                    shutil.rmtree(arquivos_dir)
                except Exception:
                    pass
                    
            # Copia o template completo (ignorando pastas grandes/pesadas que podem estar travadas)
            try:
                shutil.copytree(
                    template_dir, 
                    arquivos_dir, 
                    dirs_exist_ok=True,
                    ignore=shutil.ignore_patterns('.venv', 'node_modules', '.git')
                )
            except Exception as copy_err:
                raise Exception(
                    "Erro ao copiar arquivos do template para a pasta do cliente. "
                    "Isso geralmente ocorre se alguns arquivos na pasta destino (como o INICIAR.bat ou o ambiente virtual) "
                    "estiverem abertos ou sendo executados por outro programa. Certifique-se de fechar todos os terminais "
                    f"e arquivos do cliente e tente novamente. Detalhes: {str(copy_err)}"
                )
                
            # Configura o .env do novo cliente
            env_file = os.path.join(arquivos_dir, ".env")
            env_example = os.path.join(arquivos_dir, ".env.example")
            if not os.path.exists(env_file) and os.path.exists(env_example):
                try:
                    shutil.copy(env_example, env_file)
                except Exception:
                    pass
                    
            if os.path.exists(env_file):
                try:
                    with open(env_file, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    new_lines = []
                    for line in lines:
                        if line.startswith("DB_NAME="):
                            new_lines.append(f"DB_NAME={db_name}\n")
                        elif line.startswith("DB_USER="):
                            new_lines.append(f"DB_USER={default_db.get('USER', 'root')}\n")
                        elif line.startswith("DB_PASSWORD="):
                            new_lines.append(f"DB_PASSWORD={default_db.get('PASSWORD', '')}\n")
                        elif line.startswith("DB_HOST="):
                            new_lines.append(f"DB_HOST={default_db.get('HOST', '127.0.0.1')}\n")
                        elif line.startswith("DB_PORT="):
                            new_lines.append(f"DB_PORT={default_db.get('PORT', '3306')}\n")
                        elif line.startswith("DEBUG="):
                            new_lines.append("DEBUG=True\n")
                        elif line.startswith("ALLOWED_HOSTS="):
                            new_lines.append("ALLOWED_HOSTS=*\n")
                        else:
                            new_lines.append(line)
                            
                    with open(env_file, 'w', encoding='utf-8') as f:
                        f.writelines(new_lines)
                except Exception:
                    pass

            # Configura a porta no INICIAR.bat
            iniciar_bat = os.path.join(arquivos_dir, "INICIAR.bat")
            if os.path.exists(iniciar_bat):
                try:
                    with open(iniciar_bat, 'r', encoding='utf-8', errors='ignore') as f:
                        bat_content = f.read()
                    bat_content = re.sub(r':\d+', f':{cliente.db_port}', bat_content)
                    bat_content = re.sub(r'porta \d+', f'porta {cliente.db_port}', bat_content, flags=re.IGNORECASE)
                    with open(iniciar_bat, 'w', encoding='utf-8') as f:
                        f.write(bat_content)
                except Exception:
                    pass

            # Configura a porta no INICIAR_PRODUCAO.ps1
            iniciar_ps1 = os.path.join(arquivos_dir, "INICIAR_PRODUCAO.ps1")
            if os.path.exists(iniciar_ps1):
                try:
                    with open(iniciar_ps1, 'r', encoding='utf-8', errors='ignore') as f:
                        ps1_content = f.read()
                    ps1_content = re.sub(r'\$PORTA\s*=\s*"\d+"', f'$PORTA = "{cliente.db_port}"', ps1_content)
                    with open(iniciar_ps1, 'w', encoding='utf-8') as f:
                        f.write(ps1_content)
                except Exception:
                    pass

            # Substitui a porta de template '8005' em todos os arquivos de configuração e código fonte do cliente
            extensions = ('.js', '.jsx', '.html', '.css', '.json', '.bat', '.ps1', '.txt')
            for root, dirs, files in os.walk(arquivos_dir):
                # Ignora pastas grandes e binárias como .venv, node_modules e .git
                if any(x in root for x in ['.venv', 'node_modules', '.git']):
                    continue
                for file in files:
                    if file.endswith(extensions):
                        filepath = os.path.join(root, file)
                        try:
                            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                            if '8005' in content:
                                new_content = content.replace('8005', str(cliente.db_port))
                                with open(filepath, 'w', encoding='utf-8') as f:
                                    f.write(new_content)
                        except Exception:
                            pass
            
            # 3. Injeta os dados cadastrais da empresa no novo banco
            if cliente.schema_name == 'central':
                db_name = 'aperus_central'
            elif cliente.schema_name == 'testes':
                db_name = 'aperus_testes'
            else:
                db_name = f"aperus_{cliente.schema_name}"
            from api.models import EmpresaConfig, User
            from django.contrib.auth.hashers import make_password
            
            # Remove qualquer config pré-existente
            EmpresaConfig.objects.using(db_name).all().delete()
            
            # Cria a nova EmpresaConfig
            empresa = EmpresaConfig(
                nome_razao_social=cliente.razao_social,
                nome_fantasia=cliente.nome_fantasia or cliente.razao_social,
                cpf_cnpj=cnpj_limpo,
                endereco=cliente.endereco or "",
                numero=cliente.numero or "",
                bairro=cliente.bairro or "",
                cidade=cliente.cidade or "",
                estado=cliente.estado or "",
                cep=cliente.cep or "",
                telefone=cliente.telefone or "",
                email=cliente.email or ""
            )
            empresa.save(using=db_name)
            
            # 4. Cria automaticamente o usuário administrador padrão: ADMIN / _APERUS#
            User.objects.using(db_name).filter(username='ADMIN').delete()
            
            admin_user = User(
                username='ADMIN',
                password=make_password('_APERUS#'),
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            admin_user.save(using=db_name)
            
            # 5. Altera o campo banco_criado para True
            cliente.banco_criado = True
            cliente.save()
            
            # 6. Registra e inicia o serviço do Windows via NSSM se não for central/testes
            msg_servico = "Serviço não registrado para base central/testes."
            sucesso_servico = True
            if cliente.schema_name not in ['central', 'testes']:
                try:
                    from api.services.tenant_service import registrar_servico_windows_nssm
                    sucesso_servico, msg_servico = registrar_servico_windows_nssm(cliente.schema_name, cliente.db_port)
                except Exception as e_servico:
                    sucesso_servico = False
                    msg_servico = f"Erro ao registrar o serviço Windows: {e_servico}"
            
            serializer = self.get_serializer(cliente)
            response_data = serializer.data
            response_data['sucesso_servico'] = sucesso_servico
            response_data['mensagem_servico'] = msg_servico
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'error': f'Erro ao criar banco de dados e provisionar dados para este cliente: {str(e)}'
            })

    def provisionar_banco_cliente(self, cliente):
        from django.db import connection
        from django.conf import settings
        from django.core.management import call_command
        import re
        import copy
        import threading
        import os
        import subprocess
        
        cnpj = re.sub(r'\D', '', str(cliente.cnpj))
        if cliente.schema_name == 'central':
            db_name = 'aperus_central'
        elif cliente.schema_name == 'testes':
            db_name = 'aperus_testes'
        else:
            db_name = f"aperus_{cliente.schema_name}"
        
        # 1. Executa DROP e CREATE DATABASE na conexão central para limpar qualquer estado anterior corrompido
        with connection.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS {db_name};")
            cursor.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            
        # 2. Adiciona conexão dinamicamente no pool de DATABASES do settings (copiando todas as chaves)
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name
        
        # 3. Roda clonagem de schema se for MySQL, caso contrário roda migrações padrão
        engine = default_db.get('ENGINE', '').lower()
        if 'mysql' in engine:
            mysqldump_bin = 'mysqldump'
            mysql_bin = 'mysql'
            candidatos_mysqldump = [
                r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
                r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
                r"C:\Program Files\MySQL\MySQL Server 8.1\bin\mysqldump.exe",
                r"C:\Program Files\MySQL\MySQL Server 8.2\bin\mysqldump.exe",
                r"C:\Program Files\MySQL\MySQL Server 8.3\bin\mysqldump.exe",
                r"C:\xampp\mysql\bin\mysqldump.exe",
            ]
            for path in candidatos_mysqldump:
                if os.path.exists(path):
                    mysqldump_bin = f'"{path}"'
                    mysql_bin = f'"{path.replace("mysqldump.exe", "mysql.exe")}"'
                    break
            
            host = default_db.get('HOST', '127.0.0.1')
            port = default_db.get('PORT', '3306')
            user = default_db.get('USER', 'root')
            password = default_db.get('PASSWORD', '')
            central_db = default_db.get('NAME', 'aperus_central')
            
            schema_file = os.path.join(settings.BASE_DIR, 'scratch', f'temp_schema_{cnpj}.sql')
            os.makedirs(os.path.dirname(schema_file), exist_ok=True)
            
            cmd_dump = f'{mysqldump_bin} -h {host} -P {port} -u {user} --no-data {central_db}'
            env = os.environ.copy()
            if password:
                env['MYSQL_PWD'] = password
                
            try:
                # Dump schema
                with open(schema_file, 'w', encoding='utf-8') as f:
                    res_dump = subprocess.run(cmd_dump, env=env, stdout=f, stderr=subprocess.PIPE, text=True, shell=True, timeout=60)
                if res_dump.returncode != 0:
                    raise Exception(f"Erro ao exportar schema do banco central: {res_dump.stderr}")
                    
                # Import schema
                cmd_import = f'{mysql_bin} -h {host} -P {port} -u {user} --default-character-set=utf8mb4 {db_name}'
                with open(schema_file, 'r', encoding='utf-8-sig') as f:
                    sql_content = f.read()
                
                fixed_sql = "SET FOREIGN_KEY_CHECKS=0;\n" + sql_content + "\nSET FOREIGN_KEY_CHECKS=1;\n"
                fixed_sql_bytes = fixed_sql.encode('utf-8')
                
                res_import = subprocess.run(cmd_import, env=env, input=fixed_sql_bytes, stderr=subprocess.PIPE, shell=True, timeout=60)
                if res_import.returncode != 0:
                    err_msg = res_import.stderr.decode('utf-8', errors='replace')
                    raise Exception(f"Erro ao importar schema no banco do cliente: {err_msg}")
            finally:
                if os.path.exists(schema_file):
                    try:
                        os.remove(schema_file)
                    except Exception:
                        pass
        else:
            exception_holder = []
            
            def run_migration():
                try:
                    call_command('migrate', database=db_name, interactive=False)
                except Exception as e:
                    exception_holder.append(e)
                    
            thread = threading.Thread(target=run_migration)
            thread.start()
            thread.join()
            
            if exception_holder:
                if db_name in settings.DATABASES:
                    del settings.DATABASES[db_name]
                raise exception_holder[0]

    @action(detail=True, methods=['post'])
    def gerar_mensalidades(self, request, pk=None):
        if not check_user_permission(request.user, 'pode_cadastrar_financeiro_saas'):
            return Response({'error': 'Você não tem permissão para gerenciar o faturamento SaaS.'}, status=status.HTTP_403_FORBIDDEN)

        """
        Gera mensalidades em lote para um cliente.
        Payload: {"meses": 6, "id_config_bancaria": 2}
        """
        cliente = self.get_object()
        if cliente.is_test_environment:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Não é possível gerar mensalidades para um cliente de ambiente de teste.'})
            
        id_config_bancaria = request.data.get('id_config_bancaria')
        if not id_config_bancaria:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Você deve selecionar uma conta bancária para emissão dos boletos.'})

        try:
            config_bancaria = models.ConfiguracaoBancaria.objects.get(pk=id_config_bancaria, ativo=True)
        except models.ConfiguracaoBancaria.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'A configuração bancária selecionada não existe ou não está ativa.'})

        from .services_bancarios import criar_integracao_bancaria
        try:
            integracao = criar_integracao_bancaria(config_bancaria)
        except Exception as e:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': f'Erro ao inicializar integração bancária: {str(e)}'})

        try:
            meses = int(request.data.get('meses', 1))
        except (ValueError, TypeError):
            meses = 1

        mensalidades_geradas = []
        hoje = timezone.now().date()
        ano = hoje.year
        mes = hoje.month

        try:
            for i in range(meses):
                # Incrementa o mês
                mes += 1
                if mes > 12:
                    mes = 1
                    ano += 1

                # Proteção contra dias inexistentes (ex: dia 31 em fevereiro)
                dia = cliente.dia_vencimento
                ultimo_dia_mes = calendar.monthrange(ano, mes)[1]
                dia_efetivo = min(dia, ultimo_dia_mes)
                vencimento = date(ano, mes, dia_efetivo)

                nosso_numero = f"{cliente.id_saas_cliente:03d}{ano}{mes:02d}"

                # Cria a mensalidade com valores provisórios antes de registrar na API
                mensalidade = models.SaaSClienteMensalidade.objects.create(
                    saas_cliente=cliente,
                    nosso_numero=nosso_numero,
                    data_vencimento=vencimento,
                    valor=cliente.valor_mensalidade,
                    status_pagamento='PENDENTE',
                    url_boleto="",
                    linha_digitavel="",
                    pix_copia_cola="",
                    configuracao_bancaria=config_bancaria,
                )

                # Tenta registrar o boleto real via API
                try:
                    integracao.registrar_boleto_saas(mensalidade)
                except Exception as e:
                    # Se falhar a integração, remove a mensalidade atual e levanta erro
                    mensalidade.delete()
                    raise Exception(f"Erro ao registrar boleto para o vencimento {vencimento.strftime('%d/%m/%Y')}: {str(e)}")

                mensalidades_geradas.append(mensalidade)
        except Exception as e:
            # Se ocorrer erro em qualquer mês, removemos as mensalidades que já haviam sido criadas neste lote
            for m in mensalidades_geradas:
                try:
                    m.delete()
                except Exception:
                    pass
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': str(e)})

        serializer = serializers.SaaSClienteMensalidadeSerializer(mensalidades_geradas, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_or_create_update_script(self, cliente):
        import os
        import subprocess

        def descobrir_nome_servico_windows(client_dir, schema_name):
            nssm_path = "C:\\APERUS\\nssm.exe"
            try:
                res = subprocess.run(['powershell', '-Command', 'Get-Service -Name AperusServer* | Select-Object -ExpandProperty Name'], capture_output=True, text=True)
                if res.returncode == 0:
                    servicos = [s.strip() for s in res.stdout.strip().split('\n') if s.strip()]
                    for svc in servicos:
                        res_dir = subprocess.run([nssm_path, 'get', svc, 'AppDirectory'], capture_output=True, text=True)
                        if res_dir.returncode == 0:
                            app_dir = res_dir.stdout.strip()
                            if os.path.abspath(app_dir).lower() == os.path.abspath(client_dir).lower():
                                return svc
            except Exception:
                pass
            
            if "SistemaAperus" in client_dir:
                return "AperusServerFilho"
            elif "aperus_mae" in client_dir:
                return "AperusServerMae"
            
            name_cap = schema_name.capitalize()
            return f"AperusServer{name_cap}"
        
        # Determina o diretório de arquivos do cliente
        if cliente.schema_name == 'testes':
            client_dir = "C:\\APERUS\\SistemaAperus"
        elif cliente.schema_name == 'central':
            client_dir = "C:\\APERUS\\aperus_mae"
        else:
            client_dir = f"C:\\APERUS\\arquivos_clientes\\aperus_{cliente.schema_name}"
            # Se o cliente é ambiente de teste OU a pasta ainda não existe, usa SistemaAperus
            if getattr(cliente, 'is_test_environment', False) or not os.path.exists(client_dir):
                client_dir = "C:\\APERUS\\SistemaAperus"
            
        # Para clientes normais (incluindo testes e outros que copiam da mae), garante que o ATUALIZAR.ps1 é gerado
        _schema_especial = cliente.schema_name == 'central'
        if not _schema_especial and os.path.exists(client_dir):
            ps1_path = os.path.join(client_dir, "ATUALIZAR.ps1")
            needs_generation = True
            if os.path.exists(ps1_path):
                try:
                    with open(ps1_path, 'r', encoding='utf-8', errors='ignore') as ps_file:
                        content = ps_file.read()
                        if "Copy-TemplateFiles" in content and "nssmPath" in content:
                            needs_generation = False
                except Exception:
                    pass
            
            if needs_generation:
                try:
                    client_ps1_content = """# ATUALIZAR.ps1 - Atualizar cliente a partir do template SistemaAperus
# ============================================================
# ATENCAO: Este script e exclusivo para instancias de CLIENTES.
# Ele NAO faz git pull. Em vez disso, copia apenas os arquivos
# de CODIGO do template SistemaAperus, preservando os arquivos
# de configuracao do banco de dados (.env, settings, etc.)
# Usa NSSM para parar/iniciar o servico corretamente.
# ============================================================
$Host.UI.RawUI.WindowTitle = "APERUS - ATUALIZAR CLIENTE"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

Clear-Host
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  APERUS - ATUALIZANDO CLIENTE" -ForegroundColor Cyan
Write-Host "  Pasta: $scriptDir" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Detectar PORTA do cliente a partir do .env (para reiniciar
# na porta correta)
# ============================================================
$portaCliente = "8007"  # Porta padrao se nao encontrada no .env
if (Test-Path ".env") {
    $envLines = Get-Content ".env" -ErrorAction SilentlyContinue
    foreach ($line in $envLines) {
        if ($line -match "^PORT\\\\s*=\\\\s*(\\\\d+)") {
            $portaCliente = $Matches[1]
            break
        }
    }
}
Write-Host "  Porta do cliente: $portaCliente" -ForegroundColor DarkGray
Write-Host ""

# ============================================================
# Detectar nome do venv (pode ser 'venv' ou '.venv')
# ============================================================
$venvPath = "venv"
if (Test-Path ".venv\\\\Scripts\\\\python.exe") { $venvPath = ".venv" }

# ============================================================
# [1/5] Parar servidor Django do cliente (via NSSM)
# ============================================================
Write-Host "[1/5] Parando servidor Django..." -ForegroundColor Yellow

# Detectar o nome do servico NSSM do cliente
$nssmPath = "C:\\\\APERUS\\\\nssm.exe"
$nomeServico = "__NOME_SERVICO__"
Write-Host "  Servico: $nomeServico" -ForegroundColor DarkGray

# Tentar parar pelo servico NSSM
$servicoParado = $false
try {
    $statusResult = & $nssmPath status $nomeServico 2>$null
    if ($statusResult -match 'SERVICE_RUNNING') {
        Write-Host "  Parando servico $nomeServico via NSSM..." -ForegroundColor Yellow
        & $nssmPath stop $nomeServico 2>$null
        Start-Sleep -Seconds 3
        $servicoParado = $true
        Write-Host "  OK - Servico parado." -ForegroundColor Green
    } else {
        Write-Host "  Servico $nomeServico ja estava parado." -ForegroundColor DarkGray
        $servicoParado = $true
    }
} catch {
    Write-Host "  [AVISO] Nao foi possivel parar pelo NSSM. Tentando matar processo na porta..." -ForegroundColor Yellow
}

# Fallback: matar processo pela porta se o NSSM nao conseguiu
if (-not $servicoParado) {
    $pids = @()
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        $connections = Get-NetTCPConnection -LocalPort $portaCliente -ErrorAction SilentlyContinue
        if ($connections) {
            $pids = @($connections.OwningProcess)
        }
    }
    foreach ($procId in $pids | Select-Object -Unique) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc -and ($proc.Name -like "*python*")) {
            Write-Host "  Parando processo Python (PID $procId) na porta $portaCliente..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "  OK." -ForegroundColor Green
}

# Garantir que a porta esta livre (matar qualquer processo orfao)
$connections = Get-NetTCPConnection -LocalPort $portaCliente -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($procId in ($connections.OwningProcess | Select-Object -Unique)) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc -and ($proc.Name -like "*python*")) {
            Write-Host "  Matando processo orfao (PID $procId) na porta $portaCliente..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
}

# ============================================================
# [2/5] Fazer backup dos arquivos de configuracao do banco
#       ANTES de qualquer copia (para garantir preservacao)
# ============================================================
Write-Host ""
Write-Host "[2/5] Protegendo arquivos de configuracao do banco..." -ForegroundColor Yellow

# Arquivos de configuracao que NUNCA devem ser sobrescritos
$arquivosProtegidos = @(
    ".env",
    "projeto_gerencial\\\\settings.py",
    "projeto_gerencial\\\\settings_production.py",
    "projeto_gerencial\\\\settings_azure.py",
    "projeto_gerencial\\\\settings_exe.py",
    "INICIAR.bat",
    "INICIAR_PRODUCAO.ps1",
    "ATUALIZAR.ps1",
    "ATUALIZAR.bat"
)

# Pasta temporaria para backup dos arquivos protegidos
$backupDir = Join-Path $env:TEMP "aperus_backup_$($portaCliente)_$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$backupFeito = @{}
foreach ($arquivo in $arquivosProtegidos) {
    $caminhoCompleto = Join-Path $scriptDir $arquivo
    if (Test-Path $caminhoCompleto) {
        $destino = Join-Path $backupDir $arquivo
        $pastaDestino = Split-Path -Parent $destino
        if (-not (Test-Path $pastaDestino)) {
            New-Item -ItemType Directory -Path $pastaDestino -Force | Out-Null
        }
        Copy-Item -Path $caminhoCompleto -Destination $destino -Force -ErrorAction SilentlyContinue
        $backupFeito[$arquivo] = $destino
        Write-Host "  Protegido: $arquivo" -ForegroundColor DarkGray
    }
}
Write-Host "  OK - $($backupFeito.Count) arquivos de configuracao protegidos." -ForegroundColor Green

# ============================================================
# [3/5] Copiar arquivos de codigo do template SistemaAperus
#       (apenas arquivos .py, .js, .jsx, etc. -- sem .env)
# ============================================================
Write-Host ""
Write-Host "[3/5] Copiando atualizacoes de codigo..." -ForegroundColor Cyan

$templateDir = "C:\\\\APERUS\\\\aperus_mae"
if (-not (Test-Path $templateDir)) {
    Write-Host "  [AVISO] Pasta template $templateDir nao encontrada. Pulando copia." -ForegroundColor Yellow
} else {
    # Extensoes de arquivos de CODIGO que podem ser atualizados
    $extensoesCodigo = @(".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".json", ".txt", ".md", ".rst")
    
    # Pastas que NAO devem ser copiadas
    $pastasIgnoradas = @(".git", ".venv", "venv", "node_modules", "backups", "logs", "scratch",
                         "staticfiles", "media", "__pycache__", ".vscode")
    
    # Arquivos que NAO devem ser copiados (configuracoes do banco/instancia)
    $arquivosIgnorados = @(".env", ".env.example", ".env.local", ".env.production",
                           "INICIAR.bat", "INICIAR_PRODUCAO.ps1", "ATUALIZAR.ps1", "ATUALIZAR.bat",
                           "ATUALIZAR_SERVIDOR.vbs", "db.sqlite3")
    
    # Arquivos de settings que contem configuracao do banco
    $settingsIgnorados = @("settings.py", "settings_production.py", "settings_azure.py", "settings_exe.py")
    
    function Copy-TemplateFiles ($srcDir, $currentRelPath) {
        $srcPath = if ($currentRelPath) { Join-Path $srcDir $currentRelPath } else { $srcDir }
        $items = Get-ChildItem -Path $srcPath
        foreach ($item in $items) {
            $relItemPath = if ($currentRelPath) { Join-Path $currentRelPath $item.Name } else { $item.Name }
            if ($item.PSIsContainer) {
                # Ignora pastas desnecessarias na origem
                if ($pastasIgnoradas -contains $item.Name) { continue }
                Copy-TemplateFiles $srcDir $relItemPath
            } else {
                # Ignora arquivos de configuracao e banco na raiz/settings
                if ($arquivosIgnorados -contains $item.Name) { continue }
                if ($relItemPath -like "projeto_gerencial\\\\*" -and $settingsIgnorados -contains $item.Name) { continue }
                
                # Filtra extensoes de codigo
                $ext = $item.Extension.ToLower()
                if ($extensoesCodigo -notcontains $ext) { continue }
                
                # Copia para o destino
                $destino = Join-Path $scriptDir $relItemPath
                $pastaDestino = Split-Path -Parent $destino
                try {
                    if (-not (Test-Path $pastaDestino)) {
                        New-Item -ItemType Directory -Path $pastaDestino -Force | Out-Null
                    }
                    Copy-Item -Path $item.FullName -Destination $destino -Force -ErrorAction Stop
                    $script:arquivosAtualizados++
                } catch {
                    $script:erros++
                }
            }
        }
    }

    $script:arquivosAtualizados = 0
    $script:erros = 0
    Copy-TemplateFiles $templateDir ""
    
    Write-Host "  OK - $script:arquivosAtualizados arquivo(s) de codigo atualizado(s)." -ForegroundColor Green
    if ($script:erros -gt 0) {
        Write-Host "  [AVISO] $script:erros arquivo(s) com erro ao copiar (podem estar em uso)." -ForegroundColor Yellow
    }
}

# ============================================================
# [4/5] Restaurar arquivos de configuracao protegidos
# ============================================================
Write-Host ""
Write-Host "[4/5] Restaurando configuracoes do banco de dados..." -ForegroundColor Yellow

foreach ($arquivo in $backupFeito.Keys) {
    $origem = $backupFeito[$arquivo]
    $destino = Join-Path $scriptDir $arquivo
    $pastaDestino = Split-Path -Parent $destino
    
    if (-not (Test-Path $pastaDestino)) {
        New-Item -ItemType Directory -Path $pastaDestino -Force | Out-Null
    }
    
    try {
        Copy-Item -Path $origem -Destination $destino -Force -ErrorAction Stop
        Write-Host "  Restaurado: $arquivo" -ForegroundColor DarkGray
    } catch {
        Write-Host "  [ERRO] Nao foi possivel restaurar: $arquivo" -ForegroundColor Red
    }
}

# Limpar backup temporario
Remove-Item -Path $backupDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  OK - Configuracoes do banco de dados preservadas." -ForegroundColor Green

# ============================================================
# [4.2/5] Executando migracoes do banco de dados (migrate)
# ============================================================
Write-Host ""
Write-Host "[4.2/5] Executando migracoes do banco de dados (migrate)..." -ForegroundColor Yellow
if (Test-Path "$venvPath\\Scripts\\activate.bat") {
    cmd.exe /c "call $venvPath\\Scripts\\activate.bat && python manage.py migrate --run-syncdb"
    Write-Host "  OK - Banco de dados migrado!" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] Ambiente virtual nao encontrado. Pulando migrate." -ForegroundColor Yellow
}

# ============================================================
# [4.5/5] Sincronizar arquivos estaticos do frontend
# ============================================================
Write-Host ""
Write-Host "[4.5/5] Sincronizando arquivos estaticos do frontend (collectstatic)..." -ForegroundColor Yellow

# Limpar staticfiles antigos para evitar conflito com builds anteriores
$staticDir = Join-Path $scriptDir "staticfiles"
if (Test-Path $staticDir) {
    Write-Host "  Limpando staticfiles antigos..." -ForegroundColor DarkGray
    Remove-Item -Path $staticDir -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path "$venvPath\\Scripts\\activate.bat") {
    cmd.exe /c "call $venvPath\\Scripts\\activate.bat && python manage.py collectstatic --noinput"
    Write-Host "  OK - Arquivos estaticos sincronizados!" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] Ambiente virtual nao encontrado. Pulando collectstatic." -ForegroundColor Yellow
}

# ============================================================
# [5/5] Reiniciar servidor Django do cliente (via NSSM)
# ============================================================
Write-Host ""
Write-Host "[5/5] Reiniciando servidor Django na porta $portaCliente..." -ForegroundColor Cyan

# Tentar iniciar pelo servico NSSM (metodo correto)
$servicoIniciado = $false
try {
    $statusResult = & $nssmPath status $nomeServico 2>$null
    if ($statusResult -match 'SERVICE_STOPPED|SERVICE_PAUSED') {
        Write-Host "  Iniciando servico $nomeServico via NSSM..." -ForegroundColor Cyan
        & $nssmPath start $nomeServico 2>$null
        Start-Sleep -Seconds 3
        $statusResult2 = & $nssmPath status $nomeServico 2>$null
        if ($statusResult2 -match 'SERVICE_RUNNING') {
            $servicoIniciado = $true
            Write-Host "  OK - Servico $nomeServico iniciado via NSSM!" -ForegroundColor Green
        } else {
            Write-Host "  [AVISO] NSSM nao confirmou inicio. Status: $statusResult2" -ForegroundColor Yellow
        }
    } elseif ($statusResult -match 'SERVICE_RUNNING') {
        Write-Host "  Servico $nomeServico ja esta rodando." -ForegroundColor Green
        $servicoIniciado = $true
    }
} catch {
    Write-Host "  [AVISO] Falha ao iniciar pelo NSSM: $_" -ForegroundColor Yellow
}

# Fallback: iniciar processo diretamente se NSSM falhou
if (-not $servicoIniciado) {
    Write-Host "  Tentando iniciar Django diretamente..." -ForegroundColor Yellow
    if (Test-Path "$venvPath\\\\Scripts\\\\python.exe") {
        Start-Process powershell -ArgumentList "-WindowStyle Minimized -ExecutionPolicy Bypass -Command `"cd '$scriptDir'; .\\\\$venvPath\\\\Scripts\\\\python.exe manage.py runserver 0.0.0.0:$portaCliente --noreload`""
        Write-Host "  OK - Django iniciado diretamente na porta $portaCliente!" -ForegroundColor Green
    } else {
        Write-Host "  [AVISO] Ambiente virtual nao encontrado ($venvPath). Execute INSTALAR.bat." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [OK] CLIENTE ATUALIZADO COM SUCESSO!" -ForegroundColor Green
Write-Host "  Configuracoes do banco de dados preservadas." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
"""
                    # Descobrir nome do serviço Windows e injetar
                    nome_servico = descobrir_nome_servico_windows(client_dir, cliente.schema_name)
                    client_ps1_content = client_ps1_content.replace("__NOME_SERVICO__", nome_servico)
                    with open(ps1_path, 'w', encoding='utf-8') as ps_file:
                        ps_file.write(client_ps1_content)
                except Exception:
                    pass

        script_path = f"C:\\APERUS\\atualizar_{cliente.schema_name}.bat"
        if not os.path.exists(script_path):
            if os.path.exists(os.path.join(client_dir, "ATUALIZAR.ps1")):
                try:
                    with open(script_path, 'w', encoding='utf-8') as f:
                        f.write('@echo off\n')
                        f.write(f'cd /d "{client_dir}"\n')
                        # Para central/testes/ambientes de teste, passa -NonInteractive para o git pull
                        if _schema_especial:
                            f.write(f'powershell.exe -ExecutionPolicy Bypass -NonInteractive -File "{client_dir}\\ATUALIZAR.ps1" -NonInteractive\n')
                        else:
                            f.write(f'powershell.exe -ExecutionPolicy Bypass -NonInteractive -File "{client_dir}\\ATUALIZAR.ps1"\n')
                except Exception:
                    pass
                
        return script_path

    @action(detail=True, methods=['post'])
    def disparar_atualizacao(self, request, pk=None):
        import os
        if not check_user_permission(request.user, 'pode_atualizar_cliente'):
            return Response({'error': 'Você não tem permissão para atualizar clientes.'}, status=status.HTTP_403_FORBIDDEN)

        """
        Dispara o script de atualização do cliente em background.
        """
        cliente = self.get_object()
        # Busca a versão mais recente cadastrada
        versao = models.VersaoSistema.objects.all().order_by('-data_lancamento').first()
        if not versao:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Nenhuma versão cadastrada no sistema. Cadastre uma versão primeiro.'})

        # Cria o registro de histórico de atualização com status PROCESSANDO
        historico = models.HistoricoAtualizacao.objects.create(
            cliente=cliente,
            versao=versao,
            status='PROCESSANDO'
        )

        # Determina o caminho do script
        script_path = self.get_or_create_update_script(cliente)

        if not os.path.exists(script_path):
            historico.status = 'FALHA'
            historico.log_erro = f"Script de atualização não encontrado: {script_path}"
            historico.save()
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': f'Script de atualização não encontrado: {script_path}'})

        # Inicia a execução do script em background thread
        self.executar_script_background(historico.id_historico, script_path)

        serializer = serializers.HistoricoAtualizacaoSerializer(historico)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def atualizar_em_lote(self, request):
        import os
        if not check_user_permission(request.user, 'pode_atualizar_cliente'):
            return Response({'error': 'Você não tem permissão para atualizar clientes.'}, status=status.HTTP_403_FORBIDDEN)

        """
        Dispara o script de atualização para todos os clientes ativos em background.
        """
        # Busca a versão mais recente cadastrada
        versao = models.VersaoSistema.objects.all().order_by('-data_lancamento').first()
        if not versao:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Nenhuma versão cadastrada no sistema. Cadastre uma versão primeiro.'})

        clientes_ativos = models.SaaSCliente.objects.filter(status_licenca='ATIVO')
        if not clientes_ativos.exists():
            return Response({'message': 'Nenhum cliente ativo encontrado para atualização.'}, status=status.HTTP_200_OK)

        historicos_criados = []
        for cliente in clientes_ativos:
            # Determina o caminho do script
            script_path = self.get_or_create_update_script(cliente)

            if not os.path.exists(script_path):
                historico = models.HistoricoAtualizacao.objects.create(
                    cliente=cliente,
                    versao=versao,
                    status='FALHA',
                    log_erro=f"Script de atualização não encontrado: {script_path}"
                )
            else:
                historico = models.HistoricoAtualizacao.objects.create(
                    cliente=cliente,
                    versao=versao,
                    status='PROCESSANDO'
                )
                self.executar_script_background(historico.id_historico, script_path)
            
            historicos_criados.append(historico)

        serializer = serializers.HistoricoAtualizacaoSerializer(historicos_criados, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def executar_script_background(self, historico_id, script_path):
        import subprocess
        import threading

        def target():
            from api.models import HistoricoAtualizacao
            try:
                historico = HistoricoAtualizacao.objects.get(pk=historico_id)
                cliente = historico.cliente
                
                # Executar backup obrigatório antes da atualização (git pull)
                log_output = ""
                try:
                    backup_path = realizar_backup_banco(cliente)
                    log_output += f"--- BACKUP REALIZADO COM SUCESSO ---\nArquivo: {backup_path}\n\n"
                except Exception as e:
                    historico.status = 'FALHA'
                    historico.log_erro = f"--- ERRO AO REALIZAR BACKUP (ATUALIZAÇÃO ABORTADA) ---\n{str(e)}\n\nO processo de git pull e atualização foi cancelado para segurança dos dados."
                    historico.save()
                    return

                # Executa o script de atualização
                result = subprocess.run(
                    [script_path],
                    cwd="C:\\APERUS",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    shell=True,
                    timeout=300
                )
                log_output += f"STDOUT:\n{result.stdout}\n\nSTDERR:\n{result.stderr}"
                if result.returncode == 0:
                    historico.status = 'SUCESSO'
                else:
                    historico.status = 'FALHA'
                historico.log_erro = log_output
                historico.save()
            except Exception as e:
                try:
                    historico = HistoricoAtualizacao.objects.get(pk=historico_id)
                    historico.status = 'FALHA'
                    historico.log_erro = f"Erro de subprocesso ao executar batch: {str(e)}"
                    historico.save()
                except Exception:
                    pass

        thread = threading.Thread(target=target)
        thread.start()


class TerminalAtivoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de terminais ativos dos clientes SaaS.
    """
    queryset = models.TerminalAtivo.objects.all().order_by('-ultimo_acesso')
    serializer_class = serializers.TerminalAtivoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['cliente']
    search_fields = ['nome_computador', 'hardware_id']


class SaaSClienteMensalidadeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de mensalidades dos clientes SaaS.
    """
    queryset = models.SaaSClienteMensalidade.objects.all().order_by('-data_vencimento')
    serializer_class = serializers.SaaSClienteMensalidadeSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    pagination_class = None
    permission_required = 'pode_cadastrar_financeiro_saas'
    filterset_fields = ['saas_cliente', 'status_pagamento']
    search_fields = ['nosso_numero']

    @action(detail=False, methods=['post'])
    def consultar_abertos(self, request):
        from .services_bancarios import criar_integracao_bancaria
        from datetime import datetime
        
        # Filtra mensalidades pendentes
        mensalidades_abertas = models.SaaSClienteMensalidade.objects.filter(status_pagamento='PENDENTE')
        
        atualizados = 0
        erros = 0
        integracoes_cache = {}
        
        # Busca uma configuração do Mercado Pago ativa como fallback
        fallback_config = models.ConfiguracaoBancaria.objects.filter(banco='MERCADOPAGO', ativo=True).first()
        
        for m in mensalidades_abertas:
            config = m.configuracao_bancaria or fallback_config
            if not config or not m.nosso_numero:
                continue
                
            if config.id_config not in integracoes_cache:
                try:
                    integracoes_cache[config.id_config] = criar_integracao_bancaria(config)
                except Exception:
                    continue
                    
            integracao = integracoes_cache[config.id_config]
            
            sucesso, resultado = integracao.consultar_boleto(m.nosso_numero)
            if sucesso:
                novo_status = resultado.get('status')
                if novo_status == 'PAGO':
                    m.status_pagamento = 'PAGO'
                    data_pagto_str = resultado.get('data_pagamento')
                    if data_pagto_str:
                        try:
                            m.data_pagamento = datetime.strptime(data_pagto_str, '%Y-%m-%d').date()
                        except Exception:
                            m.data_pagamento = timezone.now().date()
                    else:
                        m.data_pagamento = timezone.now().date()
                    m.save()
                    atualizados += 1
            else:
                erros += 1
                
        return Response({
            'status': 'sucesso',
            'mensagem': f'Verificação concluída. {atualizados} mensalidade(s) baixada(s) com sucesso. {erros} erro(s).',
            'atualizados': atualizados
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def consultar_status(self, request, pk=None):
        from .services_bancarios import criar_integracao_bancaria
        from datetime import datetime
        
        mensalidade = self.get_object()
        
        if not mensalidade.nosso_numero:
            return Response(
                {'error': 'Mensalidade não possui nosso_numero registrado'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        config = mensalidade.configuracao_bancaria
        if not config:
            config = models.ConfiguracaoBancaria.objects.filter(banco='MERCADOPAGO', ativo=True).first()
            
        if not config:
            return Response(
                {'error': 'Configuração bancária não encontrada para esta mensalidade'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            integracao = criar_integracao_bancaria(config)
            sucesso, resultado = integracao.consultar_boleto(mensalidade.nosso_numero)
            
            if not sucesso:
                return Response(
                    {'error': resultado.get('erro', 'Erro na consulta do boleto')},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            novo_status = resultado.get('status')
            if novo_status == 'PAGO' and mensalidade.status_pagamento != 'PAGO':
                mensalidade.status_pagamento = 'PAGO'
                data_pagto_str = resultado.get('data_pagamento')
                if data_pagto_str:
                    try:
                        mensalidade.data_pagamento = datetime.strptime(data_pagto_str, '%Y-%m-%d').date()
                    except Exception:
                        mensalidade.data_pagamento = timezone.now().date()
                else:
                    mensalidade.data_pagamento = timezone.now().date()
                mensalidade.save()
                
            return Response({
                'status': mensalidade.status_pagamento,
                'data_pagamento': mensalidade.data_pagamento,
                'mensagem': resultado.get('mensagem', 'Consulta concluída com sucesso')
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erro ao processar consulta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SaaSClienteContratoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de contratos dos clientes SaaS.
    """
    queryset = models.SaaSClienteContrato.objects.all().order_by('-data_geracao')
    serializer_class = serializers.SaaSClienteContratoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['saas_cliente', 'assinado']


class VersaoSistemaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de versões do sistema SaaS.
    """
    queryset = models.VersaoSistema.objects.all().order_by('-data_lancamento')
    serializer_class = serializers.VersaoSistemaSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    search_fields = ['versao', 'descricao']


class HistoricoAtualizacaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de histórico de atualizações de clientes SaaS.
    """
    queryset = models.HistoricoAtualizacao.objects.all().order_by('-data_atualizacao')
    serializer_class = serializers.HistoricoAtualizacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    filterset_fields = ['cliente', 'status', 'versao']
    search_fields = ['cliente__razao_social', 'versao__versao']


class ConfiguracaoAgendamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento da configuração de agendamento do SaaS.
    """
    queryset = models.ConfiguracaoAgendamento.objects.all()
    serializer_class = serializers.ConfiguracaoAgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    permission_required = 'pode_gerenciar_agendamento'

    def list(self, request, *args, **kwargs):
        config = models.ConfiguracaoAgendamento.objects.first()
        if not config:
            config = models.ConfiguracaoAgendamento.objects.create()
        serializer = self.get_serializer(config)
        return Response(serializer.data)


class ComunicadoSaaSViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento dos comunicados do Mural de Avisos (SaaS).
    """
    queryset = models.ComunicadoSaaS.objects.all().order_by('-criado_em')
    serializer_class = serializers.ComunicadoSaaSSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    filterset_fields = ['ativo', 'tipo']
    search_fields = ['titulo', 'conteudo_texto']


# ─── Public API Endpoints for Client Instances ────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def saas_verificar_licenca(request):
    """
    Verifica a situação da licença do CNPJ.
    URL: /api/saas/licenca/?cnpj=...&schema_name=...
    """
    cnpj = clean_cnpj(request.query_params.get('cnpj'))
    if not cnpj:
        return Response({'error': 'CNPJ é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Certificar que a conexão com o banco central está configurada
    from django.conf import settings
    db_name = 'aperus_central'
    if db_name not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name
    
    try:
        schema_name = request.query_params.get('schema_name')
        if schema_name:
            cliente = models.SaaSCliente.objects.using(db_name).get(cnpj=cnpj, schema_name=schema_name)
        else:
            cliente = models.SaaSCliente.objects.using(db_name).filter(cnpj=cnpj).order_by('is_test_environment').first()
            if not cliente:
                raise models.SaaSCliente.DoesNotExist
        
        # Bloqueio automático por mensalidades vencidas há mais de 5 dias
        cinco_dias_atras = timezone.now().date() - timedelta(days=5)
        tem_financeiro_atrasado = models.SaaSClienteMensalidade.objects.using(db_name).filter(
            saas_cliente=cliente,
            status_pagamento__in=['PENDENTE', 'VENCIDO'],
            data_vencimento__lt=cinco_dias_atras
        ).exists()
        
        status_licenca = cliente.status_licenca
        motivo = "Licença ativa e regular."
        if tem_financeiro_atrasado:
            status_licenca = 'BLOQUEADO'
            motivo = "Mensalidade em atraso há mais de 5 dias."
        elif status_licenca == 'BLOQUEADO':
            motivo = "Bloqueado administrativamente pelo painel SaaS."

        return Response({
            'cnpj': cliente.cnpj,
            'razao_social': cliente.razao_social,
            'status_licenca': status_licenca,
            'motivo': motivo,
            'data_reajuste': cliente.data_reajuste,
            'emite_nota': cliente.emite_nota,
        })
    except models.SaaSCliente.DoesNotExist:
        return Response({
            'status_licenca': 'BLOQUEADO',
            'motivo': 'CNPJ ou Identificador não localizado na base central do Aperus.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def saas_financeiro(request):
    """
    Lista histórico financeiro/mensalidades pendentes e pagas do cliente.
    URL: /api/saas/financeiro/?cnpj=...&schema_name=...
    """
    cnpj = clean_cnpj(request.query_params.get('cnpj'))
    if not cnpj:
        return Response({'error': 'CNPJ é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Certificar que a conexão com o banco central está configurada
    from django.conf import settings
    db_name = 'aperus_central'
    if db_name not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name
    
    try:
        schema_name = request.query_params.get('schema_name')
        if schema_name:
            cliente = models.SaaSCliente.objects.using(db_name).get(cnpj=cnpj, schema_name=schema_name)
        else:
            cliente = models.SaaSCliente.objects.using(db_name).filter(cnpj=cnpj).order_by('is_test_environment').first()
            if not cliente:
                raise models.SaaSCliente.DoesNotExist
        
        mensalidades = models.SaaSClienteMensalidade.objects.using(db_name).filter(
            saas_cliente=cliente
        ).order_by('-data_vencimento')
        
        serializer = serializers.SaaSClienteMensalidadeSerializer(mensalidades, many=True)
        return Response(serializer.data)
    except models.SaaSCliente.DoesNotExist:
        return Response({'error': 'CNPJ ou Identificador não encontrado'}, status=status.HTTP_404_NOT_FOUND)


FALLBACK_CONTRATO_TEMPLATE = """CONTRATO DE PRESTAÇÃO DE SERVIÇOS SAAS

CONTRATANTE: {{ cliente_razao_social }}, inscrito no CNPJ sob o nº {{ cliente_cnpj }}.
CONTRATADA: APERUS SISTEMAS LTDA.

CLÁUSULA PRIMEIRA - DO OBJETO E VALORES
1.1. O presente contrato tem por objeto o licenciamento de uso do software APERUS, mediante o pagamento da mensalidade base de R$ {{ mensalidade_base }}.

CLÁUSULA SEGUNDA - DA RESPONSABILIDADE DOS DADOS E USO DO SISTEMA
2.1. A responsabilidade por todos os dados inseridos, cadastrados, vendidos ou emitidos no sistema (incluindo controle de estoque, movimentações financeiras e obrigações fiscais/impostos) é 100% da CONTRATANTE. A CONTRATANTE responde civil e criminalmente por toda e qualquer informação registrada no sistema.

CLÁUSULA TERCEIRA - DA INSTALAÇÃO LOCAL
3.1. Caso o software APERUS seja executado ou instalado localmente em servidores, computadores ou redes próprias da CONTRATANTE, a CONTRATADA fica integralmente isenta de qualquer responsabilidade por perdas de dados, quebras físicas de hardware, lentidão, oscilações de rede ou invasões de terceiros.

CLÁUSULA QUARTA - DA POLÍTICA DE BACKUP
4.1. A CONTRATADA somente realizará backups automatizados em nuvem caso a CONTRATANTE contrate especificamente o "Módulo de Backup Extra".
4.2. Inexistindo a contratação do referido módulo, é dever exclusivo da CONTRATANTE gerar, armazenar, testar e garantir a segurança de suas próprias cópias de segurança (backups).

CLÁUSULA QUINTA - DO SUPORTE TÉCNICO
5.1. O suporte técnico prestado pela CONTRATADA restringe-se exclusivamente ao funcionamento lógico do software APERUS.
5.2. O suporte será prestado dentro do horário comercial e não abrange problemas de infraestrutura física, hardware local, impressoras, redes internas ou instabilidade na conexão de internet da CONTRATANTE.

CLÁUSULA SEXTA - DA CARÊNCIA MÍNIMA
6.1. Fica estipulado um período mínimo de carência de 3 (três) meses de vigência deste contrato para fins de configuração inicial, treinamento e estabilização do sistema.

CLÁUSULA SÉTIMA - DO FORO
7.1. Para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato, as partes elegem o foro da comarca de Patrocínio/MG, com renúncia expressa a qualquer outro, por mais privilegiado que seja."""


@api_view(['GET'])
@permission_classes([AllowAny])
def saas_contrato_pendente(request):
    """
    Busca se há algum contrato pendente de assinatura para o CNPJ.
    URL: /api/saas/contrato-pendente/?cnpj=...&schema_name=...
    """
    cnpj = clean_cnpj(request.query_params.get('cnpj'))
    if not cnpj:
        return Response({'error': 'CNPJ é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Certificar que a conexão com o banco central está configurada
    from django.conf import settings
    db_name = 'aperus_central'
    if db_name not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name
    
    try:
        schema_name = request.query_params.get('schema_name')
        if schema_name:
            cliente = models.SaaSCliente.objects.using(db_name).get(cnpj=cnpj, schema_name=schema_name)
        else:
            cliente = models.SaaSCliente.objects.using(db_name).filter(cnpj=cnpj).order_by('is_test_environment').first()
            if not cliente:
                raise models.SaaSCliente.DoesNotExist
        
        clientes_cnpj = models.SaaSCliente.objects.using(db_name).filter(cnpj=cnpj)
        contrato = models.SaaSClienteContrato.objects.using(db_name).filter(
            saas_cliente__in=clientes_cnpj,
            assinado=False
        ).order_by('-data_geracao').first()
        
        if not contrato:
            return Response({'id_contrato': None, 'texto_contrato': None})
            
        texto_raw = contrato.texto_contrato
        if not texto_raw or not texto_raw.strip():
            template = models.TemplateContrato.objects.using(db_name).filter(ativo=True).first()
            if template and template.texto_template:
                texto_raw = template.texto_template
            else:
                texto_raw = FALLBACK_CONTRATO_TEMPLATE
                
        valor_mensalidade_str = "0,00"
        if cliente.valor_mensalidade is not None:
            try:
                valor_mensalidade_str = f"{cliente.valor_mensalidade:.2f}".replace('.', ',')
            except Exception:
                valor_mensalidade_str = str(cliente.valor_mensalidade)
                
        texto_processado = texto_raw
        texto_processado = texto_processado.replace('{{ cliente_razao_social }}', cliente.razao_social or '')
        texto_processado = texto_processado.replace('{{ cliente_cnpj }}', cliente.cnpj or '')
        texto_processado = texto_processado.replace('{{ mensalidade_base }}', valor_mensalidade_str)
        
        data = serializers.SaaSClienteContratoSerializer(contrato).data
        data['texto_contrato'] = texto_processado
        return Response(data)
    except models.SaaSCliente.DoesNotExist:
        return Response({'error': 'CNPJ ou Identificador não encontrado'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def saas_assinar_contrato(request):
    """
    Registra a assinatura/aceite do contrato.
    URL: /api/saas/assinar-contrato/
    """
    id_contrato = request.data.get('id_contrato')
    usuario_assinou = request.data.get('usuario_assinou')
    
    if not id_contrato or not usuario_assinou:
        return Response({'error': 'id_contrato e usuario_assinou são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Certificar que a conexão com o banco central está configurada
    from django.conf import settings
    db_name = 'aperus_central'
    if db_name not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name
        
    try:
        contrato = models.SaaSClienteContrato.objects.using(db_name).get(id_contrato=id_contrato)
        if contrato.assinado:
            return Response({'error': 'Este contrato já está assinado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        contrato.assinado = True
        contrato.data_assinatura = timezone.now()
        contrato.ip_assinatura = get_client_ip(request)
        contrato.usuario_assinou = usuario_assinou
        contrato.save(using=db_name)
        
        serializer = serializers.SaaSClienteContratoSerializer(contrato)
        return Response(serializer.data)
    except models.SaaSClienteContrato.DoesNotExist:
        return Response({'error': 'Contrato não encontrado'}, status=status.HTTP_404_NOT_FOUND)


def enviar_email_token(destinatario_email, token):
    from django.conf import settings
    import requests
    import logging
    
    logger = logging.getLogger(__name__)
    is_mother = settings.DATABASES['default']['NAME'] == 'aperus_central'
    
    if not is_mother:
        # Estamos no backend do cliente, delegamos o disparo para a Central Mãe via HTTP
        url = f"{settings.SAAS_MOTHER_URL.rstrip('/')}/api/saas/disparar-email-token/"
        try:
            logger.info(f"Delegando envio de e-mail OTP para a Central Mãe: {url}")
            response = requests.post(url, json={
                'destinatario_email': destinatario_email,
                'token': token
            }, timeout=15)
            if response.status_code == 200:
                logger.info("Envio de e-mail OTP delegado com sucesso para a Central Mãe.")
                return True
            else:
                logger.error(f"Erro ao delegar envio de e-mail para a mãe: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Exceção ao delegar envio de e-mail para a mãe: {str(e)}")
            
    # Se formos a Central Mãe (ou fallback no cliente se delegação falhou):
    assunto = "Código de Assinatura de Contrato - Aperus"
    mensagem = f"Seu código de assinatura de contrato de 6 dígitos é: {token}\nEste código é válido por 15 minutos."
    
    try:
        from api.models import EmpresaConfig
        from api.services_email import EmailService
        
        # Se for na mãe, usamos empresa_id = 7 (Mother)
        # Se for no cliente fallback, tenta pegar a empresa local
        if is_mother:
            emp_id = 7
        else:
            empresa = EmpresaConfig.objects.exclude(cpf_cnpj='').first() or EmpresaConfig.objects.first()
            emp_id = empresa.id_empresa if empresa else 1
            
        logger.info(f"Enviando e-mail OTP localmente via EmailService (empresa_id={emp_id}).")
        service = EmailService(empresa_id=emp_id)
        service.send(
            destinatario_email=destinatario_email,
            assunto=assunto,
            html_body=f"<p>Seu código de assinatura de contrato de 6 dígitos é: <strong>{token}</strong></p><p>Este código expira em 15 minutos.</p>",
            text_body=mensagem
        )
        return True
    except Exception as e:
        logger.warning(f"Erro ao enviar e-mail OTP via EmailService: {str(e)}. Tentando send_mail padrão.")
        try:
            from django.core.mail import send_mail
            send_mail(
                assunto,
                mensagem,
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'Aperussistema@gmail.com',
                [destinatario_email],
                fail_silently=False,
            )
            return True
        except Exception as e_fallback:
            logger.error(f"Erro ao enviar e-mail OTP: {str(e)} | Fallback: {str(e_fallback)}")
            return False


@api_view(['POST'])
@permission_classes([AllowAny])
def saas_disparar_email_token(request):
    """
    Dispara o e-mail OTP de validação de contrato usando as configurações de e-mail da Central Mãe.
    Esta rota é chamada pelo backend do cliente para centralizar os envios na Central Mãe.
    """
    destinatario_email = request.data.get('destinatario_email')
    token = request.data.get('token')
    
    if not destinatario_email or not token:
        return Response({'error': 'destinatario_email e token são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
        
    assunto = "Código de Assinatura de Contrato - Aperus"
    mensagem = f"Seu código de assinatura de contrato de 6 dígitos é: {token}\nEste código é válido por 15 minutos."
    
    try:
        from api.services_email import EmailService
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Central Mãe processando envio de e-mail OTP para {destinatario_email}")
        service = EmailService(empresa_id=7)
        service.send(
            destinatario_email=destinatario_email,
            assunto=assunto,
            html_body=f"<p>Seu código de assinatura de contrato de 6 dígitos é: <strong>{token}</strong></p><p>Este código expira em 15 minutos.</p>",
            text_body=mensagem
        )
        return Response({'status': 'sucesso', 'mensagem': 'E-mail disparado com sucesso pela Central Mãe.'})
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Erro ao disparar e-mail OTP na Central Mãe via EmailService: {str(e)}. Usando send_mail padrão.")
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            send_mail(
                assunto,
                mensagem,
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'Aperussistema@gmail.com',
                [destinatario_email],
                fail_silently=False,
            )
            return Response({'status': 'sucesso', 'mensagem': 'E-mail disparado com sucesso pela Central Mãe (fallback django send_mail).'})
        except Exception as e_fallback:
            logger.error(f"Erro ao disparar e-mail OTP na Central Mãe: {str(e)} | Fallback: {str(e_fallback)}")
            return Response({'error': f"Erro ao enviar e-mail: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def saas_assinar_contrato_etapas(request):
    """
    Gerencia a assinatura em duas etapas na Central Mãe.
    URL: /api/saas/assinar-contrato-etapas/
    """
    id_contrato = request.data.get('id_contrato')
    etapa = request.data.get('etapa') # 'validar_data' ou 'validar_token'
    
    if not id_contrato or not etapa:
        return Response({'error': 'id_contrato e etapa são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        from django.conf import settings
        db_name = 'aperus_central'
        if db_name not in settings.DATABASES:
            import copy
            default_db = settings.DATABASES['default']
            settings.DATABASES[db_name] = copy.deepcopy(default_db)
            settings.DATABASES[db_name]['NAME'] = db_name

        contrato = models.SaaSClienteContrato.objects.using(db_name).get(id_contrato=id_contrato)
        cliente = models.SaaSCliente.objects.using(db_name).get(id_saas_cliente=contrato.saas_cliente_id)
    except models.SaaSClienteContrato.DoesNotExist:
        return Response({'error': 'Contrato não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
    except models.SaaSCliente.DoesNotExist:
        return Response({'error': 'Cliente não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
    if etapa == 'validar_data':
        data_nascimento = request.data.get('data_nascimento')
        if not data_nascimento:
            return Response({'error': 'data_nascimento é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)
            
        import datetime
        try:
            if isinstance(data_nascimento, str):
                if '-' in data_nascimento:
                    data_dt = datetime.datetime.strptime(data_nascimento, '%Y-%m-%d').date()
                elif '/' in data_nascimento:
                    data_dt = datetime.datetime.strptime(data_nascimento, '%d/%m/%Y').date()
                else:
                    return Response({'error': 'Formato de data inválido. Use YYYY-MM-DD ou DD/MM/YYYY.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'data_nascimento deve ser uma string.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Data de nascimento inválida.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not cliente.data_nascimento_responsavel:
            return Response({'error': 'Data de nascimento do responsável não cadastrada na Central Mãe.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if cliente.data_nascimento_responsavel != data_dt:
            return Response({'error': 'Data de nascimento incorreta.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Gera o token OTP de 6 dígitos
        import random
        token_otp = f"{random.randint(100000, 999999)}"
        
        contrato.token_validacao = token_otp
        contrato.token_expira_em = timezone.now() + timezone.timedelta(minutes=15)
        contrato.save(using=db_name)
        
        # Envia o e-mail
        email_destino = cliente.email_responsavel or cliente.email
        if not email_destino:
            return Response({'error': 'E-mail do responsável não cadastrado na Central Mãe.'}, status=status.HTTP_400_BAD_REQUEST)
            
        enviou = enviar_email_token(email_destino, token_otp)
        if not enviou:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"AVISO: Falha ao enviar e-mail com token OTP {token_otp} para {email_destino}. No entanto, a requisição prosseguirá devido ao ambiente de desenvolvimento/teste (DEBUG=True).")
            from django.conf import settings
            if not getattr(settings, 'DEBUG', False):
                return Response({'error': 'Erro ao disparar o e-mail de validação. Contate o suporte.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # Mascara o e-mail
        partes = email_destino.split('@')
        email_mascarado = f"{partes[0][:2]}***@{partes[1]}"
        
        return Response({
            'status': 'sucesso',
            'mensagem': f'Data confirmada! O token de validação foi enviado para o e-mail: {email_mascarado}'
        })
        
    elif etapa == 'validar_token':
        token = request.data.get('token')
        usuario_assinou = request.data.get('usuario_assinou')
        
        if not token or not usuario_assinou:
            return Response({'error': 'token e usuario_assinou são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if contrato.assinado:
            return Response({'error': 'Este contrato já está assinado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not contrato.token_expira_em or contrato.token_expira_em < timezone.now():
            return Response({'error': 'Este token já expirou ou é inválido. Solicite o reenvio.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if contrato.token_validacao != token:
            return Response({'error': 'Token inválido. Verifique o código enviado no seu e-mail.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Sucesso! Grava assinatura e auditoria
        contrato.assinado = True
        contrato.data_assinatura = timezone.now()
        contrato.assinado_em = timezone.now()
        contrato.ip_assinatura = get_client_ip(request)
        contrato.user_agent = request.META.get('HTTP_USER_AGENT', '')
        contrato.usuario_assinou = usuario_assinou
        contrato.token_validacao = None # Consome o token
        contrato.save(using=db_name)
        
        # Atualiza o cliente
        cliente.contrato_pendente = False
        cliente.save(using=db_name)
        
        serializer = serializers.SaaSClienteContratoSerializer(contrato)
        return Response({
            'status': 'sucesso',
            'mensagem': 'Contrato assinado com sucesso!',
            'contrato': serializer.data
        })
    else:
        return Response({'error': 'Etapa inválida.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def buscar_contrato_atual(request):
    """ Retorna o contrato ativo para carregar na tela de edição do React """
    try:
        contrato = models.ContratoPadrao.objects.filter(ativo=True).latest('atualizado_em')
        return Response({
            'status': 'sucesso',
            'id': contrato.id,
            'titulo': contrato.titulo,
            'versao': contrato.versao,
            'conteudo_html': contrato.conteudo_html
        })
    except models.ContratoPadrao.DoesNotExist:
        return Response({
            'status': 'sucesso',
            'id': None,
            'titulo': 'Contrato Padrão de Prestação de Serviços - Aperus',
            'versao': '1.0',
            'conteudo_html': '<p>Escreva o contrato aqui...</p>'
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def salvar_edicao_contrato(request):
    """ Salva o contrato editado vindo do painel do React """
    conteudo = request.data.get('conteudo_html')
    titulo = request.data.get('titulo', 'Contrato Padrão de Prestação de Serviços - Aperus')
    nova_versao = request.data.get('versao', '1.0')
    
    if not conteudo:
        return Response({'error': 'conteudo_html é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
    
    contrato = models.ContratoPadrao.objects.filter(ativo=True).order_by('-atualizado_em').first()
    if contrato:
        contrato.conteudo_html = conteudo
        contrato.titulo = titulo
        contrato.versao = nova_versao
        contrato.save()
    else:
        contrato = models.ContratoPadrao.objects.create(
            titulo=titulo,
            conteudo_html=conteudo,
            versao=nova_versao,
            ativo=True
        )
    
    return Response({'status': 'sucesso', 'mensagem': 'Contrato padrão atualizado com sucesso!'})


@api_view(['GET'])
@permission_classes([AllowAny])
def render_contrato_padrao(request):
    """
    Carrega o contrato padrão ativo e substitui as variáveis pelo cliente fornecido.
    URL: /api/saas/contrato-padrao/render/?cliente_id=X
    """
    cliente_id = request.query_params.get('cliente_id')
    if not cliente_id:
        return Response({'error': 'cliente_id é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        cliente = models.SaaSCliente.objects.get(id_saas_cliente=cliente_id)
    except models.SaaSCliente.DoesNotExist:
        return Response({'error': 'Cliente não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
    try:
        contrato_padrao = models.ContratoPadrao.objects.filter(ativo=True).latest('atualizado_em')
        conteudo_html = contrato_padrao.conteudo_html
    except models.ContratoPadrao.DoesNotExist:
        conteudo_html = "<p><strong>CONTRATO DE LICENCIAMENTO DE SOFTWARE</strong></p><p>Cliente: {{ cliente_razao_social }}</p>"
        
    data_vencimento = cliente.dia_vencimento or 10
    valor_mensalidade = f"R$ {cliente.valor_mensalidade:.2f}".replace('.', ',') if cliente.valor_mensalidade else "R$ 0,00"
    
    cnpj = cliente.cnpj
    cnpj_fmt = cnpj
    if len(cnpj) == 14:
        cnpj_fmt = f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"
        
    replacements = {
        '{{ cliente_razao_social }}': cliente.razao_social,
        '{{ cliente_cnpj }}': cnpj_fmt,
        '{{ cliente_endereco }}': f"{cliente.endereco or ''}, {cliente.numero or ''} {cliente.complemento or ''} - {cliente.bairro or ''}, {cliente.cidade or ''}/{cliente.estado or ''} - CEP {cliente.cep or ''}".strip(', '),
        '{{ cliente_responsavel_nome }}': cliente.proprietario or '',
        '{{ cliente_responsavel_cpf }}': '',
        '{{ cliente_responsavel_email }}': cliente.email_responsavel or cliente.email or '',
        '{{ cliente_valor_mensalidade }}': valor_mensalidade,
        '{{ cliente_dia_vencimento }}': str(data_vencimento),
        '{{ sua_empresa_razao }}': 'SUPREMA INFORMÁTICA',
        '{{ sua_empresa_cnpj }}': '00.000.000/0000-00',
    }
    
    rendered = conteudo_html
    for tag, value in replacements.items():
        rendered = rendered.replace(tag, str(value or ''))
        
    return Response({
        'status': 'sucesso',
        'rendered_html': rendered
    })
@api_view(['GET'])
@permission_classes([AllowAny])
def saas_status_cliente(request):
    """
    Retorna o status consolidado de mensalidades abertas e contrato pendente do cliente.
    URL: /api/saas/status-cliente/?cnpj=...&schema_name=...
    """
    cnpj = clean_cnpj(request.query_params.get('cnpj'))
    if not cnpj:
        return Response({'error': 'CNPJ é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Certificar que a conexão com o banco central está configurada
    from django.conf import settings
    db_name = 'aperus_central'
    if db_name not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name
    
    try:
        schema_name = request.query_params.get('schema_name')
        if schema_name:
            cliente = models.SaaSCliente.objects.using(db_name).get(cnpj=cnpj, schema_name=schema_name)
        else:
            cliente = models.SaaSCliente.objects.using(db_name).filter(cnpj=cnpj).order_by('is_test_environment').first()
            if not cliente:
                raise models.SaaSCliente.DoesNotExist
                
        # 1. Mensalidades abertas
        mensalidades_abertas = models.SaaSClienteMensalidade.objects.using(db_name).filter(
            saas_cliente=cliente,
            status_pagamento__in=['PENDENTE', 'VENCIDO']
        ).order_by('data_vencimento')
        
        mensalidades_list = []
        for m in mensalidades_abertas:
            mensalidades_list.append({
                'id_mensalidade': m.id_mensalidade,
                'data_vencimento': m.data_vencimento,
                'valor': str(m.valor),
                'nosso_numero': m.nosso_numero,
                'url_boleto': m.url_boleto,
                'linha_digitavel': m.linha_digitavel,
                'pix_copia_cola': m.pix_copia_cola,
            })
            
        # 2. Contrato pendente
        clientes_cnpj = models.SaaSCliente.objects.using(db_name).filter(cnpj=cnpj)
        contrato = models.SaaSClienteContrato.objects.using(db_name).filter(
            saas_cliente__in=clientes_cnpj,
            assinado=False
        ).order_by('-data_geracao').first()
        
        contrato_pendente = contrato is not None
        contrato_data = None
        if contrato_pendente:
            texto_raw = contrato.texto_contrato
            if not texto_raw or not texto_raw.strip():
                template = models.TemplateContrato.objects.using(db_name).filter(ativo=True).first()
                if template and template.texto_template:
                    texto_raw = template.texto_template
                else:
                    texto_raw = FALLBACK_CONTRATO_TEMPLATE
            
            valor_mensalidade_str = "0,00"
            if cliente.valor_mensalidade is not None:
                try:
                    valor_mensalidade_str = f"{cliente.valor_mensalidade:.2f}".replace('.', ',')
                except Exception:
                    valor_mensalidade_str = str(cliente.valor_mensalidade)
                    
            texto_processado = texto_raw
            texto_processado = texto_processado.replace('{{ cliente_razao_social }}', cliente.razao_social or '')
            texto_processado = texto_processado.replace('{{ cliente_cnpj }}', cliente.cnpj or '')
            texto_processado = texto_processado.replace('{{ mensalidade_base }}', valor_mensalidade_str)
            
            contrato_data = {
                'id_contrato': contrato.id_contrato,
                'texto_contrato': texto_processado,
                'data_geracao': contrato.data_geracao,
            }
            
        return Response({
            'cnpj': cliente.cnpj,
            'razao_social': cliente.razao_social,
            'status_licenca': cliente.status_licenca,
            'mensalidades_abertas': mensalidades_list,
            'contrato_pendente': contrato_pendente,
            'contrato': contrato_data,
        })
    except models.SaaSCliente.DoesNotExist:
        return Response({'error': 'CNPJ ou Identificador não encontrado'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def saas_meu_contrato(request):
    """
    Retorna o contrato assinado ativo do cliente logado, buscando pela empresa CNPJ na central.
    """
    from rest_framework.permissions import IsAuthenticated
    from rest_framework.decorators import permission_classes
    
    db_name = 'aperus_central'
    from django.conf import settings
    if db_name not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name

    # 1. Carrega CNPJ da empresa local
    empresa = models.EmpresaConfig.objects.exclude(cpf_cnpj='').first() or models.EmpresaConfig.objects.first()
    if not empresa or not empresa.cpf_cnpj:
        return Response({'error': 'CNPJ da empresa não configurado localmente.'}, status=status.HTTP_400_BAD_REQUEST)
    
    import re
    cnpj_limpo = re.sub(r'\D', '', str(empresa.cpf_cnpj))
    
    # 2. Busca o cliente no banco central
    try:
        cliente_saas = models.SaaSCliente.objects.using(db_name).get(cnpj=cnpj_limpo)
    except models.SaaSCliente.DoesNotExist:
        return Response({'error': 'Cliente SaaS não localizado para este CNPJ.'}, status=status.HTTP_404_NOT_FOUND)
        
    # 3. Busca o último contrato assinado
    contrato = models.SaaSClienteContrato.objects.using(db_name).filter(
        saas_cliente=cliente_saas,
        assinado=True
    ).order_by('-data_assinatura').first()
    
    if not contrato:
        return Response({'error': 'Nenhum contrato assinado encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = serializers.SaaSClienteContratoSerializer(contrato)
    return Response({
        'status': 'sucesso',
        'contrato': serializer.data
    })


@csrf_exempt
@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def status_financeiro_saas(request):
    """
    Endpoint consultado pelas filiais para verificar faturamento,
    alertas graduais e regras de bloqueio/carência com trava de fim de semana,
    além de validação de limite de máquinas (Auto-Ativação).
    """
    from django.http import JsonResponse
    if request.method == "GET":
        cnpj_cliente = request.query_params.get('cnpj')
        hardware_id = request.query_params.get('hardware_id')
        nome_computador = request.query_params.get('nome_computador')
    else:
        if hasattr(request, 'data') and request.data:
            dados = request.data
        else:
            try:
                dados = json.loads(request.body)
            except Exception:
                dados = {}
        cnpj_cliente = dados.get('cnpj')
        hardware_id = dados.get('hardware_id')
        nome_computador = dados.get('nome_computador')

    cnpj_cliente = clean_cnpj(cnpj_cliente)
    if not cnpj_cliente:
        return JsonResponse({'status': 'erro', 'mensagem': 'CNPJ não fornecido.'}, status=400)

    cliente = models.SaaSCliente.objects.filter(cnpj=cnpj_cliente).first()
    if not cliente:
        return JsonResponse({
            'bloqueio_manual': False,
            'bloquear_sistema': False,
            'alerta_estagio': 'isento',
            'dias_atraso': 0,
            'mensagem': 'Cliente não cadastrado no painel SaaS. Acesso liberado.',
            'faturas': [],
            'modulos_liberados': {
                "pdv": True,
                "financeiro_avancado": True,
                "producao": True,
                "transporte": True,
                "ciot": True,
                "report_builder": True
            }
        })

    # Resolver módulos do plano
    plano = cliente.plano
    if plano:
        recursos = {
            "pdv": plano.modulo_pdv,
            "financeiro_avancado": plano.modulo_financeiro_avancado,
            "producao": plano.modulo_producao_industria,
            "transporte": plano.modulo_transporte_cte,
            "ciot": plano.modulo_ciot_automatico,
            "report_builder": plano.modulo_report_builder,
        }
    else:
        # Fallback para clientes sem plano definido: tudo liberado por padrão
        recursos = {
            "pdv": True,
            "financeiro_avancado": True,
            "producao": True,
            "transporte": True,
            "ciot": True,
            "report_builder": True,
        }

    # Validação do Limite de Máquinas (Auto-Ativação)
    # Se hardware_id não for informado, ignoramos a trava (retrocompatibilidade)
    terminais_autorizados = list(models.TerminalAtivo.objects.filter(cliente=cliente).values_list('hardware_id', flat=True))
    limite_maquinas = getattr(cliente, 'limite_maquinas', 1)

    if hardware_id:
        terminal = models.TerminalAtivo.objects.filter(hardware_id=hardware_id).first()
        if terminal:
            if terminal.cliente == cliente:
                # Se for do mesmo cliente, atualiza data de último acesso e nome (se mudou)
                if nome_computador and terminal.nome_computador != nome_computador:
                    terminal.nome_computador = nome_computador
                terminal.save()  # Dispara auto_now para ultimo_acesso
            elif getattr(cliente, 'is_test_environment', False) or getattr(terminal.cliente, 'is_test_environment', False):
                # Se for ambiente de teste (ou o dono do terminal for de teste), permite compartilhar o hardware_id sem bloqueio
                pass
            else:
                # O terminal existe, mas pertence a outro cliente SaaS
                return JsonResponse({
                    'bloqueio_manual': False,
                    'bloquear_sistema': True,
                    'alerta_estagio': 'limite_dispositivos',
                    'dias_atraso': 0,
                    'dias_restantes_carencia': 0,
                    'mensagem': 'Este dispositivo físico está associado a outro cliente SaaS.',
                    'modulos_liberados': recursos,
                    'terminais_autorizados': terminais_autorizados,
                    'limite_maquinas': limite_maquinas
                })
        else:
            # Não existe terminal para este hardware_id, tenta cadastrar/auto-ativar
            quantidade_terminais = models.TerminalAtivo.objects.filter(cliente=cliente).count()
            if quantidade_terminais >= limite_maquinas and not getattr(cliente, 'is_test_environment', False):
                return JsonResponse({
                    'bloqueio_manual': False,
                    'bloquear_sistema': True,
                    'alerta_estagio': 'limite_dispositivos',
                    'dias_atraso': 0,
                    'dias_restantes_carencia': 0,
                    'mensagem': f'Limite de dispositivos contratados atingido ({limite_maquinas} máquina{"s" if limite_maquinas > 1 else ""}). Remova um dispositivo ativo no painel ou entre em contato com o suporte.',
                    'modulos_liberados': recursos,
                    'terminais_autorizados': terminais_autorizados,
                    'limite_maquinas': limite_maquinas
                })
            else:
                models.TerminalAtivo.objects.create(
                    cliente=cliente,
                    hardware_id=hardware_id,
                    nome_computador=nome_computador or 'Máquina Auto-Ativada'
                )
                # Atualiza a lista local de terminais autorizados para retornar no response
                terminais_autorizados = list(models.TerminalAtivo.objects.filter(cliente=cliente).values_list('hardware_id', flat=True))

    # 1. VERIFICAÇÃO DE BLOQUEIO MANUAL (FIM DE CONTRATO)
    if getattr(cliente, 'status_licenca', 'ATIVO') in ['BLOQUEADO', 'CANCELADO', 'SUSPENSO', 'INATIVO']:
        return JsonResponse({
            'bloqueio_manual': True,
            'bloquear_sistema': True,
            'alerta_estagio': 'bloqueio_manual',
            'dias_atraso': 0,
            'dias_restantes_carencia': 0,
            'mensagem': 'Acesso suspenso devido ao encerramento do contrato de prestação de serviços.',
            'modulos_liberados': recursos,
            'terminais_autorizados': terminais_autorizados,
            'limite_maquinas': limite_maquinas
        })

    faturas = models.SaaSClienteMensalidade.objects.filter(saas_cliente=cliente)
    
    if not faturas.exists() or getattr(cliente, 'is_test_environment', False):
        return JsonResponse({
            'bloqueio_manual': False,
            'bloquear_sistema': False,
            'alerta_estagio': 'isento',
            'dias_atraso': 0,
            'mensagem': 'Ambiente de teste ou sem faturamento gerado. Acesso liberado.',
            'faturas': [],
            'modulos_liberados': recursos,
            'terminais_autorizados': terminais_autorizados,
            'limite_maquinas': limite_maquinas
        })

    hoje = timezone.now().date()
    faturas_atrasadas = faturas.filter(
        status_pagamento__in=['PENDENTE', 'VENCIDO'],
        data_vencimento__lt=hoje
    ).order_by('data_vencimento')
    
    if not faturas_atrasadas.exists():
        return JsonResponse({
            'bloqueio_manual': False,
            'bloquear_sistema': False,
            'alerta_estagio': 'em_dia',
            'dias_atraso': 0,
            'mensagem': 'Todas as faturas estão em dia.',
            'modulos_liberados': recursos,
            'terminais_autorizados': terminais_autorizados,
            'limite_maquinas': limite_maquinas
        })

    fatura_mais_antiga = faturas_atrasadas.first()
    dias_atraso = (hoje - fatura_mais_antiga.data_vencimento).days

    bloquear_sistema = False
    alerta_estagio = 'suave'
    dias_restantes = 11 - dias_atraso

    if 1 <= dias_atraso <= 5:
        alerta_estagio = 'suave'
    elif 6 <= dias_atraso <= 10:
        alerta_estagio = 'critico'
    elif dias_atraso > 10:
        dia_semana_atual = hoje.weekday()
        
        if dia_semana_atual in [5, 6]:
            bloquear_sistema = False
            alerta_estagio = 'fim_de_semana'
        else:
            bloquear_sistema = True

    return JsonResponse({
        'bloqueio_manual': False,
        'bloquear_sistema': bloquear_sistema,
        'alerta_estagio': alerta_estagio,
        'dias_atraso': dias_atraso,
        'dias_restantes_carencia': max(0, dias_restantes),
        'modulos_liberados': recursos,
        'terminais_autorizados': terminais_autorizados,
        'limite_maquinas': limite_maquinas,
        'fatura_pendente': {
            'id_mensalidade': fatura_mais_antiga.id_mensalidade,
            'valor': str(fatura_mais_antiga.valor),
            'vencimento': fatura_mais_antiga.data_vencimento.strftime('%d/%m/%Y'),
            'pix_copia_cola': fatura_mais_antiga.pix_copia_cola,
            'url_boleto': fatura_mais_antiga.url_boleto,
            'link_boleto': fatura_mais_antiga.url_boleto,
            'linha_digitavel': fatura_mais_antiga.linha_digitavel,
            'nosso_numero': fatura_mais_antiga.nosso_numero
        }
    })


def obter_comunicado_ativo(request):
    """
    Retorna o comunicado ativo vigente para o sistema central.
    """
    from django.http import JsonResponse
    from django.utils import timezone
    from api import models
    
    hoje = timezone.now().date()
    comunicado = models.ComunicadoSaaS.objects.filter(
        ativo=True, 
        data_inicio__lte=hoje, 
        data_fim__gte=hoje
    ).order_by('-id').first()
    
    if comunicado:
        url = comunicado.url_midia
        if comunicado.tipo == 'IMAGEM' and comunicado.imagem:
            url = comunicado.imagem.url
            
        return JsonResponse({
            'existe_comunicado': True,
            'id': comunicado.id,
            'titulo': comunicado.titulo,
            'tipo': comunicado.tipo,
            'texto': comunicado.conteudo_texto,
            'url': url
        })
    return JsonResponse({'existe_comunicado': False})


def enviar_nfse_mensalidade(fatura):
    """
    Função para estruturar e disparar a NFS-e para a Prefeitura de Patrocínio/MG
    Utilizando o Código de Serviço 1.05.
    """
    cliente = fatura.saas_cliente 
    
    empresa = models.EmpresaConfig.objects.exclude(cpf_cnpj='').first() or models.EmpresaConfig.objects.first()
    cnpj_prestador = re.sub(r'\D', '', str(empresa.cpf_cnpj)) if empresa and empresa.cpf_cnpj else "CNPJ_DA_SUPREMA_AQUI"
    im_prestador = empresa.inscricao_municipal if empresa and empresa.inscricao_municipal else "IM_DA_SUPREMA_AQUI"

    payload_nfse = {
        "IdentificacaoRps": {
            "Numero": str(fatura.id_mensalidade),
            "Tipo": "1"
        },
        "DataEmissao": timezone.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "Status": "1",
        "Servico": {
            "Valores": {
                "ValorServicos": float(fatura.valor),
                "IssRetido": "2",
                "ItemListaServico": "1.05",
                "CodigoTributacaoMunicipio": "010500199",
            },
            "Discriminacao": f"PRESTACAO DE SERVICO DE LICENCIAMENTO E USO DO SISTEMA DE GESTAO EMPRESARIAL APERUS. REF. COMPETENCIA ATUAL. FATURA ID {fatura.id_mensalidade}.",
            "CodigoMunicipio": "3148103"
        },
        "Prestador": {
            "Cnpj": cnpj_prestador,
            "InscricaoMunicipal": im_prestador
        },
        "Tomador": {
            "CpfCnpj": {
                "Cnpj": cliente.cnpj
            },
            "RazaoSocial": cliente.razao_social,
            "Endereco": {
                "Endereco": cliente.endereco or '',
                "Numero": cliente.numero or '',
                "Bairro": cliente.bairro or '',
                "CodigoMunicipio": "3148103",
                "Uf": cliente.estado or '',
                "Cep": cliente.cep or ''
            },
            "Contato": {
                "Email": cliente.email_responsavel or cliente.email or ''
            }
        }
    }
    
    return payload_nfse


@csrf_exempt
@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def verificar_licenca_local(request):
    """
    Endpoint na filial local para verificar a licenca do SaaS.
    """
    from django.http import JsonResponse
    from .licenciamento_service import sincronizar_e_verificar_licenca
    return JsonResponse(sincronizar_e_verificar_licenca())


class GabaritoCustomizadoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar os gabaritos de relatórios customizados na central.
    """
    queryset = models.GabaritoCustomizado.objects.all().order_by('-atualizado_em')
    serializer_class = serializers.GabaritoCustomizadoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        cliente_id = self.request.query_params.get('cliente')
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        return queryset

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Erro ao buscar gabaritos no banco central local, tentando fallback HTTP: {e}")
            
            import re
            empresa = models.EmpresaConfig.objects.exclude(cpf_cnpj='').first() or models.EmpresaConfig.objects.first()
            if not empresa or not empresa.cpf_cnpj:
                return Response([], status=status.HTTP_200_OK)
            
            cnpj_limpo = re.sub(r'\D', '', str(empresa.cpf_cnpj))
            
            from django.conf import settings
            import requests
            
            mother_url = getattr(settings, 'SAAS_MOTHER_URL', 'https://central.aperus.com.br')
            if mother_url.endswith('/'):
                mother_url = mother_url[:-1]
                
            try:
                response = requests.get(
                    f"{mother_url}/api/saas/listar-gabaritos/",
                    params={'cnpj': cnpj_limpo},
                    timeout=5
                )
                if response.status_code == 200:
                    return Response(response.json(), status=status.HTTP_200_OK)
                else:
                    logger.error(f"Erro na resposta do fallback HTTP: {response.status_code} - {response.text}")
            except Exception as http_err:
                logger.error(f"Falha de conexão com a Central mãe no fallback: {http_err}")
                
            return Response([], status=status.HTTP_200_OK)


def _enviar_whatsapp_cadastro(telefone: str, mensagem: str) -> bool:
    import logging
    import requests
    from decouple import config
    from . import whatsapp_cloud_service as _cloud
    from .whatsapp_playwright_service import WhatsAppService

    logger = logging.getLogger(__name__)

    # Limpar telefone (apenas números)
    telefone_limpo = ''.join(filter(str.isdigit, str(telefone)))
    if not telefone_limpo:
        return False
        
    if len(telefone_limpo) <= 11:
        telefone_limpo = f"55{telefone_limpo}"

    # Para APIs de texto corrido (Cloud/Evolution), removemos o marcador §§ do desktop
    mensagem_api = mensagem.replace('\n§§\n', '\n').replace('§§', '')

    enviado = False

    # 1. Tenta Cloud API
    try:
        if _cloud.is_configurado() and not _cloud.token_com_erro():
            logger.info("Tentando enviar via WhatsApp Cloud API...")
            enviado = _cloud.enviar_mensagem(telefone_limpo, mensagem_api)
    except Exception as e:
        logger.error(f"Erro ao enviar via Cloud API: {e}")

    # 2. Tenta Evolution API
    if not enviado:
        try:
            base_url = config('EVOLUTION_API_URL', default='').rstrip('/')
            api_key  = config('EVOLUTION_API_KEY', default='')
            instance = config('EVOLUTION_INSTANCE', default='default')
            if base_url and api_key:
                logger.info("Tentando enviar via Evolution API...")
                url = f"{base_url}/message/sendText/{instance}"
                headers = {'apikey': api_key, 'Content-Type': 'application/json'}
                payload = {'number': telefone_limpo, 'text': mensagem_api}
                resp = requests.post(url, json=payload, headers=headers, timeout=10)
                resp.raise_for_status()
                enviado = True
        except Exception as e:
            logger.error(f"Erro ao enviar via Evolution API: {e}")

    # 3. Tenta Playwright
    if not enviado:
        try:
            if config('WHATSAPP_PLAYWRIGHT_ENABLED', default='True').lower() in ('true', '1', 'yes'):
                logger.warning("Tentando enviar via Playwright...")
                service = WhatsAppService()
                enviado = service.enviar_mensagem(telefone_limpo, mensagem)
            else:
                logger.info("Envio via Playwright/Desktop desabilitado nas configurações.")
        except Exception as e:
            logger.error(f"Erro ao enviar via Playwright: {e}")

    return enviado


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def saas_gerar_link_cadastro(request):
    """
    Gera um convite/token temporário para o cliente preencher os próprios dados cadastrais.
    Dispara o link via WhatsApp do cliente se possível.
    """
    from django.utils import timezone
    import datetime
    
    whatsapp = request.data.get('whatsapp_cliente')
    valor_mensalidade = request.data.get('valor_mensalidade')
    plano_id = request.data.get('plano_id')
    
    if not whatsapp or not valor_mensalidade:
        return Response({'error': 'WhatsApp e Valor da Mensalidade são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Limpa telefone
    import re
    whatsapp_limpo = re.sub(r'\D', '', str(whatsapp))
    if not whatsapp_limpo:
        return Response({'error': 'Telefone inválido.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        # Resolver Plano
        plano = None
        if plano_id:
            try:
                plano = models.PlanoSaaS.objects.get(id=plano_id)
            except models.PlanoSaaS.DoesNotExist:
                pass

        # Prazo de expiração: 48 horas
        prazo = timezone.now() + datetime.timedelta(hours=48)
        
        # Criar convite
        convite = models.LinkCadastroRemoto.objects.create(
            whatsapp_cliente=whatsapp_limpo,
            expira_em=prazo,
            dia_vencimento=int(request.data.get('dia_vencimento', 10)),
            valor_mensalidade=float(valor_mensalidade),
            emite_nota=bool(request.data.get('emite_nota', False)),
            vendedor=request.data.get('vendedor'),
            status_licenca=request.data.get('status_licenca', 'ATIVO'),
            schema_name=request.data.get('schema_name'),
            db_host=request.data.get('db_host', 'localhost'),
            db_port=request.data.get('db_port', '8005'),
            is_test_environment=bool(request.data.get('is_test_environment', False)),
            plano=plano
        )
        
        # Construir link
        host = request.get_host()
        is_local = 'localhost' in host or '127.0.0.1' in host or '192.168.' in host or '10.' in host
        protocol = 'http' if is_local else 'https'
        url_cadastro = f"{protocol}://{host}/cadastro-cliente/?token={convite.id_token}"
        
        # Enviar WhatsApp (usando §§ para isolar o link em mensagem própria no WhatsApp Desktop)
        mensagem = (
            f"Olá! Para darmos andamento à ativação do seu sistema Aperus, por favor, "
            f"preencha seus dados cadastrais pelo link seguro:\n"
            f"§§\n"
            f"{url_cadastro}\n"
            f"§§\n"
            f"_(Este link é válido por 48 horas)_"
        )
        
        whatsapp_enviado = _enviar_whatsapp_cadastro(whatsapp_limpo, mensagem)
        
        return Response({
            'success': True,
            'token': str(convite.id_token),
            'url': url_cadastro,
            'whatsapp_enviado': whatsapp_enviado
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def saas_validar_token_cadastro(request):
    """
    Verifica se um token de cadastro remoto é válido e retorna os parâmetros comerciais predefinidos.
    """
    token_str = request.query_params.get('token')
    if not token_str:
        return Response({'error': 'Token é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        convite = models.LinkCadastroRemoto.objects.get(id_token=token_str)
        if not convite.esta_valido():
            return Response({'valido': False, 'error': 'Link expirado ou já utilizado.'}, status=status.HTTP_200_OK)
            
        return Response({
            'valido': True,
            'whatsapp_cliente': convite.whatsapp_cliente,
            'preset': {
                'dia_vencimento': convite.dia_vencimento,
                'valor_mensalidade': str(convite.valor_mensalidade),
                'emite_nota': convite.emite_nota,
                'vendedor': convite.vendedor,
                'status_licenca': convite.status_licenca,
                'schema_name': convite.schema_name,
                'db_host': convite.db_host,
                'db_port': convite.db_port,
                'is_test_environment': convite.is_test_environment,
                'plano_id': convite.plano.id if convite.plano else None,
                'nome_plano': convite.plano.nome if convite.plano else None,
            }
        }, status=status.HTTP_200_OK)
        
    except models.LinkCadastroRemoto.DoesNotExist:
        return Response({'valido': False, 'error': 'Token inválido.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def saas_finalizar_cadastro_remoto(request):
    """
    Finaliza o cadastro remoto do cliente.
    Cria a conta em SaaSCliente, marca o token como usado e avisa o suporte.
    """
    token_str = request.data.get('token')
    cnpj = request.data.get('cnpj')
    razao_social = request.data.get('razao_social')
    
    if not token_str or not cnpj or not razao_social:
        return Response({'error': 'Token, CNPJ e Razão Social são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        convite = models.LinkCadastroRemoto.objects.get(id_token=token_str)
        if not convite.esta_valido():
            return Response({'error': 'Link expirado ou já utilizado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Limpar CNPJ
        import re
        cnpj_limpo = re.sub(r'\D', '', str(cnpj))
        
        # Validar se já existe cliente com esse CNPJ ou schema_name
        schema_final = convite.schema_name
        if not schema_final:
            # Auto-gerar schema_name baseado na Razão Social
            from django.utils.text import slugify
            schema_final = slugify(razao_social).replace('-', '_')
            
        # Garantir unicidade do schema_name adicionando sufixo se necessário
        base_schema = schema_final
        counter = 1
        while models.SaaSCliente.objects.filter(schema_name=schema_final).exists():
            schema_final = f"{base_schema}_{counter}"
            counter += 1
            
        # Criar SaaSCliente
        cliente = models.SaaSCliente.objects.create(
            cnpj=cnpj,
            razao_social=razao_social,
            nome_fantasia=request.data.get('nome_fantasia'),
            inscricao_estadual=request.data.get('inscricao_estadual'),
            proprietario=request.data.get('proprietario'),
            telefone=request.data.get('telefone') or convite.whatsapp_cliente,
            email=request.data.get('email'),
            cep=request.data.get('cep'),
            endereco=request.data.get('endereco'),
            numero=request.data.get('numero'),
            complemento=request.data.get('complemento'),
            bairro=request.data.get('bairro'),
            cidade=request.data.get('cidade'),
            estado=request.data.get('estado'),
            dia_vencimento=convite.dia_vencimento,
            valor_mensalidade=convite.valor_mensalidade,
            emite_nota=convite.emite_nota,
            vendedor=convite.vendedor,
            status_licenca=convite.status_licenca,
            schema_name=schema_final,
            db_host=convite.db_host,
            db_port=convite.db_port,
            is_test_environment=convite.is_test_environment,
            banco_criado=False,
            contrato_pendente=True,
            email_responsavel=request.data.get('email_responsavel') or request.data.get('email'),
            data_nascimento_responsavel=request.data.get('data_nascimento_responsavel'),
            plano=convite.plano
        )
        
        # Marcar convite como usado
        convite.usado = True
        convite.save()
        
        # Notificar equipe de suporte/vendas via WhatsApp
        notificacao = (
            f"🚀 *Novo Cadastro Remoto Concluído!*\n\n"
            f"O cliente *{cliente.razao_social}* (CNPJ: {cliente.cnpj}) finalizou o seu preenchimento cadastral.\n"
            f"• *Schema*: {cliente.schema_name}\n"
            f"• *Vendedor*: {cliente.vendedor or 'Não informado'}\n"
            f"• *Mensalidade*: R$ {cliente.valor_mensalidade}\n\n"
            f"O banco de dados já pode ser provisionado no painel da Central SaaS."
        )
        
        confirmacao_cliente = (
            f"Olá *{cliente.razao_social}*!\n\n"
            f"Recebemos seus dados cadastrais com sucesso. Nossa equipe de suporte já está "
            f"provisionando o seu ambiente de banco de dados. Em instantes você receberá "
            f"as suas credenciais de acesso por aqui!"
        )
        _enviar_whatsapp_cadastro(cliente.telefone, confirmacao_cliente)
        
        # Se o suporte/vendedor tiver um telefone configurado no .env, avisa lá
        from decouple import config
        suporte_fone = config('SUPORTE_WHATSAPP', default='')
        if suporte_fone:
            _enviar_whatsapp_cadastro(suporte_fone, notificacao)
            
        return Response({
            'success': True,
            'message': 'Cadastro finalizado com sucesso!',
            'cliente_id': cliente.id_saas_cliente,
            'schema_name': cliente.schema_name
        }, status=status.HTTP_200_OK)
        
    except models.LinkCadastroRemoto.DoesNotExist:
        return Response({'error': 'Token inválido.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def saas_listar_gabaritos(request):
    """
    Retorna a lista de todos os gabaritos customizados de um cliente a partir de seu CNPJ.
    Usado no fallback quando clientes locais não conseguem acessar o banco central.
    """
    cnpj = request.query_params.get('cnpj')
    if not cnpj:
        return Response({'error': 'CNPJ é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
    import re
    cnpj_limpo = re.sub(r'\D', '', str(cnpj))
    
    try:
        clientes = models.SaaSCliente.objects.all()
        cliente = None
        for c in clientes:
            if re.sub(r'\D', '', c.cnpj) == cnpj_limpo:
                cliente = c
                break

        if not cliente:
            return Response([], status=status.HTTP_200_OK)

        gabaritos = models.GabaritoCustomizado.objects.filter(
            cliente=cliente,
            ativo=True
        ).order_by('-atualizado_em')
        
        serializer = serializers.GabaritoCustomizadoSerializer(gabaritos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def saas_obter_gabarito(request):
    """
    Retorna o layout do gabarito customizado para a filial a partir do CNPJ e nome do relatório.
    """
    cnpj = request.data.get('cnpj') if request.method == 'POST' else request.query_params.get('cnpj')
    nome_relatorio = request.data.get('nome_relatorio') if request.method == 'POST' else request.query_params.get('nome_relatorio')

    if not cnpj or not nome_relatorio:
        return Response({'error': 'Parâmetros cnpj e nome_relatorio são obrigatórios.'}, status=status.HTTP_400_BAD_REQUEST)

    import re
    cnpj_limpo = re.sub(r'\D', '', str(cnpj))

    try:
        # Busca o cliente SaaS pelo CNPJ.
        clientes = models.SaaSCliente.objects.all()
        cliente = None
        for c in clientes:
            if re.sub(r'\D', '', c.cnpj) == cnpj_limpo:
                cliente = c
                break

        if not cliente:
            return Response({'error': 'Cliente SaaS não encontrado na central.'}, status=status.HTTP_404_NOT_FOUND)

        gabarito = models.GabaritoCustomizado.objects.filter(
            cliente=cliente,
            nome_relatorio=nome_relatorio,
            ativo=True
        ).first()

        if not gabarito:
            return Response({'layout_json': None, 'mensagem': 'Nenhum gabarito customizado ativo encontrado.'}, status=status.HTTP_200_OK)

        return Response({
            'id': gabarito.id,
            'nome_relatorio': gabarito.nome_relatorio,
            'tipo_gabarito': gabarito.tipo_gabarito,
            'layout_json': gabarito.layout_json,
            'largura_gabarito_mm': gabarito.largura_gabarito_mm,
            'altura_gabarito_mm': gabarito.altura_gabarito_mm,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def saas_gabarito_preview(request):
    """
    Gera um preview HTML de teste com dados mockados de um gabarito de relatório customizado.
    URL: /api/saas/gabarito-preview/?nome_relatorio=venda_recibo
    """
    from django.http import HttpResponse
    from django.conf import settings
    from api.logic.renderizador import montar_html_gabarito_customizado

    nome_relatorio = request.query_params.get('nome_relatorio')
    if not nome_relatorio:
        return HttpResponse("O parâmetro nome_relatorio é obrigatório.", status=400)

    # 1. Obter CNPJ (permite parâmetro da query ou local)
    import re
    cnpj_param = request.query_params.get('cnpj')
    if cnpj_param:
        cnpj_limpo = re.sub(r'\D', '', str(cnpj_param))
    else:
        empresa = models.EmpresaConfig.objects.exclude(cpf_cnpj='').first() or models.EmpresaConfig.objects.first()
        cnpj_limpo = re.sub(r'\D', '', str(empresa.cpf_cnpj)) if empresa and empresa.cpf_cnpj else ""

    # 2. Conectar e buscar da Central SaaS
    db_name = 'aperus_central'
    if db_name not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name

    layout_json = None
    largura_mm = 210
    altura_mm = 297
    tipo_gabarito = 'A4_RETRATO'

    # Se tivermos CNPJ, tentamos obter da Central/Local
    if cnpj_limpo:
        try:
            cliente = models.SaaSCliente.objects.using(db_name).filter(cnpj=cnpj_limpo).first()
            if cliente:
                gabarito = models.GabaritoCustomizado.objects.using(db_name).filter(
                    cliente=cliente,
                    nome_relatorio=nome_relatorio,
                    ativo=True
                ).first()
                if gabarito:
                    layout_json = gabarito.layout_json
                    largura_mm = gabarito.largura_gabarito_mm
                    altura_mm = gabarito.altura_gabarito_mm
                    tipo_gabarito = gabarito.tipo_gabarito
        except Exception as e:
            pass

    # Dicionário de templates de layout padrão (fallback caso o cliente não tenha customizado ainda)
    DEFAULT_LAYOUTS = {
        'venda_recibo': [
            {'campo_origem': 'venda.numero', 'x': 10, 'y': 10, 'font_size': 12, 'largura': 150, 'label': 'Número da Venda'},
            {'campo_origem': 'venda.data', 'x': 180, 'y': 10, 'font_size': 12, 'largura': 100, 'label': 'Data da Venda'},
            {'campo_origem': 'cliente.nome', 'x': 10, 'y': 30, 'font_size': 12, 'largura': 220, 'label': 'Nome do Cliente'},
            {'campo_origem': 'produto.codigo', 'x': 10, 'y': 65, 'font_size': 11, 'largura': 50, 'label': 'Código do Produto'},
            {'campo_origem': 'produto.descricao', 'x': 65, 'y': 65, 'font_size': 11, 'largura': 150, 'label': 'Descrição do Produto'},
            {'campo_origem': 'produto.quantidade', 'x': 220, 'y': 65, 'font_size': 11, 'largura': 40, 'label': 'Quantidade'},
            {'campo_origem': 'produto.valor_unit', 'x': 265, 'y': 65, 'font_size': 11, 'largura': 60, 'label': 'Valor Unitário'},
            {'campo_origem': 'venda.total', 'x': 180, 'y': 105, 'font_size': 14, 'largura': 100, 'label': 'Total da Venda'}
        ],
        'etiqueta_gondola': [
            {'campo_origem': 'produto.descricao', 'x': 10, 'y': 10, 'font_size': 14, 'largura': 260, 'label': 'Descrição do Produto'},
            {'campo_origem': 'produto.codigo', 'x': 10, 'y': 40, 'font_size': 11, 'largura': 100, 'label': 'Código do Produto'},
            {'campo_origem': 'produto.valor_unit', 'x': 10, 'y': 65, 'font_size': 20, 'largura': 150, 'label': 'Valor Unitário'},
            {'campo_origem': 'produto.codigo_barras', 'x': 10, 'y': 105, 'font_size': 12, 'largura': 200, 'label': 'Código de Barras'}
        ],
        'relatorio_vendas': [
            {'campo_origem': 'cliente.nome', 'x': 30, 'y': 30, 'font_size': 12, 'largura': 200, 'label': 'Nome do Cliente'},
            {'campo_origem': 'venda.numero', 'x': 250, 'y': 30, 'font_size': 12, 'largura': 100, 'label': 'Número da Venda'},
            {'campo_origem': 'venda.total', 'x': 370, 'y': 30, 'font_size': 12, 'largura': 120, 'label': 'Total da Venda'}
        ],
        'relatorio_inventario': [
            {'campo_origem': 'produto.codigo', 'x': 30, 'y': 30, 'font_size': 12, 'largura': 100, 'label': 'Código do Produto'},
            {'campo_origem': 'produto.descricao', 'x': 150, 'y': 30, 'font_size': 12, 'largura': 300, 'label': 'Descrição do Produto'},
            {'campo_origem': 'produto.quantidade', 'x': 470, 'y': 30, 'font_size': 12, 'largura': 100, 'label': 'Quantidade'}
        ]
    }

    if not layout_json:
        layout_json = DEFAULT_LAYOUTS.get(nome_relatorio, [])
        if nome_relatorio == 'venda_recibo':
            tipo_gabarito = 'RECIBO'
            largura_mm = 80
            altura_mm = 0
        elif nome_relatorio == 'etiqueta_gondola':
            tipo_gabarito = 'ETIQUETA'
            largura_mm = 100
            altura_mm = 50
        elif nome_relatorio == 'relatorio_vendas':
            tipo_gabarito = 'A4_RETRATO'
            largura_mm = 210
            altura_mm = 297
        elif nome_relatorio == 'relatorio_inventario':
            tipo_gabarito = 'A4_PAISAGEM'
            largura_mm = 297
            altura_mm = 210

    # Dados mockados para visualização do teste
    empresa_obj = models.EmpresaConfig.objects.exclude(cpf_cnpj='').first() or models.EmpresaConfig.objects.first()
    logo_url = empresa_obj.logo_url if (empresa_obj and empresa_obj.logo_url) else ''
    if logo_url:
        if not logo_url.startswith('http'):
            if logo_url.startswith('media/'):
                logo_url = '/' + logo_url
            elif logo_url.startswith('/media/'):
                pass
            else:
                if logo_url.startswith('/logos/'):
                    pass
                elif logo_url.startswith('logos/'):
                    logo_url = '/' + logo_url
                else:
                    logo_url = '/logos/' + logo_url.lstrip('/')
            logo_url = request.build_absolute_uri(logo_url)
    else:
        logo_url = 'https://central.aperus.com.br/static/logo.png'

    MOCK_DATA = {
        # Empresa
        'empresa.logomarca': logo_url,
        'empresa.razao_social': 'Aperus Tec Informática S.A.',
        'empresa.nome_fantasia': 'Sistema Aperus Central',
        'empresa.cnpj': '99.888.777/0001-66',
        'empresa.inscricao_estadual': '109.208.300.111',
        'empresa.telefone': '(34) 3210-9999',
        'empresa.email': 'contato@aperus.com.br',
        'empresa.endereco': 'Rua Santo Antônio, 450 - Bairro Planalto, Uberlândia - MG',
        'empresa.cep': '38400-112',
        
        # Cliente
        'cliente.nome': 'Brunow e Associados S/S Ltda',
        'cliente.doc': '12.345.678/0001-90',
        'cliente.rg_ie': 'MG-15.890.301',
        'cliente.telefone': '(34) 99999-1234',
        'cliente.email': 'financeiro@brunow.com.br',
        'cliente.endereco': 'Av. Faria Lima, 1000 - Centro',
        'cliente.bairro': 'Jardins',
        'cliente.cidade': 'São Paulo',
        'cliente.uf': 'SP',
        'cliente.cep': '01451-001',
        'cliente.complemento': '15º Andar - Sala 152',
        
        # Venda
        'venda.numero': '00004589',
        'venda.data': '05/06/2026',
        'venda.total': 'R$ 389,90',
        'venda.subtotal': 'R$ 399,90',
        'venda.desconto': 'R$ 10,00',
        'venda.frete': 'R$ 15,00',
        'venda.total_geral': 'R$ 389,90',
        'venda.total_desconto': 'R$ 10,00',
        'venda.total_frete': 'R$ 15,00',
        'venda.forma_pagamento': 'Cartão de Crédito',
        
        # Produto
        'produto.codigo': 'PROD0089',
        'produto.descricao': 'Arroz Integral Prato Fino 5kg',
        'produto.valor_unit': 'R$ 29,90',
        'produto.quantidade': '3',
        'produto.subtotal': 'R$ 89,70',
        'produto.codigo_barras': '7891000200030',
        'produto.unidade': 'UN',
        'produto.ncm': '1006.30.21',
        'produto.grupo': 'Alimentos Básicos',
        'produto.marca': 'Prato Fino',
        'produto.preco_custo': 'R$ 19,50',
        'produto.peso_liquido': '5.00 kg',
        'produto.peso_bruto': '5.05 kg',

        # Ordem de Serviço
        'os.numero': '00001024',
        'os.data_abertura': '11/06/2026 09:00',
        'os.data_previsao': '12/06/2026 18:00',
        'os.data_fechamento': '11/06/2026 15:30',
        'os.status': 'Finalizada',
        'os.tecnico': 'João Técnico de Campo',
        'os.defeitos': 'O aparelho não liga e emite bip intermitente.',
        'os.laudo_tecnico': 'Substituição da fonte de alimentação queimada e limpeza geral.',
        'os.observacoes': 'Garantia de 90 dias sobre a fonte trocada.',
        'os.solicitante': 'Brunow Solicitante',
        'os.total_produtos': 'R$ 150,00',
        'os.total_servicos': 'R$ 120,00',
        'os.total_geral': 'R$ 270,00',
        'os.desconto': 'R$ 20,00',
        'os.frete': 'R$ 0,00',
        'os.subtotal': 'R$ 270,00',

        # Veículo
        'veiculo.placa': 'ABC-1234',
        'veiculo.marca': 'Toyota',
        'veiculo.modelo': 'Corolla XEI 2.0',
        'veiculo.ano': '2022',
        'veiculo.cor': 'Prata',
        'veiculo.chassi': '9BWZZZ99Z99999999',
        'veiculo.km': '45.000 km',
        'veiculo.combustivel': 'Flex',
        'veiculo.observacoes': 'Nenhuma observação.',

        # Equipamento
        'equipamento.codigo': 'EQP004',
        'equipamento.nome': 'Ar Condicionado Split 12000 BTU',
        'equipamento.marca': 'Springer Midea',
        'equipamento.modelo': '42AGQA12M5',
        'equipamento.numero_serie': '1234567890AB',
        'equipamento.descricao': 'Ar condicionado split hi-wall inverter',
        'equipamento.categoria': 'Climatização',
        'equipamento.status': 'Ativo',
        'equipamento.observacoes': 'Em bom estado.',

        # Animal / Pet
        'animal.nome': 'Max',
        'animal.raca': 'Golden Retriever',
        'animal.sexo': 'Macho',
        'animal.idade': '3 anos',
        'animal.peso': '32 kg',
        'animal.cor': 'Dourado',
        'animal.observacoes': 'Amigável.',
        
        'pet.nome': 'Max',
        'pet.raca': 'Golden Retriever',
        'pet.sexo': 'Macho',
        'pet.peso': '32 kg',
        'pet.cor': 'Dourado',
        'pet.observacoes': 'Amigável.',
    }

    html = montar_html_gabarito_customizado(
        layout_json=layout_json,
        dados_reais_locais=MOCK_DATA,
        largura_mm=largura_mm,
        altura_mm=altura_mm,
        tipo_gabarito=tipo_gabarito
    )
    return HttpResponse(html)


@api_view(['GET'])
@permission_classes([AllowAny])
def saas_gabarito_gerar(request):
    """
    Gera o relatório com dados reais aplicando filtros e ordenação, retornando o HTML pronto para impressão.
    """
    from django.http import HttpResponse
    from django.conf import settings
    from django.db.models import Sum
    from rest_framework.permissions import AllowAny
    import re
    
    nome_relatorio = request.query_params.get('nome_relatorio')
    if not nome_relatorio:
        return HttpResponse("O parâmetro nome_relatorio é obrigatório.", status=400)

    # 1. Tenant database routing
    cnpj_param = request.query_params.get('cnpj')
    db_alias = 'default'
    if cnpj_param:
        cnpj_limpo = re.sub(r'\D', '', str(cnpj_param))
        # Mother node case: find SaaSCliente to resolve schema database
        cliente_saas = models.SaaSCliente.objects.filter(cnpj=cnpj_limpo).first()
        if cliente_saas and cliente_saas.schema_name:
            schema_db = f"aperus_{cliente_saas.schema_name}"
            if schema_db not in settings.DATABASES:
                import copy
                default_db = settings.DATABASES['default']
                settings.DATABASES[schema_db] = copy.deepcopy(default_db)
                settings.DATABASES[schema_db]['NAME'] = schema_db
            db_alias = schema_db
    else:
        # Local filial case: get local CNPJ to fetch custom layouts
        empresa = models.EmpresaConfig.objects.exclude(cpf_cnpj='').first() or models.EmpresaConfig.objects.first()
        cnpj_limpo = re.sub(r'\D', '', str(empresa.cpf_cnpj)) if empresa and empresa.cpf_cnpj else ""

    # 2. Fetch layout from central db
    db_central = 'aperus_central'
    if db_central not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_central] = copy.deepcopy(default_db)
        settings.DATABASES[db_central]['NAME'] = db_central

    layout_json = None
    largura_mm = 210
    altura_mm = 297
    tipo_gabarito = 'A4_RETRATO'

    if cnpj_limpo:
        try:
            cliente_saas = models.SaaSCliente.objects.using(db_central).filter(cnpj=cnpj_limpo).first()
            if cliente_saas:
                gabarito = models.GabaritoCustomizado.objects.using(db_central).filter(
                    cliente=cliente_saas,
                    nome_relatorio=nome_relatorio,
                    ativo=True
                ).first()
                if gabarito:
                    layout_json = gabarito.layout_json
                    largura_mm = gabarito.largura_gabarito_mm
                    altura_mm = gabarito.altura_gabarito_mm
                    tipo_gabarito = gabarito.tipo_gabarito
        except Exception as e:
            pass

    # Fallback to defaults
    DEFAULT_LAYOUTS = {
        'venda_recibo': [
            {'campo_origem': 'venda.numero', 'x': 10, 'y': 10, 'font_size': 12, 'largura': 150, 'label': 'Número da Venda'},
            {'campo_origem': 'venda.data', 'x': 180, 'y': 10, 'font_size': 12, 'largura': 100, 'label': 'Data da Venda'},
            {'campo_origem': 'cliente.nome', 'x': 10, 'y': 30, 'font_size': 12, 'largura': 220, 'label': 'Nome do Cliente'},
            {'campo_origem': 'produto.codigo', 'x': 10, 'y': 65, 'font_size': 11, 'largura': 50, 'label': 'Código do Produto'},
            {'campo_origem': 'produto.descricao', 'x': 65, 'y': 65, 'font_size': 11, 'largura': 150, 'label': 'Descrição do Produto'},
            {'campo_origem': 'produto.quantidade', 'x': 220, 'y': 65, 'font_size': 11, 'largura': 40, 'label': 'Quantidade'},
            {'campo_origem': 'produto.valor_unit', 'x': 265, 'y': 65, 'font_size': 11, 'largura': 60, 'label': 'Valor Unitário'},
            {'campo_origem': 'venda.total', 'x': 180, 'y': 105, 'font_size': 14, 'largura': 100, 'label': 'Total da Venda'}
        ],
        'etiqueta_gondola': [
            {'campo_origem': 'produto.descricao', 'x': 10, 'y': 10, 'font_size': 14, 'largura': 260, 'label': 'Descrição do Produto'},
            {'campo_origem': 'produto.codigo', 'x': 10, 'y': 40, 'font_size': 11, 'largura': 100, 'label': 'Código do Produto'},
            {'campo_origem': 'produto.valor_unit', 'x': 10, 'y': 65, 'font_size': 20, 'largura': 150, 'label': 'Valor Unitário'},
            {'campo_origem': 'produto.codigo_barras', 'x': 10, 'y': 105, 'font_size': 12, 'largura': 200, 'label': 'Código de Barras'}
        ],
        'relatorio_vendas': [
            {'campo_origem': 'cliente.nome', 'x': 30, 'y': 30, 'font_size': 12, 'largura': 200, 'label': 'Nome do Cliente'},
            {'campo_origem': 'venda.numero', 'x': 250, 'y': 30, 'font_size': 12, 'largura': 100, 'label': 'Número da Venda'},
            {'campo_origem': 'venda.total', 'x': 370, 'y': 30, 'font_size': 12, 'largura': 120, 'label': 'Total da Venda'}
        ],
        'relatorio_inventario': [
            {'campo_origem': 'produto.codigo', 'x': 30, 'y': 30, 'font_size': 12, 'largura': 100, 'label': 'Código do Produto'},
            {'campo_origem': 'produto.descricao', 'x': 150, 'y': 30, 'font_size': 12, 'largura': 300, 'label': 'Descrição do Produto'},
            {'campo_origem': 'produto.quantidade', 'x': 470, 'y': 30, 'font_size': 12, 'largura': 100, 'label': 'Quantidade'}
        ]
    }

    if not layout_json:
        layout_json = DEFAULT_LAYOUTS.get(nome_relatorio, [])
        if nome_relatorio == 'venda_recibo':
            tipo_gabarito = 'RECIBO'
            largura_mm = 80
            altura_mm = 0
        elif nome_relatorio == 'etiqueta_gondola':
            tipo_gabarito = 'ETIQUETA'
            largura_mm = 100
            altura_mm = 50
        elif nome_relatorio == 'relatorio_vendas':
            tipo_gabarito = 'A4_RETRATO'
            largura_mm = 210
            altura_mm = 297
        elif nome_relatorio == 'relatorio_inventario':
            tipo_gabarito = 'A4_PAISAGEM'
            largura_mm = 297
            altura_mm = 210

    # 3. Load EmpresaConfig
    empresa_obj = models.EmpresaConfig.objects.using(db_alias).exclude(cpf_cnpj='').first() or models.EmpresaConfig.objects.using(db_alias).first()
    
    logo_url = empresa_obj.logo_url if (empresa_obj and empresa_obj.logo_url) else ''
    if logo_url:
        if not logo_url.startswith('http'):
            if logo_url.startswith('media/'):
                logo_url = '/' + logo_url
            elif logo_url.startswith('/media/'):
                pass
            else:
                if logo_url.startswith('/logos/'):
                    pass
                elif logo_url.startswith('logos/'):
                    logo_url = '/' + logo_url
                else:
                    logo_url = '/logos/' + logo_url.lstrip('/')
            logo_url = request.build_absolute_uri(logo_url)
    else:
        logo_url = 'https://central.aperus.com.br/static/logo.png'

    empresa_data = {
        'empresa.logomarca': logo_url,
        'empresa.razao_social': empresa_obj.nome_razao_social if empresa_obj else 'Aperus Tec Informática S.A.',
        'empresa.nome_fantasia': empresa_obj.nome_fantasia if empresa_obj else 'Sistema Aperus Central',
        'empresa.cnpj': empresa_obj.cpf_cnpj if empresa_obj else '99.888.777/0001-66',
        'empresa.inscricao_estadual': empresa_obj.inscricao_estadual if empresa_obj else '',
        'empresa.telefone': empresa_obj.telefone if empresa_obj else '',
        'empresa.email': empresa_obj.email if empresa_obj else '',
        'empresa.endereco': f"{empresa_obj.endereco or ''}, {empresa_obj.numero or ''} - {empresa_obj.bairro or ''}, {empresa_obj.cidade or ''} - {empresa_obj.estado or ''}" if empresa_obj else '',
        'empresa.cep': empresa_obj.cep if empresa_obj else ''
    }

    # 4. Fetch list of data records based on report type
    records_data = []

    is_sales_report = False
    is_os_report = False
    
    # Check elements list
    elements_to_check = []
    if isinstance(layout_json, dict) and 'elementos' in layout_json:
        elements_to_check = layout_json['elementos']
    elif isinstance(layout_json, list):
        elements_to_check = layout_json
        
    if nome_relatorio in ['venda_recibo', 'relatorio_vendas']:
        is_sales_report = True
    elif nome_relatorio in ['etiqueta_gondola', 'relatorio_inventario']:
        is_sales_report = False
    elif nome_relatorio and any(kw in str(nome_relatorio).lower() for kw in ['ordem_servico', 'os']):
        is_os_report = True
    else:
        if any(
            str(el.get('campo_origem', '')).startswith('venda.') or 
            str(el.get('campo_origem', '')).startswith('cliente.')
            for el in elements_to_check
        ):
            is_sales_report = True
            
        if any(
            str(el.get('campo_origem', '')).startswith('os.') or
            str(el.get('campo_origem', '')).startswith('veiculo.') or
            str(el.get('campo_origem', '')).startswith('equipamento.') or
            str(el.get('campo_origem', '')).startswith('animal.') or
            str(el.get('campo_origem', '')).startswith('pet.')
            for el in elements_to_check
        ):
            is_os_report = True

    if is_os_report:
        # Fetch OrdemServico
        qs = models.OrdemServico.objects.using(db_alias).all().select_related('id_cliente', 'id_tecnico', 'id_status')
        
        # Apply filters
        os_id = request.query_params.get('os')
        if os_id:
            qs = qs.filter(id_os=os_id)
            
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        if data_inicio:
            qs = qs.filter(data_abertura__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data_abertura__lte=data_fim)
            
        cliente_id = request.query_params.get('cliente')
        if cliente_id:
            qs = qs.filter(id_cliente=cliente_id)
            
        tecnico_id = request.query_params.get('tecnico')
        if tecnico_id:
            qs = qs.filter(id_tecnico=tecnico_id)
            
        status_id = request.query_params.get('status')
        if status_id:
            qs = qs.filter(id_status=status_id)

        # Build list of dicts
        for os_rec in qs:
            veiculo = None
            if os_rec.id_veiculo:
                try:
                    veiculo = models.Veiculo.objects.using(db_alias).filter(id_veiculo=os_rec.id_veiculo).first()
                except Exception:
                    pass
            
            equipamento = None
            if os_rec.id_equipamento:
                try:
                    equipamento = models.Equipamento.objects.using(db_alias).filter(id_equipamento=os_rec.id_equipamento).first()
                except Exception:
                    pass
                    
            pet = None
            if os_rec.id_animal:
                try:
                    pet = models.Pet.objects.using(db_alias).filter(id_pet=os_rec.id_animal).first()
                except Exception:
                    pass
            
            total_prod = os_rec.valor_total_produtos or 0
            total_serv = os_rec.valor_total_servicos or 0
            desc = os_rec.valor_desconto or 0
            total_os = os_rec.valor_total_os or 0
            
            os_dict = {
                **empresa_data,
                
                # Cliente
                'cliente.nome': os_rec.id_cliente.nome_razao_social if os_rec.id_cliente else '',
                'cliente.doc': os_rec.id_cliente.cpf_cnpj if os_rec.id_cliente else '',
                'cliente.rg_ie': os_rec.id_cliente.inscricao_estadual if os_rec.id_cliente else '',
                'cliente.telefone': os_rec.id_cliente.telefone or (os_rec.id_cliente.whatsapp if os_rec.id_cliente else '') or '',
                'cliente.email': os_rec.id_cliente.email if os_rec.id_cliente else '',
                'cliente.endereco': os_rec.id_cliente.endereco if os_rec.id_cliente else '',
                'cliente.bairro': os_rec.id_cliente.bairro if os_rec.id_cliente else '',
                'cliente.cidade': os_rec.id_cliente.cidade if os_rec.id_cliente else '',
                'cliente.uf': os_rec.id_cliente.estado if os_rec.id_cliente else '',
                'cliente.cep': os_rec.id_cliente.cep if os_rec.id_cliente else '',
                'cliente.complemento': '',

                # OS
                'os.numero': str(os_rec.id_os),
                'os.data_abertura': os_rec.data_abertura.strftime('%d/%m/%Y %H:%M') if os_rec.data_abertura else '',
                'os.data_previsao': os_rec.data_finalizacao.strftime('%d/%m/%Y') if os_rec.data_finalizacao else '',
                'os.data_fechamento': os_rec.data_finalizacao.strftime('%d/%m/%Y') if os_rec.data_finalizacao else '',
                'os.status': os_rec.id_status.nome_status if os_rec.id_status else (os_rec.status_os or ''),
                'os.tecnico': os_rec.id_tecnico.nome if os_rec.id_tecnico else '',
                'os.defeitos': os_rec.descricao_problema or '',
                'os.laudo_tecnico': os_rec.laudo_tecnico or '',
                'os.observacoes': '',
                'os.solicitante': os_rec.solicitante or '',
                'os.total_produtos': f"R$ {total_prod:.2f}".replace('.', ','),
                'os.total_servicos': f"R$ {total_serv:.2f}".replace('.', ','),
                'os.desconto': f"R$ {desc:.2f}".replace('.', ','),
                'os.subtotal': f"R$ {(total_prod + total_serv):.2f}".replace('.', ','),
                'os.total_geral': f"R$ {total_os:.2f}".replace('.', ','),
                'os.frete': 'R$ 0,00',
                
                # Veículo
                'veiculo.placa': veiculo.placa if veiculo else '',
                'veiculo.marca': veiculo.marca if veiculo else '',
                'veiculo.modelo': veiculo.modelo if veiculo else '',
                'veiculo.ano': str(veiculo.ano) if veiculo and veiculo.ano else '',
                'veiculo.cor': veiculo.cor if veiculo else '',
                'veiculo.chassi': veiculo.chassi if veiculo else '',
                'veiculo.uf': veiculo.uf if veiculo else '',
                'veiculo.observacoes': veiculo.observacoes if veiculo else '',
                
                # Equipamento
                'equipamento.codigo': equipamento.codigo if equipamento else '',
                'equipamento.nome': equipamento.nome if equipamento else '',
                'equipamento.descricao': equipamento.descricao if equipamento else '',
                'equipamento.categoria': equipamento.categoria if equipamento else '',
                'equipamento.marca': equipamento.marca if equipamento else '',
                'equipamento.modelo': equipamento.modelo if equipamento else '',
                'equipamento.numero_serie': equipamento.numero_serie if equipamento else '',
                'equipamento.status': equipamento.status if equipamento else '',
                'equipamento.observacoes': equipamento.observacoes if equipamento else '',
                
                # Animal / Pet
                'animal.nome': pet.nome_pet if pet else '',
                'animal.raca': pet.raca if pet else '',
                'animal.sexo': pet.sexo if pet else '',
                'animal.idade': '',
                'animal.peso': f"{pet.peso} kg" if pet and pet.peso else '',
                'animal.cor': pet.cor if pet else '',
                'animal.pelagem': '',
                'animal.observacoes': pet.observacoes if pet else '',

                'pet.nome': pet.nome_pet if pet else '',
                'pet.raca': pet.raca if pet else '',
                'pet.sexo': pet.sexo if pet else '',
                'pet.peso': f"{pet.peso} kg" if pet and pet.peso else '',
                'pet.cor': pet.cor if pet else '',
                'pet.observacoes': pet.observacoes if pet else '',
            }

            itens_list = []
            try:
                os_produtos = models.OsItensProduto.objects.using(db_alias).filter(id_os=os_rec).select_related('id_produto')
                for item in os_produtos:
                    prod_data = {
                        'produto.codigo': item.id_produto.codigo_produto if item.id_produto else '',
                        'produto.descricao': item.id_produto.nome_produto or item.id_produto.descricao if item.id_produto else '',
                        'produto.valor_unit': f"R$ {item.valor_unitario:.2f}".replace('.', ','),
                        'produto.quantidade': str(item.quantidade),
                        'produto.subtotal': f"R$ {item.valor_total:.2f}".replace('.', ','),
                        'produto.codigo_barras': item.id_produto.gtin or item.id_produto.codigo_produto if item.id_produto else '',
                        'produto.unidade': item.id_produto.unidade_medida if item.id_produto else '',
                        'produto.ncm': item.id_produto.ncm if item.id_produto else '',
                        'produto.grupo': item.id_produto.id_grupo.nome_grupo if (item.id_produto and item.id_produto.id_grupo) else '',
                        'produto.marca': item.id_produto.marca if item.id_produto else '',
                    }
                    itens_list.append(prod_data)
            except Exception:
                pass
                
            try:
                os_servicos = models.OsItensServico.objects.using(db_alias).filter(id_os=os_rec)
                for item in os_servicos:
                    srv_data = {
                        'produto.codigo': 'SERV',
                        'produto.descricao': item.descricao_servico or 'Prestação de Serviço',
                        'produto.valor_unit': f"R$ {item.valor_unitario:.2f}".replace('.', ','),
                        'produto.quantidade': str(item.quantidade),
                        'produto.subtotal': f"R$ {item.valor_total:.2f}".replace('.', ','),
                        'produto.codigo_barras': '',
                        'produto.unidade': 'UN',
                        'produto.ncm': '',
                        'produto.grupo': 'Serviços',
                        'produto.marca': '',
                    }
                    itens_list.append(srv_data)
            except Exception:
                pass
                
            os_dict['itens'] = itens_list
            records_data.append(os_dict)

    elif is_sales_report:
        # Fetch Vendas
        qs = models.Venda.objects.using(db_alias).all().select_related('id_cliente')
        
        # Apply filters
        venda_id = request.query_params.get('venda')
        if venda_id:
            qs = qs.filter(id_venda=venda_id)
            
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        if data_inicio:
            qs = qs.filter(data_documento__gte=data_inicio)
        if data_fim:
            qs = qs.filter(data_documento__lte=data_fim)
            
        cliente_id = request.query_params.get('cliente')
        if cliente_id:
            qs = qs.filter(id_cliente=cliente_id)
            
        vendedor_id = request.query_params.get('vendedor')
        if vendedor_id:
            qs = qs.filter(id_vendedor1=vendedor_id)
            
        status_venda = request.query_params.get('status')
        if status_venda:
            qs = qs.filter(status_pagamento=status_venda)

        # Apply ordering
        ordenacao = request.query_params.get('ordenacao')
        if ordenacao == 'documento':
            from django.db.models import Case, When, F, CharField
            from django.db.models.functions import Length, Cast
            qs = qs.annotate(
                doc_display=Case(
                    When(numero_documento__isnull=False, numero_documento__gt='', then=F('numero_documento')),
                    default=Cast('id_venda', CharField()),
                    output_field=CharField()
                )
            ).order_by(Length('doc_display').asc(), 'doc_display')
        else:
            sort_map = {
                'data': 'data_documento',
                'cliente': 'id_cliente__nome_razao_social',
                'total': 'valor_total'
            }
            sort_field = sort_map.get(ordenacao, 'id_venda')
            qs = qs.order_by(sort_field)

        # Build list of dicts
        elements_to_check = []
        if isinstance(layout_json, dict) and 'elementos' in layout_json:
            elements_to_check = layout_json['elementos']
        elif isinstance(layout_json, list):
            elements_to_check = layout_json
            
        tem_campos_produto = any(str(el.get('campo_origem', '')).startswith('produto.') for el in elements_to_check)

        for venda in qs:
            # Get payment form
            financeiro = models.FinanceiroConta.objects.using(db_alias).filter(id_venda_origem=venda.id_venda).first()
            forma_pagamento = financeiro.forma_pagamento if financeiro else ''

            venda_dict = {
                **empresa_data,
                'cliente.nome': venda.id_cliente.nome_razao_social if venda.id_cliente else '',
                'cliente.doc': venda.id_cliente.cpf_cnpj if venda.id_cliente else '',
                'cliente.rg_ie': venda.id_cliente.inscricao_estadual if venda.id_cliente else '',
                'cliente.telefone': venda.id_cliente.telefone or (venda.id_cliente.whatsapp if venda.id_cliente else '') or '',
                'cliente.email': venda.id_cliente.email if venda.id_cliente else '',
                'cliente.endereco': venda.id_cliente.endereco if venda.id_cliente else '',
                'cliente.bairro': venda.id_cliente.bairro if venda.id_cliente else '',
                'cliente.cidade': venda.id_cliente.cidade if venda.id_cliente else '',
                'cliente.uf': venda.id_cliente.estado if venda.id_cliente else '',
                'cliente.cep': venda.id_cliente.cep if venda.id_cliente else '',
                'cliente.complemento': '',

                'venda.numero': venda.numero_documento or str(venda.id_venda),
                'venda.data': venda.data_documento.strftime('%d/%m/%Y') if venda.data_documento else '',
                'venda.total': f"R$ {venda.valor_total:.2f}".replace('.', ','),
                'venda.subtotal': f"R$ {(venda.valor_total + (venda.valor_desconto or 0)):.2f}".replace('.', ','),
                'venda.desconto': f"R$ {(venda.valor_desconto or 0):.2f}".replace('.', ','),
                'venda.frete': f"R$ {(venda.taxa_entrega or 0):.2f}".replace('.', ','),
                'venda.total_geral': f"R$ {venda.valor_total:.2f}".replace('.', ','),
                'venda.total_desconto': f"R$ {(venda.valor_desconto or 0):.2f}".replace('.', ','),
                'venda.total_frete': f"R$ {(venda.taxa_entrega or 0):.2f}".replace('.', ','),
                'venda.forma_pagamento': forma_pagamento
            }

            if tem_campos_produto:
                # Loop items of the sale
                itens = models.VendaItem.objects.using(db_alias).filter(id_venda=venda).select_related('id_produto')
                itens_list = []
                for item in itens:
                    item_data = {
                        'produto.codigo': item.id_produto.codigo_produto if item.id_produto else '',
                        'produto.descricao': item.id_produto.nome_produto or item.id_produto.descricao if item.id_produto else '',
                        'produto.valor_unit': f"R$ {item.valor_unitario:.2f}".replace('.', ','),
                        'produto.quantidade': str(item.quantidade),
                        'produto.subtotal': f"R$ {item.valor_total:.2f}".replace('.', ','),
                        'produto.codigo_barras': item.id_produto.gtin or item.id_produto.codigo_produto if item.id_produto else '',
                        'produto.unidade': item.id_produto.unidade_medida if item.id_produto else '',
                        'produto.ncm': item.id_produto.ncm if item.id_produto else '',
                        'produto.grupo': item.id_produto.id_grupo.nome_grupo if (item.id_produto and item.id_produto.id_grupo) else '',
                        'produto.marca': item.id_produto.marca if item.id_produto else '',
                        'produto.preco_custo': '',
                        'produto.peso_liquido': f"{item.id_produto.peso_unitario} kg" if (item.id_produto and item.id_produto.peso_unitario) else '',
                        'produto.peso_bruto': ''
                    }
                    itens_list.append(item_data)
                
                venda_dict['itens'] = itens_list
                records_data.append(venda_dict)
            else:
                records_data.append(venda_dict)

    else:
        # Fetch Produtos
        qs = models.Produto.objects.using(db_alias).all().select_related('id_grupo')

        # Apply filters
        grupo_id = request.query_params.get('grupo')
        if grupo_id:
            qs = qs.filter(id_grupo=grupo_id)

        marca = request.query_params.get('marca')
        if marca:
            qs = qs.filter(marca=marca)

        produto_id = request.query_params.get('produto')
        if produto_id:
            qs = qs.filter(id_produto=produto_id)

        # Apply ordering
        ordenacao = request.query_params.get('ordenacao')
        sort_map = {
            'codigo': 'codigo_produto',
            'descricao': 'nome_produto',
            'grupo': 'id_grupo__nome_grupo',
            'marca': 'marca'
        }
        sort_field = sort_map.get(ordenacao, 'id_produto')
        qs = qs.order_by(sort_field)

        for prod in qs:
            # Get inventory quantity
            qty_total = models.Estoque.objects.using(db_alias).filter(id_produto=prod).aggregate(total=Sum('quantidade'))['total'] or 0
            
            prod_dict = {
                **empresa_data,
                'produto.codigo': prod.codigo_produto,
                'produto.descricao': prod.nome_produto or prod.descricao or '',
                'produto.valor_unit': f"R$ {prod.preco_web:.2f}".replace('.', ',') if prod.preco_web is not None else 'R$ 0,00',
                'produto.quantidade': str(qty_total),
                'produto.subtotal': '',
                'produto.codigo_barras': prod.gtin or prod.codigo_produto,
                'produto.unidade': prod.unidade_medida or '',
                'produto.ncm': prod.ncm or '',
                'produto.grupo': prod.id_grupo.nome_grupo if prod.id_grupo else '',
                'produto.marca': prod.marca or '',
                'produto.preco_custo': '',
                'produto.peso_liquido': f"{prod.peso_unitario} kg" if prod.peso_unitario else '',
                'produto.peso_bruto': ''
            }
            records_data.append(prod_dict)

    # Helper function for layout migration
    def get_banded_layout(layout):
        if not layout:
            return {
                'configuracao_faixas': {'header_height': 120, 'detail_height': 40, 'summary_height': 60, 'footer_height': 80},
                'elementos': []
            }
        if isinstance(layout, dict) and 'configuracao_faixas' in layout and 'elementos' in layout:
            return layout
            
        def infer_section(el):
            sec = el.get('secao')
            if sec in ['header', 'detail', 'summary', 'footer']:
                return sec
            chave = el.get('campo_origem', '')
            if chave.startswith('produto.') or chave in ['venda.itens_tabela', 'os.itens_tabela']:
                return 'detail'
            if chave in ['venda.total', 'venda.subtotal', 'venda.desconto', 'venda.forma_pagamento',
                         'os.total_produtos', 'os.total_servicos', 'os.desconto', 'os.subtotal', 'os.total_geral']:
                return 'summary'
            if (chave.startswith('empresa.') or chave.startswith('cliente.') or 
                chave in ['venda.numero', 'venda.data'] or 
                chave.startswith('os.') or chave.startswith('veiculo.') or 
                chave.startswith('equipamento.') or chave.startswith('animal.') or 
                chave.startswith('pet.')):
                return 'header'
            return 'header'

        grouped = {'header': [], 'detail': [], 'summary': [], 'footer': []}
        for el in layout:
            sec = infer_section(el)
            grouped[sec].append(el)

        configuracao_faixas = {
            'header_height': 120,
            'detail_height': 40,
            'summary_height': 60,
            'footer_height': 80
        }

        elementos_novos = []

        for sec in ['header', 'detail', 'summary', 'footer']:
            els = grouped[sec]
            if not els:
                continue
            min_y = min([e.get('y', 0) for e in els])
            for el in els:
                rel_y = max(0, el.get('y', 0) - min_y)
                el_copy = dict(el)
                el_copy['secao'] = sec
                el_copy['y'] = rel_y
                elementos_novos.append(el_copy)

            max_rel_y_with_height = max([(e.get('y', 0) - min_y) + (e.get('altura') if e.get('altura') is not None else 30) for e in els])
            default_height = 120 if sec == 'header' else (40 if sec == 'detail' else (60 if sec == 'summary' else 80))
            configuracao_faixas[f'{sec}_height'] = max(default_height, max_rel_y_with_height + 10)

        return {
            'configuracao_faixas': configuracao_faixas,
            'elementos': elementos_novos
        }

    # 5. Build HTML output
    if tipo_gabarito == 'A4_RETRATO':
        size_css = "A4 portrait"
        width_css = "210mm"
        height_css = "297mm"
    elif tipo_gabarito == 'A4_PAISAGEM':
        size_css = "A4 landscape"
        width_css = "297mm"
        height_css = "210mm"
    elif tipo_gabarito == 'RECIBO':
        size_css = "80mm auto"
        width_css = "80mm"
        height_css = "auto"
    else:
        width_css = f"{largura_mm}mm"
        height_css = f"{altura_mm}mm" if altura_mm > 0 else "auto"
        size_css = f"{width_css} {height_css}"

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Aperus Custom Report</title>
    <style>
        @page {{
            size: {size_css};
            margin: 0;
        }}
        html, body {{
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
        }}
        .gabarito-container {{
            position: relative;
            width: {width_css};
            min-height: {height_css};
            box-sizing: border-box;
            overflow: visible;
            page-break-after: always;
        }}
        .gabarito-container:last-of-type {{
            page-break-after: avoid;
        }}
        .band {{
            position: relative;
            width: 100%;
            overflow: visible;
            box-sizing: border-box;
        }}
        .elemento-impressao {{
            position: absolute;
            box-sizing: border-box;
            white-space: normal;
            word-break: break-word;
        }}
        @media print {{
            .page-break {{
                page-break-inside: avoid;
            }}
            .no-print {{
                display: none !important;
            }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="position: fixed; top: 15px; right: 15px; z-index: 99999;">
        <button onclick="window.print()" style="background-color: #2e7d32; color: white; border: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 8px; font-family: Arial, sans-serif;">
            🖨️ Imprimir / Salvar PDF
        </button>
    </div>
"""

    if not records_data:
        html += f"""
    <div style="padding: 20px; font-family: sans-serif; color: #666; text-align: center;">
        Nenhum registro encontrado para os filtros selecionados.
    </div>
"""
    else:
        # Determine if this is a listing report or a single master-detail doc
        is_listing_report = True
        if tipo_gabarito in ['ETIQUETA', 'RECIBO']:
            is_listing_report = False
        elif is_sales_report and tem_campos_produto:
            is_listing_report = False
        elif is_os_report and (request.query_params.get('os') or tem_campos_produto):
            is_listing_report = False

        if is_listing_report:
            banded = get_banded_layout(layout_json)
            alturas = banded['configuracao_faixas']
            elementos = banded['elementos']
            
            header_elements = [el for el in elementos if el.get('secao') == 'header']
            detail_elements = [el for el in elementos if el.get('secao') == 'detail']
            summary_elements = [el for el in elementos if el.get('secao') == 'summary']
            footer_elements = [el for el in elementos if el.get('secao') == 'footer']
            
            def render_band_elements(elements_list, data_context, item_context=None):
                band_html = ""
                for el in elements_list:
                    chave_campo = el.get('campo_origem', '')
                    is_shape = chave_campo.startswith('forma.')
                    is_table = (chave_campo in ['venda.itens_tabela', 'os.itens_tabela'])
                    
                    x = el.get('x', 0)
                    y = el.get('y', 0)
                    bold = el.get('bold', False)
                    color = el.get('color', '#000000') or '#000000'
                    altura = el.get('altura')
                    largura = el.get('largura', 150)
                    font_size = el.get('font_size', 12) or 12
                    
                    font_weight_css = "font-weight: bold;" if bold else ""
                    color_css = f"color: {color};"
                    
                    if is_table:
                        itens_list = data_context.get('itens', []) if (is_sales_report or is_os_report) else []
                        if not (is_sales_report or is_os_report):
                            itens_list = [{
                                'produto.codigo': data_context.get('produto.codigo', ''),
                                'produto.descricao': data_context.get('produto.descricao', ''),
                                'produto.quantidade': data_context.get('produto.quantidade', ''),
                                'produto.valor_unit': data_context.get('produto.valor_unit', ''),
                                'produto.subtotal': data_context.get('produto.subtotal', '')
                            }]
                            
                        table_html = f'<table style="width: 100%; border-collapse: collapse; font-size: {font_size}px; color: {color};">'
                        table_html += f'<tr style="background-color: #f2f2f2; font-weight: bold; border: 1px solid #ccc;">'
                        table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Cód</th>'
                        table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Descrição</th>'
                        table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Qtd</th>'
                        table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">V.Unit</th>'
                        table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Total</th>'
                        table_html += f'</tr>'
                        
                        for it in itens_list:
                            table_html += f'<tr style="border: 1px solid #ccc;">'
                            table_html += f'<td style="border: 1px solid #ccc; padding: 4px;">{it.get("produto.codigo", "")}</td>'
                            table_html += f'<td style="border: 1px solid #ccc; padding: 4px;">{it.get("produto.descricao", "")}</td>'
                            table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.quantidade", "")}</td>'
                            table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.valor_unit", "")}</td>'
                            table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.subtotal", "")}</td>'
                            table_html += f'</tr>'
                        table_html += f'</table>'
                        
                        h_css = f"height: {altura}px;" if altura is not None else ""
                        band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css}">\n            {table_html}\n        </div>\n'
                        continue
                        
                    if chave_campo == 'forma.retangulo':
                        border_css = f"border: 1px solid {color};"
                        h_css = f"height: {altura}px;" if altura is not None else "height: 50px;"
                        band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {border_css}"></div>\n'
                        continue
                        
                    if chave_campo == 'forma.linha_h':
                        h_css = f"height: {altura}px;" if altura is not None else "height: 2px;"
                        bg_css = f"background-color: {color};"
                        band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {bg_css}"></div>\n'
                        continue
                    if chave_campo == 'forma.linha_v':
                        h_css = f"height: {altura}px;" if altura is not None else "height: 100px;"
                        bg_css = f"background-color: {color};"
                        band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {bg_css}"></div>\n'
                        continue
                        
                    if item_context and chave_campo.startswith('produto.'):
                        valor_real = item_context.get(chave_campo, '')
                    elif chave_campo == 'texto.livre':
                        valor_real = el.get('valor_customizado', '')
                        if valor_real:
                            valor_real = str(valor_real).replace('\n', '<br />')
                    else:
                        valor_real = data_context.get(chave_campo, '')
                        
                    if valor_real is None:
                        valor_real = ''
                        
                    if chave_campo and any(kw in chave_campo for kw in ['logomarca', 'logo', 'imagem']):
                        conteudo = f'<img src="{valor_real}" style="max-width: 100%; height: auto; display: block;" />' if valor_real else ''
                    else:
                        conteudo = valor_real
                        
                    band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; font-size: {font_size}px; width: {largura}px; {font_weight_css} {color_css}">\n            {conteudo}\n        </div>\n'
                return band_html

            container_style = f"position: relative; width: {width_css}; min-height: {height_css}; box-sizing: border-box; overflow: visible; page-break-after: always;"
            if tipo_gabarito not in ['A4_RETRATO', 'A4_PAISAGEM', 'RECIBO']:
                container_style = f"position: relative; width: {width_css}; height: {height_css}; box-sizing: border-box; overflow: hidden; page-break-after: always;"
                
            html += f'    <div class="gabarito-container" style="{container_style}">\n'
            
            first_data = records_data[0] if records_data else {}
            html += f'        <div class="band" style="height: {alturas.get("header_height", 120)}px;">\n'
            html += render_band_elements(header_elements, data_context=first_data)
            html += f'        </div>\n'
            
            detail_h = alturas.get("detail_height", 40)
            for data in records_data:
                html += f'        <div class="band page-break" style="height: {detail_h}px;">\n'
                html += render_band_elements(detail_elements, data_context=data)
                html += f'        </div>\n'
                
            summary_context = dict(first_data)
            if is_sales_report:
                total_sum = 0.0
                subtotal_sum = 0.0
                desconto_sum = 0.0
                frete_sum = 0.0
                for data in records_data:
                    def parse_money(val):
                        if not val: return 0.0
                        cleaned = re.sub(r'[^\d,.-]', '', str(val)).replace(',', '.')
                        try:
                            return float(cleaned)
                        except ValueError:
                            return 0.0
                    total_sum += parse_money(data.get('venda.total', '0'))
                    subtotal_sum += parse_money(data.get('venda.subtotal', '0'))
                    desconto_sum += parse_money(data.get('venda.desconto', '0'))
                    frete_sum += parse_money(data.get('venda.frete', '0'))
                summary_context['venda.total'] = f"R$ {total_sum:.2f}".replace('.', ',')
                summary_context['venda.subtotal'] = f"R$ {subtotal_sum:.2f}".replace('.', ',')
                summary_context['venda.desconto'] = f"R$ {desconto_sum:.2f}".replace('.', ',')
                summary_context['venda.frete'] = f"R$ {frete_sum:.2f}".replace('.', ',')
                summary_context['venda.total_geral'] = f"R$ {total_sum:.2f}".replace('.', ',')
                summary_context['venda.total_desconto'] = f"R$ {desconto_sum:.2f}".replace('.', ',')
                summary_context['venda.total_frete'] = f"R$ {frete_sum:.2f}".replace('.', ',')
            elif is_os_report:
                total_prod_sum = 0.0
                total_serv_sum = 0.0
                desconto_sum = 0.0
                subtotal_sum = 0.0
                total_os_sum = 0.0
                for data in records_data:
                    def parse_money(val):
                        if not val: return 0.0
                        cleaned = re.sub(r'[^\d,.-]', '', str(val)).replace(',', '.')
                        try:
                            return float(cleaned)
                        except ValueError:
                            return 0.0
                    total_prod_sum += parse_money(data.get('os.total_produtos', '0'))
                    total_serv_sum += parse_money(data.get('os.total_servicos', '0'))
                    desconto_sum += parse_money(data.get('os.desconto', '0'))
                    subtotal_sum += parse_money(data.get('os.subtotal', '0'))
                    total_os_sum += parse_money(data.get('os.total_geral', '0'))
                summary_context['os.total_produtos'] = f"R$ {total_prod_sum:.2f}".replace('.', ',')
                summary_context['os.total_servicos'] = f"R$ {total_serv_sum:.2f}".replace('.', ',')
                summary_context['os.desconto'] = f"R$ {desconto_sum:.2f}".replace('.', ',')
                summary_context['os.subtotal'] = f"R$ {subtotal_sum:.2f}".replace('.', ',')
                summary_context['os.total_geral'] = f"R$ {total_os_sum:.2f}".replace('.', ',')
                
            html += f'        <div class="band" style="height: {alturas.get("summary_height", 60)}px;">\n'
            html += render_band_elements(summary_elements, data_context=summary_context)
            html += f'        </div>\n'
            
            html += f'        <div class="band" style="height: {alturas.get("footer_height", 80)}px;">\n'
            html += render_band_elements(footer_elements, data_context=summary_context)
            html += f'        </div>\n'
            
            html += f'    </div>\n'
            
        else:
            for data in records_data:
                banded = get_banded_layout(layout_json)
                alturas = banded['configuracao_faixas']
                elementos = banded['elementos']
                
                header_elements = [el for el in elementos if el.get('secao') == 'header']
                detail_elements = [el for el in elementos if el.get('secao') == 'detail']
                summary_elements = [el for el in elementos if el.get('secao') == 'summary']
                footer_elements = [el for el in elementos if el.get('secao') == 'footer']
                
                table_element = next((el for el in detail_elements if el.get('campo_origem') in ['venda.itens_tabela', 'os.itens_tabela']), None)
                
                itens = data.get('itens')
                num_items = len(itens) if (itens is not None) else 0
                
                table_growth = 0
                if table_element:
                    designed_altura = table_element.get('altura', 150)
                    font_size = table_element.get('font_size', 11) or 11
                    row_height = max(20, int(font_size * 1.5))
                    header_height = 25
                    actual_height = header_height + num_items * row_height
                    table_growth = max(0, actual_height - designed_altura)
                    
                def render_band_elements(elements_list, item_context=None):
                    band_html = ""
                    for el in elements_list:
                        chave_campo = el.get('campo_origem', '')
                        is_shape = chave_campo.startswith('forma.')
                        is_table = (chave_campo in ['venda.itens_tabela', 'os.itens_tabela'])
                        
                        x = el.get('x', 0)
                        y = el.get('y', 0)
                        bold = el.get('bold', False)
                        color = el.get('color', '#000000') or '#000000'
                        altura = el.get('altura')
                        largura = el.get('largura', 150)
                        font_size = el.get('font_size', 12) or 12
                        
                        font_weight_css = "font-weight: bold;" if bold else ""
                        color_css = f"color: {color};"
                        
                        if is_table:
                            itens_list = data.get('itens', []) if (is_sales_report or is_os_report) else []
                            if not (is_sales_report or is_os_report):
                                itens_list = [{
                                    'produto.codigo': data.get('produto.codigo', ''),
                                    'produto.descricao': data.get('produto.descricao', ''),
                                    'produto.quantidade': data.get('produto.quantidade', ''),
                                    'produto.valor_unit': data.get('produto.valor_unit', ''),
                                    'produto.subtotal': data.get('produto.subtotal', '')
                                }]
                                
                            table_html = f'<table style="width: 100%; border-collapse: collapse; font-size: {font_size}px; color: {color};">'
                            table_html += f'<tr style="background-color: #f2f2f2; font-weight: bold; border: 1px solid #ccc;">'
                            table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Cód</th>'
                            table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: left;">Descrição</th>'
                            table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Qtd</th>'
                            table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">V.Unit</th>'
                            table_html += f'<th style="border: 1px solid #ccc; padding: 4px; text-align: right;">Total</th>'
                            table_html += f'</tr>'
                            
                            for it in itens_list:
                                table_html += f'<tr style="border: 1px solid #ccc;">'
                                table_html += f'<td style="border: 1px solid #ccc; padding: 4px;">{it.get("produto.codigo", "")}</td>'
                                table_html += f'<td style="border: 1px solid #ccc; padding: 4px;">{it.get("produto.descricao", "")}</td>'
                                table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.quantidade", "")}</td>'
                                table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.valor_unit", "")}</td>'
                                table_html += f'<td style="border: 1px solid #ccc; padding: 4px; text-align: right;">{it.get("produto.subtotal", "")}</td>'
                                table_html += f'</tr>'
                            table_html += f'</table>'
                            
                            h_css = f"height: {altura}px;" if altura is not None else ""
                            band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css}">\n            {table_html}\n        </div>\n'
                            continue
                            
                        if chave_campo == 'forma.retangulo':
                            border_css = f"border: 1px solid {color};"
                            h_css = f"height: {altura}px;" if altura is not None else "height: 50px;"
                            band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {border_css}"></div>\n'
                            continue
                            
                        if chave_campo == 'forma.linha_h':
                            h_css = f"height: {altura}px;" if altura is not None else "height: 2px;"
                            bg_css = f"background-color: {color};"
                            band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {bg_css}"></div>\n'
                            continue
                        if chave_campo == 'forma.linha_v':
                            h_css = f"height: {altura}px;" if altura is not None else "height: 100px;"
                            bg_css = f"background-color: {color};"
                            band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; width: {largura}px; {h_css} {bg_css}"></div>\n'
                            continue
                            
                        if item_context and chave_campo.startswith('produto.'):
                            valor_real = item_context.get(chave_campo, '')
                        elif chave_campo == 'texto.livre':
                            valor_real = el.get('valor_customizado', '')
                            if valor_real:
                                valor_real = str(valor_real).replace('\n', '<br />')
                        else:
                            valor_real = data.get(chave_campo, '')
                            
                        if valor_real is None:
                            valor_real = ''
                            
                        if chave_campo and any(kw in chave_campo for kw in ['logomarca', 'logo', 'imagem']):
                            conteudo = f'<img src="{valor_real}" style="max-width: 100%; height: auto; display: block;" />' if valor_real else ''
                        else:
                            conteudo = valor_real
                            
                        band_html += f'        <div class="elemento-impressao" style="left: {x}px; top: {y}px; font-size: {font_size}px; width: {largura}px; {font_weight_css} {color_css}">\n            {conteudo}\n        </div>\n'
                    return band_html

                container_style = f"position: relative; width: {width_css}; min-height: {height_css}; box-sizing: border-box; overflow: visible; page-break-after: always;"
                if tipo_gabarito not in ['A4_RETRATO', 'A4_PAISAGEM', 'RECIBO']:
                    container_style = f"position: relative; width: {width_css}; height: {height_css}; box-sizing: border-box; overflow: hidden; page-break-after: always;"
                    
                html += f'    <div class="gabarito-container" style="{container_style}">\n'
                
                html += f'        <div class="band" style="height: {alturas.get("header_height", 120)}px;">\n'
                html += render_band_elements(header_elements)
                html += f'        </div>\n'
                
                if detail_elements:
                    if table_element:
                        detail_h = alturas.get("detail_height", 40) + table_growth
                        html += f'        <div class="band" style="height: {detail_h}px;">\n'
                        html += render_band_elements(detail_elements)
                        html += f'        </div>\n'
                    else:
                        detail_h = alturas.get("detail_height", 40)
                        if itens:
                            for item in itens:
                                html += f'        <div class="band page-break" style="height: {detail_h}px;">\n'
                                html += render_band_elements(detail_elements, item_context=item)
                                html += f'        </div>\n'
                        else:
                            html += f'        <div class="band" style="height: {detail_h}px;">\n'
                            html += render_band_elements(detail_elements)
                            html += f'        </div>\n'
                
                html += f'        <div class="band" style="height: {alturas.get("summary_height", 60)}px;">\n'
                html += render_band_elements(summary_elements)
                html += f'        </div>\n'
                
                html += f'        <div class="band" style="height: {alturas.get("footer_height", 80)}px;">\n'
                html += render_band_elements(footer_elements)
                html += f'        </div>\n'
                
                html += f'    </div>\n'

    html += """
</body>
</html>
"""
    return HttpResponse(html)


@api_view(['GET'])
@permission_classes([AllowAny])
def saas_listar_planos(request):
    """
    Retorna a lista de planos cadastrados na Central SaaS.
    Se for uma filial, encaminha para a Central Mãe.
    """
    is_central = models.EmpresaConfig.objects.filter(habilitar_central_saas=True).exists()
    
    if not is_central:
        from django.conf import settings
        import requests
        central_base = getattr(settings, 'SAAS_MOTHER_URL', None) or "http://localhost:8006"
        central_url = central_base.rstrip('/') + "/api/saas/planos/"
        try:
            r = requests.get(central_url, timeout=5)
            if r.status_code == 200:
                return Response(r.json(), status=200)
            return Response(r.json(), status=r.status_code)
        except Exception as e:
            return Response({'error': f"Falha ao conectar na Central: {str(e)}"}, status=502)

    planos = models.PlanoSaaS.objects.all().order_by('valor_mensalidade')
    data = [{
        'id': p.id,
        'nome': p.nome,
        'valor_mensalidade': str(p.valor_mensalidade),
        'modulo_pdv': p.modulo_pdv,
        'modulo_financeiro_avancado': p.modulo_financeiro_avancado,
        'modulo_producao_industria': p.modulo_producao_industria,
        'modulo_transporte_cte': p.modulo_transporte_cte,
        'modulo_ciot_automatico': p.modulo_ciot_automatico,
        'modulo_report_builder': p.modulo_report_builder,
    } for p in planos]
    return Response(data, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def saas_solicitar_upgrade(request):
    """
    Registra um pedido de upgrade de plano feito por uma filial local.
    Se for uma filial, encaminha para a Central Mãe.
    """
    cnpj = request.data.get('cnpj')
    plano_id = request.data.get('plano_id')
    
    if not cnpj or not plano_id:
        return Response({'error': 'CNPJ e ID do plano são obrigatórios.'}, status=400)
        
    import re
    cnpj_limpo = re.sub(r'\D', '', str(cnpj))
    
    is_central = models.EmpresaConfig.objects.filter(habilitar_central_saas=True).exists()
    
    if not is_central:
        from django.conf import settings
        import requests
        central_base = getattr(settings, 'SAAS_MOTHER_URL', None) or "http://localhost:8006"
        central_url = central_base.rstrip('/') + "/api/saas/solicitar-upgrade/"
        try:
            r = requests.post(central_url, json={'cnpj': cnpj_limpo, 'plano_id': plano_id}, timeout=5)
            if r.status_code == 200:
                return Response(r.json(), status=200)
            return Response(r.json(), status=r.status_code)
        except Exception as e:
            return Response({'error': f"Falha ao conectar na Central: {str(e)}"}, status=502)
            
    try:
        cliente = None
        for c in models.SaaSCliente.objects.all():
            if re.sub(r'\D', '', c.cnpj) == cnpj_limpo:
                cliente = c
                break
                
        if not cliente:
            return Response({'error': 'Cliente SaaS não localizado para este CNPJ.'}, status=404)
            
        plano = models.PlanoSaaS.objects.get(id=plano_id)
        cliente.upgrade_solicitado = plano
        cliente.save()
        
        return Response({'success': True, 'message': f'Solicitação de upgrade para o plano {plano.nome} registrada com sucesso.'}, status=200)
        
    except models.PlanoSaaS.DoesNotExist:
        return Response({'error': 'Plano não localizado.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def saas_aprovar_upgrade(request):
    """
    Aprova a solicitação de upgrade do cliente, aplicando o novo plano e atualizando a mensalidade.
    """
    cliente_id = request.data.get('cliente_id')
    if not cliente_id:
        return Response({'error': 'ID do cliente é obrigatório.'}, status=400)
        
    try:
        cliente = models.SaaSCliente.objects.get(id_saas_cliente=cliente_id)
        if not cliente.upgrade_solicitado:
            return Response({'error': 'Nenhuma solicitação de upgrade pendente para este cliente.'}, status=400)
            
        plano_novo = cliente.upgrade_solicitado
        cliente.plano = plano_novo
        cliente.valor_mensalidade = plano_novo.valor_mensalidade
        cliente.upgrade_solicitado = None
        cliente.save()
        
        return Response({
            'success': True,
            'message': f'Upgrade aprovado com sucesso! Cliente agora está no plano {plano_novo.nome}.',
            'novo_valor': str(cliente.valor_mensalidade)
        }, status=200)
        
    except models.SaaSCliente.DoesNotExist:
        return Response({'error': 'Cliente não localizado.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def saas_rejeitar_upgrade(request):
    """
    Rejeita a solicitação de upgrade do cliente, apenas limpando o campo upgrade_solicitado.
    """
    cliente_id = request.data.get('cliente_id')
    if not cliente_id:
        return Response({'error': 'ID do cliente é obrigatório.'}, status=400)
        
    try:
        cliente = models.SaaSCliente.objects.get(id_saas_cliente=cliente_id)
        cliente.upgrade_solicitado = None
        cliente.save()
        return Response({'success': True, 'message': 'Solicitação de upgrade rejeitada e limpa.'}, status=200)
    except models.SaaSCliente.DoesNotExist:
        return Response({'error': 'Cliente não localizado.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def saas_editar_plano(request, plano_id):
    """
    Edita os valores e recursos de um plano SaaS.
    """
    is_central = models.EmpresaConfig.objects.filter(habilitar_central_saas=True).exists()
    if not is_central:
        from django.conf import settings
        import requests
        central_base = getattr(settings, 'SAAS_MOTHER_URL', None) or "http://localhost:8006"
        central_url = central_base.rstrip('/') + f"/api/saas/planos/{plano_id}/editar/"
        try:
            headers = {}
            auth_header = request.headers.get('Authorization')
            if auth_header:
                headers['Authorization'] = auth_header
            r = requests.post(central_url, json=request.data, headers=headers, timeout=5)
            return Response(r.json(), status=r.status_code)
        except Exception as e:
            return Response({'error': f"Falha ao conectar na Central: {str(e)}"}, status=502)

    try:
        plano = models.PlanoSaaS.objects.get(id=plano_id)
        
        if 'valor_mensalidade' in request.data:
            plano.valor_mensalidade = request.data['valor_mensalidade']
        if 'modulo_pdv' in request.data:
            plano.modulo_pdv = bool(request.data['modulo_pdv'])
        if 'modulo_financeiro_avancado' in request.data:
            plano.modulo_financeiro_avancado = bool(request.data['modulo_financeiro_avancado'])
        if 'modulo_producao_industria' in request.data:
            plano.modulo_producao_industria = bool(request.data['modulo_producao_industria'])
        if 'modulo_transporte_cte' in request.data:
            plano.modulo_transporte_cte = bool(request.data['modulo_transporte_cte'])
        if 'modulo_ciot_automatico' in request.data:
            plano.modulo_ciot_automatico = bool(request.data['modulo_ciot_automatico'])
        if 'modulo_report_builder' in request.data:
            plano.modulo_report_builder = bool(request.data['modulo_report_builder'])
            
        plano.save()
        
        return Response({
            'success': True,
            'plano': {
                'id': plano.id,
                'nome': plano.nome,
                'valor_mensalidade': str(plano.valor_mensalidade),
                'modulo_pdv': plano.modulo_pdv,
                'modulo_financeiro_avancado': plano.modulo_financeiro_avancado,
                'modulo_producao_industria': plano.modulo_producao_industria,
                'modulo_transporte_cte': plano.modulo_transporte_cte,
                'modulo_ciot_automatico': plano.modulo_ciot_automatico,
                'modulo_report_builder': plano.modulo_report_builder,
            }
        }, status=200)
    except models.PlanoSaaS.DoesNotExist:
        return Response({'error': 'Plano não localizado.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
