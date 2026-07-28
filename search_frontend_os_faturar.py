# search_frontend_os_faturar.py
import os

print("=== SEARCHING FRONTEND FOR OS ACTIONS ===")
for root, dirs, files in os.walk(r"C:\APERUS\SistemaAperus\frontend\src"):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                if 'ordem-servico' in content.lower() and ('faturar' in content.lower() or 'fechar' in content.lower() or 'gera_financeiro' in content.lower()):
                    print(f"File matches: {path}")
            except Exception:
                pass
