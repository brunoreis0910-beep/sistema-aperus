import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Cliente

try:
    c = Cliente.objects.get(id_cliente=3)
    print(f"Cliente: {c.nome_razao_social}")
    print(f"Tipo Desconto: {c.tipo_desconto}")
    print(f"Valor Desconto: {c.valor_desconto}")
    print(f"Priorizar Desconto Cliente: {c.priorizar_desconto_cliente}")
    print("Exceções:", [g.nome for g in c.grupos_excecao.all()])
except Exception as e:
    print("Erro:", e)
