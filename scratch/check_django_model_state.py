import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from django.db.migrations.loader import MigrationLoader
from django.db.migrations.state import ProjectState

loader = MigrationLoader(connection)

# We want to see if mapacarga is in the initial state of the project
# before running the unapplied migrations.
# To do this, we get the list of applied migrations:
applied_migrations = loader.applied_migrations
print(f"Applied migrations: {len(applied_migrations)}")

state = ProjectState()
# Let's populate state step by step for the applied migrations
applied_list = sorted(list(applied_migrations))

# Let's get the execution plan
from django.db.migrations.executor import MigrationExecutor
executor = MigrationExecutor(connection)
plan = executor.migration_plan(executor.loader.graph.leaf_nodes())

print("Migration plan (unapplied):")
for migration, backwards in plan[:10]:
    print(f"  {migration.app_label}.{migration.name} (backwards={backwards})")
