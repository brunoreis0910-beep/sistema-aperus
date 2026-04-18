from rest_framework import serializers
from .models import LayoutEtiqueta, ImpressaoEtiqueta


class LayoutEtiquetaSerializer(serializers.ModelSerializer):
    usuario_criacao_nome = serializers.CharField(source='usuario_criacao.username', read_only=True)
    
    class Meta:
        model = LayoutEtiqueta
        fields = '__all__'
        read_only_fields = ['usuario_criacao', 'criado_em', 'atualizado_em']


class ImpressaoEtiquetaSerializer(serializers.ModelSerializer):
    layout_nome = serializers.CharField(source='layout.nome_layout', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)
    cliente_nome = serializers.SerializerMethodField()
    
    class Meta:
        model = ImpressaoEtiqueta
        fields = '__all__'
        read_only_fields = ['usuario', 'data_impressao']
    
    def get_cliente_nome(self, obj):
        """Retorna o nome do cliente se disponível"""
        if obj.cliente_id:
            try:
                from api.models import Cliente
                cliente = Cliente.objects.get(id_cliente=obj.cliente_id)
                return cliente.nome_razao_social
            except Cliente.DoesNotExist:
                return None
        return None
