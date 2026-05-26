import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        cursor.execute("SHOW DATABASES")
        print("=== MySQL Databases ===")
        for (db_name,) in cursor:
            print(db_name)
except Exception as e:
    print("Error showing databases:", e)
