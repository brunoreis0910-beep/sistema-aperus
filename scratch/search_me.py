import os

with open('api/views.py', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'me' in line or 'Usuario' in line or 'User' in line:
        if 'def ' in line or 'class ' in line:
            print(f"{i+1}: {line.strip()}")
