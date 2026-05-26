import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from django.db.migrations.loader import MigrationLoader

loader = MigrationLoader(connection)
graph = loader.graph

print("Leaf nodes for 'api' app:")
for leaf in graph.leaf_nodes('api'):
    print(f"  Leaf: {leaf}")

# Encontrar os filhos de 'api.0002_initial'
for node in graph.nodes.values():
    if node.app_label == 'api':
        for dep in node.dependencies:
            if dep == ('api', '0002_initial'):
                print(f"Node depending on api.0002_initial: {node.app_label}.{node.name}")
