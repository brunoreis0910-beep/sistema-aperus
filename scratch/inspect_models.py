with open('api/models.py', 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = re.finditer(r'class OrdemServico\(.*?\):', content)
for m in matches:
    # Look ahead for nfse/dps fields
    end = content.find('class ', m.end())
    if end == -1:
        end = len(content)
    os_class_code = content[m.start():end]
    for line in os_class_code.splitlines():
        if 'nfse' in line.lower() or 'dps' in line.lower():
            print(line)
