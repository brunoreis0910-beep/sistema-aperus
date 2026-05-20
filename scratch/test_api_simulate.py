import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from rest_framework.test import APIClient

client = APIClient()
payload = {
    "id_cliente": "3",
    "id_produto": "59",
    "valor_tabela": "122.38"
}

response = client.post('/api/descontos/simular/', payload, format='json')
print("Status Code:", response.status_code)
print("Response Data:", response.data)
