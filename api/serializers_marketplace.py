from rest_framework import serializers
from .models_marketplace import MarketplaceConfig, MarketplaceProduto
from .models import Produto

class MarketplaceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceConfig
        fields = '__all__'
        extra_kwargs = {
            'client_secret': {'write_only': True},
            'access_token': {'write_only': True},
            'refresh_token': {'write_only': True},
        }

class MarketplaceProdutoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.descricao', read_only=True)
    marketplace_nome = serializers.CharField(source='marketplace.nome', read_only=True)
    
    class Meta:
        model = MarketplaceProduto
        fields = '__all__'
