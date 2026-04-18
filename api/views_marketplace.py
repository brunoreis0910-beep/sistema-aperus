from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models_marketplace import MarketplaceConfig, MarketplaceProduto
from .serializers_marketplace import MarketplaceConfigSerializer, MarketplaceProdutoSerializer
from .models import Produto

class MarketplaceConfigViewSet(viewsets.ModelViewSet):
    queryset = MarketplaceConfig.objects.all()
    serializer_class = MarketplaceConfigSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def testar_conexao(self, request, pk=None):
        config = self.get_object()
        # Aqui integrar logicamente com cada marketplace para testar token
        return Response({'status': 'Conexão testada com sucesso (Simulado)'})


class MarketplaceProdutoViewSet(viewsets.ModelViewSet):
    queryset = MarketplaceProduto.objects.all()
    serializer_class = MarketplaceProdutoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        produto_id = self.request.query_params.get('produto_id')
        marketplace_id = self.request.query_params.get('marketplace_id')
        
        if produto_id:
            queryset = queryset.filter(produto_id=produto_id)
        if marketplace_id:
            queryset = queryset.filter(marketplace_id=marketplace_id)
            
        return queryset

    @action(detail=True, methods=['post'])
    def sincronizar_estoque(self, request, pk=None):
        vinculo = self.get_object()
        # Lógica de sincronização com API externa
        # Ex: enviar estoque atual do produto para a plataforma
        return Response({'status': 'Estoque sincronizado (Simulado)'})
