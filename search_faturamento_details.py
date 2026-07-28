# search_faturamento_details.py
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== SEARCHING FINANCEIRO IN VIEWS_FATURAMENTO.PY ===")
path = r"C:\APERUS\SistemaAperus\api\views_faturamento.py"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f):
        if 'FinanceiroConta.objects.create' in line or 'FinanceiroConta(' in line:
            print(f"L{i+1}: {line.strip()}")
