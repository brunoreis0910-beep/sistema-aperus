with open('api/views_hotel.py', 'r', encoding='utf-8') as f:
    content = f.read()

import re
match = re.search(r'def checkout\(.*?\):', content)
if match:
    start = match.start()
    # print about 1500 chars after the match
    print(content[start:start+2500])
else:
    # Print the class names in the file to find where checkout is defined
    classes = re.findall(r'class \w+\(.*?\):', content)
    print("Classes in views_hotel.py:", classes)
    # Search for checkout anywhere
    matches = [m.start() for m in re.finditer(r'checkout', content, re.IGNORECASE)]
    print(f"Matches for 'checkout': {len(matches)}")
    if matches:
        print("First match context:")
        print(content[matches[0]-200:matches[0]+1500])
