import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\views_vendas.py', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

import re
matches = [m.start() for m in re.finditer(r'def post', content)]
for pos in matches:
    # Print the lines containing and following def post
    print(content[pos:pos+1500])
    print("=" * 60)
