import os
import re

def scan_files():
    api_dir = 'api'
    print(f"Scanning Python files in {api_dir} for non-ASCII characters inside print statements...")
    
    # Matches print(...) calls. We need to be careful with multi-line print statements but simple regex works for general detection.
    print_regex = re.compile(r'print\s*\(\s*f?["\'](.*?)(?:["\']\s*\)|["\'])', re.DOTALL)
    
    for root, dirs, files in os.walk(api_dir):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Search for prints
                    matches = print_regex.finditer(content)
                    for match in matches:
                        text = match.group(1)
                        # Check if it has any non-ASCII characters
                        if not all(ord(c) < 128 for c in text):
                            # Check if it is a unicode emoji or special symbol
                            non_ascii = [c for c in text if ord(c) >= 128]
                            print(f"{path}: Line {content.count('\n', 0, match.start()) + 1}: print({text!r}) -> contains: {''.join(non_ascii)}")
                except Exception as e:
                    print(f"Error reading {path}: {e}")

if __name__ == '__main__':
    scan_files()
