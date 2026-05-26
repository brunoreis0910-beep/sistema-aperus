import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection

# Deletar os registros inconsistentes de django_migrations
apps_to_delete = ['comandas', 'cte', 'etiquetas', 'cadastro_clientes', 'mdfe']

with connection.cursor() as cursor:
    placeholders = ', '.join(['%s'] * len(apps_to_delete))
    query = f"DELETE FROM django_migrations WHERE app IN ({placeholders})"
    cursor.execute(query, apps_to_delete)
    print(f"Deleted rows for apps: {apps_to_delete}")

print("Done. Now try running migrate --fake.")
