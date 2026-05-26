import os

for f in sorted(os.listdir('api/migrations')):
    if f.endswith('.py') and not f.startswith('__'):
        content = open(os.path.join('api/migrations', f), encoding='utf-8', errors='ignore').read()
        if 'mapacarga' in content.lower() or 'mapa_carga' in content.lower():
            print(f"File: {f}")
            # print dependencies and model creations
            lines = content.split('\n')
            for line in lines[:20]:
                if 'dependencies' in line or 'name=' in line or 'CreateModel' in line:
                    print(f"  {line.strip()}")
