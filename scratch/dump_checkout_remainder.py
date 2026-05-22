with open('api/views_hotel.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for k in range(220, min(250, len(lines))):
    print(f"{k+1}: {lines[k]}", end="")
