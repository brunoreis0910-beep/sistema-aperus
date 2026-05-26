import os

content = open('api/migrations/0179_saascliente_venda_valor_desconto_saasclientecontrato_and_more.py', encoding='utf-8', errors='ignore').read()
for i, line in enumerate(content.split('\n')):
    if 'valor_desconto' in line or 'venda' in line:
        print(f"{i+1}: {line}")
