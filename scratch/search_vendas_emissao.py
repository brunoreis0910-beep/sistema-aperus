import re

with open(r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\components\Vendas.jsx", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "emitir" in line.lower() or "nfce" in line.lower() or "nfe" in line.lower() or "nfse" in line.lower() or "nse" in line.lower():
        if "api" in line.lower() or "post" in line.lower() or "get" in line.lower() or "axios" in line.lower():
            clean = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"Line {i+1}: {clean}")
