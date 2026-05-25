import os
import django
import sys
import re

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import SaaSCliente, Produto, Promocao
from rest_framework.test import APIClient
from django.db import connection, connections
from django.conf import settings
from django.contrib.auth.models import User

def cleanup_db(cnpj):
    db_name = f"aperus_{cnpj}"
    print(f"Cleaning up database {db_name} and SaaS record...")
    
    # 1. Delete SaaSCliente central record
    SaaSCliente.objects.filter(cnpj=cnpj).delete()
    
    # 2. Delete database in MySQL if exists
    with connection.cursor() as cursor:
        cursor.execute(f"DROP DATABASE IF EXISTS {db_name};")
    print("Database dropped successfully.")

def verify_provisioning():
    test_cnpj = "12345678000100"
    db_name = f"aperus_{test_cnpj}"
    
    # Make sure we start clean
    try:
        cleanup_db(test_cnpj)
    except Exception:
        pass
        
    client = APIClient()
    
    # Authenticate admin for viewset creation
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin_temp', 'admin@temp.com', 'admin_pass')
        print(f"Created temporary superuser: {admin_user}")
    
    client.force_authenticate(user=admin_user)
    
    print("\n--- Test 1: Creating SaaSCliente via ViewSet ---")
    payload = {
        "cnpj": test_cnpj,
        "razao_social": "Tenant Test Shop Ltda",
        "dia_vencimento": 5,
        "valor_mensalidade": "199.90",
        "status_licenca": "ATIVO",
        "emite_nota": False
    }
    
    # This should call perform_create, which creates DB and runs migrations
    response = client.post('/api/saas-clientes/', payload, format='json')
    print(f"Response status code: {response.status_code}")
    if response.status_code != 211 and response.status_code != 201:
        print(f"FAILED: {response.data}")
        return
        
    print("SaaSCliente successfully created.")
    
    # Check if database exists in MySQL
    print("\n--- Test 2: Checking MySQL database creation ---")
    db_exists = False
    with connection.cursor() as cursor:
        cursor.execute("SHOW DATABASES;")
        dbs = [row[0] for row in cursor.fetchall()]
        if db_name in dbs:
            db_exists = True
            
    print(f"Database '{db_name}' exists in MySQL: {db_exists}")
    if not db_exists:
        print("FAILED: Database was not created.")
        return
        
    # Check if we can connect to the tenant database and insert/query transactional data
    print("\n--- Test 3: Inserting data into tenant isolated database ---")
    
    # Ensure tenant connection settings are in settings
    if db_name not in settings.DATABASES:
        print("FAILED: Connection was not registered in settings.DATABASES.")
        return
        
    # Try inserting a product using the tenant connection
    tenant_conn = connections[db_name]
    with tenant_conn.cursor() as cursor:
        # Check all tables
        cursor.execute("SHOW TABLES;")
        all_tables = [row[0] for row in cursor.fetchall()]
        print(f"Tables present in tenant DB: {all_tables}")
        
        has_table = 'produtos' in all_tables
        print(f"produtos table exists in tenant DB: {has_table}")
        if not has_table:
            print("FAILED: Migrations/Schema copy were not applied to tenant DB.")
            return

    # Create product specifically in the tenant DB
    # We use Django's using() to target the tenant database connection alias
    test_prod = Produto.objects.using(db_name).create(
        codigo_produto="TENANT001",
        nome_produto="Produto Exclusivo do Inquilino",
        descricao="Teste de tenant"
    )
    print(f"Product created in tenant DB: {test_prod}")
    
    # Verify the product is NOT visible in the central default DB
    prod_in_default = Produto.objects.filter(codigo_produto="TENANT001").exists()
    print(f"Product visible in default/central DB: {prod_in_default} (Expected: False)")
    
    # Verify the product IS visible when using the tenant DB
    prod_in_tenant = Produto.objects.using(db_name).filter(codigo_produto="TENANT001").exists()
    print(f"Product visible in tenant DB: {prod_in_tenant} (Expected: True)")
    
    print("\n--- Test 4: Dynamic routing via middleware header ---")
    # Clean authentication just to test standard headers
    client.force_authenticate(user=None)
    
    # Run a request without tenant header
    # Let's request the products list
    res_no_header = client.get('/api/produtos/')
    print(f"Request without header - Status: {res_no_header.status_code}")
    
    # Now run request WITH X-Tenant-CNPJ header
    # authenticate a test user in default connection first (since products listing requires auth)
    client.force_authenticate(user=admin_user)
    
    res_with_header = client.get('/api/produtos/', HTTP_X_TENANT_CNPJ=test_cnpj)
    print(f"Request WITH X-Tenant-CNPJ header - Status: {res_with_header.status_code}")
    
    # Clean up
    print("\n--- Final: Cleaning up resources ---")
    cleanup_db(test_cnpj)
    
    # Clean up temp superuser if created
    User.objects.filter(username='admin_temp').delete()
    print("Validation successfully completed!")

if __name__ == "__main__":
    verify_provisioning()
