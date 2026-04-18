# -*- coding: utf-8 -*-
"""
WhatsApp Desktop Listener — Leitura de respostas via clipboard
==============================================================
Como funciona:
  1. O supervisor abre a conversa no WhatsApp Desktop e responde "SIM" ou "NÃO".
  2. Este serviço roda em background e, a cada N segundos, abre o chat do
     supervisor via `whatsapp://send?phone=...`, seleciona e copia a última
     mensagem recebida (Ctrl+A → copiar via clipboard), depois processa o
     texto usando a mesma lógica do webhook Cloud API.
  3. Após processar, marca a mensagem como "lida" para não processar duas vezes.

Requisitos:
  - WhatsApp Desktop instalado e LOGADO.
  - pyautogui e pyperclip instalados (já estão no projeto).
  - Windows com tela disponível (não funciona em servidor headless puro).

Configuração no .env:
  SUPERVISOR_WHATSAPP_PHONE=5534988523215   (já configurado)
  WHATSAPP_DESKTOP_POLL_INTERVAL=15         (segundos entre checagens, default 15)
"""
import os
import re
import time
import logging
import threading
import pyperclip
import pyautogui

logger = logging.getLogger(__name__)

# Intervalo entre polls (em segundos)
_DEFAULT_POLL_INTERVAL = 15

# Última mensagem processada (evita reprocessar)
_ultima_mensagem_processada: str = ""
_ultima_mensagem_lock = threading.Lock()

# Estado do listener
_listener_thread: threading.Thread | None = None
_stop_event = threading.Event()
_status = "stopped"   # stopped | running | error

pyautogui.FAILSAFE = False  # Desativa failsafe (mover mouse ao canto pausa o bot)
pyautogui.PAUSE = 0.1       # Pausa mínima entre ações


# ─────────────────────────────────────────────────────────────────────────────
# Funções públicas
# ─────────────────────────────────────────────────────────────────────────────

def iniciar_listener():
    """
    Inicia o thread de polling das mensagens do WhatsApp Desktop.
    Chamado automaticamente pelo apps.py do Django.
    Seguro chamar múltiplas vezes (singleton).
    """
    global _listener_thread, _status

    if _listener_thread and _listener_thread.is_alive():
        logger.info("Listener WhatsApp Desktop já está rodando.")
        return

    _stop_event.clear()
    _listener_thread = threading.Thread(
        target=_loop_polling,
        daemon=True,
        name="WhatsAppDesktopListener",
    )
    _listener_thread.start()
    _status = "running"
    logger.info("✅ Listener WhatsApp Desktop iniciado.")


def parar_listener():
    """Para o thread de polling."""
    global _status
    _stop_event.set()
    _status = "stopped"
    logger.info("Listener WhatsApp Desktop parado.")


def get_status() -> dict:
    """Retorna o estado atual do listener para exibição no admin/API."""
    global _status, _ultima_mensagem_processada
    with _ultima_mensagem_lock:
        ultima = _ultima_mensagem_processada
    return {
        "status": _status,
        "ultima_mensagem_processada": ultima[:80] if ultima else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Loop interno de polling
# ─────────────────────────────────────────────────────────────────────────────

def _loop_polling():
    """Thread principal: verifica novas mensagens a cada POLL_INTERVAL segundos."""
    global _status

    try:
        from decouple import config
        intervalo = int(config("WHATSAPP_DESKTOP_POLL_INTERVAL", default=str(_DEFAULT_POLL_INTERVAL)))
    except Exception:
        intervalo = _DEFAULT_POLL_INTERVAL

    logger.info(f"[Listener] Iniciando loop (intervalo={intervalo}s)")

    while not _stop_event.is_set():
        try:
            _verificar_mensagens()
        except Exception as exc:
            logger.error(f"[Listener] Erro no ciclo de polling: {exc}", exc_info=True)
            _status = "error"
            time.sleep(5)
            _status = "running"  # Tenta recuperar

        # Aguarda o intervalo (interruptível)
        _stop_event.wait(timeout=intervalo)

    logger.info("[Listener] Loop encerrado.")


def _verificar_mensagens():
    """
    Abre o chat do supervisor no WhatsApp Desktop, lê a última mensagem
    recebida via clipboard e, se for nova, processa como aprovação.
    """
    global _ultima_mensagem_processada

    # 1. Obtém telefone do supervisor
    try:
        from django.conf import settings  # noqa  (garante que Django já foi configurado)
        from api.views_aprovacao_whatsapp import _buscar_dados_supervisor
        from api.models import SolicitacaoAprovacao
    except Exception as exc:
        logger.warning(f"[Listener] Django ainda não configurado: {exc}")
        return

    sup_info = _buscar_dados_supervisor()
    telefone = sup_info.get("phone", "")
    if not telefone:
        logger.debug("[Listener] Nenhum supervisor configurado, pulando poll.")
        return

    # 2. Verifica se há solicitação pendente (evita abrir o app desnecessariamente)
    tem_pendente = SolicitacaoAprovacao.objects.filter(
        tipo_solicitacao="desconto_venda",
        status="Pendente",
    ).exists()

    if not tem_pendente:
        logger.debug("[Listener] Nenhuma solicitação pendente; poll ignorado.")
        return

    # 3. Abre o chat do supervisor no WhatsApp Desktop
    logger.info(f"[Listener] Abrindo chat do supervisor ({telefone[:6]}****) ...")
    link = f"whatsapp://send?phone={telefone}"
    try:
        os.startfile(link)
    except Exception as exc:
        logger.error(f"[Listener] Falha ao abrir WhatsApp Desktop: {exc}")
        return

    # Aguarda o app focar e o chat carregar
    time.sleep(6)

    # 4. Lê a última mensagem recebida
    # Estratégia: usa Ctrl+Shift+C no campo de mensagem (copia última mensagem)
    # Alternativa mais confiável: navega com Tab até a última bolha e copia
    ultima_msg = _capturar_ultima_mensagem_recebida()

    if not ultima_msg:
        logger.debug("[Listener] Não foi possível capturar mensagem.")
        return

    # 5. Verifica se é uma mensagem nova (diferente da última processada)
    with _ultima_mensagem_lock:
        if ultima_msg == _ultima_mensagem_processada:
            logger.debug(f"[Listener] Mesma mensagem anterior, sem novidades.")
            return
        _ultima_mensagem_processada = ultima_msg

    logger.info(f"[Listener] Nova mensagem detectada: '{ultima_msg[:60]}'")

    # 6. Processa como aprovação
    try:
        from api.views_aprovacao_whatsapp import _processar_aprovacao_whatsapp
        resultado = _processar_aprovacao_whatsapp(telefone, ultima_msg)
        logger.info(f"[Listener] Resultado: {resultado}")
    except Exception as exc:
        logger.error(f"[Listener] Erro ao processar aprovação: {exc}", exc_info=True)


def _capturar_ultima_mensagem_recebida() -> str:
    """
    Captura a última mensagem recebida na conversa aberta no WhatsApp Desktop.

    Estratégia:
      1. Garante que o WhatsApp Desktop está em foco.
      2. Usa Shift+Tab para navegar até a área de mensagens.
      3. Pressiona End para ir ao final da conversa.
      4. Seleciona a última mensagem com Shift+Up+End e copia.
      5. Lê o clipboard.

    Retorna o texto capturado (str) ou "" em caso de falha.
    """
    try:
        # Salva o conteúdo atual do clipboard para restaurar depois
        clipboard_anterior = ""
        try:
            clipboard_anterior = pyperclip.paste()
        except Exception:
            pass

        # Limpa clipboard para detectar se algo novo foi copiado
        pyperclip.copy("")
        time.sleep(0.3)

        # Coloca uma sentinela vazia no clipboard
        sentinela = "\x00VAZIO\x00"
        pyperclip.copy(sentinela)
        time.sleep(0.2)

        # Garante foco no WhatsApp (clica na janela que acabou de ser aberta)
        # O startfile já deve ter focado, mas garantimos com Alt+Tab se necessário
        # Pressiona Escape para fechar qualquer popup
        pyautogui.press("escape")
        time.sleep(0.3)

        # Ativa o painel de mensagens com Alt+F para chegar em algum item
        # No WhatsApp Desktop, a área de chat usa Ctrl+F para busca
        # Vamos usar o método mais confiável: clicar no centro da tela (onde fica o chat)
        screen_w, screen_h = pyautogui.size()
        chat_x = int(screen_w * 0.65)   # Lado direito = área de mensagens
        chat_y = int(screen_h * 0.50)   # Centro vertical

        pyautogui.click(chat_x, chat_y)
        time.sleep(0.5)

        # Vai ao final da conversa (a última mensagem)
        pyautogui.hotkey("ctrl", "end")
        time.sleep(0.5)

        # Seleciona a linha atual (última mensagem visível)
        # Home → Shift+End = seleciona linha inteira
        pyautogui.hotkey("ctrl", "shift", "end")
        time.sleep(0.3)

        # Copia a seleção
        pyautogui.hotkey("ctrl", "c")
        time.sleep(0.5)

        # Lê o clipboard
        texto_copiado = pyperclip.paste() or ""

        # Restaura clipboard anterior (boa prática)
        if clipboard_anterior and clipboard_anterior != sentinela:
            pyperclip.copy(clipboard_anterior)

        # Se copiou a sentinela ou vazio, falhou
        if not texto_copiado or texto_copiado == sentinela or texto_copiado == "\x00VAZIO\x00":
            return ""

        # Limpa o texto: remove espaços extras, timestamps do WhatsApp
        # Timestamps aparecem como "11:48" no início ou fim
        texto_limpo = texto_copiado.strip()

        # Remove timestamps (formato HH:MM ou H:MM no início/fim)
        texto_limpo = re.sub(r'^\d{1,2}:\d{2}\s*', '', texto_limpo)
        texto_limpo = re.sub(r'\s*\d{1,2}:\d{2}$', '', texto_limpo)
        texto_limpo = texto_limpo.strip()

        return texto_limpo

    except Exception as exc:
        logger.error(f"[Listener] Erro ao capturar mensagem: {exc}", exc_info=True)
        return ""


# ─────────────────────────────────────────────────────────────────────────────
# Processamento direto (para testes/integração via endpoint)
# ─────────────────────────────────────────────────────────────────────────────

def processar_resposta_manual(texto: str) -> dict:
    """
    Processa manualmente uma resposta do supervisor (para testes via API).
    Equivale a receber a mensagem pelo webhook.
    """
    try:
        from api.views_aprovacao_whatsapp import (
            _buscar_dados_supervisor,
            _processar_aprovacao_whatsapp,
        )
        sup_info = _buscar_dados_supervisor()
        telefone = sup_info.get("phone", "")
        if not telefone:
            return {"erro": "Nenhum supervisor configurado"}
        return _processar_aprovacao_whatsapp(telefone, texto)
    except Exception as exc:
        logger.error(f"[Listener] processar_resposta_manual: {exc}", exc_info=True)
        return {"erro": str(exc)}
