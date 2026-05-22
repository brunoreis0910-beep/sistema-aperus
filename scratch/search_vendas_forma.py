with open(r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\components\Vendas.jsx", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "formapagamento" in line.lower() or "forma_pagamento" in line.lower():
        if "select" in line.lower() or "menuitem" in line.lower() or "value=" in line.lower():
            clean = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"Line {i+1}: {clean}")
