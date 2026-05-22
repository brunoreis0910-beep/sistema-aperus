import os
import re

root = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src"

pattern = re.compile(r'emitir_nfce|emitir_nfe|emitir_nfse|emitir_nse|emitir_nfs|/emitir', re.IGNORECASE)

matches = []
for dirpath, _, filenames in os.walk(root):
    for f in filenames:
        if f.endswith('.jsx') or f.endswith('.js'):
            fullpath = os.path.join(dirpath, f)
            with open(fullpath, 'r', encoding='utf-8', errors='ignore') as file:
                for idx, line in enumerate(file):
                    if pattern.search(line):
                        matches.append((f, idx + 1, line.strip()))

print(f"Found {len(matches)} matches in frontend/src:")
for filename, num, line in matches[:100]:
    clean_line = line.encode('ascii', errors='replace').decode('ascii')
    print(f"{filename}:{num}: {clean_line}")
