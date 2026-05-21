import re

with open("C:/Projetos/SistemaGerencial/1_Sistema_Gerencial_Backend/frontend/src/pages/HotelPMSPage.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "while" in line or "for (" in line or "forEach" in line:
        print(f"Line {i}: {line.strip()}")
