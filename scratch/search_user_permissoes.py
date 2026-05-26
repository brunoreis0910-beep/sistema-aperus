with open('api/models.py', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'class UserPermissoes' in line:
        print(f"Found UserPermissoes at line {i+1}")
