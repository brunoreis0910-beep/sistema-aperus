import os
import django
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from api.models import OrdemServico

print("OrdemServico managed:", OrdemServico._meta.managed)
print("OrdemServico db_table:", OrdemServico._meta.db_table)

with connection.cursor() as cursor:
    cursor.execute("SHOW CREATE TABLE ordem_servico")
    print("\nCentral Table Create Statement:")
    print(cursor.fetchone()[1])
