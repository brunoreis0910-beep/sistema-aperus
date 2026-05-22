with open('frontend/src/pages/VendaRapidaPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find state variables or helper functions related to condicoesSelecionadas
terms = ['condicoesSelecionadas', 'adicionarCondicao', 'openCondicoesPagamento', 'formaPagamentoAtual']
for term in terms:
    matches = [m.start() for m in re.finditer(term, content)]
    print(f"Term '{term}': {len(matches)} matches")

# Save a snippet around the rendering of openCondicoesPagamento Dialog
dialog_matches = [m.start() for m in re.finditer(r'<Dialog[^>]*openCondicoesPagamento', content)]
print(f"Dialog openCondicoesPagamento: {len(dialog_matches)}")
if dialog_matches:
    m = dialog_matches[0]
    ctx = content[m:m+2500]
    with open('scratch/venda_rapida_dialog_snippet.txt', 'w', encoding='utf-8') as out:
        out.write(ctx)
    print("Saved dialog snippet to scratch/venda_rapida_dialog_snippet.txt")
