from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Cliente, EscritorioContabilidade
from .serializers import (
    ClienteSerializer,
    ClienteListSerializer,
    EscritorioContabilidadeSerializer
)


class EscritorioContabilidadeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Escritórios de Contabilidade.
    
    Endpoints:
    - GET /api/escritorios/ - Lista todos os escritórios
    - POST /api/escritorios/ - Cria novo escritório
    - GET /api/escritorios/{id}/ - Detalhes de um escritório
    - PUT /api/escritorios/{id}/ - Atualiza escritório
    - PATCH /api/escritorios/{id}/ - Atualização parcial
    - DELETE /api/escritorios/{id}/ - Remove escritório
    """
    
    queryset = EscritorioContabilidade.objects.all()
    serializer_class = EscritorioContabilidadeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ativo']
    search_fields = ['razao_social', 'cnpj', 'contador', 'email']
    ordering_fields = ['razao_social', 'criado_em']
    ordering = ['razao_social']
    
    @action(detail=True, methods=['get'])
    def clientes(self, request, pk=None):
        """Retorna todos os clientes de um escritório"""
        escritorio = self.get_object()
        clientes = escritorio.clientes.filter(ativo=True)
        serializer = ClienteListSerializer(clientes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ativar(self, request, pk=None):
        """Ativa um escritório"""
        escritorio = self.get_object()
        escritorio.ativo = True
        escritorio.save()
        serializer = self.get_serializer(escritorio)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def desativar(self, request, pk=None):
        """Desativa um escritório"""
        escritorio = self.get_object()
        escritorio.ativo = False
        escritorio.save()
        serializer = self.get_serializer(escritorio)
        return Response(serializer.data)


class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de Clientes.
    
    Endpoints:
    - GET /api/clientes/ - Lista todos os clientes
    - POST /api/clientes/ - Cria novo cliente
    - GET /api/clientes/{id}/ - Detalhes de um cliente
    - PUT /api/clientes/{id}/ - Atualiza cliente
    - PATCH /api/clientes/{id}/ - Atualização parcial
    - DELETE /api/clientes/{id}/ - Remove cliente
    """
    
    queryset = Cliente.objects.select_related('escritorio').all()
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['regime_tributario', 'escritorio', 'ativo', 'cidade', 'estado']
    search_fields = [
        'razao_social',
        'nome_fantasia',
        'cnpj',
        'proprietario',
        'cpf',
        'email',
        'telefone'
    ]
    ordering_fields = ['razao_social', 'criado_em', 'cidade']
    ordering = ['razao_social']
    
    def get_serializer_class(self):
        """Usa serializer simplificado para listagem"""
        if self.action == 'list':
            return ClienteListSerializer
        return ClienteSerializer
    
    @action(detail=False, methods=['get'])
    def por_regime(self, request):
        """Agrupa clientes por regime tributário"""
        return Response({}) # Placeholder implementation

    @action(detail=True, methods=['post'])
    def inativar(self, request, pk=None):
        """Inativa um cliente com observação e opção de email"""
        cliente = self.get_object()
        observacoes = request.data.get('observacoes')
        enviar_email = request.data.get('enviar_email', False)

        cliente.ativo = False
        
        # Adicionar observação com timestamp se fornecida
        if observacoes:
            from datetime import datetime
            timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
            new_obs = f"Inativado em {timestamp}: {observacoes}"
            if cliente.observacoes:
                cliente.observacoes += f"\n\n{new_obs}"
            else:
                cliente.observacoes = new_obs
        
        cliente.save()

        # Lógica de envio de email (simulada ou real)
        if enviar_email and cliente.email:
            # Aqui você implementaria o envio real de email
            # send_mail(...)
            print(f"Enviando email de inativação para {cliente.email}")
            pass
        
        serializer = self.get_serializer(cliente)
        return Response(serializer.data)

        from django.db.models import Count
        
        resultado = Cliente.objects.values(
            'regime_tributario'
        ).annotate(
            total=Count('id')
        ).order_by('regime_tributario')
        
        return Response(resultado)
    
    @action(detail=False, methods=['get'])
    def por_cidade(self, request):
        """Agrupa clientes por cidade"""
        from django.db.models import Count
        
        resultado = Cliente.objects.values(
            'cidade',
            'estado'
        ).annotate(
            total=Count('id')
        ).order_by('-total')
        
        return Response(resultado)
    
    @action(detail=True, methods=['post'])
    def ativar(self, request, pk=None):
        """Ativa um cliente"""
        cliente = self.get_object()
        cliente.ativo = True
        cliente.save()
        serializer = self.get_serializer(cliente)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def desativar(self, request, pk=None):
        """Desativa um cliente"""
        cliente = self.get_object()
        cliente.ativo = False
        cliente.save()
        serializer = self.get_serializer(cliente)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def busca_avancada(self, request):
        """Busca avançada com múltiplos critérios"""
        queryset = self.get_queryset()
        
        # Filtros opcionais
        cnpj = request.query_params.get('cnpj', None)
        cpf = request.query_params.get('cpf', None)
        nome = request.query_params.get('nome', None)
        escritorio_id = request.query_params.get('escritorio_id', None)
        
        if cnpj:
            queryset = queryset.filter(cnpj__icontains=cnpj)
        
        if cpf:
            queryset = queryset.filter(cpf__icontains=cpf)
        
        if nome:
            queryset = queryset.filter(
                Q(razao_social__icontains=nome) |
                Q(nome_fantasia__icontains=nome) |
                Q(proprietario__icontains=nome)
            )
        
        if escritorio_id:
            queryset = queryset.filter(escritorio_id=escritorio_id)
        
        serializer = ClienteListSerializer(queryset, many=True)
        return Response(serializer.data)
