import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

backend_dir = r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api'
for filename in os.listdir(backend_dir):
    if filename.endswith('.py'):
        filepath = os.path.join(backend_dir, filename)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if 'estoque' in content or 'baixa' in content:
            print(f"Found in {filename}")
