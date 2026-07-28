# search_faturar_all.py
import os

print("=== SEARCHING ALL PY FILES IN API/ FOR FATURAR/FATURAMENTO ===")
for root, dirs, files in os.walk(r"C:\APERUS\SistemaAperus\api"):
    for file in files:
        if file.endswith('.py') and not file.startswith('00'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    for i, line in enumerate(f):
                        if 'faturar' in line.lower() or 'faturamento' in line.lower():
                            if 'def ' in line or 'class ' in line or 'path(' in line or '@action' in line:
                                print(f"{file}:{i+1}: {line.strip()}")
            except Exception:
                pass
