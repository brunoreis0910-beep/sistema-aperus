import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\models.py', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

import re
matches = re.findall(r'class Comanda.*', content)
for m in matches:
    print(m)
