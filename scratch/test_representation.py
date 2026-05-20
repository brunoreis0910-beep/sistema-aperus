import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.serializers import ClienteSerializer
from api.models import Cliente, GrupoProduto, ClienteGrupoExcecao

c = Cliente.objects.first()
g = GrupoProduto.objects.first()

try:
    # Set relation
    ClienteGrupoExcecao.objects.filter(cliente=c).delete()
    rel = ClienteGrupoExcecao.objects.create(cliente=c, grupo=g)
    
    # Serialize
    serializer = ClienteSerializer(c)
    print("Serialized data:")
    for key, value in serializer.data.items():
        if 'grupo' in key or 'excecao' in key:
            print(f"  - {key}: {value} (type: {type(value)})")
            
    # Clean up
    rel.delete()
except Exception as e:
    print("Error:", e)
