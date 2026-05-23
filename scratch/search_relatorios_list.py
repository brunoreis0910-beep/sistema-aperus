import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/src/pages/RelatoriosPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find the const relatorios array and print the whole array
start_idx = content.find('const relatorios = [')
end_idx = content.find('];', start_idx)
if start_idx != -1 and end_idx != -1:
    print(content[start_idx:end_idx+2])
else:
    print("Not found")
