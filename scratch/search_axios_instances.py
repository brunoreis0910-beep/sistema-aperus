with open('frontend/src/pages/VendaRapidaPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find references to axiosInstance.post or saving financial data
matches = [m.start() for m in re.finditer(r'axiosInstance', content)]

results = []
for idx, m in enumerate(matches):
    ctx = content[max(0, m-150):min(len(content), m+350)]
    results.append(f"MATCH {idx+1} at index {m}:\n{ctx}\n{'='*50}\n")

with open('scratch/axios_matches.txt', 'w', encoding='utf-8') as out:
    out.write("\n".join(results))

print(f"Written {len(matches)} matches to scratch/axios_matches.txt")
