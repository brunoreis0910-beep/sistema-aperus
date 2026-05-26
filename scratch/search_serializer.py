with open('api/serializers.py', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'class UserSerializer' in line:
        print(f"Found UserSerializer at line {i+1}")
