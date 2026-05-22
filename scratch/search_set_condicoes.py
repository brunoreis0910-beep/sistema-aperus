with open('frontend/src/pages/VendaRapidaPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

matches = [m.start() for m in re.finditer(r'setCondicoesSelecionadas', content)]
results = []
for idx, m in enumerate(matches):
    ctx = content[max(0, m-150):min(len(content), m+350)]
    results.append(f"MATCH {idx+1} at index {m}:\n{ctx}\n{'='*50}\n")

with open('scratch/search_set_condicoes.txt', 'w', encoding='utf-8') as out:
    out.write("\n".join(results))

print("Saved output successfully")
