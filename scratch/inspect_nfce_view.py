import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

backend_dir = r'C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api'
for filename in os.listdir(backend_dir):
    if filename.endswith('.py'):
        filepath = os.path.join(backend_dir, filename)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if 'class NFCeView' in content:
            print(f"Found in {filename}")
            # print surrounding lines
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'class NFCeView' in line:
                    print(f"  Line {i+1}: {line.strip()}")
                    # Print the next 60 lines
                    for j in range(i+1, min(i+61, len(lines))):
                        print(f"    {j+1}: {lines[j]}")
                    break
