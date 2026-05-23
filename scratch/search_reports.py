import sys
import os
import glob
sys.stdout.reconfigure(encoding='utf-8')

root_dir = 'frontend/src'
for filepath in glob.glob(os.path.join(root_dir, '**/*.jsx'), recursive=True):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    if 'relatorio' in content.lower() or 'relatório' in content.lower():
        print(f"Found keyword in {filepath}")
        # print some lines containing the keyword
        for idx, line in enumerate(content.split('\n')):
            if 'relatorio' in line.lower() or 'relatório' in line.lower():
                print(f"  {idx+1}: {line.strip()}")
