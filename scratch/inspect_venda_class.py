with open('api/models.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'class Venda(models.Model):' in line:
        print(f"Start index: {idx+1}")
        for k in range(idx, min(idx + 100, len(lines))):
            print(f"{k+1}: {lines[k]}", end="")
        break
