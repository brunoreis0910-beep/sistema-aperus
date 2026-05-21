import os
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
import django
django.setup()

from django.db import connection
from api.models_hotel import Quarto, Reserva, TipoQuarto
from api.models import Cliente

print("=== CONEXÃO ===")
print("DB name:", connection.settings_dict['NAME'])

with connection.cursor() as cursor:
    cursor.execute("SHOW TABLES LIKE 'hotel_%'")
    tables = cursor.fetchall()
    print("Tabelas do hotel no banco:")
    for t in tables:
        print(" -", t[0])

print("\n=== CONTAGEM DE REGISTROS ===")
print("Clientes:", Cliente.objects.count())
print("Quartos:", Quarto.objects.count())
print("Tipos de Quarto:", TipoQuarto.objects.count())
print("Reservas:", Reserva.objects.count())

if Quarto.objects.exists():
    print("\nQuartos cadastrados:")
    for q in Quarto.objects.all():
        print(f" - Quarto {q.numero_quarto} (ID: {q.id_quarto}), Status: {q.status_atual}")

if Reserva.objects.exists():
    print("\nReservas cadastradas:")
    for r in Reserva.objects.all():
        print(f" - ID: {r.id_reserva}, Quarto: {r.quarto.numero_quarto}, Hóspede: {r.hospede.nome_razao_social}, Status: {r.status_reserva}")
else:
    print("\nNenhuma reserva cadastrada.")
