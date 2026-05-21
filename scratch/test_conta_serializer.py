import django
import os
import sys

sys.path.append(r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import FinanceiroConta
from rest_framework import serializers
from django.db import transaction

# Definimos uma versão do serializer alterada para teste
class TestFinanceiroContaSerializer(serializers.ModelSerializer):
    gerencial = serializers.BooleanField()
    cliente = serializers.SerializerMethodField()
    data_documento = serializers.DateField(source='data_emissao', read_only=True)
    id_cliente_fornecedor = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = FinanceiroConta
        fields = '__all__'
        read_only_fields = ['id_conta', 'data_emissao']
        
    def get_cliente(self, obj):
        if obj.id_cliente_fornecedor:
            return obj.id_cliente_fornecedor.nome_razao_social
        return None

    def create(self, validated_data):
        id_cli_for = validated_data.pop('id_cliente_fornecedor', None)
        instance = super().create(validated_data)
        if id_cli_for is not None:
            instance.id_cliente_fornecedor_id = id_cli_for
            instance.save()
        return instance

    def update(self, instance, validated_data):
        id_cli_for = validated_data.pop('id_cliente_fornecedor', None)
        instance = super().update(instance, validated_data)
        if id_cli_for is not None:
            instance.id_cliente_fornecedor_id = id_cli_for
            instance.save()
        return instance

# Dados de entrada simulando o payload do frontend
payload = {
    "tipo_conta": "Pagar",
    "id_cliente_fornecedor": 99999, # ID inexistente
    "descricao": "Compra #999 - Parcela 1/1",
    "valor_parcela": 250.00,
    "data_vencimento": "2026-05-21",
    "status_conta": "Pendente",
    "forma_pagamento": "Dinheiro",
    "id_compra_origem": 999,
    "gerencial": 1
}

try:
    print("Validando payload...")
    serializer = TestFinanceiroContaSerializer(data=payload)
    is_valid = serializer.is_valid()
    print(f"É válido? {is_valid}")
    if not is_valid:
        print(f"Erros: {serializer.errors}")
    else:
        print("Dados validados:", serializer.validated_data)
        with transaction.atomic():
            instance = serializer.save()
            print(f"Sucesso! Conta criada com ID {instance.id_conta} e id_cliente_fornecedor: {instance.id_cliente_fornecedor_id}")
            # Deletamos a conta diretamente via SQL para evitar disparar sinais de exclusão do Django/boletos
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM financeiro_contas WHERE id_conta = %s", [instance.id_conta])
            print("Conta de teste removida via SQL.")
except Exception as e:
    print(f"Erro: {e}")
