import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Produto

print("Produto fields:")
for field in Produto._meta.get_fields():
    print(f"  {field.name} (column: {getattr(field, 'db_column', None)})")
