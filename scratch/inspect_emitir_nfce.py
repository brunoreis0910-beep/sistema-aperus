import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

urls_path = r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\urls.py'
with open(urls_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'emitir_nfce' in line:
        print(f"Line {i+1}: {line.strip()}")
