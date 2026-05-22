import re

filepath = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\views_vendas.py"

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

pattern = re.compile(r'def.*emitir|class.*emitir|emitir_nfe|emitir_nfce|emitir_nfse', re.IGNORECASE)

matches = []
for idx, line in enumerate(lines):
    if pattern.search(line):
        matches.append((idx + 1, line.strip()))

for num, line in matches:
    clean_line = line.encode('ascii', errors='replace').decode('ascii')
    print(f"Line {num}: {clean_line}")
