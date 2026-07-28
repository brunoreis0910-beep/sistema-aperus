# search_payment_select_frontend.py
import os

print("=== SEARCHING PAYMENT SELECT IN FRONTEND ===")
for root, dirs, files in os.walk(r"C:\APERUS\SistemaAperus\frontend\src"):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                if 'forma_pagamento' in content or 'formasPagamento' in content or 'formas_pagamento' in content:
                    if 'select' in content.lower() or 'button' in content.lower() or 'menuitem' in content.lower():
                        print(f"File matches: {path}")
            except Exception:
                pass
