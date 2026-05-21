import django
import os
import sys
import json
import random

sys.path.append(r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from api.models import Fornecedor, Operacao, Produto, Compra, FinanceiroConta
from django.db import transaction

# Verifica dados necessários
fornecedor = Fornecedor.objects.first()
operacao = Operacao.objects.first()
produto = Produto.objects.first()

if not (fornecedor and operacao and produto):
    print("Erro: Fornecedor, Operacao ou Produto nao encontrados no BD.")
    sys.exit(1)

print(f"Usando Fornecedor ID={fornecedor.id_fornecedor}, Operacao ID={operacao.id_operacao}, Produto ID={produto.id_produto}")

c = APIClient()
user = User.objects.first()
c.force_authenticate(user=user)

# Gera uma chave NFe aleatória para evitar erro de duplicidade
random_nfe = "".join([str(random.randint(0, 9)) for _ in range(44)])

payload_compra = {
    "id_fornecedor": fornecedor.id_fornecedor,
    "id_operacao": operacao.id_operacao,
    "numero_documento": f"NFe-{random.randint(1000, 9999)}",
    "data_documento": "2026-05-18T10:00:00",
    "data_entrada": "2026-05-21",
    "dados_entrada": random_nfe,
    "xml_conteudo": "",
    "valor_total": "249.990000",
    "itens": [
        {
            "id_produto": produto.id_produto,
            "quantidade": 1.0,
            "valor_unitario": 249.99,
            "valor_total": 249.99,
            "fracao_memorizada": 1.0
        }
    ]
}

try:
    with transaction.atomic():
        print("Enviando POST /api/compras/ ...")
        response_compra = c.post('/api/compras/', data=json.dumps(payload_compra), content_type='application/json')
        print(f"Status Compra: {response_compra.status_code}")
        
        if response_compra.status_code != 201:
            print(f"Erro ao criar compra: {response_compra.content}")
            raise Exception("Compra falhou")
            
        compra_dados = response_compra.json()
        id_compra = compra_dados['id_compra']
        print(f"Compra cadastrada com sucesso! ID={id_compra}")
        
        # Agora simulamos o envio da parcela do financeiro
        payload_financeiro = {
            "tipo_conta": "Pagar",
            "id_cliente_fornecedor": fornecedor.id_fornecedor, # Usando o ID do fornecedor
            "descricao": f"Compra #{id_compra} - Parcela 1/1",
            "valor_parcela": 249.99,
            "data_vencimento": "2026-06-21",
            "status_conta": "Pendente",
            "forma_pagamento": "Dinheiro",
            "id_compra_origem": id_compra,
            "id_conta_cobranca": None,
            "gerencial": True
        }
        
        print("Enviando POST /api/contas/ ...")
        response_financeiro = c.post('/api/contas/', data=json.dumps(payload_financeiro), content_type='application/json')
        print(f"Status Financeiro: {response_financeiro.status_code}")
        
        if response_financeiro.status_code != 201:
            print(f"Erro ao criar financeiro: {response_financeiro.content}")
            raise Exception("Financeiro falhou")
            
        financeiro_dados = response_financeiro.json()
        id_conta = financeiro_dados['id_conta']
        print(f"Financeiro cadastrado com sucesso! ID={id_conta}")
        
        # Faz rollback automático para não sujar o banco de dados
        raise Exception("Rollback intencional do teste")
except Exception as e:
    if "Rollback intencional" in str(e):
        print("\n✅ Fluxo completo executado com SUCESSO! Ambas as requisições retornaram HTTP 201 Created.")
    else:
        print(f"\n❌ Erro durante o fluxo: {e}")
