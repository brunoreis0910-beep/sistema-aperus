# inspect_venda_financeiro.py
import re

file_path = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\pages\VendaRapidaPage.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for keywords
keywords = ["centro", "custo", "departamento", "condicao", "parcela", "financeiro", "forma_pagamento", "gerar_financeiro"]
lines = content.splitlines()

matches = []
for i, line in enumerate(lines):
    for kw in keywords:
        if kw in line.lower():
            matches.append((i+1, line.strip()))
            break

output_path = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\scratch\inspect_results.txt"
with open(output_path, "w", encoding="utf-8") as out:
    out.write(f"Total matching lines: {len(matches)}\n")
    for num, line in matches:
        out.write(f"L{num}: {line}\n")

print("Done! Results written to scratch/inspect_results.txt")
