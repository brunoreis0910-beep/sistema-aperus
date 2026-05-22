import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

backend_dir = r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api'
for filename in os.listdir(backend_dir):
    if filename.endswith('.py'):
        filepath = os.path.join(backend_dir, filename)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        import re
        matches = re.findall(r'class \w*Venda\w*\(.*', content)
        if matches:
            print(f"Found in {filename}:")
            for m in matches:
                print(f"  {m}")
