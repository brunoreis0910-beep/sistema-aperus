import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.serializers import ClienteSerializer
from api.models import Cliente, GrupoProduto, ClienteGrupoExcecao

# Let's get the first client and two groups to use in our test
c = Cliente.objects.first()
groups = list(GrupoProduto.objects.all()[:2])

print(f"Client to test: {c.id_cliente} - {c.nome_razao_social}")
print("Groups to test:")
for g in groups:
    print(f"  - {g.id_grupo}: {g.nome_grupo}")

# Test serializer update (putting exception groups)
payload = {
    'nome_razao_social': c.nome_razao_social + ' TEST_EDIT',
    'cpf_cnpj': c.cpf_cnpj,
    'grupos_excecao': [g.id_grupo for g in groups]
}

print("\n--- UPDATING VIA SERIALIZER ---")
serializer = ClienteSerializer(c, data=payload, partial=True)
if serializer.is_valid():
    updated_client = serializer.save()
    print("Update successful!")
    
    # Reload from DB and check relations
    saved_relations = list(ClienteGrupoExcecao.objects.filter(cliente=updated_client))
    print(f"Found {len(saved_relations)} relations in database table 'clientes_grupos_excecao':")
    for r in saved_relations:
        print(f"  - Client ID {r.cliente_id} -> Group ID {r.grupo_id}")
        
    # Check serialization of relation
    reload_serializer = ClienteSerializer(updated_client)
    print("Serialized groups_excecao in representation:", reload_serializer.data.get('grupos_excecao'))
    
    # Restore original client data
    payload_restore = {
        'nome_razao_social': c.nome_razao_social.replace(' TEST_EDIT', ''),
        'grupos_excecao': []
    }
    restore_serializer = ClienteSerializer(updated_client, data=payload_restore, partial=True)
    if restore_serializer.is_valid():
        restore_serializer.save()
        print("Restored original state successfully!")
else:
    print("Serializer validation errors:", serializer.errors)
