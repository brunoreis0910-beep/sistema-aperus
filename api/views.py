# Em: C:\Projetos\SistemaGerencial\api\views.py

from rest_framework import viewsets, generics, permissions, filters, status
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
    UserPreferencia,
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

class FinanceiroContaViewSet(viewsets.ModelViewSet):
    queryset = FinanceiroConta.objects.all().order_by('-id_conta')  # Ordenar por ID decrescente (mais recentes primeiro)
    serializer_class = FinanceiroContaSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Desabilitar paginação para retornar todos os registros
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
        response = super().list(request, *args, **kwargs)
        contas = response.data if isinstance(response.data, list) else response.data.get('results', [])
        pagar = [c for c in contas if c.get('tipo_conta') == 'Pagar']
        receber = [c for c in contas if c.get('tipo_conta') == 'Receber']
        print(f'[FINANCEIRO_API] Total contas: {len(contas)} | A Pagar: {len(pagar)} | A Receber: {len(receber)}')
        if pagar:
            print(f'[FINANCEIRO_API] Primeiras contas a pagar: {[c.get("id_conta") for c in pagar[:3]]}')
        return response

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
        print(f"🔍 RETRIEVE Operacao ID {instance.id_operacao}:")
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
        
        logger.info(f'📦 Recebido request de ajuste: {request.data}')
        
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
            logger.info(f'✅ Ajuste concluído: {response_data}')
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f'❌ Erro ao processar ajuste: {str(e)}', exc_info=True)
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
                    print(f'✅ Dados via Gemini: {dados_veiculo}')
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
                        print(f'✅ Dados BrasilAPI: {dados_veiculo}')
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
                        print(f'✅ Dados FIPE API: {dados_veiculo}')
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
                        print(f'✅ Dados WD API: {dados_veiculo}')
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
            print(f"🔍 Consultando CNPJ {cnpj_limpo} na ReceitaWS...")
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
                    print(f"✅ CNPJ encontrado na ReceitaWS: {dados_empresa.get('razao_social')}")
                    
                    # ⚠️ IMPORTANTE: Se logradouro vier vazio, não considerar sucesso total
                    if not dados_empresa.get('logradouro'):
                        print(f"⚠️ ReceitaWS retornou sem endereço, tentando outra API...")
                        dados_empresa = None  # Força fallback
                else:
                    print(f"⚠️ ReceitaWS retornou ERROR: {data.get('message')}")
        except Exception as e:
            print(f"⚠️ Erro na ReceitaWS: {e}")
            erro_ultima_tentativa = str(e)

        # Tentativa 2: Brasil API (Fallback - rápido mas pode ter rate limit)
        if not dados_empresa:
            try:
                print(f"🔍 Consultando CNPJ {cnpj_limpo} na BrasilAPI...")
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
                    print(f"✅ CNPJ encontrado na BrasilAPI: {dados_empresa.get('razao_social')}")
                    
                    # Se logradouro vier vazio, tentar próxima API
                    if not dados_empresa.get('logradouro'):
                        print(f"⚠️ BrasilAPI retornou sem endereço, tentando Minha Receita...")
                        dados_empresa = None
            except Exception as e:
                print(f"⚠️ Erro na BrasilAPI: {e}")
                erro_ultima_tentativa = str(e)
        
        # Tentativa 3: Minha Receita (Outra API pública gratuita) - Fallback final
        if not dados_empresa:
            try:
                print(f"🔍 Consultando CNPJ {cnpj_limpo} na Minha Receita...")
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
                    print(f"✅ CNPJ encontrado na Minha Receita: {dados_empresa.get('razao_social')}")
            except Exception as e:
                print(f"⚠️ Erro na Minha Receita: {e}")
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

