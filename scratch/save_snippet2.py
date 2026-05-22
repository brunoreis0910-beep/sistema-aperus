with open('frontend/src/pages/VendaRapidaPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
for k in range(2549, min(2700, len(lines))):
    output_lines.append(f"{k+1}: {lines[k]}")

with open('scratch/venda_rapida_financeiro_flow2.txt', 'w', encoding='utf-8') as out:
    out.writelines(output_lines)

print("Saved output to scratch/venda_rapida_financeiro_flow2.txt")
