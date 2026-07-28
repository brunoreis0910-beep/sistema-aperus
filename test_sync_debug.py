#!/usr/bin/env python
# coding: utf-8
"""
Test script to debug SAAS sync issue
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.conf import settings
from api.licenciamento_service import sincronizar_e_verificar_licenca
import logging

logging.basicConfig(level=logging.DEBUG)

print("="*60)
print("TEST: SAAS Sync Debug")
print("="*60)

# 1. Check if SAAS_MOTHER_URL is set
print(f"\n[1] SAAS_MOTHER_URL from settings:")
central_url = getattr(settings, 'SAAS_MOTHER_URL', None)
print(f"    Value: {central_url}")
print(f"    Type: {type(central_url)}")

# 2. Call the sync function
print(f"\n[2] Calling sincronizar_e_verificar_licenca():")
try:
    resultado = sincronizar_e_verificar_licenca()
    print(f"    Result: {resultado}")
except Exception as e:
    print(f"    ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
