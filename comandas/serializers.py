from rest_framework import serializers
from .models import Mesa, Comanda, ItemComanda, TransferenciaMesa
from api.models import Produto, Estoque


class MesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesa
        fields = '__all__'


class ItemComandaSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome_produto', read_only=True)
    produto_codigo = serializers.CharField(source='produto.codigo_produto', read_only=True)
    
    class Meta:
        model = ItemComanda
        fields = ['id', 'comanda', 'produto', 'produto_nome', 'produto_codigo', 
                  'quantidade', 'valor_unitario', 'subtotal', 'status', 'observacoes',
                  'criado_em', 'atualizado_em']
        read_only_fields = ['subtotal']
    
    def create(self, validated_data):
        """
        Se valor_unitario nÃ£o for informado, busca automaticamente da tabela estoque
        """
        if 'valor_unitario' not in validated_data or validated_data['valor_unitario'] is None:
            produto = validated_data.get('produto')
            # Busca o valor_venda do primeiro estoque encontrado para este produto
            estoque = Estoque.objects.filter(id_produto=produto).first()
            if estoque and estoque.valor_venda:
                validated_data['valor_unitario'] = estoque.valor_venda
            else:
                # Se nÃ£o encontrar, usa 0.00
                validated_data['valor_unitario'] = 0.00
        
        return super().create(validated_data)


class ComandaSerializer(serializers.ModelSerializer):
    itens = ItemComandaSerializer(many=True, read_only=True)
    mesa_numero = serializers.CharField(source='mesa.numero', read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome_razao_social', read_only=True)
    garcom_nome = serializers.CharField(source='garcom.username', read_only=True)
    vendedor_nome = serializers.CharField(source='id_vendedor.nome', read_only=True, allow_null=True)
    operacao_nfce_nome = serializers.CharField(source='id_operacao_nfce.nome_operacao', read_only=True, allow_null=True)
    
    class Meta:
        model = Comanda
        fields = ['id', 'numero', 'mesa', 'mesa_numero', 'cliente', 'cliente_nome',
                  'garcom', 'garcom_nome', 'id_vendedor', 'vendedor_nome',
                  'id_operacao_nfce', 'operacao_nfce_nome', 
                  'status', 'forma_pagamento', 'data_abertura', 'data_fechamento',
                  'subtotal', 'desconto', 'taxa_servico', 'total', 'observacoes',
                  'itens', 'criado_em', 'atualizado_em']
        read_only_fields = ['subtotal', 'total']


class TransferenciaMesaSerializer(serializers.ModelSerializer):
    mesa_origem_numero = serializers.CharField(source='mesa_origem.numero', read_only=True)
    mesa_destino_numero = serializers.CharField(source='mesa_destino.numero', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)
    
    class Meta:
        model = TransferenciaMesa
        fields = '__all__'
