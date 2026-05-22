import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\services\simpliss_rest_service.py"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(200, min(len(lines), 350)):
    print(f"{idx+1}: {lines[idx].rstrip()}")
