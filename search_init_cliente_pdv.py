# search_init_cliente_pdv.py
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== SEARCHING INITIAL CLIENT IN VENDARAPIDAPAGE.JSX ===")
path = r"C:\APERUS\SistemaAperus\frontend\src\pages\VendaRapidaPage.jsx"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f):
        if 'const [cliente,' in line or 'cliente_nfce' in line or 'default_cliente' in line:
            cleaned = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"L{i+1}: {cleaned}")
