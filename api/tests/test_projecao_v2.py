import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Setup Django - MUST BE FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SistemaGerencial.settings')
django.setup()

from rest_framework.test import APIClient
from api.models import Produto

def test_projecao():
    client = APIClient()
    
    # URL da rota
    url = '/relatorios/projecao-compra/'
    
    # Test JSON
    print("Testing JSON response...")
    response = client.get(url, {'dias_projecao': 30, 'formato': 'json'})
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data.get('produtos', []))} products.")
        if data.get('produtos'):
            print("Sample product:", data['produtos'][0])
            print("Columns keys:", list(data['produtos'][0].keys()))
    else:
        print(f"Failed JSON: {response.status_code}")

    # Test PDF
    print("\nTesting PDF response...")
    response = client.get(url, {'dias_projecao': 30, 'formato': 'pdf'})
    if response.status_code == 200 and 'application/pdf' in response.get('Content-Type', ''):
        print("Success! PDF generated.")
    else:
        print(f"Failed PDF: {response.status_code}")

    # Test Excel
    print("\nTesting Excel response...")
    response = client.get(url, {'dias_projecao': 30, 'formato': 'excel'})
    if response.status_code == 200 and 'spreadsheetml' in response.get('Content-Type', ''):
        print("Success! Excel generated.")
    else:
        print(f"Failed Excel: {response.status_code}")

if __name__ == '__main__':
    test_projecao()
