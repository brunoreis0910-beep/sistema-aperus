import os

search_dir = r"C:\Projetos\SistemaGerencial\aperus_mae\frontend\src"
terms = ["saas", "saascliente", "saasadmin"]

print("=== Search Results ===")
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.json', '.html')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                for term in terms:
                    if term in content.lower():
                        print(f"Found '{term}' in {os.path.relpath(path, search_dir)}")
                        # Print matching lines
                        lines = content.splitlines()
                        for i, line in enumerate(lines):
                            if term in line.lower():
                                print(f"  Line {i+1}: {line.strip()[:120]}")
            except Exception as e:
                pass
