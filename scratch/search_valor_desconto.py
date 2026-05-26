import os

for f in sorted(os.listdir('api/migrations')):
    if f.endswith('.py') and not f.startswith('__'):
        content = open(os.path.join('api/migrations', f), encoding='utf-8', errors='ignore').read()
        if 'valor_desconto' in content:
            print(f"File: {f}")
            for line in content.split('\n'):
                if 'model_name=' in line or 'name=' in line:
                    if 'venda' in line or 'valor_desconto' in line:
                        print(f"  {line.strip()}")
