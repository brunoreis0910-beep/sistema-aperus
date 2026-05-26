import os

content = open('api/migrations/0001_initial.py', encoding='utf-8', errors='ignore').read()
if 'mapacarga' in content.lower():
    print("Found mapacarga in 0001_initial.py")
else:
    print("NOT found mapacarga in 0001_initial.py")
