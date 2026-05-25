import os
import sys

# Find where OrdemServico is defined in api/models.py
models_path = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\models.py"
with open(models_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

os_found = False
count = 0
for idx, line in enumerate(lines):
    if "class OrdemServico(" in line or "class OrdemServicoItem(" in line:
        print(f"--- Line {idx+1} ---")
        # print next 40 lines
        for offset in range(0, 50):
            if idx + offset < len(lines):
                print(lines[idx + offset], end="")
        print("\n" + "="*40 + "\n")
