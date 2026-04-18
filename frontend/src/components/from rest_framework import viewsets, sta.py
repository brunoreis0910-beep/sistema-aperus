from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Produto, CatalogoItem
from .serializers import ProdutoSerializer, CatalogoItemSerializer


class CatalogoViewSet(viewsets.ModelViewSet):
    queryset = CatalogoItem.objects.all()
    serializer_class = CatalogoItemSerializer

    @action(detail=False, methods=['get'])
    def produtos_ativos(self, request):
        catalogo = CatalogoItem.objects.filter(ativo=True).select_related('produto')
        serializer = self.get_serializer(catalogo, many=True)
        return Response(serializer.data)


class WhatsAppViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def enviar_catalogo(self, request):
        numero = request.data.get('numero')
        
        if not numero:
            return Response(
                {'error': 'Número do WhatsApp é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'message': 'Catálogo enviado com sucesso'})
