with open('api/views_vendas.py', 'r', encoding='utf-8') as f:
    content = f.read()

import re

results = []
for view_name in ['NFeView', 'NFCeView']:
    match = re.search(fr'class {view_name}\(.*?\):', content)
    if match:
        start = match.start()
        ctx = content[start:start+2500]
        results.append(f"=== {view_name} ===\n{ctx}\n")

with open('scratch/search_views_vendas.txt', 'w', encoding='utf-8') as out:
    out.write("\n".join(results))

print("Saved successfully")
