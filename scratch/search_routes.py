import sys
import os
import glob
sys.stdout.reconfigure(encoding='utf-8')

root_dir = 'frontend/src'
for filepath in glob.glob(os.path.join(root_dir, '*.jsx')) + glob.glob(os.path.join(root_dir, 'components/**/*.jsx')) + glob.glob(os.path.join(root_dir, 'pages/**/*.jsx')):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'relatorios' in content.lower() or 'relatórios' in content.lower():
        if 'router' in content.lower() or 'route' in content.lower() or 'path=' in content.lower():
            print(f"Routing/Navigation found in: {filepath}")
            for idx, line in enumerate(content.split('\n')):
                if 'relatorio' in line.lower() or 'relatório' in line.lower():
                    print(f"  {idx+1}: {line.strip()}")
