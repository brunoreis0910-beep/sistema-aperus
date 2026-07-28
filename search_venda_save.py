# search_venda_save.py
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== SEARCHING IN VIEWS_VENDAS.PY ===")
path = r"C:\APERUS\SistemaAperus\api\views_vendas.py"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f):
        if 'def ' in line or 'class ' in line or 'serializer' in line:
            cleaned = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"L{i+1}: {cleaned}")
