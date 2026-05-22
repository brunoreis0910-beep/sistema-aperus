with open('frontend/src/pages/VendaRapidaPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'contas/' in line or 'contas' in line and ('post' in line or 'save' in line or 'axios' in line):
        print(f"Line {idx+1}: {line.strip()}")
        # print 20 lines around it
        start = max(0, idx - 10)
        end = min(len(lines), idx + 25)
        for k in range(start, end):
            print(f"  {k+1}: {lines[k]}", end="")
        print("-" * 50)
