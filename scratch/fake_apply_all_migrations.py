import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from django.utils import timezone
from django.db.migrations.loader import MigrationLoader

loader = MigrationLoader(connection)
graph = loader.graph

# Encontrar todas as migrações disponíveis no grafo do Django
all_migrations = list(graph.nodes.keys())
print(f"Total migrations in graph: {len(all_migrations)}")

with connection.cursor() as cursor:
    # Obter migrações já aplicadas
    cursor.execute("SELECT app, name FROM django_migrations")
    applied = set(cursor.fetchall())
    print(f"Already applied in DB: {len(applied)}")

    inserted = 0
    for app, name in all_migrations:
        if (app, name) not in applied:
            cursor.execute(
                "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s)",
                [app, name, timezone.now()]
            )
            inserted += 1

print(f"Successfully fake-applied {inserted} migrations in django_migrations table.")
