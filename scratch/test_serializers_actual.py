import django
import os
import sys

sys.path.append(r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import FinanceiroConta
from api.serializers import FinanceiroContaSerializer
from django.db import transaction

# Dados de entrada simulando o payload do frontend
payload = {
    "tipo_conta": "Pagar",
    "id_cliente_fornecedor": 99999, # ID inexistente em Clientes, mas válido para Fornecedores
    "descricao": "Compra #999 - Parcela 1/1 (Real)",
    "valor_parcela": 250.00,
    "data_vencimento": "2026-05-21",
    "status_conta": "Pendente",
    "forma_pagamento": "Dinheiro",
    "id_compra_origem": 999,
    "gerencial": True
}

try:
    print("Validando payload com o serializer real modificado...")
    serializer = FinanceiroContaSerializer(data=payload)
    is_valid = serializer.is_valid()
    print(f"É válido? {is_valid}")
    if not is_valid:
        print(f"Erros: {serializer.errors}")
    else:
        print("Dados validados com sucesso!")
        with transaction.atomic():
            instance = serializer.save()
            print(f"Sucesso! Conta criada via serializer real com ID {instance.id_conta} e id_cliente_fornecedor: {instance.id_cliente_fornecedor_id}")
            # Deletamos a conta diretamente via SQL
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM financeiro_contas WHERE id_conta = %s", [instance.id_conta])
            print("Conta de teste removida via SQL.")
except Exception as e:
    print(f"Erro no teste: {e}")
