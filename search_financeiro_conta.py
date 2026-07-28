# search_financeiro_conta.py
import os

print("=== SEARCHING FOR FINANCEIROCONTA CLASS ===")
path = r"C:\APERUS\SistemaAperus\api\models.py"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

in_class = False
class_lines = []
for i, line in enumerate(lines):
    if line.strip().startswith("class FinanceiroConta("):
        in_class = True
    elif in_class and line.strip().startswith("class "):
        in_class = False
    
    if in_class:
        class_lines.append((i+1, line))

for lno, text in class_lines[:100]:
    print(f"L{lno}: {text.strip()}")
