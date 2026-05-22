with open('frontend/src/pages/VendaRapidaPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

print("--- Imports in VendaRapidaPage.jsx ---")
for line in content.splitlines()[:50]:
    if 'import' in line:
        print(line)

print("\n--- Search for '.post' or '.get' or 'fetch' ---")
matches = [m.start() for m in re.finditer(r'\.(post|get|put|request)\(', content)]
print(f"Total dot-method matches: {len(matches)}")
for idx, m in enumerate(matches[:15]):
    print(f"Match {idx+1}:")
    print(content[max(0, m-80):min(len(content), m+200)])
    print("-" * 30)
