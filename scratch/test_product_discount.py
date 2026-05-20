import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Cliente, Produto
from api.logic.descontos import calcular_preco_final

try:
    c = Cliente.objects.get(id_cliente=3)
    p = Produto.objects.filter(codigo_produto="0537112283").first()
        
    if p:
        print(f"Produto: {p.id_produto} | Nome: {p.nome_produto} | Grupo: {p.id_grupo} | Preço: {p.preco_web}")
        res = calcular_preco_final(p, c, 122.38)
        print("Resultado simulação:", res)
    else:
        print("Produto não encontrado por código!")
except Exception as e:
    print("Erro:", e)
