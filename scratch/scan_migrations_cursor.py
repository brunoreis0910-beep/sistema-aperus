import os

migrations_dir = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\migrations"

def scan():
    files = [f for f in os.listdir(migrations_dir) if f.endswith(".py") and not f.startswith("__")]
    files.sort()
    
    print("Scanning migration files for connection.cursor() or django.db connection usage...")
    for filename in files:
        filepath = os.path.join(migrations_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "connection.cursor" in content:
            print(f"Match connection.cursor: {filename}")
        if "from django.db import" in content and "connection" in content:
            # Check if it actually uses it
            if "connection." in content:
                print(f"Match connection usage: {filename}")

if __name__ == "__main__":
    scan()
