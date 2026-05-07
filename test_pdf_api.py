#!/usr/bin/env python
"""Script para testar a API de PDF através do Django Test Client"""
import os
import sys
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Cria cliente de teste
client = Client()

# Cria datas de teste
data_inicio = (timezone.now() - timedelta(days=30)).date().strftime('%Y-%m-%d')
data_fim = timezone.now().date().strftime('%Y-%m-%d')

# Monta URL como o frontend faria
url = f'/api/relatorios/vendas/pdf/?data_inicio={data_inicio}&data_fim={data_fim}&device=desktop'

print("=" * 80)
print("TESTE DA API DE PDF - Relatório de Vendas")
print("=" * 80)
print(f"Data Início: {data_inicio}")
print(f"Data Fim: {data_fim}")
print(f"Device: desktop")
print(f"URL: {url}")
print()

# Tenta obter um usuário autenticado para fazer a requisição
token = None
try:
    # Primeira, tenta buscar um usuário admin
    user = User.objects.filter(is_staff=True).first()
    if user:
        # Tenta obter ou criar token
        token, created = Token.objects.get_or_create(user=user)
        print(f"✓ Autenticado como: {user.username}")
        print(f"  Token: {token.key[:20]}...")
    else:
        print("⚠ Nenhum usuário admin encontrado para autenticação")
except Exception as e:
    print(f"⚠ Erro ao autenticar: {e}")

print()
print("Fazendo requisição para o endpoint...")
print()

try:
    # Adiciona token se conseguiu
    headers = {}
    if token:
        headers = {'HTTP_AUTHORIZATION': f'Token {token.key}'}
    
    response = client.get(url, **headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.get('Content-Type', 'N/A')}")
    print()
    
    if response.status_code == 200:
        print(f"✓ Sucesso! PDF gerado com {len(response.content):,} bytes")
    else:
        print(f"✗ Erro HTTP {response.status_code}")
        conteudo = response.content.decode('utf-8', errors='ignore')
        print(f"\nResposta:")
        print(conteudo[:1000])
        
except Exception as e:
    print(f"✗ Erro ao fazer requisição:")
    print(f"  {e}")
    import traceback
    traceback.print_exc()
    
print()
print("=" * 80)
