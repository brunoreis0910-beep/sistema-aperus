import os

migrations_dir = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\migrations"
files = [f for f in os.listdir(migrations_dir) if f.endswith('.py') and f != '__init__.py']

for file in sorted(files):
    filepath = os.path.join(migrations_dir, file)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'OrdemServico' in content or 'ordem_servico' in content:
        print(f"File: {file}")
        # print lines that contain OrdemServico or ordem_servico
        for line in content.splitlines():
            if 'OrdemServico' in line or 'ordem_servico' in line:
                print("  ", line.strip())
