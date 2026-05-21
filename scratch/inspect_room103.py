import os
import sys

# Adiciona o diretório pai (raiz do projeto) ao path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
import django
django.setup()

from api.models_hotel import Quarto, Reserva

print("=== QUARTOS ===")
quartos = Quarto.objects.all()
for q in quartos:
    print(f"ID: {q.id_quarto} | Número: {q.numero_quarto} | Status: {q.status_atual} | Tipo: {q.tipo.nome}")

print("\n=== RESERVAS DO QUARTO 103 ===")
res_103 = Reserva.objects.filter(quarto__numero_quarto='103')
if not res_103.exists():
    print("Nenhuma reserva encontrada para o Quarto 103.")
for r in res_103:
    print(f"ID: {r.id_reserva} | Hóspede: {r.hospede.nome_razao_social} | Entrada: {r.data_entrada_prevista} | Saída: {r.data_saida_prevista} | Status: {r.status_reserva}")

print("\n=== TODAS AS RESERVAS ATIVAS (CONFIRMADA OU CHECKIN) ===")
res_ativas = Reserva.objects.filter(status_reserva__in=['confirmada', 'checkin'])
for r in res_ativas:
    print(f"ID: {r.id_reserva} | Quarto: {r.quarto.numero_quarto} | Hóspede: {r.hospede.nome_razao_social} | Entrada: {r.data_entrada_prevista} | Saída: {r.data_saida_prevista} | Status: {r.status_reserva}")
