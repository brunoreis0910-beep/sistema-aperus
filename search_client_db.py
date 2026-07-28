# search_client_db.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Cliente

print("=== CLIENTS IN DB ===")
# List first 10 clients
for c in Cliente.objects.all()[:10]:
    print(f"ID={c.id_cliente}, Name={c.nome_razao_social}, CPF/CNPJ={c.cpf_cnpj}")
