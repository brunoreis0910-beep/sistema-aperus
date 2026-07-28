# query_formas_pagamento.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import FormaPagamento

print("=== FORMAS DE PAGAMENTO EM DB ===")
for fp in FormaPagamento.objects.all():
    print(f"ID={fp.id_forma_pagamento}, Nome={fp.nome_forma}, CodigoTPag={fp.codigo_t_pag}, DiasVencimento={fp.dias_vencimento}")
