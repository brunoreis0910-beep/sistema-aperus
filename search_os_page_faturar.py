# search_os_page_faturar.py
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== SEARCHING IN ORDEMSERVICOPAGE.JSX ===")
path = r"C:\APERUS\SistemaAperus\frontend\src\pages\OrdemServicoPage.jsx"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f):
        if any(kw in line.lower() for kw in ['faturar', 'fechar', 'gera_financeiro', 'financeiro']):
            # Remove non-BMP emojis or encode/decode as ascii ignore
            cleaned = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"L{i+1}: {cleaned}")
