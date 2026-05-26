import urllib.request
import json

base_url = "http://localhost:8006/api/saas/licenca/"
cnpj = "48010363000134"

tests = [
    # 1. Query only CNPJ (should fallback to the first based on is_test_environment, which is False, i.e., central)
    {"url": f"{base_url}?cnpj={cnpj}", "desc": "Querying with CNPJ only (should return production)"},
    # 2. Query CNPJ with schema_name=central
    {"url": f"{base_url}?cnpj={cnpj}&schema_name=central", "desc": "Querying CNPJ with schema_name=central"},
    # 3. Query CNPJ with schema_name=testes
    {"url": f"{base_url}?cnpj={cnpj}&schema_name=testes", "desc": "Querying CNPJ with schema_name=testes"},
]

print("=== Testing Licensing Endpoints ===")
for t in tests:
    print(f"Test: {t['desc']}")
    print(f"Requesting: {t['url']}")
    try:
        req = urllib.request.Request(t['url'], method='GET')
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            body = response.read().decode('utf-8')
            print(f"Response Status: {status_code}")
            print(f"Response Body: {body}")
    except Exception as e:
        print(f"Error executing test: {e}")
    print("-" * 50)
