import os
import django
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from api.models import Compra

print("Compra managed:", Compra._meta.managed)
print("Compra db_table:", Compra._meta.db_table)

with connection.cursor() as cursor:
    cursor.execute("SHOW CREATE TABLE compras")
    print("\nCentral Table Create Statement:")
    print(cursor.fetchone()[1])
