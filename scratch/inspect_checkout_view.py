import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

views_hotel_path = r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\views_hotel.py'
with open(views_hotel_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

import re
match = re.search(r'def checkout', content)
if match:
    pos = match.start()
    print("Found checkout view (extended part 3):")
    print(content[pos+4000:pos+6500])
else:
    print("checkout not found")
