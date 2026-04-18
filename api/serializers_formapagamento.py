from rest_framework import serializers
from .models import FormaPagamento


class FormaPagamentoSerializer(serializers.ModelSerializer):
    quantidade_dias = serializers.IntegerField(source='dias_vencimento', required=False, allow_null=True)
    nome_conta_padrao = serializers.SerializerMethodField()
    nome_departamento = serializers.SerializerMethodField()
    nome_centro_custo = serializers.SerializerMethodField()

    def get_nome_conta_padrao(self, obj):
        return obj.id_conta_padrao.nome_conta if obj.id_conta_padrao else None
    
    def get_nome_departamento(self, obj):
        return obj.id_departamento.nome_departamento if obj.id_departamento else None
    
    def get_nome_centro_custo(self, obj):
        return obj.id_centro_custo.nome_centro_custo if obj.id_centro_custo else None

    class Meta:
        model = FormaPagamento
        fields = [
            'id_forma_pagamento',
            'nome_forma',
            'dias_vencimento',
            'codigo_t_pag',
            'quantidade_dias',
            'id_conta_padrao',
            'id_centro_custo',
            'id_departamento',
            'nome_conta_padrao',
            'nome_departamento',
            'nome_centro_custo',
            'tipo_integracao',
            'taxa_operadora',
            'dias_repasse',
        ]
        read_only_fields = ['id_forma_pagamento', 'nome_conta_padrao', 'nome_departamento', 'nome_centro_custo']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['descricao'] = instance.nome_forma
        return data
