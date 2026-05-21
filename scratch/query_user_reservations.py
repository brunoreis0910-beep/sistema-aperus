import os
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
import django
django.setup()

from api.models_hotel import Quarto, Reserva

print("=== QUARTO 103 ===")
q = Quarto.objects.filter(numero_quarto='103').first()
if q:
    print(f"Quarto ID: {q.id_quarto} | Número: {q.numero_quarto} | Status Atual: {q.status_atual} | Tipo: {q.tipo.nome}")
else:
    print("Quarto 103 não cadastrado.")

print("\n=== RESERVAS PARA O QUARTO 103 ===")
reservas = Reserva.objects.filter(quarto__numero_quarto='103')
print(f"Total de reservas para o quarto 103: {reservas.count()}")
for r in reservas:
    print(f"ID: {r.id_reserva}")
    print(f"  Hóspede: {r.hospede.nome_razao_social} (ID: {r.hospede.id_cliente})")
    print(f"  Status Reserva: {r.status_reserva}")
    print(f"  Data Entrada Prevista: {r.data_entrada_prevista}")
    print(f"  Data Saída Prevista: {r.data_saida_prevista}")
    print(f"  Data Check-in Real: {r.data_checkin_real}")
    print(f"  Data Check-out Real: {r.data_checkout_real}")
