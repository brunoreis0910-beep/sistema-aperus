import os

content = open('api/migrations/0002_initial.py', encoding='utf-8', errors='ignore').read()
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'mapacarga' in line.lower():
        print(f"{i+1}: {line.strip()}")
