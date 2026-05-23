import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/src/pages/RelatoriosPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# find tabs or filters
import re
matches = [m.start() for m in re.finditer(r'value\s*=\s*[\'"]', content)]
for idx, line in enumerate(content.split('\n')):
    if 'tab' in line.lower() or 'value' in line.lower() or 'filter' in line.lower():
        if idx > 400 and idx < 550: # around the render tabs area
            print(f"{idx+1}: {line.strip()}")
