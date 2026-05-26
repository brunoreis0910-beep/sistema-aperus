import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import SaaSCliente

print("=== SaaSClientes cadastrados ===")
for cliente in SaaSCliente.objects.all():
    print(f"ID: {cliente.id_saas_cliente}")
    print(f"Razão Social: {cliente.razao_social}")
    print(f"CNPJ: {cliente.cnpj}")
    print(f"Schema Name: {cliente.schema_name}")
    print(f"Host: {cliente.db_host}:{cliente.db_port}")
    print(f"Ambiente de Teste: {cliente.is_test_environment}")
    print("-" * 30)
