"""
Views para gerenciamento de dados de Veículo Novo (grupo veicProd - NF-e 4.0).

Endpoints:
  GET    /api/venda-item/<id_venda_item>/veiculo-novo/   → retorna dados do veículo
  POST   /api/venda-item/<id_venda_item>/veiculo-novo/   → cria ou atualiza (upsert)
  DELETE /api/venda-item/<id_venda_item>/veiculo-novo/   → remove dados

Além disso, o viewset padrão:
  GET/POST  /api/veiculos-novos/
  GET/PUT/PATCH/DELETE  /api/veiculos-novos/<id>/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import VeiculoNovo, VendaItem
from .serializers import VeiculoNovoSerializer


# ---------------------------------------------------------------------------
# ViewSet completo (roteado via DefaultRouter em urls.py)
# ---------------------------------------------------------------------------
class VeiculoNovoViewSet(viewsets.ModelViewSet):
    queryset = VeiculoNovo.objects.all()
    serializer_class = VeiculoNovoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        id_venda_item = self.request.query_params.get('id_venda_item')
        if id_venda_item:
            qs = qs.filter(id_venda_item=id_venda_item)
        return qs


# ---------------------------------------------------------------------------
# View sub-recurso: /api/venda-item/<id_venda_item>/veiculo-novo/
# ---------------------------------------------------------------------------
class VendaItemVeiculoNovoView(APIView):
    """
    Sub-recurso de VendaItem para dados de veículo novo.
    Suporta GET, POST (upsert) e DELETE.
    """
    permission_classes = [IsAuthenticated]

    def _get_item(self, id_venda_item):
        try:
            return VendaItem.objects.get(pk=id_venda_item)
        except VendaItem.DoesNotExist:
            return None

    def get(self, request, id_venda_item):
        item = self._get_item(id_venda_item)
        if not item:
            return Response({'detail': 'Item de venda não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            vn = VeiculoNovo.objects.get(id_venda_item=item)
        except VeiculoNovo.DoesNotExist:
            return Response({'detail': 'Dados de veículo novo não cadastrados para este item.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VeiculoNovoSerializer(vn)
        return Response(serializer.data)

    def post(self, request, id_venda_item):
        """Cria ou atualiza (upsert) os dados de veículo novo para o item."""
        item = self._get_item(id_venda_item)
        if not item:
            return Response({'detail': 'Item de venda não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            vn = VeiculoNovo.objects.get(id_venda_item=item)
            serializer = VeiculoNovoSerializer(vn, data=request.data, partial=True)
            is_create = False
        except VeiculoNovo.DoesNotExist:
            data = {**request.data, 'id_venda_item': id_venda_item}
            serializer = VeiculoNovoSerializer(data=data)
            is_create = True

        if serializer.is_valid():
            serializer.save()
            code = status.HTTP_201_CREATED if is_create else status.HTTP_200_OK
            return Response(serializer.data, status=code)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id_venda_item):
        item = self._get_item(id_venda_item)
        if not item:
            return Response({'detail': 'Item de venda não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            vn = VeiculoNovo.objects.get(id_venda_item=item)
            vn.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except VeiculoNovo.DoesNotExist:
            return Response({'detail': 'Dados de veículo novo não encontrados.'}, status=status.HTTP_404_NOT_FOUND)
