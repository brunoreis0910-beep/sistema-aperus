"""
Serializers para funcionalidade de Troca
"""
from rest_framework import serializers
from decimal import Decimal
from .models import Troca, TrocaItem


class TrocaItemSerializer(serializers.ModelSerializer):
    """Serializer para itens de troca"""
    
    class Meta:
        model = TrocaItem
        fields = [
            'id_troca_item',
            'id_venda_item_original',
            'id_produto_retorno',
            'quantidade_retorno',
            'valor_unit_retorno',
            'valor_total_retorno',
            'id_produto_substituicao',
            'quantidade_substituicao',
            'valor_unit_substituicao',
            'valor_total_substituicao'
        ]
        read_only_fields = ['id_troca_item']

    def validate(self, data):
        """Validações dos dados do item"""
        # Pelo menos um dos lados deve estar preenchido
        tem_retorno = data.get('id_produto_retorno') and data.get('quantidade_retorno', 0) > 0
        tem_substituicao = data.get('id_produto_substituicao') and data.get('quantidade_substituicao', 0) > 0
        
        if not tem_retorno and not tem_substituicao:
            raise serializers.ValidationError(
                "Item deve ter pelo menos um produto de retorno ou substituição"
            )
        
        # Validar quantidades positivas
        if data.get('quantidade_retorno', 0) < 0:
            raise serializers.ValidationError("Quantidade de retorno deve ser positiva")
        
        if data.get('quantidade_substituicao', 0) < 0:
            raise serializers.ValidationError("Quantidade de substituição deve ser positiva")
        
        # Validar valores unitários positivos
        if data.get('valor_unit_retorno', 0) < 0:
            raise serializers.ValidationError("Valor unitário de retorno deve ser positivo")
        
        if data.get('valor_unit_substituicao', 0) < 0:
            raise serializers.ValidationError("Valor unitário de substituição deve ser positivo")
        
        return data


class TrocaSerializer(serializers.ModelSerializer):
    """Serializer para troca completa"""
    itens = TrocaItemSerializer(many=True, read_only=True)
    diferenca_valor = serializers.ReadOnlyField()
    tipo_ajuste_financeiro = serializers.ReadOnlyField()
    
    class Meta:
        model = Troca
        fields = [
            'id_troca',
            'id_venda_original',
            'id_cliente',
            'data_troca',
            'valor_total_retorno',
            'valor_total_substituicao',
            'status',
            'observacao',
            'criado_por',
            'criado_em',
            'atualizado_em',
            'id_financeiro',
            'itens',
            'diferenca_valor',
            'tipo_ajuste_financeiro'
        ]
        read_only_fields = [
            'id_troca', 'criado_em', 'atualizado_em', 
            'diferenca_valor', 'tipo_ajuste_financeiro'
        ]

    def validate_id_venda_original(self, value):
        """Validar se a venda existe"""
        if value <= 0:
            raise serializers.ValidationError("ID da venda deve ser positivo")
        return value

    def validate(self, data):
        """Validações gerais da troca"""
        if data.get('valor_total_retorno', 0) < 0:
            raise serializers.ValidationError("Valor total de retorno deve ser positivo")
        
        if data.get('valor_total_substituicao', 0) < 0:
            raise serializers.ValidationError("Valor total de substituição deve ser positivo")
        
        return data


class TrocaCreateSerializer(serializers.Serializer):
    """Serializer específico para criação de troca com itens"""
    id_venda_original = serializers.IntegerField(min_value=1)
    id_cliente = serializers.IntegerField(required=False, allow_null=True)
    observacao = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    criado_por = serializers.IntegerField(required=False, allow_null=True)
    
    # Campos de condição de pagamento (para geração do financeiro)
    id_conta = serializers.IntegerField(required=False, allow_null=True, help_text="ID da conta bancária")
    id_tipo_pagamento = serializers.IntegerField(required=False, allow_null=True, help_text="ID do tipo de pagamento")
    id_centro_custo = serializers.IntegerField(required=False, allow_null=True, help_text="ID do centro de custo")
    id_condicao_pagamento = serializers.IntegerField(required=False, allow_null=True, help_text="ID da condição de pagamento")
    data_vencimento = serializers.DateField(required=False, allow_null=True, help_text="Data de vencimento")
    numero_parcelas = serializers.IntegerField(required=False, allow_null=True, min_value=1, help_text="Número de parcelas")
    
    # Listas de itens
    itens_retorno = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="Lista de itens sendo devolvidos"
    )
    itens_substituicao = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="Lista de itens substitutos"
    )

    def validate_itens_retorno(self, value):
        """Validar estrutura dos itens de retorno"""
        for item in value:
            required_fields = ['id_venda_item_original', 'quantidade_retorno', 'valor_unit_retorno']
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(
                        f"Campo '{field}' é obrigatório nos itens de retorno"
                    )
            
            if Decimal(str(item['quantidade_retorno'])) <= 0:
                raise serializers.ValidationError(
                    "Quantidade de retorno deve ser positiva"
                )
            
            if Decimal(str(item['valor_unit_retorno'])) <= 0:
                raise serializers.ValidationError(
                    "Valor unitário de retorno deve ser positivo"
                )
        
        return value

    def validate_itens_substituicao(self, value):
        """Validar estrutura dos itens de substituição"""
        for item in value:
            required_fields = ['id_produto_substituicao', 'quantidade_substituicao', 'valor_unit_substituicao']
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(
                        f"Campo '{field}' é obrigatório nos itens de substituição"
                    )
            
            if Decimal(str(item['quantidade_substituicao'])) <= 0:
                raise serializers.ValidationError(
                    "Quantidade de substituição deve ser positiva"
                )
            
            if Decimal(str(item['valor_unit_substituicao'])) <= 0:
                raise serializers.ValidationError(
                    "Valor unitário de substituição deve ser positivo"
                )
        
        return value

    def validate(self, data):
        """Validação geral - deve ter pelo menos um item"""
        itens_ret = data.get('itens_retorno', [])
        itens_sub = data.get('itens_substituicao', [])
        
        if not itens_ret and not itens_sub:
            raise serializers.ValidationError(
                "Troca deve ter pelo menos um item de retorno ou substituição"
            )
        
        return data


class VendaItemParaTrocaSerializer(serializers.Serializer):
    """Serializer para itens de venda disponíveis para troca"""
    id_venda_item = serializers.IntegerField()
    id_produto = serializers.IntegerField()
    nome_produto = serializers.CharField()
    codigo_produto = serializers.CharField(allow_null=True)
    quantidade = serializers.DecimalField(max_digits=12, decimal_places=3)
    valor_unitario = serializers.DecimalField(max_digits=12, decimal_places=2)
    valor_total = serializers.DecimalField(max_digits=12, decimal_places=2)


class VendaParaTrocaSerializer(serializers.Serializer):
    """Serializer para vendas disponíveis para troca"""
    id_venda = serializers.IntegerField()
    numero_documento = serializers.CharField(allow_null=True)
    data_documento = serializers.DateTimeField()
    id_cliente = serializers.IntegerField(allow_null=True)
    cliente_nome = serializers.CharField(allow_null=True)
    cliente_documento = serializers.CharField(allow_null=True)
    valor_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    itens = VendaItemParaTrocaSerializer(many=True, required=False)


class ProdutoParaTrocaSerializer(serializers.Serializer):
    """Serializer para produtos disponíveis como substituição"""
    id_produto = serializers.IntegerField()
    codigo_produto = serializers.CharField(allow_null=True)
    nome_produto = serializers.CharField()
    valor_venda = serializers.DecimalField(max_digits=12, decimal_places=2)
    estoque_disponivel = serializers.DecimalField(max_digits=12, decimal_places=3)


class FinanceiroTrocaSerializer(serializers.Serializer):
    """Serializer para o registro financeiro gerado pela troca"""
    id_financeiro = serializers.IntegerField()
    tipo = serializers.ChoiceField(choices=['entrada', 'credito'])
    valor = serializers.DecimalField(max_digits=12, decimal_places=2)
    descricao = serializers.CharField()
    status = serializers.CharField()