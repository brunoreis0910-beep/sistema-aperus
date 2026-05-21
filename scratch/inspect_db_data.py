import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projeto_gerencial.settings")
django.setup()

from api.models_hotel import Reserva, Quarto, TipoQuarto

print("--- TIPOS DE QUARTO ---")
for t in TipoQuarto.objects.all():
    print(t.id_tipo_quarto, t.nome, t.valor_diaria_padrao)

print("\n--- QUARTOS ---")
for q in Quarto.objects.all():
    print(q.id_quarto, q.numero_quarto, q.status_atual)

print("\n--- RESERVAS ---")
for r in Reserva.objects.all():
    print(
        r.id_reserva,
        "Quarto ID:", r.quarto_id,
        "Hospede:", r.hospede.nome_razao_social,
        "Entrada Prev:", r.data_entrada_prevista,
        "Saida Prev:", r.data_saida_prevista,
        "Checkin Real:", r.data_checkin_real,
        "Checkout Real:", r.data_checkout_real,
        "Status:", r.status_reserva
    )
