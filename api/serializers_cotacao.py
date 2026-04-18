from rest_framework import serializers

try:
    from .models_cotacao import Cotacao, CotacaoItem, CotacaoFornecedor, CotacaoResposta
    from .models import Produto, Fornecedor
except ImportError:
    # Modelos de cotação não estão disponíveis
    Cotacao = None
    CotacaoItem = None
    CotacaoFornecedor = None
    CotacaoResposta = None


class CotacaoRespostaSerializer(serializers.ModelSerializer):
    """Serializer para respostas dos fornecedores"""
    fornecedor_nome = serializers.CharField(source='id_cotacao_fornecedor.id_fornecedor.nome_razao_social', read_only=True)
    produto_nome = serializers.CharField(source='id_cotacao_item.id_produto.nome_produto', read_only=True)
    
    class Meta:
        model = CotacaoResposta
        fields = '__all__'
        read_only_fields = ['valor_total']


class CotacaoFornecedorSerializer(serializers.ModelSerializer):
    """Serializer para fornecedores da cotação"""
    fornecedor_nome = serializers.CharField(source='id_fornecedor.nome_razao_social', read_only=True)
    fornecedor_email = serializers.CharField(source='id_fornecedor.email', read_only=True)
    fornecedor_telefone = serializers.CharField(source='id_fornecedor.telefone', read_only=True)
    link_resposta = serializers.SerializerMethodField()
    respostas = CotacaoRespostaSerializer(many=True, read_only=True)
    
    class Meta:
        model = CotacaoFornecedor
        fields = '__all__'
        read_only_fields = ['token_acesso', 'data_visualizacao', 'data_resposta']
    
    def get_link_resposta(self, obj):
        return obj.get_link_resposta()


class CotacaoItemSerializer(serializers.ModelSerializer):
    """Serializer para itens da cotação"""
    produto_nome = serializers.CharField(source='id_produto.nome_produto', read_only=True)
    produto_unidade = serializers.CharField(source='id_produto.unidade_medida', read_only=True)
    fornecedor_vencedor_nome = serializers.CharField(source='fornecedor_vencedor.nome_razao_social', read_only=True)
    respostas = CotacaoRespostaSerializer(many=True, read_only=True)
    
    class Meta:
        model = CotacaoItem
        fields = '__all__'
        read_only_fields = ['fornecedor_vencedor', 'valor_vencedor']


class CotacaoSerializer(serializers.ModelSerializer):
    """Serializer principal para cotações"""
    itens = CotacaoItemSerializer(many=True, read_only=True)
    fornecedores = CotacaoFornecedorSerializer(many=True, read_only=True)
    criado_por_nome = serializers.CharField(source='criado_por.username', read_only=True)
    
    class Meta:
        model = Cotacao
        fields = '__all__'
        read_only_fields = ['numero_cotacao', 'criado_em', 'atualizado_em']


class CotacaoCreateSerializer(serializers.Serializer):
    """Serializer para criar cotação com itens e fornecedores"""
    prazo_resposta = serializers.DateTimeField()
    observacoes = serializers.CharField(required=False, allow_blank=True)
    itens = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    fornecedores = serializers.ListField(
        child=serializers.IntegerField()
    )
    
    def validate_itens(self, value):
        if not value:
            raise serializers.ValidationError("A cotação deve ter pelo menos um item")
        
        for item in value:
            if 'id_produto' not in item:
                raise serializers.ValidationError("Cada item deve ter id_produto")
            if 'quantidade_solicitada' not in item:
                raise serializers.ValidationError("Cada item deve ter quantidade_solicitada")
        
        return value
    
    def validate_fornecedores(self, value):
        if not value:
            raise serializers.ValidationError("A cotação deve ter pelo menos um fornecedor")
        return value


class CotacaoRespostaPublicSerializer(serializers.Serializer):
    """Serializer para resposta pública do fornecedor (sem autenticação)"""
    respostas = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    
    def validate_respostas(self, value):
        if not value:
            raise serializers.ValidationError("Deve haver pelo menos uma resposta")
        
        for resposta in value:
            if 'id_cotacao_item' not in resposta:
                raise serializers.ValidationError("Cada resposta deve ter id_cotacao_item")
            if 'valor_unitario' not in resposta:
                raise serializers.ValidationError("Cada resposta deve ter valor_unitario")
        
        return value


class CotacaoConfirmarVencedorSerializer(serializers.Serializer):
    """Serializer para confirmar vencedores da cotação"""
    vencedores = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    
    def validate_vencedores(self, value):
        if not value:
            raise serializers.ValidationError("Deve selecionar pelo menos um vencedor")
        
        for vencedor in value:
            if 'id_cotacao_item' not in vencedor:
                raise serializers.ValidationError("Cada vencedor deve ter id_cotacao_item")
            if 'id_fornecedor' not in vencedor:
                raise serializers.ValidationError("Cada vencedor deve ter id_fornecedor")
            if 'valor_vencedor' not in vencedor:
                raise serializers.ValidationError("Cada vencedor deve ter valor_vencedor")
        
        return value
