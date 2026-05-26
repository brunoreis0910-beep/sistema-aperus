import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import EmpresaConfig

print("=== Empresa Configs ===")
for emp in EmpresaConfig.objects.all():
    print(f"ID: {emp.id_empresa}")
    print(f"Nome Fantasia: {emp.nome_fantasia}")
    print(f"Razão Social: {emp.razao_social}")
    print(f"CNPJ: {emp.cnpj}")
    print("-" * 30)
