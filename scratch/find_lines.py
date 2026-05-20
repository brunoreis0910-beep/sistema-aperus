import sys

filepath = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\pages\ClientePageCompleteFixed.jsx"
query = "grupos_excecao"

with open(filepath, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if query in line:
            print(f"{i+1}: {line.strip()}")
