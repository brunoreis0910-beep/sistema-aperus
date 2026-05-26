import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from django.db.migrations.loader import MigrationLoader

loader = MigrationLoader(connection)
graph = loader.graph

# Print nodes in api app
nodes = sorted([node for node in graph.nodes.values() if node.app_label == 'api'], key=lambda x: x.name)
print("Migration nodes in 'api':")
for node in nodes:
    deps = [f"{d[0]}.{d[1]}" for d in node.dependencies]
    print(f"  {node.name} -> depends on: {deps}")
