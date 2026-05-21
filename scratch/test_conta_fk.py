import django
import os
import sys

sys.path.append(r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import FinanceiroConta
from django.db import transaction

try:
    with transaction.atomic():
        # Cria uma conta de teste associando a um ID de fornecedor que não existe em Clientes (ex: 99999)
        conta = FinanceiroConta.objects.create(
            tipo_conta='Pagar',
            descricao='Teste Antigravity FK',
            valor_parcela=100.00,
            data_vencimento='2026-05-21',
            status_conta='Pendente',
            gerencial=1
        )
        print(f"Conta criada: ID {conta.id_conta}")
        
        # Tenta atribuir o ID frouxo
        conta.id_cliente_fornecedor_id = 99999
        conta.save()
        
        # Recarrega do banco
        conta_db = FinanceiroConta.objects.get(pk=conta.id_conta)
        print(f"Conta no banco: ID {conta_db.id_conta}, id_cliente_fornecedor_id: {conta_db.id_cliente_fornecedor_id}")
        
        # Deleta para não sujar o banco
        conta_db.delete()
        print("Conta de teste deletada com sucesso!")
except Exception as e:
    print(f"Erro no teste: {e}")
