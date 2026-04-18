import os
import django
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Setup Django - MUST BE FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from rest_framework.test import APIClient
from api.models import Produto
from django.contrib.auth.models import User

def test_projecao():
    client = APIClient()
    user, created = User.objects.get_or_create(username='test_user_projecao')
    client.force_authenticate(user=user)
    
    # URL da rota
    url = '/api/relatorios/projecao-compra/'  # Try with /api/ prefix if router is included under /api/
    # Or check if router is included at root path '' in urls.py
    
    # Based on urls.py: path('', include(router.urls)), so likely no /api prefix unless project-level urls.py has it.
    # Let's try to infer from existing successful tests or usage.
    # The grep showed url='/relatorios/projecao-compra/' in frontend so likely '/relatorios/' is correct if backed runs on port 8000.
    
    # URL da rota
    url = '/api/relatorios/projecao-compra/'

    # Test JSON
    print(f"Testing JSON response for {url}...")
    response = client.get(url, {'dias_projecao': 30, 'formato': 'json'})
    
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.get('Content-Type')}")
    
    if response.status_code == 200:
        if response.get('Content-Type') == 'application/json':
            data = response.json()
            print(f"Success! Found {len(data.get('produtos', []))} products.")
            if data.get('produtos') and len(data['produtos']) > 0:
                print("Sample product:", data['produtos'][0])
                print("Columns keys:", list(data['produtos'][0].keys()))
            else:
                print("No products in result.")
        else:
            print(f"Content-Type: {response.get('Content-Type')}")
            # print(response.streaming_content if hasattr(response, 'streaming_content') else response.content[:500])
            if hasattr(response, 'content'):
                try:
                    print(response.content.decode('utf-8')[:500])
                except:
                    print("Binary content (skipped)")
            else:
                 print("Streaming content (skipped)")
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
