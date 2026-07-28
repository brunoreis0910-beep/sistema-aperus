# search_os_faturamento.py
import os

print("=== SEARCHING ORDEMSERVICO AND FATURAR ===")
for root, dirs, files in os.walk(r"C:\APERUS\SistemaAperus\api"):
    for file in files:
        if file.endswith('.py'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                if 'ordemservico' in content.lower() and 'faturar' in content.lower():
                    print(f"File matches: {path}")
            except Exception:
                pass
