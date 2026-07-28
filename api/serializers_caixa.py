from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ControleCaixa, MovimentacaoCaixa

class UserCaixaSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class MovimentacaoCaixaSerializer(serializers.ModelSerializer):
    usuario_detalhe = UserCaixaSerializer(source='usuario', read_only=True)

    class Meta:
        model = MovimentacaoCaixa
        fields = [
            'id_movimentacao', 
            'caixa', 
            'tipo', 
            'valor', 
            'data_movimentacao', 
            'observacao', 
            'usuario',
            'usuario_detalhe'
        ]
        read_only_fields = ['data_movimentacao', 'usuario']

class ControleCaixaSerializer(serializers.ModelSerializer):
    operador_detalhe = UserCaixaSerializer(source='operador', read_only=True)
    movimentacoes = MovimentacaoCaixaSerializer(many=True, read_only=True)

    class Meta:
        model = ControleCaixa
        fields = [
            'id_caixa',
            'operador',
            'operador_detalhe',
            'data_abertura',
            'valor_abertura',
            'data_fechamento',
            'valor_fechamento',
            'status',
            'observacoes',
            'movimentacoes'
        ]
        read_only_fields = ['data_abertura', 'status']
