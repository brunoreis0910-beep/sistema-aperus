from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from api.services.product_intelligence_service import ProductIntelligenceService
from api.services.ai_service import ai_service

class ProductIntelligenceViewSet(viewsets.ViewSet):
    """
    ViewSet para recursos de Inteligência de Produtos (Premium)
    Inclui:
    1. Turbo Cadastro (Consulta EAN/GTIN)
    2. Classificação Inteligente via IA
    3. Inteligência de Preços Regionais
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.intelligence_service = ProductIntelligenceService()

    @action(detail=False, methods=['post'], url_path='consultar-ean')
    def consultar_ean(self, request):
        """
        Consulta dados de um produto a partir do código EAN/GTIN.
        Utiliza APIs externas (GS1/Cosmos) ou mock se em modo de desenvolvimento.
        """
        ean = request.data.get('ean')
        
        if not ean:
            return Response(
                {'erro': 'O código EAN é obrigatório.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            resultado = self.intelligence_service.consultar_ean_gtin(ean)
            
            if resultado['encontrado']:
                return Response(resultado)
            else:
                return Response(resultado, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response(
                {'erro': f'Erro ao consultar EAN: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='classificar')
    def classificar_produto(self, request):
        """
        Sugere classificação mercadológica (Grupo/Categoria) para um produto via IA.
        """
        nome_produto = request.data.get('nome_produto')
        
        if not nome_produto:
            return Response(
                {'erro': 'O nome do produto é obrigatório.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Chama o serviço de IA (Gemini)
            resultado = ai_service.classificar_produto_mercado(nome_produto)
            
            if resultado['sucesso']:
                return Response({'sucesso': True, 'sugestoes': resultado['sugestoes']})
            else:
                return Response(
                    {'erro': resultado.get('mensagem', 'Erro desconhecido na IA')}, 
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
                
        except Exception as e:
            return Response(
                {'erro': f'Erro na classificação inteligente: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='precos-regionais')
    def precos_regionais(self, request):
        """
        Pesquisa média de preços regionais para o produto.
        """
        ean = request.data.get('ean')
        descricao = request.data.get('descricao')
        uf = request.data.get('uf', 'SP') # Default para SP se não informado
        
        if not ean and not descricao:
            return Response(
                {'erro': 'Informe EAN ou Descrição do produto.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            resultado = self.intelligence_service.pesquisar_precos_regionais(
                ean=ean, 
                descricao=descricao, 
                uf=uf
            )
            
            return Response(resultado)
            
        except Exception as e:
            return Response(
                {'erro': f'Erro na pesquisa de preços: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
