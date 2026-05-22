import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

page_path = r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\pages\HotelPMSPage.jsx'
with open(page_path, 'r', encoding='utf-8-sig', errors='ignore') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'user' in line.lower() or 'auth' in line.lower() or 'session' in line.lower():
        if len(line.strip()) < 120:
            print(f"Line {i+1}: {line.strip()}")
