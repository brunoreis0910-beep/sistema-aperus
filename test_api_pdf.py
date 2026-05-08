#!/usr/bin/env python
"""
Script de teste para validar o endpoint de PDF de vendas
"""
import requests
import json

base_url = 'http://localhost:8005'

# Token JWT válido
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc4MjY3NTU1LCJpYXQiOjE3NzgyMzg3NTUsImp0aSI6IjRlY2MyYTIyNDFiZDQzODQ4NjhkMGEzMzA1MGI0NmIzIiwidXNlcl9pZCI6IjIifQ.vCZdqBdgprnWAgZ2LyYJVemiM7sSWPZCuIJZVi1cTDo'

# Parâmetros da requisição  
params = {
    'data_inicio': '2026-05-01',
    'data_fim': '2026-05-08',
    'status': 'todos',
    'device': 'mobile'
}

headers = {
    'Authorization': f'Bearer {token}'
}

url = f'{base_url}/api/relatorios/vendas/pdf/'

try:
    print(f"Testando endpoint: {url}")
    print(f"Parametros: {params}")
    print(f"Device: mobile (dimensoes Letter)")
    
    response = requests.get(url, params=params, headers=headers, timeout=60)
    
    print(f"\n=== RESULTADO ===")
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
    
    if response.status_code == 200:
        pdf_size = len(response.content)
        print(f"\n[OK] PDF GERADO COM SUCESSO!")
        print(f"     Tamanho: {pdf_size} bytes")
        
        # Salvar PDF para validação
        with open('test_output.pdf', 'wb') as f:
            f.write(response.content)
        print(f"     Arquivo: test_output.pdf")
    else:
        print(f"\n[ERRO] Status {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response: {response.text[:500]}")
        
except Exception as e:
    print(f"\n[ERRO] {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
