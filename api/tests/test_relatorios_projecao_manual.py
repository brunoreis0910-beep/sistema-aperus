from rest_framework.test import APIClient
from rest_framework import status
from api.models import Produto, GrupoProduto, Deposito, VendaItem, Venda, Estoque
from decimal import Decimal
import django
import os
from django.conf import settings
from datetime import timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SistemaGerencial.settings')
django.setup()

def test_projecao():
    client = APIClient()
    
    # Criar dados de teste se necessario
    # Mas primeiro vamos tentar consultar o que ja existe
    url = '/relatorios/projecao-compra/'
    
    # Test JSON
    print("Testing JSON response...")
    response = client.get(url, {'dias_projecao': 30, 'formato': 'json'})
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Found {len(data.get('produtos', []))} products.")
        if data.get('produtos'):
            print("Sample product:", data['produtos'][0])
            print("Columns keys:", data['produtos'][0].keys())
    else:
        print(f"Failed JSON: {response.status_code} - {response.content}")

    # Test PDF
    print("\nTesting PDF response...")
    response = client.get(url, {'dias_projecao': 30, 'formato': 'pdf'})
    if response.status_code == 200 and response['Content-Type'] == 'application/pdf':
        print("Success! PDF generated.")
    else:
        print(f"Failed PDF: {response.status_code}")

    # Test Excel
    print("\nTesting Excel response...")
    response = client.get(url, {'dias_projecao': 30, 'formato': 'excel'})
    if response.status_code == 200 and 'spreadsheetml' in response['Content-Type']:
        print("Success! Excel generated.")
    else:
        print(f"Failed Excel: {response.status_code}")

if __name__ == '__main__':
    try:
        test_projecao()
    except Exception as e:
        print(f"Error: {e}")
