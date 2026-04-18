from rest_framework import viewsets, filters, permissions
from .models import LoteProduto
from .serializers import LoteProdutoSerializer

class LoteProdutoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento de lotes de produtos e datas de validade.
    Permite filtrar por id_produto e status ativo.
    """
    queryset = LoteProduto.objects.all().order_by('data_validade')
    serializer_class = LoteProdutoSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['numero_lote', 'id_produto__nome_produto']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtro por Produto
        id_produto = self.request.query_params.get('id_produto')
        if id_produto:
            queryset = queryset.filter(id_produto=id_produto)
        
        # Filtro por Ativo/Inativo
        ativo = self.request.query_params.get('ativo')
        if ativo is not None:
            is_active = ativo.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(ativo=is_active)
            
        return queryset
