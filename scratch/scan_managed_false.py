import os

migrations_dir = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\migrations"
files = [f for f in os.listdir(migrations_dir) if f.endswith('.py') and f != '__init__.py']

for file in sorted(files):
    filepath = os.path.join(migrations_dir, file)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'compra' in content.lower():
        for line in content.splitlines():
            if 'managed' in line:
                print(f"File: {file} -> {line.strip()}")
