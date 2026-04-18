# -*- coding: utf-8 -*-
"""
Aprovação de Desconto via WhatsApp + Gemini AI
================================================
Fluxo:
 1. Vendedor solicita desconto acima do limite  →  POST /api/aprovacao/desconto/
 2. Sistema consulta histórico do cliente no banco + chama Gemini para gerar
    uma sugestão contextualizada (adimplência, volume de compras, etc.)
 3. Mensagem WhatsApp é enviada ao supervisor com os dados + sugestão do Gemini
 4. Supervisor responde em linguagem natural: "Libera aí", "Pode 10%", "Não"
 5a. Evolution API dispara  →  POST /api/aprovacao/webhook-whatsapp/
 5b. Meta Cloud API dispara →  POST /api/aprovacao/webhook-cloud/
 6. Gemini interpreta a resposta (fallback: regex) e extrai status + percentual
 7. Frontend faz polling em  GET /api/aprovacao/<id>/status/  a cada 5 s

Provedor de envio (automático por prioridade):
  1° WhatsApp Cloud API (Meta Oficial) — se WHATSAPP_CLOUD_TOKEN estiver no .env
  2° Evolution API                     — se EVOLUTION_API_URL/KEY estiverem no .env
"""
import re
import json
import secrets
import logging
from datetime import datetime, timedelta

import requests
from decouple import config
from django.http import HttpResponse, HttpResponseRedirect
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .whatsapp_playwright_service import WhatsAppService
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.utils import timezone

from .models import SolicitacaoAprovacao
from . import whatsapp_cloud_service as _cloud

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# GEMINI — cliente lazy (inicializado apenas quando necessário)
# ─────────────────────────────────────────────────────────────────────────────

try:
    from google import genai as _genai_module
    _GEMINI_AVAILABLE = True
except ImportError:
    _genai_module = None
    _GEMINI_AVAILABLE = False

_gemini_client = None  # inicializado na primeira chamada


def _get_gemini_client():
    """Retorna (ou cria) o cliente Gemini, ou None se indisponível."""
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    if not _GEMINI_AVAILABLE:
        return None
    api_key = config('GEMINI_API_KEY', default=None)
    if not api_key:
        logger.warning("GEMINI_API_KEY não configurada — análise de IA indisponível.")
        return None
    _gemini_client = _genai_module.Client(api_key=api_key)
    return _gemini_client


GEMINI_MODEL = 'models/gemini-2.5-flash'


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _enviar_evolution(telefone: str, mensagem: str) -> bool:
    """
    Envia uma mensagem de texto via Evolution API.

    Configure no .env:
        EVOLUTION_API_URL=http://localhost:8080
        EVOLUTION_API_KEY=SUA_CHAVE_AQUI
        EVOLUTION_INSTANCE=default
    """
    base_url = config('EVOLUTION_API_URL', default='').rstrip('/')
    api_key  = config('EVOLUTION_API_KEY', default='')
    instance = config('EVOLUTION_INSTANCE', default='default')

    if not base_url or not api_key:
        logger.warning("Evolution API não configurada — WhatsApp não enviado.")
        return False

    url = f"{base_url}/message/sendText/{instance}"
    headers = {'apikey': api_key, 'Content-Type': 'application/json'}
    payload = {'number': telefone, 'text': mensagem}

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        return True
    except requests.RequestException as exc:
        logger.error(f"Erro ao enviar WhatsApp via Evolution API: {exc}")
        return False


def _enviar_whatsapp(telefone: str, mensagem: str) -> bool:
    """
    Envia mensagem usando WhatsApp Desktop App (via PyAutoGUI).
    No modo Desktop, não verifica status de conexão (usa app instalado localmente).
    """
    try:
        service = WhatsAppService()
        
        # MODO DESKTOP: Não verifica status de conexão
        # (WhatsApp Desktop já está logado localmente - não usa navegador)
        # 
        # if service.status != "connected":
        #     logger.warning(
        #         f"[WhatsApp View] Playwright não conectado (status: {service.status}). "
        #         "Escaneie o QR Code na aba WhatsApp antes de usar esta função."
        #     )
        #     return False
        
        logger.info(f"🖥️ [DESKTOP MODE] Enviando mensagem via WhatsApp Desktop App...")
        return service.enviar_mensagem(telefone, mensagem)
    except Exception as e:
        logger.error(f"[WhatsApp View] Falha ao enviar mensagem: {e}")
        return False


def _processar_resposta_supervisor(texto: str) -> dict:
    """
    Analisa o texto de resposta do supervisor e devolve:
        {'status': 'Aprovada'|'Rejeitada'|None, 'percentual': float|None}
    """
    msg = texto.lower().strip()

    APROVACAO = ['sim', 'autorizado', 'ok', 'liberado', 'pode', 'aprovado', 'libera', 'autoriza']
    NEGACAO   = ['não', 'nao', 'negado', 'recusado', 'negada', 'recusada', 'negar', 'recusar', 'nega']

    negado  = any(p in msg for p in NEGACAO)
    aprovado = any(p in msg for p in APROVACAO)

    if negado and not aprovado:
        return {'status': 'Rejeitada', 'percentual': None}

    if aprovado:
        # Extrai o primeiro número (inteiro ou decimal com . ou ,)
        numeros = re.findall(r'\d+(?:[.,]\d+)?', msg)
        percentual = float(numeros[0].replace(',', '.')) if numeros else None
        return {'status': 'Aprovada', 'percentual': percentual}

    return {'status': None, 'percentual': None}


def _limpar_telefone(telefone: str) -> str:
    """Remove tudo que não é dígito e garante o prefixo 55 (Brasil)."""
    digits = re.sub(r'\D', '', telefone)
    if len(digits) in (10, 11):
        digits = '55' + digits
    return digits


def _buscar_telefone_supervisor() -> str:
    """Retorna apenas o telefone do supervisor (wrapper de _buscar_dados_supervisor)."""
    info = _buscar_dados_supervisor()
    return info.get('phone', '') if info else ''


def _buscar_dados_supervisor(user_solicitante=None) -> dict:
    """
    Busca o WhatsApp e ID do supervisor no banco de dados.
    Prioridade:
      1. Usuários com permissão aut_desconto=True e whatsapp_supervisor preenchido
      2. Usuários is_staff/is_superuser com whatsapp_supervisor preenchido
      3. Fallback: SUPERVISOR_WHATSAPP_PHONE do .env (sem ID)
    
    Retorna dict: {'id_supervisor': int|None, 'phone': str, 'nome': str}
    """
    try:
        from django.contrib.auth.models import User
        from .models import UserParametros, UserPermissoes
        from django.db.models import Q
        
        # 1. Busca usuários com permissão de autorização de desconto
        perms_qs = UserPermissoes.objects.filter(aut_desconto=True).values_list('id_user_id', flat=True)
        
        if perms_qs.exists():
            # Busca primeiro supervisor com permissão E WhatsApp cadastrado
            params_qs = UserParametros.objects.filter(
                id_user_id__in=perms_qs
            ).exclude(
                whatsapp_supervisor__isnull=True
            ).exclude(
                whatsapp_supervisor=''
            ).select_related('id_user')
            
            # Exclui o próprio solicitante (não aprovar próprio desconto)
            if user_solicitante and user_solicitante.id:
                params_qs = params_qs.exclude(id_user_id=user_solicitante.id)
            
            param = params_qs.first()
            
            if param and param.whatsapp_supervisor:
                supervisor = param.id_user
                return {
                    'id_supervisor': supervisor.id,
                    'phone': _limpar_telefone(param.whatsapp_supervisor),
                    'nome': supervisor.first_name or supervisor.username
                }
        
        # 2. Fallback: busca staff/superuser com WhatsApp
        staff_qs = User.objects.filter(
            is_active=True
        ).filter(
            Q(is_staff=True) | Q(is_superuser=True)
        )
        
        if user_solicitante and user_solicitante.id:
            staff_qs = staff_qs.exclude(id=user_solicitante.id)
        
        for staff_user in staff_qs:
            param = UserParametros.objects.filter(id_user=staff_user).first()
            if param and param.whatsapp_supervisor:
                return {
                    'id_supervisor': staff_user.id,
                    'phone': _limpar_telefone(param.whatsapp_supervisor),
                    'nome': staff_user.first_name or staff_user.username
                }
        
        # 3. Último recurso: .env (sem ID de supervisor)
        phone_env = config('SUPERVISOR_WHATSAPP_PHONE', default='').strip()
        if phone_env:
            logger.warning('Usando SUPERVISOR_WHATSAPP_PHONE do .env (sem ID de supervisor no banco)')
            return {
                'id_supervisor': None,
                'phone': _limpar_telefone(phone_env),
                'nome': "Supervisor (Config)"
            }

    except Exception as e:
        logger.error(f'_buscar_dados_supervisor: erro ao consultar BD: {e}', exc_info=True)
        # Fallback em caso de erro
        phone_env = config('SUPERVISOR_WHATSAPP_PHONE', default='').strip()
        if phone_env:
            return {
                'id_supervisor': None,
                'phone': _limpar_telefone(phone_env),
                'nome': "Supervisor (Config)"
            }

    return {'id_supervisor': None, 'phone': '', 'nome': ''}


# ─────────────────────────────────────────────────────────────────────────────
# GEMINI — ANÁLISE DE HISTÓRICO DO CLIENTE
# ─────────────────────────────────────────────────────────────────────────────

def _analisar_historico_cliente_gemini(
    id_cliente,
    nome_cliente: str,
    valor_total: float,
    percentual_solicitado: float,
) -> str:
    """
    Consulta o banco de dados para obter o histórico de compras e pagamentos
    do cliente e usa o Gemini para gerar uma sugestão de 1-2 linhas para o
    supervisor.

    Retorna a sugestão como texto, ou '' se Gemini indisponível.
    """
    # ── 1. Coletar dados do banco ─────────────────────────────────────────────
    try:
        from .models import Venda, FinanceiroConta

        doze_meses_atras = timezone.now() - timedelta(days=365)

        # Compras nos últimos 12 meses
        vendas_qs = (
            Venda.objects
            .filter(id_cliente=id_cliente, data_documento__gte=doze_meses_atras)
            .order_by('-data_documento')
        )
        total_compras = vendas_qs.count()
        valor_total_compras = float(
            vendas_qs.aggregate(s=Sum('valor_total'))['s'] or 0
        )

        # Contas a receber: pagas vs. vencidas sem pagamento
        contas_qs = FinanceiroConta.objects.filter(
            id_cliente_fornecedor=id_cliente,
            tipo_conta='Receber',
        )
        total_contas = contas_qs.count()
        contas_pagas = contas_qs.filter(status_conta='Paga').count()
        # Vencidas = data_vencimento < hoje E não pagas
        hoje = timezone.now().date()
        contas_vencidas = contas_qs.filter(
            data_vencimento__lt=hoje,
            data_pagamento__isnull=True,
        ).exclude(status_conta='Paga').count()

        adimplencia = (
            round((contas_pagas / total_contas) * 100, 1)
            if total_contas > 0 else 100.0
        )

        contexto = (
            f"Cliente: {nome_cliente}\n"
            f"Compras nos últimos 12 meses: {total_compras} pedido(s), "
            f"total R$ {valor_total_compras:,.2f}\n"
            f"Contas a receber: {total_contas} total, {contas_pagas} pagas, "
            f"{contas_vencidas} em atraso (adimplência {adimplencia}%)\n"
            f"Venda atual: R$ {valor_total:,.2f} | Desconto solicitado: {percentual_solicitado:.1f}%"
        )
    except Exception as exc:
        logger.warning(f"Erro ao consultar histórico do cliente para Gemini: {exc}")
        return ''

    # ── 2. Chamar Gemini ──────────────────────────────────────────────────────
    client = _get_gemini_client()
    if client is None:
        return ''

    prompt = (
        "Você é um assistente de análise de crédito e vendas de uma empresa brasileira.\n"
        "Com base nas informações abaixo, escreva UMA sugestão curta (máximo 2 linhas) "
        "para o supervisor decidir se aprova ou não um desconto especial. "
        "Seja objetivo, cite o fato mais relevante (adimplência, frequência de compras ou "
        "valor em aberto) e termine com uma recomendação clara ('Sugestão: aprovar' ou "
        "'Sugestão: avaliar com cautela').\n\n"
        f"{contexto}"
    )

    try:
        import concurrent.futures

        def _call_gemini():
            return client.models.generate_content(model=GEMINI_MODEL, contents=prompt)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_call_gemini)
            try:
                response = future.result(timeout=8)  # abandona após 8s (evita retry de 41s)
            except concurrent.futures.TimeoutError:
                logger.warning("Gemini: timeout de 8s excedido — análise IA ignorada.")
                return ''

        sugestao = (response.text or '').strip()
        # Limite de segurança: no máximo 300 caracteres para não poluir a mensagem
        if len(sugestao) > 300:
            sugestao = sugestao[:297] + '…'
        return sugestao
    except Exception as exc:
        msg = str(exc)
        if 'RESOURCE_EXHAUSTED' in msg or '429' in msg or 'quota' in msg.lower():
            logger.warning("Gemini: cota diária esgotada — análise IA ignorada.")
        else:
            logger.error(f"Gemini erro em _analisar_historico_cliente_gemini: {exc}")
        return ''


# ─────────────────────────────────────────────────────────────────────────────
# GEMINI — INTERPRETAÇÃO DA RESPOSTA DO SUPERVISOR
# ─────────────────────────────────────────────────────────────────────────────

def _interpretar_resposta_gemini(texto: str, percentual_solicitado: float) -> dict:
    """
    Usa o Gemini para interpretar a resposta em linguagem natural do supervisor.

    Retorna {'status': 'Aprovada'|'Rejeitada'|None, 'percentual': float|None}

    Exemplos tratados pelo Gemini:
        "Pode ser"              → Aprovada, percentual_solicitado
        "Libera aí"             → Aprovada, percentual_solicitado
        "Autoriza 10.5%"        → Aprovada, 10.5
        "Dê apenas 8"           → Aprovada, 8.0
        "Negativo, não autorizo"→ Rejeitada
        "Oi, tudo bem?"         → None (irrelevante)
    """
    client = _get_gemini_client()
    if client is None:
        # Fallback imediato para regex
        return _processar_resposta_supervisor(texto)

    prompt = (
        "Você analisa respostas de supervisores de vendas sobre aprovação de desconto.\n"
        "Classifique a mensagem abaixo e responda APENAS com JSON válido, sem markdown.\n\n"
        f'Mensagem: "{texto}"\n'
        f"Desconto solicitado originalmente: {percentual_solicitado}%\n\n"
        "Responda no formato:\n"
        '{"status": "Aprovada" | "Rejeitada" | null, '
        '"percentual": <número float ou null>}\n\n'
        "Regras:\n"
        "- status='Aprovada' se o supervisor claramente autoriza (sim, ok, libera, pode, autorizado, etc.)\n"
        "- status='Rejeitada' se o supervisor claramente nega (não, negado, recusado, etc.)\n"
        "- status=null se a mensagem for irrelevante ou ambígua\n"
        "- percentual=valor numérico somente se o supervisor mencionar um número específico; "
        "caso contrário null (o sistema usará o percentual solicitado originalmente)\n"
        "- Ignore tokens de identificação como '#1234'"
    )

    try:
        import concurrent.futures

        def _call_gemini_interpretacao():
            return client.models.generate_content(model=GEMINI_MODEL, contents=prompt)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_call_gemini_interpretacao)
            try:
                response = future.result(timeout=8)
            except concurrent.futures.TimeoutError:
                logger.warning("Gemini: timeout na interpretação — usando fallback regex.")
                return _processar_resposta_supervisor(texto)

        texto_json = (response.text or '').strip()
        # Remove blocos de código markdown caso Gemini os inclua
        texto_json = re.sub(r'^```(?:json)?\s*', '', texto_json, flags=re.MULTILINE)
        texto_json = re.sub(r'\s*```$', '', texto_json, flags=re.MULTILINE)
        resultado = json.loads(texto_json.strip())
        # Validação mínima de estrutura
        if 'status' not in resultado:
            raise ValueError("Chave 'status' ausente na resposta Gemini")
        return {
            'status': resultado.get('status'),
            'percentual': resultado.get('percentual'),
        }
    except Exception as exc:
        msg = str(exc)
        if 'RESOURCE_EXHAUSTED' in msg or '429' in msg or 'quota' in msg.lower():
            logger.warning("Gemini: cota esgotada ao interpretar resposta — usando fallback regex.")
        else:
            logger.warning(
                f"Gemini falhou ao interpretar resposta ({exc}); "
                "usando fallback regex."
            )
        return _processar_resposta_supervisor(texto)


# ─────────────────────────────────────────────────────────────────────────────
# VIEW 1 — Solicitar aprovação de desconto
# ─────────────────────────────────────────────────────────────────────────────

class SolicitarDescontoWhatsAppView(APIView):
    """
    POST /api/aprovacao/desconto/

    Cria uma SolicitacaoAprovacao do tipo 'desconto_venda' e envia uma
    mensagem WhatsApp para o supervisor cadastrado.

    Body esperado:
    {
        "id_venda":             4582,     // 0 ou null se venda ainda não foi salva
        "nome_vendedor":        "João",
        "nome_cliente":         "Marmoraria Silva",
        "valor_total":          5000.00,
        "percentual_solicitado": 15.0,
        "limite_desconto":       10.0
    }

    Retorna:
    {
        "id_solicitacao":     42,
        "token":              "7831",
        "whatsapp_enviado":   true,
        "mensagem_whatsapp":  "🚨 APROVAÇÃO ..."
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        dados = request.data
        try:
            perc_sol = float(dados.get('percentual_solicitado', 0))
            limite   = float(dados.get('limite_desconto', 0))
            valor    = float(dados.get('valor_total', 0))
        except ValueError:
            return Response({'error': 'Valores numéricos inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

        id_venda  = dados.get('id_venda')
        nome_cliente  = dados.get('nome_cliente', 'Consumidor Final')
        nome_vendedor = dados.get('nome_vendedor') or (request.user.first_name or request.user.username)

        # Token simples para referência rápida
        token = str(secrets.randbelow(9000) + 1000)

        # 1. Busca Telefone do Supervisor
        sup_info = _buscar_dados_supervisor(request.user)
        telefone_sup = sup_info.get('phone')
        id_supervisor = sup_info.get('id_supervisor')
        
        if not telefone_sup:
            return Response({
                'error': 'Não foi encontrado um supervisor com WhatsApp configurado para aprovação.',
                'action': 'Cadastre o celular no perfil do supervisor (Parâmetros).'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validação adicional: id_supervisor deve existir
        if not id_supervisor:
            return Response({
                'error': 'Supervisor não identificado no sistema.',
                'action': 'Configure um usuário supervisor com permissão de autorização.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Gera análise IA (caso configurado)
        try:
            sugestao_ia = _analisar_historico_cliente_gemini(
                0, # TODO: extrair id_cliente se passarem via front
                nome_cliente,
                valor,
                perc_sol
            )
        except Exception:
            sugestao_ia = ''

        # 3. Registra Solicitação no Banco
        dados_json = json.dumps({
            'percentual_solicitado': perc_sol,
            'limite_desconto':       limite,
            'valor_total':           valor,
            'id_venda':              id_venda,
            'nome_cliente':          nome_cliente,
            'token':                 token,
            'sugestao_ia':           sugestao_ia,
            'supervisor_id':         sup_info.get('id_supervisor')
        }, ensure_ascii=False)

        solicitacao = SolicitacaoAprovacao.objects.create(
            id_usuario_solicitante=request.user,
            id_usuario_supervisor_id=id_supervisor,
            tipo_solicitacao='desconto_venda',
            id_registro=int(id_venda) if id_venda else None,
            dados_solicitacao=dados_json,
            observacao_solicitante=f"Solicitado: {perc_sol}% | Limite: {limite}%",
            status='Pendente',
        )

        # 4. Monta Mensagem Otimizada
        # Detecta o IP/host do servidor para gerar links clicáveis
        # Prioridade: SERVER_HOST no .env → IP real da rede local → fallback
        try:
            host_env = config('SERVER_HOST', default='').strip().rstrip('/')
            if host_env:
                host = host_env
            else:
                import socket as _socket
                import ipaddress as _ipaddress
                _port = request.get_port()

                def _detectar_ip_lan(porta):
                    """
                    Detecta o melhor IP LAN acessível pelo celular.
                    Funciona mesmo quando o PC usa cabo e o celular usa Wi-Fi
                    na mesma rede — ambos estão no mesmo roteador/subrede.
                    Estratégia:
                      1. Coleta TODOS os IPs de TODAS as interfaces (via hostname)
                      2. Adiciona o IP da rota padrão de internet
                      3. Filtra apenas IPs privados (192.168.x, 10.x, 172.16-31.x)
                      4. Prefere 192.168.x.x (mais comum em redes domésticas/comerciais)
                      5. Testa qual IP tem o servidor realmente escutando na porta
                    """
                    import socket as _s
                    import ipaddress as _ipa

                    candidatos = []

                    # Passo 1: todos os IPv4 de TODAS as interfaces
                    try:
                        hostname = _s.gethostname()
                        for info in _s.getaddrinfo(hostname, None, _s.AF_INET):
                            ip = info[4][0]
                            try:
                                addr = _ipa.ip_address(ip)
                                if addr.is_private and not ip.startswith('127.'):
                                    candidatos.append(ip)
                            except Exception:
                                pass
                    except Exception:
                        pass

                    # Passo 2: IP da rota de internet (interface usada para sair p/ internet)
                    try:
                        _sock = _s.socket(_s.AF_INET, _s.SOCK_DGRAM)
                        _sock.connect(('8.8.8.8', 80))
                        ip_internet = _sock.getsockname()[0]
                        _sock.close()
                        if ip_internet not in candidatos:
                            candidatos.append(ip_internet)
                    except Exception:
                        pass

                    if not candidatos:
                        return f'http://localhost:{porta}'

                    # Passo 3: Testa qual IP está realmente escutando na porta
                    # (garante que o servidor Django está acessível naquela interface)
                    def _porta_acessivel(ip, porta):
                        try:
                            t = _s.socket(_s.AF_INET, _s.SOCK_STREAM)
                            t.settimeout(0.5)
                            resultado = t.connect_ex((ip, int(porta)))
                            t.close()
                            return resultado == 0
                        except Exception:
                            return False

                    # Prefere 192.168.x.x com porta acessível
                    for ip in candidatos:
                        if ip.startswith('192.168.') and _porta_acessivel(ip, porta):
                            return f'http://{ip}:{porta}'

                    # Qualquer IP privado com porta acessível
                    for ip in candidatos:
                        if _porta_acessivel(ip, porta):
                            return f'http://{ip}:{porta}'

                    # Fallback sem teste de porta: primeiro 192.168.x.x
                    for ip in candidatos:
                        if ip.startswith('192.168.'):
                            return f'http://{ip}:{porta}'

                    return f'http://{candidatos[0]}:{porta}'

                host = _detectar_ip_lan(_port)
                logger.info(f"🌐 [HOST] IP detectado para links WhatsApp: {host}")
        except Exception:
            host = config('SERVER_HOST', default='http://localhost:8000')

        # Garante URL limpa (sem barra no final) para montagem correta
        base_url = host.rstrip('/')

        # Links curtos: /ap/<pk>/<token>/s  e  /ap/<pk>/<token>/n
        link_curto_sim = f"{base_url}/ap/{solicitacao.pk}/{token}/s"
        link_curto_nao = f"{base_url}/ap/{solicitacao.pk}/{token}/n"

        # Mensagem principal (sem os links)
        mensagem = (
            f"🚨 *APROVAÇÃO DE DESCONTO #{solicitacao.pk}*\n\n"
            f"👤 *Vendedor:* {nome_vendedor}\n"
            f"🛒 *Cliente:* {nome_cliente}\n"
            f"💰 *Valor:* R$ {valor:,.2f}\n"
            f"📉 *Desconto:* {round(perc_sol, 2)}% (Limite: {round(limite, 2)}%)\n"
        )

        if sugestao_ia:
            mensagem += f"\n🤖 *IA:* {sugestao_ia}\n"

        # SIM/NÃO é o método principal; links são alternativa (copiar e colar no navegador)
        mensagem += f"\n*✅ Responda SIM para APROVAR*"
        mensagem += f"\n*❌ Responda NÃO para RECUSAR*"

        # Garante protocolo http para links ficarem clicáveis
        link_sim = link_curto_sim if link_curto_sim.startswith('http') else f"http://{link_curto_sim}"
        link_nao = link_curto_nao if link_curto_nao.startswith('http') else f"http://{link_curto_nao}"

        mensagem += f"\n_(Ou copie o link no navegador)_"
        mensagem += f"\nAPROVAR: {link_sim}"
        mensagem += f"\nRECUSAR: {link_nao}"

        # 5. Envia com fallback por prioridade:
        #    1° WhatsApp Cloud API (se configurado)
        #    2° Evolution API (se configurado)
        #    3° Playwright (último recurso, pode ter problemas com asyncio)
        enviado = False
        
        # Tenta Cloud API primeiro
        if _cloud.is_configurado() and not _cloud.token_com_erro():
            logger.info("Tentando enviar via WhatsApp Cloud API...")
            enviado = _cloud.enviar_mensagem(telefone_sup, mensagem)
        
        # Se não enviou, tenta Evolution API
        if not enviado:
            evolution_url = config('EVOLUTION_API_URL', default='').strip()
            evolution_key = config('EVOLUTION_API_KEY', default='').strip()
            if evolution_url and evolution_key:
                logger.info("Tentando enviar via Evolution API...")
                enviado = _enviar_evolution(telefone_sup, mensagem)
        
        # Último recurso: tenta Playwright
        if not enviado:
            logger.warning("Tentando enviar via Playwright (pode falhar se Django está em modo ASGI)...")
            enviado = _enviar_whatsapp(telefone_sup, mensagem)

        # 5. Retorna status para o Frontend
        return Response({
            'id_solicitacao': solicitacao.pk,
            'token': token,
            'whatsapp_enviado': enviado,
            'mensagem_whatsapp': mensagem,
            'status': 'Aguardando Aprovação'
        })

# ─────────────────────────────────────────────────────────────────────────────
# VIEW 2 — Webhook da Evolution API
# ─────────────────────────────────────────────────────────────────────────────

class WebhookAprovacaoView(APIView):
    """
    POST /api/aprovacao/webhook-whatsapp/

    Endpoint chamado pela Evolution API quando uma mensagem chega no WhatsApp.
    Não requer JWT (é chamado externamente), mas verifica se o remetente é
    o número autorizado em SUPERVISOR_WHATSAPP_PHONE.

    Configure o webhook na Evolution API:
        URL:    http://SEU_SERVIDOR:8000/api/aprovacao/webhook-whatsapp/
        Eventos: MESSAGES_UPSERT
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            payload = request.data

            # Suporte a envelope Evolution v1 (data.*) e v2 (raiz)
            data  = payload.get('data', payload)
            key   = data.get('key', {})

            remote_jid = key.get('remoteJid', '') or data.get('remoteJid', '')
            from_me    = key.get('fromMe', False) or data.get('fromMe', False)

            # Ignorar mensagens enviadas pelo próprio sistema
            if from_me:
                return Response({'ok': True, 'descartado': 'from_me'})

            # Extrair texto da mensagem
            msg_obj = data.get('message', {}) or {}
            texto = (
                msg_obj.get('conversation', '')
                or msg_obj.get('extendedTextMessage', {}).get('text', '')
                or data.get('body', '')
                or ''
            ).strip()

            if not remote_jid or not texto:
                return Response({'ok': True, 'descartado': 'sem_texto'})

            # Número remetente (remoteJid = "5511999999999@s.whatsapp.net")
            remetente = remote_jid.split('@')[0]

            # ── Segurança: verificar se é o supervisor autorizado ─────────────
            supervisor_phone = _buscar_telefone_supervisor()
            if supervisor_phone and remetente != supervisor_phone:
                logger.warning(
                    f"Webhook descartado: remetente {remetente[:6]}*** "
                    f"≠ supervisor autorizado."
                )
                return Response({'ok': True, 'descartado': 'nao_autorizado'})

            # ── Buscar solicitação de destino ─────────────────────────────────
            # Prioridade: #ID explícito na mensagem
            id_match = re.search(r'#(\d+)', texto)
            solicitacao = None

            if id_match:
                try:
                    solicitacao = SolicitacaoAprovacao.objects.get(
                        id_solicitacao=int(id_match.group(1)),
                        tipo_solicitacao='desconto_venda',
                        status='Pendente',
                    )
                except SolicitacaoAprovacao.DoesNotExist:
                    pass

            # Fallback: solicitação pendente mais recente
            if not solicitacao:
                solicitacao = SolicitacaoAprovacao.objects.filter(
                    tipo_solicitacao='desconto_venda',
                    status='Pendente',
                ).order_by('-data_solicitacao').first()

            if not solicitacao:
                return Response({'ok': True, 'descartado': 'sem_solicitacao_pendente'})

            # ── Interpretar resposta (Gemini primeiro, regex como fallback) ───
            try:
                dados_atuais_pre = json.loads(solicitacao.dados_solicitacao or '{}')
            except Exception:
                dados_atuais_pre = {}
            perc_original = float(dados_atuais_pre.get('percentual_solicitado') or 0)

            resultado = _interpretar_resposta_gemini(texto, perc_original)

            if resultado.get('status') is None:
                return Response({'ok': True, 'descartado': 'mensagem_irrelevante'})

            # ── Atualizar solicitação ─────────────────────────────────────────
            dados_atuais = dados_atuais_pre
            perc_sol     = dados_atuais.get('percentual_solicitado')
            perc_final   = resultado['percentual'] or perc_sol
            novo_status  = resultado['status']

            dados_atuais['percentual_aprovado']   = perc_final
            dados_atuais['resposta_supervisor']   = texto
            dados_atuais['processado_em'] = datetime.now().isoformat()

            solicitacao.status          = novo_status
            solicitacao.data_aprovacao  = datetime.now()
            solicitacao.observacao_supervisor = (
                f"Aprovado {perc_final}% via WhatsApp"
                if novo_status == 'Aprovada'
                else f"Recusado via WhatsApp: \"{texto[:60]}\""
            )
            solicitacao.dados_solicitacao = json.dumps(dados_atuais, ensure_ascii=False)
            solicitacao.save()

            logger.info(
                f"Solicitação #{solicitacao.id_solicitacao} → {novo_status} "
                f"| percentual={perc_final} | via WhatsApp"
            )
            return Response({
                'ok': True,
                'id_solicitacao': solicitacao.id_solicitacao,
                'status': novo_status,
                'percentual_aprovado': perc_final,
            })

        except Exception as exc:
            logger.error(f"Erro no webhook de aprovação WhatsApp: {exc}", exc_info=True)
            # Retorna 200 para que a Evolution API não reenvie indefinidamente
            return Response({'ok': True, 'erro': str(exc)})


# ─────────────────────────────────────────────────────────────────────────────
# VIEW 3 — Polling de status (frontend)
# ─────────────────────────────────────────────────────────────────────────────

class StatusAprovacaoView(APIView):
    """
    GET /api/aprovacao/<pk>/status/

    Consultado pelo frontend a cada ~5 s para saber se a solicitação
    foi aprovada ou rejeitada.

    Retorna:
    {
        "id_solicitacao": 42,
        "status": "Pendente" | "Aprovada" | "Rejeitada",
        "percentual_aprovado": 12.5,
        "observacao_supervisor": "Aprovado 12.5% via WhatsApp",
        "data_aprovacao": "2026-03-07T10:45:00"
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            solicitacao = SolicitacaoAprovacao.objects.get(
                id_solicitacao=pk,
                id_usuario_solicitante=request.user,
            )
        except SolicitacaoAprovacao.DoesNotExist:
            return Response(
                {'error': 'Solicitação não encontrada'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            dados = json.loads(solicitacao.dados_solicitacao or '{}')
        except Exception:
            dados = {}

        return Response({
            'id_solicitacao':       solicitacao.id_solicitacao,
            'status':               solicitacao.status,
            'percentual_aprovado':  dados.get('percentual_aprovado'),
            'percentual_solicitado': dados.get('percentual_solicitado'),
            'observacao_supervisor': solicitacao.observacao_supervisor,
            'data_aprovacao': (
                solicitacao.data_aprovacao.isoformat()
                if solicitacao.data_aprovacao else None
            ),
        })


class WhatsAppStatusView(APIView):
    """
    GET /api/aprovacao/whatsapp-status/

    Informa ao frontend qual integração WhatsApp está pronta para uso.
    Verifica (por ordem de prioridade):
      1. WhatsApp Cloud API (Meta Oficial) — WHATSAPP_CLOUD_TOKEN + WHATSAPP_CLOUD_PHONE_ID
      2. Evolution API                     — EVOLUTION_API_URL + EVOLUTION_API_KEY
      3. Presença de supervisor com WhatsApp cadastrado

    Retorna:
    {
        "configurado": true | false,
        "provedor": "cloud_api" | "evolution_api" | null,
        "motivo": "ok" | "nenhuma_api_configurada" | "nenhum_supervisor_com_whatsapp"
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import UserParametros

        # ── 1. Cloud API (Meta Oficial) ───────────────────────────────────────
        # is_configurado() já retorna False se token recentemente falhou (401/403)
        if _cloud.is_configurado():
            tem_supervisor = (
                UserParametros.objects
                .exclude(whatsapp_supervisor__isnull=True)
                .exclude(whatsapp_supervisor='')
                .exists()
            ) or bool(config('SUPERVISOR_WHATSAPP_PHONE', default='').strip())

            if not tem_supervisor:
                return Response({
                    'configurado': False,
                    'provedor':    'cloud_api',
                    'motivo':      'nenhum_supervisor_com_whatsapp',
                })
            return Response({
                'configurado': True,
                'provedor':    'cloud_api',
                'motivo':      'ok',
            })

        # ── 2. Evolution API ──────────────────────────────────────────────────
        base_url = config('EVOLUTION_API_URL', default='').strip()
        api_key  = config('EVOLUTION_API_KEY', default='').strip()

        if base_url and api_key:
            from .models import UserPermissoes
            from django.db.models import Q
            from django.contrib.auth.models import User as DjangoUser

            # UserPermissoes tem aut_desconto; UserParametros tem whatsapp_supervisor
            perms_qs = UserPermissoes.objects.filter(aut_desconto=True).values_list('id_user_id', flat=True)
            tem_supervisor = (
                UserParametros.objects
                .filter(id_user_id__in=perms_qs)
                .exclude(whatsapp_supervisor__isnull=True)
                .exclude(whatsapp_supervisor='')
                .exists()
            )
            if not tem_supervisor:
                staff_ids = DjangoUser.objects.filter(is_active=True).filter(
                    Q(is_staff=True) | Q(is_superuser=True)
                ).values_list('id', flat=True)
                tem_supervisor = (
                    UserParametros.objects
                    .filter(id_user_id__in=staff_ids)
                    .exclude(whatsapp_supervisor__isnull=True)
                    .exclude(whatsapp_supervisor='')
                    .exists()
                )
            if not tem_supervisor:
                tem_supervisor = bool(config('SUPERVISOR_WHATSAPP_PHONE', default='').strip())

            if not tem_supervisor:
                return Response({
                    'configurado': False,
                    'provedor':    'evolution_api',
                    'motivo':      'nenhum_supervisor_com_whatsapp',
                })
            return Response({'configurado': True, 'provedor': 'evolution_api', 'motivo': 'ok'})

        # ── 3. WhatsApp Nativo (Playwright / sessão local) ───────────────────
        # O estado em memória pode ser perdido após restart do servidor,
        # por isso consultamos também a tabela config_whatsapp no banco.
        whatsapp_nativo_conectado = False
        try:
            from . import whatsapp_playwright_service as _pw
            estado, _ = _pw.obter_estado("default")
            if estado == "conectado":
                whatsapp_nativo_conectado = True
        except Exception:
            pass

        if not whatsapp_nativo_conectado:
            try:
                from django.db import connection as _conn
                with _conn.cursor() as cur:
                    cur.execute(
                        "SELECT COUNT(*) FROM config_whatsapp WHERE status_conexao = 'conectado' LIMIT 1"
                    )
                    (cnt,) = cur.fetchone()
                    if cnt > 0:
                        whatsapp_nativo_conectado = True
            except Exception:
                pass

        if whatsapp_nativo_conectado:
            from .models import UserPermissoes
            from django.db.models import Q
            from django.contrib.auth.models import User as DjangoUser

            perms_qs = UserPermissoes.objects.filter(aut_desconto=True).values_list('id_user_id', flat=True)
            tem_supervisor = (
                UserParametros.objects
                .filter(id_user_id__in=perms_qs)
                .exclude(whatsapp_supervisor__isnull=True)
                .exclude(whatsapp_supervisor='')
                .exists()
            )
            if not tem_supervisor:
                staff_ids = DjangoUser.objects.filter(is_active=True).filter(
                    Q(is_staff=True) | Q(is_superuser=True)
                ).values_list('id', flat=True)
                tem_supervisor = (
                    UserParametros.objects
                    .filter(id_user_id__in=staff_ids)
                    .exclude(whatsapp_supervisor__isnull=True)
                    .exclude(whatsapp_supervisor='')
                    .exists()
                )
            if not tem_supervisor:
                tem_supervisor = bool(config('SUPERVISOR_WHATSAPP_PHONE', default='').strip())

            if tem_supervisor:
                return Response({'configurado': True, 'provedor': 'nativo', 'motivo': 'ok'})
            return Response({
                'configurado': False,
                'provedor':    'nativo',
                'motivo':      'nenhum_supervisor_com_whatsapp',
            })

        return Response({
            'configurado': False,
            'provedor':    None,
            'motivo':      'nenhuma_api_configurada',
        })


# ─────────────────────────────────────────────────────────────────────────────
# HELPER COMPARTILHADO — núcleo de processamento de resposta do supervisor
# ─────────────────────────────────────────────────────────────────────────────

def _processar_aprovacao_whatsapp(remetente: str, texto: str) -> dict:
    """
    Recebe o número do remetente (apenas dígitos, com prefixo 55) e o texto
    da mensagem do supervisor, valida a autorização, interpreta a resposta e
    atualiza a SolicitacaoAprovacao correspondente no banco de dados.

    Compartilhado entre:
        - WebhookAprovacaoView     (Evolution API)
        - WebhookCloudAprovacaoView (Meta Cloud API)

    Retorno — dicionário com:
        'ok': True em caso de sucesso
        'descartado': motivo se a mensagem foi ignorada
        'id_solicitacao', 'status', 'percentual_aprovado': quando processada
    """
    # ── Segurança: verificar se é o supervisor autorizado ─────────────────────
    supervisor_phone = _buscar_telefone_supervisor()
    if supervisor_phone and remetente != supervisor_phone:
        logger.warning(
            "Webhook descartado: remetente %s*** ≠ supervisor autorizado.",
            remetente[:6],
        )
        return {'descartado': 'nao_autorizado'}

    # ── Buscar solicitação de destino ──────────────────────────────────────────
    id_match = re.search(r'#(\d+)', texto)
    solicitacao = None

    if id_match:
        try:
            solicitacao = SolicitacaoAprovacao.objects.get(
                id_solicitacao=int(id_match.group(1)),
                tipo_solicitacao='desconto_venda',
                status='Pendente',
            )
        except SolicitacaoAprovacao.DoesNotExist:
            pass

    if not solicitacao:
        solicitacao = SolicitacaoAprovacao.objects.filter(
            tipo_solicitacao='desconto_venda',
            status='Pendente',
        ).order_by('-data_solicitacao').first()

    if not solicitacao:
        return {'descartado': 'sem_solicitacao_pendente'}

    # ── Interpretar resposta (Gemini com fallback regex) ───────────────────────
    try:
        dados = json.loads(solicitacao.dados_solicitacao or '{}')
    except Exception:
        dados = {}

    perc_original = float(dados.get('percentual_solicitado') or 0)
    resultado = _interpretar_resposta_gemini(texto, perc_original)

    if resultado.get('status') is None:
        return {'descartado': 'mensagem_irrelevante'}

    # ── Atualizar solicitação ──────────────────────────────────────────────────
    perc_sol    = dados.get('percentual_solicitado')
    perc_final  = resultado['percentual'] or perc_sol
    novo_status = resultado['status']

    dados['percentual_aprovado'] = perc_final
    dados['resposta_supervisor'] = texto
    dados['processado_em']       = timezone.now().isoformat()

    solicitacao.status         = novo_status
    solicitacao.data_aprovacao = timezone.now()
    solicitacao.observacao_supervisor = (
        f"Aprovado {perc_final}% via WhatsApp"
        if novo_status == 'Aprovada'
        else f"Recusado via WhatsApp: \"{texto[:60]}\""
    )
    solicitacao.dados_solicitacao = json.dumps(dados, ensure_ascii=False)
    solicitacao.save()

    logger.info(
        "Solicitação #%s → %s | percentual=%s",
        solicitacao.id_solicitacao, novo_status, perc_final,
    )
    return {
        'ok': True,
        'id_solicitacao': solicitacao.id_solicitacao,
        'status':         novo_status,
        'percentual_aprovado': perc_final,
    }


# ─────────────────────────────────────────────────────────────────────────────
# VIEW 5 — Webhook da WhatsApp Cloud API (Meta Oficial)
# ─────────────────────────────────────────────────────────────────────────────

class WebhookCloudAprovacaoView(APIView):
    """
    GET /api/aprovacao/webhook-cloud/   — verificação de webhook exigida pela Meta
    POST /api/aprovacao/webhook-cloud/  — recebe mensagem de resposta do supervisor

    ── Configuração no portal Meta for Developers ────────────────────────────
    1. Acesse seu App → WhatsApp → Configuração
    2. Em "Webhook", clique em "Editar" e preencha:
         URL de retorno de chamada: https://SEU_SERVIDOR/api/aprovacao/webhook-cloud/
         Token de verificação:      (o mesmo valor de WHATSAPP_CLOUD_VERIFY_TOKEN no .env)
    3. Clique em "Verificar e salvar"
    4. Assine o campo "messages" nos eventos do webhook

    ── Formato do payload POST enviado pela Meta ─────────────────────────────
    {
      "object": "whatsapp_business_account",
      "entry": [{
        "changes": [{
          "value": {
            "messages": [{
              "from": "5534999999999",
              "type": "text",
              "text": {"body": "Sim 15"}
            }]
          }
        }]
      }]
    }

    Mensagens de botão interativo (quick_reply) também são suportadas.
    """
    permission_classes    = [AllowAny]
    authentication_classes = []

    def get(self, request):
        """Verificação de webhook — a Meta chama isso uma vez ao configurar."""
        mode      = request.query_params.get('hub.mode')
        challenge = request.query_params.get('hub.challenge', '')
        token     = request.query_params.get('hub.verify_token', '')

        verify_token = config('WHATSAPP_CLOUD_VERIFY_TOKEN', default='').strip()

        if not verify_token:
            logger.error(
                "WHATSAPP_CLOUD_VERIFY_TOKEN não configurado no .env — "
                "verificação do webhook Cloud API falhou."
            )
            return Response({'error': 'Servidor não configurado'}, status=500)

        if mode == 'subscribe' and token == verify_token:
            logger.info("Webhook Meta Cloud API verificado com sucesso.")
            return HttpResponse(challenge, content_type='text/plain', status=200)

        logger.warning(
            "Verificação do webhook Meta Cloud falhou "
            "(token '%s***' não corresponde ao esperado).",
            token[:4],
        )
        return Response({'error': 'Forbidden'}, status=403)

    def post(self, request):
        """Processa mensagem recebida da Meta Cloud API."""
        try:
            payload = request.data

            # Validar que é um evento do WhatsApp Business
            if payload.get('object') != 'whatsapp_business_account':
                return Response({'ok': True})

            for entry in payload.get('entry', []):
                for change in entry.get('changes', []):
                    value    = change.get('value', {})
                    messages = value.get('messages', [])

                    for msg in messages:
                        remetente = re.sub(r'\D', '', msg.get('from', ''))
                        tipo      = msg.get('type', '')

                        # Extrair texto de acordo com o tipo da mensagem
                        if tipo == 'text':
                            texto = msg.get('text', {}).get('body', '').strip()
                        elif tipo == 'interactive':
                            inter = msg.get('interactive', {})
                            sub   = inter.get('type', '')
                            if sub == 'button_reply':
                                texto = inter.get('button_reply', {}).get('title', '').strip()
                            elif sub == 'list_reply':
                                texto = inter.get('list_reply', {}).get('title', '').strip()
                            else:
                                texto = ''
                        elif tipo == 'button':
                            # Resposta de botão de template
                            texto = msg.get('button', {}).get('text', '').strip()
                        else:
                            texto = ''

                        if not remetente or not texto:
                            continue

                        # ── Detecção de mensagem de teste de conexão ──────────
                        # Se o texto começa com "verificar " seguido do verify_token,
                        # marca status_validacao = 'VALIDADO' no banco e não processa
                        # como aprovação de desconto.
                        try:
                            from django.db import connection as _conn
                            with _conn.cursor() as _cur:
                                _cur.execute(
                                    "SELECT cloud_verify_token FROM config_whatsapp "
                                    "WHERE instancia_ativa = 1 LIMIT 1"
                                )
                                vt_row = _cur.fetchone()
                                vt = (vt_row[0] or '').strip() if vt_row else ''
                            if vt and texto.lower().startswith(f'verificar {vt.lower()}'):
                                with _conn.cursor() as _cur:
                                    _cur.execute(
                                        "UPDATE config_whatsapp SET status_validacao = 'VALIDADO' "
                                        "WHERE instancia_ativa = 1"
                                    )
                                logger.info("Conexão Cloud API validada por mensagem de teste do número %s", remetente)
                                continue  # não processa como aprovação
                        except Exception as _ve:
                            logger.warning("Erro ao verificar mensagem de teste: %s", _ve)
                        # ─────────────────────────────────────────────────────

                        resultado = _processar_aprovacao_whatsapp(remetente, texto)
                        logger.info("Cloud webhook processado: %s", resultado)

            return Response({'ok': True})

        except Exception as exc:
            logger.error("Erro no webhook Cloud API: %s", exc, exc_info=True)
            # Retornar 200 para que a Meta não reenvie indefinidamente
            return Response({'ok': True, 'erro': str(exc)})


# ─────────────────────────────────────────────────────────────────────────────
# VIEW 6 — Controle e status do Listener WhatsApp Desktop
# ─────────────────────────────────────────────────────────────────────────────

class DesktopListenerView(APIView):
    """
    GET  /api/aprovacao/desktop-listener/
        Retorna o status atual do listener (running/stopped) e a última
        mensagem processada.

    POST /api/aprovacao/desktop-listener/
        Corpo: {"acao": "iniciar"|"parar"|"processar", "texto": "SIM"}
        - "iniciar": inicia o polling automático
        - "parar": para o polling
        - "processar": processa manualmente um texto (útil para testes)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from api import whatsapp_desktop_listener as _dl
            return Response(_dl.get_status())
        except Exception as exc:
            return Response({'status': 'indisponivel', 'erro': str(exc)})

    def post(self, request):
        acao = request.data.get('acao', '').strip().lower()
        try:
            from api import whatsapp_desktop_listener as _dl

            if acao == 'iniciar':
                _dl.iniciar_listener()
                return Response({'ok': True, 'mensagem': 'Listener iniciado.'})

            elif acao == 'parar':
                _dl.parar_listener()
                return Response({'ok': True, 'mensagem': 'Listener parado.'})

            elif acao == 'processar':
                texto = request.data.get('texto', '').strip()
                if not texto:
                    return Response(
                        {'erro': 'Campo "texto" obrigatório para ação "processar".'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                resultado = _dl.processar_resposta_manual(texto)
                return Response({'ok': True, 'resultado': resultado})

            else:
                return Response(
                    {'erro': f'Ação desconhecida: "{acao}". Use: iniciar, parar ou processar.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as exc:
            logger.error("DesktopListenerView: %s", exc, exc_info=True)
            return Response({'erro': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────────────────────────
# VIEW 7 — Aprovação por link (supervisor toca no link do WhatsApp)
# ─────────────────────────────────────────────────────────────────────────────

class LinkCurtoAprovacaoView(APIView):
    """
    GET /ap/<pk>/<token>/s  → redireciona para aprovar
    GET /ap/<pk>/<token>/n  → redireciona para recusar

    URLs curtas enviadas no WhatsApp para melhor detecção como link.
    """
    permission_classes    = [AllowAny]
    authentication_classes = []

    MAPA = {'s': 'sim', 'n': 'nao'}

    def get(self, request, pk: int, token: str, acao: str):
        resposta = self.MAPA.get(acao.lower())
        if not resposta:
            return HttpResponse("<h2>Link inválido.</h2>", content_type="text/html; charset=utf-8", status=400)
        url = f"/api/aprovacao/responder/{pk}/{token}/{resposta}/"
        return HttpResponseRedirect(url)


class ResponderAprovacaoView(APIView):
    """
    GET /api/aprovacao/responder/<pk>/<token>/sim
    GET /api/aprovacao/responder/<pk>/<token>/nao

    Chamado quando o supervisor toca no link enviado via WhatsApp.
    Não requer autenticação — o token de 4 dígitos é a prova de autorização.
    Retorna HTML simples para exibir no browser do celular.
    """
    permission_classes    = [AllowAny]
    authentication_classes = []

    def get(self, request, pk: int, token: str, resposta: str):
        resposta = resposta.lower().strip()
        if resposta not in ('sim', 'nao', 'não'):
            return HttpResponse(
                "<h2>Link inválido.</h2><p>Use o link correto enviado pelo sistema.</p>",
                content_type="text/html; charset=utf-8",
                status=400,
            )

        # Busca a solicitação
        try:
            solicitacao = SolicitacaoAprovacao.objects.get(
                id_solicitacao=pk,
                tipo_solicitacao='desconto_venda',
            )
        except SolicitacaoAprovacao.DoesNotExist:
            return HttpResponse(
                "<h2>Solicitação não encontrada.</h2>",
                content_type="text/html; charset=utf-8",
                status=404,
            )

        # Valida o token
        try:
            dados = json.loads(solicitacao.dados_solicitacao or '{}')
        except Exception:
            dados = {}

        token_salvo = str(dados.get('token', '')).strip()
        if token_salvo and token.strip() != token_salvo:
            logger.warning(
                "ResponderAprovacao #%s: token inválido (%s != %s)",
                pk, token[:4], token_salvo[:4],
            )
            return HttpResponse(
                "<h2>Token inválido.</h2><p>Este link expirou ou é inválido.</p>",
                content_type="text/html; charset=utf-8",
                status=403,
            )

        # Verifica se já foi processada
        if solicitacao.status != 'Pendente':
            cor = "#4CAF50" if solicitacao.status == 'Aprovada' else "#f44336"
            return HttpResponse(
                f"<html><head><meta charset='utf-8'>"
                f"<meta name='viewport' content='width=device-width,initial-scale=1'></head>"
                f"<body style='font-family:sans-serif;text-align:center;padding:40px'>"
                f"<h2 style='color:{cor}'>Solicitação #{pk} já foi {solicitacao.status}.</h2>"
                f"<p>{solicitacao.observacao_supervisor or ''}</p>"
                f"</body></html>",
                content_type="text/html; charset=utf-8",
            )

        # Processa a resposta
        aprovado = resposta == 'sim'
        novo_status = 'Aprovada' if aprovado else 'Rejeitada'
        perc_sol = dados.get('percentual_solicitado')

        dados['percentual_aprovado'] = perc_sol if aprovado else None
        dados['resposta_supervisor'] = 'SIM (link)' if aprovado else 'NÃO (link)'
        dados['processado_em'] = timezone.now().isoformat()

        solicitacao.status = novo_status
        solicitacao.data_aprovacao = timezone.now()
        solicitacao.observacao_supervisor = (
            f"Aprovado {perc_sol}% via link WhatsApp"
            if aprovado
            else "Recusado via link WhatsApp"
        )
        solicitacao.dados_solicitacao = json.dumps(dados, ensure_ascii=False)
        solicitacao.save()

        logger.info("Solicitação #%s → %s via link WhatsApp", pk, novo_status)

        cor      = "#4CAF50" if aprovado else "#f44336"
        emoji    = "✅" if aprovado else "❌"
        msg_html = "APROVADO" if aprovado else "RECUSADO"

        return HttpResponse(
            f"<html><head><meta charset='utf-8'>"
            f"<meta name='viewport' content='width=device-width,initial-scale=1'></head>"
            f"<body style='font-family:sans-serif;text-align:center;padding:40px;background:#f5f5f5'>"
            f"<div style='background:white;border-radius:16px;padding:32px;max-width:400px;margin:0 auto;"
            f"box-shadow:0 2px 12px rgba(0,0,0,0.1)'>"
            f"<div style='font-size:64px'>{emoji}</div>"
            f"<h1 style='color:{cor};margin:16px 0'>{msg_html}</h1>"
            f"<h2 style='color:#333'>Solicitação #{pk}</h2>"
            f"<p style='color:#666'>Desconto de {perc_sol}%<br>"
            f"Cliente: {dados.get('nome_cliente', '')}</p>"
            f"<p style='color:#999;font-size:12px'>Pode fechar esta janela.</p>"
            f"</div></body></html>",
            content_type="text/html; charset=utf-8",
        )
