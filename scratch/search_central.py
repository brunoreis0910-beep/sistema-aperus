with open('frontend/src/components/DashboardLayoutClean.jsx', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'saas' in line.lower() or 'central' in line.lower():
        print(f"{i+1}: {line.strip()}")
