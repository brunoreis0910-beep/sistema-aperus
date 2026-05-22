import re

filepath = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\pages\HotelPMSPage.jsx"

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

words = ['formasPagamento', 'contasBancarias', 'departamentos', 'centrosCusto', 'operacoes', 'loadData', 'api.get']

matches = []
for idx, line in enumerate(lines):
    matched_words = [w for w in words if w in line]
    if matched_words:
        matches.append((idx + 1, matched_words, line.strip()))

print(f"Found {len(matches)} matches.")
for num, words_matched, line in matches[:100]:
    clean_line = line.encode('ascii', errors='replace').decode('ascii')
    print(f"Line {num} {words_matched}: {clean_line}")
