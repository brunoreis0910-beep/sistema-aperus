import os
import django
import sys

# Setup django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Cliente, Produto
from api.logic.descontos import calcular_preco_final

print("--- Clientes com desconto configurado ---")
clientes_com_desconto = Cliente.objects.filter(valor_desconto__gt=0)
for c in clientes_com_desconto:
    print(f"ID: {c.id_cliente} | Nome: {c.nome_razao_social} | Tipo: {c.tipo_desconto} | Valor: {c.valor_desconto} | Priorizar: {c.priorizar_desconto_cliente} | Exceções: {[g.nome_grupo for g in c.grupos_excecao.all()]}")

if not clientes_com_desconto.exists():
    print("Nenhum cliente com desconto > 0 encontrado no banco de dados!")
else:
    # Testar com o primeiro cliente
    c = clientes_com_desconto.first()
    p = Produto.objects.first()
    if p:
        print(f"\n--- Simulando desconto para Cliente {c.nome_razao_social} e Produto {p.nome_produto} ---")
        res = calcular_preco_final(p, c, 100.00)
        print("Resultado:", res)
    else:
        print("Nenhum produto encontrado para simulação.")
