import re

filepath = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\components\Vendas.jsx"

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

pattern = re.compile(r'emit|nfce|nfe|nfs|nse|print|imprimir|impressao', re.IGNORECASE)

matches = []
for idx in range(3800, len(lines)):
    line = lines[idx]
    if pattern.search(line):
        matches.append((idx + 1, line.strip()))

print(f"Found {len(matches)} matches from line 3800 onwards.")
for num, line in matches[:150]:
    clean_line = line.encode('ascii', errors='replace').decode('ascii')
    print(f"Line {num}: {clean_line}")
