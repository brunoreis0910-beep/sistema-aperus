# check_managed_models.py
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("=== CHECKING MANAGED IN MODELS.PY ===")
path = r"C:\APERUS\SistemaAperus\api\models.py"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f):
        if 'class ' in line or 'managed =' in line:
            cleaned = line.strip().encode('ascii', errors='replace').decode('ascii')
            print(f"L{i+1}: {cleaned}")
