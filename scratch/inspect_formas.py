import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import FormaPagamento
print("FormaPagamento entries:")
for fp in FormaPagamento.objects.all():
    print(f"ID: {fp.pk}, Name: {fp.nome_forma}, Code (tPag): {fp.codigo_t_pag}")
