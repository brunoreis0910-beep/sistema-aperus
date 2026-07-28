# search_vendas_component_payments.py
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== SEARCHING PAYMENTS IN VENDAS.JSX ===")
path = r"C:\APERUS\SistemaAperus\frontend\src\components\Vendas.jsx"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f):
        if any(kw in line.lower() for kw in ['formaspagamento', 'formapagamento', 'forma_pagamento', 'pagamento']):
            cleaned = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"L{i+1}: {cleaned}")
