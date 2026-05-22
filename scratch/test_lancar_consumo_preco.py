import os, sys, django
from decimal import Decimal

sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Produto, Estoque, Cliente
from api.models_hotel import Quarto, Reserva, ConsumoQuarto
from django.utils import timezone

def test_lancar_consumo():
    # 1. Pega um produto
    produto = Produto.objects.filter(id_produto=61).first() # ABRACADEIRA V-BAND W4 22-102-115
    if not produto:
        print("Produto 61 não encontrado. Pegando o primeiro produto com estoque cadastrado.")
        estoque_com_valor = Estoque.objects.filter(valor_venda__gt=0).first()
        if estoque_com_valor:
            produto = estoque_com_valor.id_produto
        else:
            produto = Produto.objects.first()
            
    if not produto:
        print("Nenhum produto cadastrado.")
        return
        
    print(f"Produto selecionado: ID {produto.id_produto} - {produto.nome_produto}")
    
    # 2. Verificar os valores do produto
    print(f"  - preco_web do Produto: {produto.preco_web}")
    estoque_rec = Estoque.objects.filter(id_produto=produto, valor_venda__gt=0).order_by('-valor_venda').first()
    print(f"  - valor_venda no Estoque (esperado): {estoque_rec.valor_venda if estoque_rec else 'Nenhum'}")
    
    # 3. Simular a lógica de lancar_consumo
    # Se valor_unitario não for enviado
    valor_unitario = None
    if not valor_unitario:
        estoque_rec_logica = Estoque.objects.filter(id_produto=produto, valor_venda__gt=0).order_by('-valor_venda').first()
        if estoque_rec_logica:
            valor_unitario = estoque_rec_logica.valor_venda
        else:
            valor_unitario = produto.preco_web or Decimal('0.00')
            
    print(f"Resultado da lógica - valor_unitario obtido: {valor_unitario}")

if __name__ == '__main__':
    test_lancar_consumo()
