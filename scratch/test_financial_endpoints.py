import os
import django
import sys
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

# Now import DRF/Django models/components
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
User = get_user_model()

def test_endpoints():
    c = APIClient()
    # Create or get supervisor/admin user to bypass permission check
    admin = User.objects.filter(is_staff=True).first()
    if not admin:
        admin = User.objects.create_superuser('admin_temp', 'admin@temp.com', 'admin_temp_pass')
        print(f"Created admin_temp")
    
    c.force_authenticate(admin)
    
    endpoints = [
        '/api/contas/?tipo_conta=Receber',
        '/api/contas/?tipo_conta=Pagar',
        '/api/operacoes/',
        '/api/clientes/?page_size=1000',
        '/api/fornecedores/?page_size=1000',
        '/api/contas-bancarias/',
        '/api/centro-custo/',
    ]
    
    for url in endpoints:
        print(f"Testing GET {url}...")
        try:
            response = c.get(url)
            print(f"  Status: {response.status_code}")
            if response.status_code >= 400:
                print(f"  Response: {response.content.decode('utf-8')[:500]}")
        except Exception as e:
            print(f"  EXCEPTION: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_endpoints()
