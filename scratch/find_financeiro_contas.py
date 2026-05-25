import os

migrations_dir = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\migrations"

def find():
    files = [f for f in os.listdir(migrations_dir) if f.endswith(".py") and not f.startswith("__")]
    files.sort()
    
    for filename in files:
        filepath = os.path.join(migrations_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "financeiro_contas" in content:
            if "CREATE TABLE" in content or "create" in filename:
                print(f"Table reference in: {filename}")

if __name__ == "__main__":
    find()
