import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection
from django.utils import timezone

with connection.cursor() as cursor:
    cursor.execute("INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s)", ['mdfe', '0001_initial', timezone.now()])
    print("Restored mdfe.0001_initial")
