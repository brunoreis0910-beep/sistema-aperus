"""
Serializers para balanças
"""
from rest_framework import serializers
from .models_balanca import ConfiguracaoBalanca, ProdutoBalanca, ExportacaoBalanca
from .models import Produto


class ConfiguracaoBalancaSerializer(serializers.ModelSerializer):
    tipo_balanca_display = serializers.CharField(source='get_tipo_balanca_display', read_only=True)
    modelo_balanca_display = serializers.CharField(source='get_modelo_balanca_display', read_only=True)
    formato_exportacao_display = serializers.CharField(source='get_formato_exportacao_display', read_only=True)
    
    class Meta:
        model = ConfiguracaoBalanca
        fields = '__all__'
        read_only_fields = ['usuario_criacao', 'criado_em', 'atualizado_em']


class ProdutoBalancaSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome_produto', read_only=True)
    produto_codigo = serializers.CharField(source='produto.codigo_produto', read_only=True)
    produto_preco = serializers.DecimalField(source='produto.valor_venda', max_digits=10, decimal_places=2, read_only=True)
    produto_codigo_barras = serializers.CharField(source='produto.codigo_barras', read_only=True)
    produto_unidade = serializers.CharField(source='produto.unidade', read_only=True)
    
    class Meta:
        model = ProdutoBalanca
        fields = '__all__'
        read_only_fields = ['exportado_em', 'atualizado_em']


class ExportacaoBalancaSerializer(serializers.ModelSerializer):
    configuracao_nome = serializers.CharField(source='configuracao.nome_configuracao', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)
    
    class Meta:
        model = ExportacaoBalanca
        fields = '__all__'
        read_only_fields = ['data_exportacao']


class ProdutoParaBalancaSerializer(serializers.Serializer):
    """Serializer para adicionar produtos à balança"""
    produtos = serializers.ListField(
        child=serializers.IntegerField(),
        help_text='Lista de IDs dos produtos'
    )
    codigo_plu_inicial = serializers.IntegerField(
        required=False,
        help_text='Código PLU inicial (se não informado, usa próximo disponível)'
    )
    validade_dias = serializers.IntegerField(
        default=3,
        help_text='Validade em dias'
    )
    tara = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=0,
        help_text='Tara em kg'
    )
    departamento = serializers.IntegerField(
        default=1,
        help_text='Departamento/Setor'
    )
