with open(r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\src\components\Vendas.jsx", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "centro" in line.lower() or "departamento" in line.lower():
        if "api" in line.lower() or "get" in line.lower() or "set" in line.lower():
            clean = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"Line {i+1}: {clean}")
