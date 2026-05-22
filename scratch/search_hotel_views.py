import re

filepath = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\views_hotel.py"

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

pattern = re.compile(r'def checkout|class.*checkout', re.IGNORECASE)

matches = []
for idx, line in enumerate(lines):
    if pattern.search(line):
        matches.append((idx + 1, line.strip()))

for num, line in matches:
    print(f"Line {num}: {line}")
