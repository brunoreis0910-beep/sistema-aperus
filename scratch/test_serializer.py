import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.serializers import ClienteSerializer
from api.models import Cliente, GrupoProduto

serializer = ClienteSerializer()
print("Serializer Fields:")
for name, field in serializer.fields.items():
    print(f"  - {name}: {field.__class__.__name__} (read_only={field.read_only}, write_only={field.write_only})")
