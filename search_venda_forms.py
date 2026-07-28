# search_venda_forms.py
import os

print("=== SEARCHING FOR FORMA_PAGAMENTO OR CONDICAO IN SERIALIZERS/VIEWS ===")
keywords = ['forma_pagamento', 'condicao_pagamento', 'condicao', 'faturar', 'faturamento']
for root, dirs, files in os.walk(r"C:\APERUS\SistemaAperus\api"):
    for file in files:
        if file.endswith('.py'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                found = [kw for kw in keywords if kw in content.lower()]
                if len(found) >= 2:
                    print(f"File: {path} (matched: {found})")
            except Exception:
                pass
