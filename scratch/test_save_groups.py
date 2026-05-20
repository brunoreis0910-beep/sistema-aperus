import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Cliente, GrupoProduto, ClienteGrupoExcecao

# Get first client and first group
c = Cliente.objects.first()
g = GrupoProduto.objects.first()

print(f"Client: {c.id_cliente} - {c.nome_razao_social}")
print(f"Group: {g.id_grupo} - {g.nome_grupo}")

# Test saving relation
try:
    # Clear existing
    ClienteGrupoExcecao.objects.filter(cliente=c).delete()
    print("Cleared existing exceptions")
    
    # Create new relation
    rel = ClienteGrupoExcecao.objects.create(cliente=c, grupo=g)
    print(f"Saved new relation: Client {rel.cliente_id} -> Group {rel.grupo_id}")
    
    # Verify M2M relationship on model
    print("Client exception groups:")
    for gp in c.grupos_excecao.all():
        print(f"  - {gp.id_grupo}: {gp.nome_grupo}")
        
    # Clean up
    rel.delete()
    print("Cleaned up test relation")
except Exception as e:
    print("Error:", e)
