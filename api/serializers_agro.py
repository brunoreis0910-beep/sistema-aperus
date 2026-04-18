from rest_framework import serializers
from .models import Safra, ConversaoUnidade, ContratoAgricola, Veiculo, AtributoVariacao, ProdutoVariacao, ValorAtributoVariacao

class SafraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Safra
        fields = '__all__'

class ConversaoUnidadeSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='id_produto.nome_produto', read_only=True)
    
    class Meta:
        model = ConversaoUnidade
        fields = ['id_conversao', 'id_produto', 'produto_nome', 'unidade_origem', 'unidade_destino', 'fator_conversao', 'operacao']

class ContratoAgricolaSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    safra_nome = serializers.CharField(source='id_safra.descricao', read_only=True)
    produto_nome = serializers.CharField(source='id_produto_destino.nome_produto', read_only=True)
    
    class Meta:
        model = ContratoAgricola
        fields = '__all__'
        read_only_fields = ['id_contrato']

class VeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veiculo
        fields = '__all__'

# --- Grade ---
class AtributoVariacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtributoVariacao
        fields = '__all__'

class ValorAtributoVariacaoSerializer(serializers.ModelSerializer):
    atributo_nome = serializers.CharField(source='id_atributo.nome', read_only=True)
    class Meta:
        model = ValorAtributoVariacao
        fields = '__all__'

class ProdutoVariacaoSerializer(serializers.ModelSerializer):
    valores_nomes = serializers.SerializerMethodField()
    
    class Meta:
        model = ProdutoVariacao
        fields = ['id_variacao', 'id_produto', 'codigo_barras', 'referencia_variacao', 'preco_venda', 'ativo', 'imagem_url', 'valores', 'valores_nomes']

    def get_valores_nomes(self, obj):
        return [f"{v.id_atributo.nome}: {v.valor}" for v in obj.valores.all()]
