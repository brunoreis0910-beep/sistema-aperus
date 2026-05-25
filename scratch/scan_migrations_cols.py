import os

migrations_dir = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\migrations"
files = [f for f in os.listdir(migrations_dir) if f.endswith('.py') and f != '__init__.py']

for file in sorted(files):
    filepath = os.path.join(migrations_dir, file)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    for col in ['status_os', 'id_os', 'laudo_tecnico']:
        if col in content:
            print(f"Found '{col}' in {file}")
