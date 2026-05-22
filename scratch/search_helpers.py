with open('frontend/src/pages/VendaRapidaPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

matches = [m.start() for m in re.finditer(r'const adicionarCondicao', content)]
if matches:
    ctx = content[matches[0]:matches[0]+3000]
    with open('scratch/venda_rapida_helpers.txt', 'w', encoding='utf-8') as out:
        out.write(ctx)
    print("Saved helper functions successfully")
else:
    print("Could not find matching function")
