# -*- coding: utf-8 -*-
"""
WhatsApp Cloud API — Serviço de Envio (Meta Oficial)
=====================================================

Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api

Configure no .env:

    WHATSAPP_CLOUD_TOKEN=EAAxxxxx...
        Token Permanente de Sistema gerado no painel Meta for Developers.
        Caminho: seu App → Configurações → Usuários do Sistema → Gerar token
        Permissões necessárias: whatsapp_business_messaging, whatsapp_business_management

    WHATSAPP_CLOUD_PHONE_ID=1234567890
        ID numérico do número de telefone (Phone Number ID), visível em:
        Meta for Developers → seu App → WhatsApp → Configuração da API

    WHATSAPP_CLOUD_VERIFY_TOKEN=meu-token-secreto-qualquer
        Token de verificação inventado por você — deve ser o mesmo valor
        cadastrado em Meta for Developers → seu App → WhatsApp → Webhook → Verificar.

Vantagens da Cloud API Oficial:
    - Zero risco de banimento (uso dentro das políticas da Meta)
    - Primeiras 1.000 conversas de serviço/mês são gratuitas
    - Entrega garantida com status de leitura

Limitações importantes:
    - Mensagens de texto livre (enviar_texto) SÓ funcionam dentro de uma
      janela de 24 h após o destinatário ter enviado uma mensagem.
    - Para INICIAR conversas (ex: notificar supervisor), a Meta exige
      Templates aprovados (use enviar_template).
    - Templates devem ser criados e aprovados no portal Meta for Developers.
"""

import re
import logging
import requests
from decouple import config

import time as _time

logger = logging.getLogger(__name__)

_GRAPH_BASE = "https://graph.facebook.com/v21.0"

# ───────────────────────────────────────────────────────────────────────────────
# FLAG DE ERRO DE TOKEN — evita tentativas com token expirado/inválido
# ───────────────────────────────────────────────────────────────────────────────
# Quando a Meta retorna 401/403, marcamos o horário aqui.
# is_configurado() retorna False enquanto o erro for recente (< 1h),
# fazendo o sistema cair automaticamente para Playwright como fallback.

_token_erro_ts: float = 0.0   # Timestamp do último HTTP 401/403 recebido
_TOKEN_ERRO_TTL = 3600         # Segundos antes de tentar novamente (1 hora)

_token_check_ts: float = 0.0  # Última verificação real com a Meta API
_TOKEN_CHECK_TTL = 300         # Re-verifica a cada 5 minutos


def marcar_token_erro() -> None:
    """Registra que o token falhou com 401/403. Chamado por enviar_texto()."""
    global _token_erro_ts
    _token_erro_ts = _time.time()
    logger.warning(
        "Cloud API token marcado como inválido/expirado. "
        "Renove o token em Meta for Developers > Usuários do Sistema."
    )


def limpar_token_erro() -> None:
    """Limpa o flag de erro (chamado quando um novo token é configurado)."""
    global _token_erro_ts
    _token_erro_ts = 0.0


def token_com_erro() -> bool:
    """Retorna True se o token falhou recentemente (dentro do TTL)."""
    return (_time.time() - _token_erro_ts) < _TOKEN_ERRO_TTL


# ───────────────────────────────────────────────────────────────────────────────
# LEITURA DE CREDENCIAIS (banco de dados > .env como fallback)
# ───────────────────────────────────────────────────────────────────────────────

def _get_credenciais():
    """
    Retorna (token, phone_id, verify_token).
    Prioridade: banco de dados (config_whatsapp) > variáveis de ambiente (.env).
    """
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT cloud_token, cloud_phone_id, cloud_verify_token
                FROM config_whatsapp
                WHERE instancia_ativa = 1
                LIMIT 1
            """)
            row = cursor.fetchone()
            if row:
                db_token, db_phone_id, db_verify = row
                # Se o banco tiver os valores, usa o banco
                if db_token and db_token.strip():
                    return (
                        db_token.strip(),
                        (db_phone_id or '').strip(),
                        (db_verify or '').strip(),
                    )
    except Exception:
        pass  # banco não disponível ainda (ex: primeira migração)

    # Fallback: variáveis de ambiente
    return (
        config('WHATSAPP_CLOUD_TOKEN', default='').strip(),
        config('WHATSAPP_CLOUD_PHONE_ID', default='').strip(),
        config('WHATSAPP_CLOUD_VERIFY_TOKEN', default='').strip(),
    )


def _get_numero_cloud() -> str:
    """
    Retorna o número real do WhatsApp associado à Cloud API (campo cloud_numero).
    Formato esperado: apenas dígitos com DDI, ex: 5511999999999.
    Fallback: variável de ambiente WHATSAPP_CLOUD_NUMERO.
    """
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT cloud_numero FROM config_whatsapp
                WHERE instancia_ativa = 1 LIMIT 1
            """)
            row = cursor.fetchone()
            if row and row[0]:
                return re.sub(r'\D', '', row[0])
    except Exception:
        pass
    return re.sub(r'\D', '', config('WHATSAPP_CLOUD_NUMERO', default='').strip())

# ─────────────────────────────────────────────────────────────────────────────
# UTILITÁRIOS
# ─────────────────────────────────────────────────────────────────────────────

def _limpar_telefone(telefone: str) -> str:
    """Remove não-dígitos e adiciona o prefixo 55 para números brasileiros."""
    digits = re.sub(r'\D', '', telefone)
    if len(digits) in (10, 11):
        digits = '55' + digits
    return digits


def _checar_token_meta() -> bool:
    """Faz uma chamada rápida à Meta API para verificar se o token é válido.
    Chama marcar_token_erro() e retorna False se o token retornar 401/403."""
    global _token_check_ts
    token, phone_id, _ = _get_credenciais()
    if not (token and phone_id):
        return False
    import urllib.request as _ureq
    import urllib.error as _uerr
    url = f'{_GRAPH_BASE}/{phone_id}'
    req = _ureq.Request(url, headers={'Authorization': f'Bearer {token}'})
    try:
        with _ureq.urlopen(req, timeout=5):
            _token_check_ts = _time.time()
            return True
    except _uerr.HTTPError as exc:
        if exc.code in (401, 403):
            marcar_token_erro()
            logger.warning('[Cloud API] Token expirado/inválido detectado (HTTP %d). Usando Playwright como fallback.', exc.code)
            return False
        # Outros erros HTTP (5xx) — não penaliza o token
        _token_check_ts = _time.time()
        return True
    except Exception:
        # Timeout ou rede indisponível — não penaliza, assume token OK
        _token_check_ts = _time.time()
        return True


def is_configurado() -> bool:
    """
    Retorna True se as credenciais da Cloud API estão configuradas E o
    token foi verificado válido com a Meta API nos últimos 5 minutos.
    Se o token estiver expirado (401/403), retorna False e o sistema
    cai automaticamente para Playwright (QR Code).
    """
    if token_com_erro():
        return False
    token, phone_id, _ = _get_credenciais()
    if not (token and phone_id):
        return False
    # Verifica com a Meta API se a última verificação foi há mais de 5 min
    if (_time.time() - _token_check_ts) > _TOKEN_CHECK_TTL:
        return _checar_token_meta()
    return True


import qrcode
import io
import base64
import urllib.parse
from django.utils.crypto import get_random_string

def obter_dados_cloud_api() -> dict:
    """
    Busca a configuração ativa no banco
    """
    token, phone_id, verify_token = _get_credenciais()
    numero = _get_numero_cloud()
    return {
        "token": token,
        "phone_id": phone_id,
        "verify_token": verify_token,
        "numero_origem": numero
    }

def gerar_qr_code_teste() -> dict:
    """
    Gera um QR Code que direciona para wa.me/numero_origem?text=Validar%20Conexao%20<hash>
    Para testar o fluxo de Webhook e envio via Cloud API Oficial.
    """
    dados = obter_dados_cloud_api()
    numero = dados.get("numero_origem", "")
    
    if not numero:
        return {"erro": "Número do WhatsApp Cloud (numero_origem) não configurado."}
    
    chave_validacao = get_random_string(6).upper()
    mensagem = f"Validar conexao {chave_validacao}"
    msg_encoded = urllib.parse.quote(mensagem)
    
    link_direto = f"https://wa.me/{numero}?text={msg_encoded}"
    
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(link_direto)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE config_whatsapp 
                SET webhook_validation_key = %s, status_validacao = 'PENDENTE'
                WHERE instancia_ativa = 1
            """, [chave_validacao])
    except Exception as e:
        logger.error(f"Erro ao salvar chave de validação: {e}")
        
    return {
        "qr_code": qr_base64,
        "chave_validacao": chave_validacao,
        "numero": numero,
        "link_direto": link_direto
    }

def testar_conexao_api() -> dict:
    """
    Testa as credenciais da Cloud API diretamente no Meta Graph API.

    Faz um GET em /v21.0/{phone_id} com o Bearer token.
    Se as credenciais forem válidas, a Meta retorna os dados do número
    e o sistema marca status_validacao = 'VALIDADO' automaticamente.

    Retorna:
        {
          "ok": True,
          "nome": "Meu Negócio",
          "numero": "+55 34 9999-9999",
          "quality": "GREEN"         # qualidade do número (opcional)
        }
    ou
        {
          "ok": False,
          "erro": "mensagem de erro da Meta"
        }
    """
    token, phone_id, _ = _get_credenciais()

    if not token:
        return {"ok": False, "erro": "Token de acesso não configurado."}
    if not phone_id:
        return {"ok": False, "erro": "Phone Number ID não configurado."}

    try:
        resp = requests.get(
            f"{_GRAPH_BASE}/{phone_id}",
            headers={"Authorization": f"Bearer {token}"},
            params={"fields": "verified_name,display_phone_number,code_verification_status,quality_rating"},
            timeout=10,
        )
        data = resp.json()

        if resp.status_code == 200:
            # Credenciais válidas → marca VALIDADO no banco
            try:
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute(
                        "UPDATE config_whatsapp SET status_validacao = 'VALIDADO' WHERE instancia_ativa = 1"
                    )
            except Exception:
                pass

            return {
                "ok": True,
                "nome": data.get("verified_name", ""),
                "numero": data.get("display_phone_number", ""),
                "quality": data.get("quality_rating", ""),
                "phone_id": phone_id,
            }

        # Erro retornado pela Meta
        erro = data.get("error", {})
        mensagem = erro.get("message") or erro.get("error_user_msg") or "Token ou Phone Number ID inválido."
        return {"ok": False, "erro": mensagem}

    except requests.Timeout:
        return {"ok": False, "erro": "Tempo limite excedido ao conectar com a Meta.", "sem_rede": True}
    except requests.ConnectionError as exc:
        # Rede inacessível (sem internet, servidor offline, etc.) — não é falha de token
        logger.warning("Cloud API: sem conectividade de rede para acessar graph.facebook.com")
        return {"ok": False, "erro": "Sem conectividade de rede.", "sem_rede": True}
    except Exception as exc:
        logger.exception("Erro ao testar conexão Cloud API")
        return {"ok": False, "erro": str(exc)}


# ─────────────────────────────────────────────────────────────────────────────
# ENVIO DE MENSAGEM DE TEXTO (dentro de janela de 24h)
# ─────────────────────────────────────────────────────────────────────────────

def enviar_texto(telefone: str, mensagem: str) -> bool:
    """
    Envia mensagem de texto livre via WhatsApp Cloud API.

    ⚠️  RESTRIÇÃO: Funciona apenas dentro da janela de 24 h de conversa ativa.
    Ou seja: o destinatário precisou ter enviado uma mensagem ao seu número
    nas últimas 24 h.
    Para contatos "frios" ou fora da janela, use ``enviar_template``.

    Parâmetros
    ----------
    telefone : str  — número do destinatário (aceita formatos: "34999...", "034999...", "+55349...")
    mensagem : str  — texto a ser enviado (suporta negrito *texto*, itálico _texto_, etc.)

    Retorno
    -------
    True  — mensagem aceita pela API da Meta (não garante entrega ao dispositivo)
    False — erro de configuração ou falha na chamada HTTP
    """
    token, phone_id, _ = _get_credenciais()

    if not token or not phone_id:
        logger.warning(
            "WhatsApp Cloud API não configurada "
            "(configure em Configurações > WhatsApp ou no .env)."
        )
        return False

    numero  = _limpar_telefone(telefone)
    url     = f"{_GRAPH_BASE}/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type":    "individual",
        "to":                numero,
        "type":              "text",
        "text": {
            "preview_url": False,
            "body":        mensagem,
        },
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        logger.info("Cloud API: texto enviado → %s***", numero[:6])
        return True
    except requests.HTTPError as exc:
        status_code = exc.response.status_code
        logger.error(
            "Cloud API HTTP %s ao enviar texto: %s",
            status_code,
            exc.response.text[:400],
        )
        if status_code in (401, 403):
            marcar_token_erro()
        return False
    except requests.RequestException as exc:
        logger.error("Cloud API falha de conexão: %s", exc)
        return False


def enviar_mensagem(telefone: str, mensagem: str) -> bool:
    """
    Wrapper compatível com o padrão do sistema (que usa separadores '§§'
    para o app Desktop). A Cloud API suporta mensagens longas, então unificamos.
    """
    # Remove separators '§§' used by Desktop
    msg_unificada = mensagem.replace('§§', '')

    # Remove extra newlines
    import re
    # Collapse 3+ newlines into 2
    msg_limpa = re.sub(r'\n{3,}', '\n\n', msg_unificada).strip()

    return enviar_texto(telefone, msg_limpa)


# ─────────────────────────────────────────────────────────────────────────────
# ENVIO DE TEMPLATE (inicia conversa fora da janela de 24h)
# ─────────────────────────────────────────────────────────────────────────────

def enviar_template(
    telefone: str,
    nome_template: str,
    idioma: str = "pt_BR",
    componentes: list | None = None,
) -> bool:
    """
    Envia uma mensagem usando um Template aprovado pela Meta.

    Templates permitem INICIAR conversas com qualquer contato, mesmo fora
    da janela de 24 h. O template precisa ser criado e aprovado no painel
    Meta for Developers antes de ser usado.

    Parâmetros
    ----------
    telefone      : número do destinatário
    nome_template : nome exato do template como registrado na Meta
    idioma        : código de idioma (padrão: "pt_BR")
    componentes   : lista de componentes conforme spec da Cloud API

    Exemplo de ``componentes`` para template com 2 variáveis no corpo:

        [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": "João Silva"},
                    {"type": "text", "text": "R$ 150,00"},
                ]
            }
        ]

    Exemplo de template com botões de resposta rápida:

        # O template precisa ter sido criado com botões na Meta
        [
            {
                "type": "body",
                "parameters": [{"type": "text", "text": "15%"}]
            },
            {
                "type": "button",
                "sub_type": "quick_reply",
                "index": "0",
                "parameters": [{"type": "payload", "payload": "APROVAR"}]
            },
            {
                "type": "button",
                "sub_type": "quick_reply",
                "index": "1",
                "parameters": [{"type": "payload", "payload": "REJEITAR"}]
            }
        ]
    """
    token, phone_id, _ = _get_credenciais()

    if not token or not phone_id:
        logger.warning("WhatsApp Cloud API não configurada.")
        return False

    numero  = _limpar_telefone(telefone)
    url     = f"{_GRAPH_BASE}/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
    }
    template_body: dict = {
        "name":     nome_template,
        "language": {"code": idioma},
    }
    if componentes:
        template_body["components"] = componentes

    payload = {
        "messaging_product": "whatsapp",
        "to":                numero,
        "type":              "template",
        "template":          template_body,
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        logger.info(
            "Cloud API: template '%s' enviado → %s***",
            nome_template, numero[:6],
        )
        return True
    except requests.HTTPError as exc:
        logger.error(
            "Cloud API HTTP %s ao enviar template '%s': %s",
            exc.response.status_code,
            nome_template,
            exc.response.text[:400],
        )
        return False
    except requests.RequestException as exc:
        logger.error("Cloud API falha de conexão (template): %s", exc)
        return False
