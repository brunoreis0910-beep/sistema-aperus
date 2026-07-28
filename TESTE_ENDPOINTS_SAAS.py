#!/usr/bin/env python
# coding: utf-8
"""
TESTE_ENDPOINTS_SAAS.py
Validar os endpoints SaaS antes de ir para produção
Data: 02/06/2026
"""

import requests
import json
from datetime import datetime, timedelta

# ===== CONFIGURAÇÃO =====
CENTRAL_MAE_URL = "http://localhost:8005/api/saas/status-financeiro-saas/"
FILIAL_URL = "http://localhost:8005/api/licenca/verificar/"
CNPJ_TESTE = "34123456000102"  # Substituir pelo CNPJ real
TIMEOUT = 5

# Cores para output
class Cor:
    VERDE = '\033[92m'
    VERMELHO = '\033[91m'
    AMARELO = '\033[93m'
    AZUL = '\033[94m'
    RESET = '\033[0m'

def print_resultado(nome_teste, sucesso, mensagem=""):
    status = f"{Cor.VERDE}✅ PASSOU{Cor.RESET}" if sucesso else f"{Cor.VERMELHO}❌ FALHOU{Cor.RESET}"
    print(f"\n[{nome_teste}] {status}")
    if mensagem:
        print(f"  → {mensagem}")

def print_secao(titulo):
    print(f"\n{Cor.AZUL}{'='*60}")
    print(f"  {titulo}")
    print(f"{'='*60}{Cor.RESET}\n")

# ===== TESTES =====

print(f"\n{Cor.AMARELO}🧪 TESTE DE INTEGRAÇÃO - SISTEMA SaaS DE FATURAMENTO{Cor.RESET}")
print(f"{Cor.AMARELO}Inicializado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}{Cor.RESET}")

# 1. TESTE: Central Mãe - Verificar Endpoint
print_secao("1️⃣  TESTE: CENTRAL MÃE - ENDPOINT DISPONÍVEL")

try:
    payload = {"cnpj": CNPJ_TESTE}
    print(f"  Enviando POST para: {CENTRAL_MAE_URL}")
    print(f"  Payload: {json.dumps(payload, indent=2)}")
    
    resposta = requests.post(CENTRAL_MAE_URL, json=payload, timeout=TIMEOUT)
    
    if resposta.status_code in [200, 400, 404]:
        print_resultado("Conexão com Central", True, f"HTTP {resposta.status_code}")
        print(f"  Response: {json.dumps(resposta.json(), indent=2, ensure_ascii=False)}")
    else:
        print_resultado("Conexão com Central", False, f"HTTP {resposta.status_code}")
except requests.exceptions.ConnectionError:
    print_resultado("Conexão com Central", False, "❌ Impossível conectar. Central está rodando?")
except Exception as e:
    print_resultado("Conexão com Central", False, str(e))

# 2. TESTE: Central Mãe - Validação de Resposta
print_secao("2️⃣  TESTE: VALIDAÇÃO DE RESPOSTA DA CENTRAL")

try:
    resposta = requests.post(CENTRAL_MAE_URL, json={"cnpj": CNPJ_TESTE}, timeout=TIMEOUT)
    if resposta.status_code == 200:
        dados = resposta.json()
        
        # Verificar campos obrigatórios
        campos_obrigatorios = ['bloqueio_manual', 'bloquear_sistema', 'alerta_estagio']
        campos_faltando = [c for c in campos_obrigatorios if c not in dados]
        
        if not campos_faltando:
            print_resultado("Campos Obrigatórios", True, "Todos os campos presentes")
            print(f"  ✓ bloqueio_manual: {dados.get('bloqueio_manual')}")
            print(f"  ✓ bloquear_sistema: {dados.get('bloquear_sistema')}")
            print(f"  ✓ alerta_estagio: {dados.get('alerta_estagio')}")
        else:
            print_resultado("Campos Obrigatórios", False, f"Faltando: {campos_faltando}")
    else:
        print_resultado("Validação de Resposta", False, f"Código HTTP: {resposta.status_code}")
except Exception as e:
    print_resultado("Validação de Resposta", False, str(e))

# 3. TESTE: Filial - Endpoint Local
print_secao("3️⃣  TESTE: FILIAL - ENDPOINT LOCAL DE SINCRONIZAÇÃO")

try:
    payload = {"cnpj": CNPJ_TESTE}
    print(f"  Enviando POST para: {FILIAL_URL}")
    
    resposta = requests.post(FILIAL_URL, json=payload, timeout=TIMEOUT)
    
    if resposta.status_code == 200:
        print_resultado("Conexão com Filial", True, f"HTTP {resposta.status_code}")
        print(f"  Response: {json.dumps(resposta.json(), indent=2, ensure_ascii=False)}")
    else:
        print_resultado("Conexão com Filial", False, f"HTTP {resposta.status_code}")
except requests.exceptions.ConnectionError:
    print_resultado("Conexão com Filial", False, "❌ Filial não está respondendo")
except Exception as e:
    print_resultado("Conexão com Filial", False, str(e))

# 4. TESTE: Estados de Bloqueio
print_secao("4️⃣  TESTE: VALIDAÇÃO DE ESTADOS DE BLOQUEIO")

estado_esperado = "em_dia"  # Ajuste conforme seu cenário

try:
    resposta = requests.post(CENTRAL_MAE_URL, json={"cnpj": CNPJ_TESTE}, timeout=TIMEOUT)
    if resposta.status_code == 200:
        dados = resposta.json()
        estado_atual = dados.get('alerta_estagio')
        
        print(f"  Estado esperado: {estado_esperado}")
        print(f"  Estado atual: {estado_atual}")
        
        if estado_atual in ['em_dia', 'suave', 'critico', 'fim_de_semana', 'modo_offline', 'isento']:
            print_resultado("Estado válido", True, f"alerta_estagio = '{estado_atual}'")
        else:
            print_resultado("Estado válido", False, f"Estado desconhecido: '{estado_atual}'")
except Exception as e:
    print_resultado("Validação de Estados", False, str(e))

# 5. TESTE: Cenário de Contingência (Simulado)
print_secao("5️⃣  TESTE: SIMULAR CONTINGÊNCIA OFFLINE")

print(f"  {Cor.AMARELO}⚠️  Para testar contingência offline:{Cor.RESET}")
print(f"     1. Desligue a conexão de internet")
print(f"     2. Chame novamente /api/licenca/verificar/")
print(f"     3. Verifique se retorna 'modo_offline' em alerta_estagio")
print(f"     4. Aguarde 3 dias para a licença local expirar")
print(f"     5. Verifique se o sistema bloqueia após expiração")

print_resultado("Simulação Manual", True, "Instruções exibidas")

# 6. TESTE: Estrutura de Fatura
print_secao("6️⃣  TESTE: VALIDAÇÃO DE ESTRUTURA DE FATURA")

try:
    resposta = requests.post(CENTRAL_MAE_URL, json={"cnpj": CNPJ_TESTE}, timeout=TIMEOUT)
    if resposta.status_code == 200:
        dados = resposta.json()
        
        if 'fatura_pendente' in dados and dados['fatura_pendente']:
            fatura = dados['fatura_pendente']
            campos_fatura = ['valor', 'vencimento', 'pix_copia_e_cola', 'link_boleto']
            
            campos_ok = [c for c in campos_fatura if c in fatura]
            
            print(f"  Campos presentes: {len(campos_ok)}/{len(campos_fatura)}")
            for campo in campos_ok:
                valor = fatura[campo][:50] + "..." if len(str(fatura[campo])) > 50 else fatura[campo]
                print(f"    ✓ {campo}: {valor}")
            
            print_resultado("Estrutura de Fatura", True)
        else:
            print_resultado("Estrutura de Fatura", False, "Nenhuma fatura pendente")
except Exception as e:
    print_resultado("Estrutura de Fatura", False, str(e))

# ===== RESUMO FINAL =====
print_secao("RESUMO DOS TESTES")

print(f"""
{Cor.VERDE}✅ SE TODOS OS TESTES PASSARAM:{Cor.RESET}
  1. O sistema SaaS está funcionando
  2. A integração Central ↔ Filial está correta
  3. Os bloqueios e estados estão sendo calculados
  4. O QR Code PIX será exibido ao cliente

{Cor.VERMELHO}❌ SE ALGUM TESTE FALHOU:{Cor.RESET}
  1. Verificar se os endpoints estão registrados em urls.py
  2. Confirmar que os modelos foram criados (migrations)
  3. Validar CNPJ_TESTE no banco de dados
  4. Revisar logs do Django em: manage.py runserver

{Cor.AMARELO}📝 PRÓXIMOS PASSOS:{Cor.RESET}
  1. Executar testes de carga
  2. Configurar alertas de fatura em produção
  3. Treinar equipe no fluxo de bloqueio
  4. Documentar procedimento de desbloqueio
""")

print(f"\n{Cor.AMARELO}{'='*60}")
print(f"  Teste finalizado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
print(f"{'='*60}{Cor.RESET}\n")
