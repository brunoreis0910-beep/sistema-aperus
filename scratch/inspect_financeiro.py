import os
import sys
import django

# Add current directory to path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import FinanceiroConta
fields = [f.name for f in FinanceiroConta._meta.get_fields()]
print("FinanceiroConta fields:")
print(fields)

for f in FinanceiroConta._meta.get_fields():
    if 'forma' in f.name:
        print(f"Found field with 'forma': {f.name} ({f})")
