import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import SaaSCliente

cnpj = '48010363000134'
razao_social = 'BRUNO DOS REIS NASCIMENTO'

print("=== Registering SaaS Clients ===")

# 1. Central / Production Client
prod_client, created_prod = SaaSCliente.objects.get_or_create(
    schema_name='central',
    defaults={
        'cnpj': cnpj,
        'razao_social': razao_social,
        'dia_vencimento': 10,
        'valor_mensalidade': 100.00,
        'emite_nota': False,
        'status_licenca': 'ATIVO',
        'db_host': 'localhost',
        'db_port': '8006',
        'is_test_environment': False
    }
)
if created_prod:
    print(f"Created production SaaSCliente: {prod_client.razao_social} (schema: {prod_client.schema_name})")
else:
    print(f"Production SaaSCliente already exists: {prod_client.razao_social} (schema: {prod_client.schema_name})")
    # Update fields just in case
    prod_client.cnpj = cnpj
    prod_client.db_host = 'localhost'
    prod_client.db_port = '8006'
    prod_client.is_test_environment = False
    prod_client.save()
    print("Updated production client fields.")

# 2. Testing Client
test_client, created_test = SaaSCliente.objects.get_or_create(
    schema_name='testes',
    defaults={
        'cnpj': cnpj,
        'razao_social': 'Aperus - Ambiente de Testes',
        'dia_vencimento': 10,
        'valor_mensalidade': 0.00,
        'emite_nota': False,
        'status_licenca': 'ATIVO',
        'db_host': 'localhost',
        'db_port': '8005',
        'is_test_environment': True
    }
)
if created_test:
    print(f"Created testing SaaSCliente: {test_client.razao_social} (schema: {test_client.schema_name})")
else:
    print(f"Testing SaaSCliente already exists: {test_client.razao_social} (schema: {test_client.schema_name})")
    # Update fields just in case
    test_client.cnpj = cnpj
    test_client.db_host = 'localhost'
    test_client.db_port = '8005'
    test_client.is_test_environment = True
    test_client.save()
    print("Updated testing client fields.")

print("=" * 30)
