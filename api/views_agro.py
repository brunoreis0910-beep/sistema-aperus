from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from .models import Safra, ConversaoUnidade, ContratoAgricola, Veiculo, AtributoVariacao, ValorAtributoVariacao, ProdutoVariacao
from .serializers_agro import (SafraSerializer, ConversaoUnidadeSerializer, ContratoAgricolaSerializer, 
                               VeiculoSerializer, AtributoVariacaoSerializer, ValorAtributoVariacaoSerializer,
                               ProdutoVariacaoSerializer)

class SafraViewSet(viewsets.ModelViewSet):
    queryset = Safra.objects.all().order_by('-data_inicio')
    serializer_class = SafraSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticated]
    # authentication_classes = [] # Descomente se quiser remover autenticação totalmente

    def create(self, request, *args, **kwargs):
        print(f"RECEBENDO POST SAFRA: {request.data}")
        response = super().create(request, *args, **kwargs)
        print(f"SAFRA CRIADA COM SUCESSO. TOTAL AGORA: {Safra.objects.count()}")
        return response

    def list(self, request, *args, **kwargs):
        count = Safra.objects.count()
        print(f"LISTANDO SAFRAS. TOTAL NO BD: {count}")
        return super().list(request, *args, **kwargs)

class ConversaoUnidadeViewSet(viewsets.ModelViewSet):
    queryset = ConversaoUnidade.objects.all()
    serializer_class = ConversaoUnidadeSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ContratoAgricolaViewSet(viewsets.ModelViewSet):
    queryset = ContratoAgricola.objects.all().order_by('-data_emissao')
    serializer_class = ContratoAgricolaSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.all()
    serializer_class = VeiculoSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]

# --- Views de Grade ---
class AtributoVariacaoViewSet(viewsets.ModelViewSet):
    queryset = AtributoVariacao.objects.all()
    serializer_class = AtributoVariacaoSerializer

class ValorAtributoVariacaoViewSet(viewsets.ModelViewSet):
    queryset = ValorAtributoVariacao.objects.all()
    serializer_class = ValorAtributoVariacaoSerializer

    @action(detail=False, methods=['get'], url_path='por-atributo/(?P<id_atributo>\d+)')
    def por_atributo(self, request, id_atributo=None):
        valores = self.queryset.filter(id_atributo=id_atributo)
        serializer = self.get_serializer(valores, many=True)
        return Response(serializer.data)

class ProdutoVariacaoViewSet(viewsets.ModelViewSet):
    queryset = ProdutoVariacao.objects.all()
    serializer_class = ProdutoVariacaoSerializer
    
    @action(detail=False, methods=['get'], url_path='por-produto/(?P<id_produto>\d+)')
    def por_produto(self, request, id_produto=None):
        variacoes = self.queryset.filter(id_produto=id_produto)
        serializer = self.get_serializer(variacoes, many=True)
        return Response(serializer.data)
