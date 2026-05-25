import os
import re

migrations_dir = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\migrations"

def scan():
    files = [f for f in os.listdir(migrations_dir) if f.endswith(".py") and not f.startswith("__")]
    files.sort()
    
    print("Scanning migration files for RunPython without atomic = False...")
    for filename in files:
        filepath = os.path.join(migrations_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "RunPython" in content:
            if "atomic = False" not in content and "atomic=False" not in content:
                print(f"Match: {filename}")

if __name__ == "__main__":
    scan()
