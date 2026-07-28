# search_venda_views.py
import os

print("=== SEARCHING VENDA VIEWS IN URLS.PY ===")
path = r"C:\APERUS\SistemaAperus\api\urls.py"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f):
        if 'venda' in line.lower() and ('path' in line or 'router.register' in line):
            print(f"L{i+1}: {line.strip()}")
