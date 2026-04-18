from rest_framework import serializers
from .models import RecebimentoCartao, Venda, Cliente

class RecebimentoCartaoSerializer(serializers.ModelSerializer):
    nome_cliente = serializers.SerializerMethodField()
    numero_venda = serializers.SerializerMethodField()

    class Meta:
        model = RecebimentoCartao
        fields = [
            'id_recebimento', 'id_venda', 'id_financeiro', 
            'data_venda', 'valor_bruto', 'taxa_percentual',
            'valor_taxa', 'valor_liquido', 'data_previsao', 
            'data_pagamento', 'status', 'bandeira', 
            'tipo_cartao', 'nsu', 'codigo_autorizacao',
            'nome_cliente', 'numero_venda'
        ]

    def get_nome_cliente(self, obj):
        if obj.id_venda and obj.id_venda.id_cliente:
            return obj.id_venda.id_cliente.nome_razao_social
        return "Consumidor"
    
    def get_numero_venda(self, obj):
        if obj.id_venda:
            return obj.id_venda.numero_documento or str(obj.id_venda.pk)
        return "-"
