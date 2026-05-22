with open('api/urls.py', 'r', encoding='utf-8') as f:
    content = f.read()

for line in content.splitlines():
    if 'contas' in line.lower() or 'financeiro' in line.lower() or 'receber' in line.lower() or 'pagamento' in line.lower() or 'vendas' in line.lower():
        print(line)
