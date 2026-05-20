import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from api.models import Cliente, ClienteGrupoExcecao

with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES LIKE 'clientes_grupos_excecao'")
    table_exists = cursor.fetchone()
    print("Table clientes_grupos_excecao exists:", table_exists)
    
    if table_exists:
        cursor.execute("DESCRIBE clientes_grupos_excecao")
        columns = cursor.fetchall()
        print("Columns:")
        for col in columns:
            print(col)
            
        cursor.execute("SELECT COUNT(*) FROM clientes_grupos_excecao")
        count = cursor.fetchone()
        print("Row count:", count[0])
