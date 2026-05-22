with open('api/views_hotel.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The checkout starts around line 55
for k in range(54, min(220, len(lines))):
    print(f"{k+1}: {lines[k]}", end="")
