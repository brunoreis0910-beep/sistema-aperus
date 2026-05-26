import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from django.db.migrations.loader import MigrationLoader

loader = MigrationLoader(connection)
print("Consistent:", loader.check_consistent_history)
try:
    loader.check_consistent_history(connection)
    print("History is consistent!")
except Exception as e:
    print("Inconsistent:", e)
