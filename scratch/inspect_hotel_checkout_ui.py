with open('frontend/src/pages/HotelPMSPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Search for checkout occurrences
matches = [m.start() for m in re.finditer(r'checkout', content, re.IGNORECASE)]
print(f"Matches for 'checkout': {len(matches)}")

# Save matching lines/contexts around checkout call to a file
results = []
for idx, m in enumerate(matches):
    ctx = content[max(0, m-150):min(len(content), m+350)]
    results.append(f"MATCH {idx+1} at index {m}:\n{ctx}\n{'='*50}\n")

with open('scratch/hotel_checkout_ui.txt', 'w', encoding='utf-8') as out:
    out.write("\n".join(results))

print("Saved output to scratch/hotel_checkout_ui.txt")
