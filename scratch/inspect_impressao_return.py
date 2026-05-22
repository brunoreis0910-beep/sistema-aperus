# inspect_impressao_return.py
file_path = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\hooks\useImpressaoVenda.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()
last_lines = "\n".join(lines[-100:])
print(last_lines.encode('ascii', errors='replace').decode('ascii'))
