from rest_framework import serializers
from .models_devolucao import Devolucao, DevolucaoItem, CreditoCliente, CreditoUtilizacao


class DevolucaoItemSerializer(serializers.ModelSerializer):
    """Serializer para itens de devolução"""
    
    class Meta:
        model = DevolucaoItem
        fields = [
            'id_devolucao_item', 'id_produto', 'nome_produto', 'codigo_produto',
            'quantidade_devolvida', 'quantidade_original', 'valor_unitario',
            'valor_total', 'motivo_item', 'id_venda_item', 'id_compra_item'
        ]
        read_only_fields = ['id_devolucao_item', 'valor_total']
    
    def validate(self, data):
        """Validar que quantidade devolvida não excede a original"""
        if data['quantidade_devolvida'] > data['quantidade_original']:
            raise serializers.ValidationError({
                'quantidade_devolvida': 'Quantidade devolvida não pode exceder a quantidade original'
            })
        
        if data['quantidade_devolvida'] <= 0:
            raise serializers.ValidationError({
                'quantidade_devolvida': 'Quantidade devolvida deve ser maior que zero'
            })
        
        return data


class DevolucaoSerializer(serializers.ModelSerializer):
    """Serializer para devoluções"""
    itens = DevolucaoItemSerializer(many=True, read_only=False)
    criado_por_nome = serializers.SerializerMethodField()
    aprovado_por_nome = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Devolucao
        fields = [
            'id_devolucao', 'tipo', 'tipo_display', 'id_venda', 'id_compra',
            'id_cliente', 'id_fornecedor', 'id_operacao', 'data_devolucao',
            'numero_devolucao', 'motivo', 'observacoes', 'gerar_credito',
            'chave_nfe_referenciada',
            'valor_total_devolucao', 'status', 'status_display',
            'estoque_atualizado', 'financeiro_gerado', 'criado_por',
            'criado_por_nome', 'aprovado_por', 'aprovado_por_nome',
            'data_aprovacao', 'criado_em', 'atualizado_em', 'itens'
        ]
        read_only_fields = [
            'id_devolucao', 'numero_devolucao', 'data_devolucao',
            'estoque_atualizado', 'financeiro_gerado', 'data_aprovacao',
            'criado_em', 'atualizado_em'
        ]
    
    def get_criado_por_nome(self, obj):
        return obj.criado_por.get_full_name() if obj.criado_por else None
    
    def get_aprovado_por_nome(self, obj):
        return obj.aprovado_por.get_full_name() if obj.aprovado_por else None
    
    def validate(self, data):
        """Validações gerais"""
        tipo = data.get('tipo')
        
        # Validar que existe id_venda ou id_compra conforme o tipo
        if tipo == 'venda' and not data.get('id_venda'):
            raise serializers.ValidationError({
                'id_venda': 'ID da venda é obrigatório para devolução de venda'
            })
        
        if tipo == 'compra' and not data.get('id_compra'):
            raise serializers.ValidationError({
                'id_compra': 'ID da compra é obrigatório para devolução de compra'
            })
        
        # Validar que gerar_credito só é válido para devolução de venda
        if tipo == 'compra' and data.get('gerar_credito'):
            raise serializers.ValidationError({
                'gerar_credito': 'Crédito só pode ser gerado para devolução de venda'
            })
        
        return data
    
    def create(self, validated_data):
        """Criar devolução com itens — auto-preenche chave_nfe_referenciada da venda de origem"""
        itens_data = validated_data.pop('itens')
        devolucao = Devolucao.objects.create(**validated_data)

        # Preencher chave_nfe_referenciada automaticamente a partir da venda original
        if devolucao.tipo == 'venda' and devolucao.id_venda and not devolucao.chave_nfe_referenciada:
            try:
                from .models import Venda
                venda_origem = Venda.objects.get(pk=devolucao.id_venda)
                if venda_origem.chave_nfe:
                    devolucao.chave_nfe_referenciada = venda_origem.chave_nfe
                    devolucao.save(update_fields=['chave_nfe_referenciada'])
            except Exception:
                pass

        # Criar itens
        valor_total = 0
        for item_data in itens_data:
            item = DevolucaoItem.objects.create(devolucao=devolucao, **item_data)
            valor_total += item.valor_total
        
        # Atualizar valor total da devolução
        devolucao.valor_total_devolucao = valor_total
        devolucao.save()
        
        return devolucao
    
    def update(self, instance, validated_data):
        """Atualizar devolução"""
        itens_data = validated_data.pop('itens', None)
        
        # Atualizar campos da devolução
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Se houver itens, atualizar
        if itens_data is not None:
            # Remover itens antigos
            instance.itens.all().delete()
            
            # Criar novos itens
            valor_total = 0
            for item_data in itens_data:
                item = DevolucaoItem.objects.create(devolucao=instance, **item_data)
                valor_total += item.valor_total
            
            # Atualizar valor total
            instance.valor_total_devolucao = valor_total
            instance.save()
        
        return instance


class CreditoClienteSerializer(serializers.ModelSerializer):
    """Serializer para créditos de clientes"""
    devolucao_numero = serializers.CharField(source='devolucao.numero_devolucao', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CreditoCliente
        fields = [
            'id_credito', 'id_cliente', 'devolucao', 'devolucao_numero',
            'valor_credito', 'valor_utilizado', 'saldo', 'data_criacao',
            'data_validade', 'status', 'status_display', 'criado_em',
            'atualizado_em'
        ]
        read_only_fields = [
            'id_credito', 'valor_utilizado', 'saldo', 'status',
            'criado_em', 'atualizado_em'
        ]


class CreditoUtilizacaoSerializer(serializers.ModelSerializer):
    """Serializer para utilizações de crédito"""
    usuario_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditoUtilizacao
        fields = [
            'id_utilizacao', 'credito', 'id_venda', 'valor_utilizado',
            'data_utilizacao', 'usuario', 'usuario_nome'
        ]
        read_only_fields = ['id_utilizacao', 'data_utilizacao']
    
    def get_usuario_nome(self, obj):
        return obj.usuario.get_full_name() if obj.usuario else None


class DevolucaoCreateSerializer(serializers.Serializer):
    """Serializer simplificado para criar devolução via API"""
    tipo = serializers.ChoiceField(choices=['venda', 'compra'])
    id_venda = serializers.IntegerField(required=False, allow_null=True)
    id_compra = serializers.IntegerField(required=False, allow_null=True)
    id_operacao = serializers.IntegerField(required=False, allow_null=True)
    motivo = serializers.CharField()
    observacoes = serializers.CharField(required=False, allow_blank=True)
    gerar_credito = serializers.BooleanField(default=False)
    itens = serializers.ListField(child=serializers.DictField())
    
    def validate(self, data):
        """Validações"""
        tipo = data.get('tipo')
        
        if tipo == 'venda' and not data.get('id_venda'):
            raise serializers.ValidationError({
                'id_venda': 'ID da venda é obrigatório para devolução de venda'
            })
        
        if tipo == 'compra' and not data.get('id_compra'):
            raise serializers.ValidationError({
                'id_compra': 'ID da compra é obrigatório para devolução de compra'
            })
        
        if tipo == 'compra' and data.get('gerar_credito'):
            raise serializers.ValidationError({
                'gerar_credito': 'Crédito só pode ser gerado para devolução de venda'
            })
        
        if not data.get('itens'):
            raise serializers.ValidationError({
                'itens': 'É necessário informar pelo menos um item para devolução'
            })
        
        return data


class VendaParaDevolucaoSerializer(serializers.Serializer):
    """Serializer para retornar dados de venda para devolução"""
    id_venda = serializers.IntegerField()
    numero_documento = serializers.CharField()
    data_venda = serializers.DateTimeField()
    id_cliente = serializers.IntegerField()
    nome_cliente = serializers.CharField()
    valor_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    status_venda = serializers.CharField()
    itens = serializers.ListField()


class CompraParaDevolucaoSerializer(serializers.Serializer):
    """Serializer para retornar dados de compra para devolução"""
    id_compra = serializers.IntegerField()
    numero_nota = serializers.CharField()
    data_movimento_entrada = serializers.DateTimeField()
    id_fornecedor = serializers.IntegerField()
    nome_fornecedor = serializers.CharField()
    valor_total_nota = serializers.DecimalField(max_digits=10, decimal_places=2)
    itens = serializers.ListField()
