from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import FormaPagamento
from .serializers_formapagamento import FormaPagamentoSerializer


class FormaPagamentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet dedicado para formas de pagamento usando o serializer com alias.

    Paginação desabilitada para garantir que a resposta seja sempre um array
    (o frontend usa .map() diretamente sobre res.data).
    """
    permission_classes = [AllowAny]
    queryset = FormaPagamento.objects.all()
    serializer_class = FormaPagamentoSerializer
    pagination_class = None
