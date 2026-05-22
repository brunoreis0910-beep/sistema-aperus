import os
import sys
import django

# Set up django
sys.path.append(r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import VendaSplitPayment
print("VendaSplitPayment fields:")
for field in VendaSplitPayment._meta.get_fields():
    if field.is_relation:
        print(f"  Relation: {field.name} -> {field.related_model.__name__ if field.related_model else 'None'}")
    else:
        print(f"  Field: {field.name} ({field.get_internal_type()})")
