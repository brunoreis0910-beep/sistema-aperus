import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT app, name, applied FROM django_migrations ORDER BY applied DESC")
    rows = cursor.fetchall()

print(f"Applied migrations count: {len(rows)}")
print("Last 20 applied migrations:")
for row in rows[:20]:
    print(f"  App: {row[0]}, Name: {row[1]}, Applied: {row[2]}")
