import re
import sys

filepath = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\components\Vendas.jsx"

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

pattern = re.compile(r'emit|nfe|nfce|nse|nfs|nfse|print|imprimir|impressao', re.IGNORECASE)

matches = []
for idx, line in enumerate(lines):
    if pattern.search(line):
        matches.append((idx + 1, line.strip()))

print(f"Found {len(matches)} matches.")
for num, line in matches[:150]:
    # clean line to ascii only to avoid windows console print errors
    clean_line = line.encode('ascii', errors='replace').decode('ascii')
    print(f"Line {num}: {clean_line}")
