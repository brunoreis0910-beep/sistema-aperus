# -*- coding: utf-8 -*-
import logging
import threading
import time
import base64
import urllib.parse
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
SESSIONS_DIR = BASE_DIR / "sessions"
SESSIONS_DIR.mkdir(exist_ok=True)

class WhatsAppService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(WhatsAppService, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.session_id = "default"
        self.session_path = SESSIONS_DIR / f"whatsapp_{self.session_id}"
        self.fila = []
        self.status = "desconectado"
        self.qr_code = None
        self.should_stop = False
        self.thread = None
        self.browser = None
        self.page = None

    def iniciar(self):
        if self.thread and self.thread.is_alive():
            logger.info("WhatsAppService já está em execução.")
            return

        logger.info("Iniciando thread do WhatsAppService...")
        self.should_stop = False
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def parar(self):
        logger.info("Parando WhatsAppService...")
        self.should_stop = True
        if self.thread:
            self.thread.join(timeout=10)

    def enfileirar_mensagem(self, telefone, texto):
        # Normaliza telefone
        num = "".join(filter(str.isdigit, str(telefone)))
        if len(num) < 12 and not num.startswith("55"):
            num = "55" + num
        
        self.fila.append({"telefone": num, "texto": texto, "tentativas": 0})
        logger.info(f"Mensagem enfileirada para {num}")

    def obter_status(self):
        return self.status, self.qr_code

    def _worker(self):
        while not self.should_stop:
            try:
                with sync_playwright() as p:
                    # Inicia navegador com persistência
                    self.browser = p.chromium.launch_persistent_context(
                        user_data_dir=str(self.session_path),
                        headless=True,
                        args=["--no-sandbox", "--disable-setuid-sandbox"],
                        viewport={"width": 1280, "height": 720}
                    )
                    
                    self.page = self.browser.pages[0] if self.browser.pages else self.browser.new_page()
                    
                    # Evita detecção simples
                    self.page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

                    logger.info("Navegando para WhatsApp Web...")
                    try:
                        self.page.goto("https://web.whatsapp.com", wait_until="domcontentloaded", timeout=60000)
                    except Exception as e:
                        logger.error(f"Timeout no carregamento inicial: {e}")
                        continue

                    # Loop de verificação de estado e processamento
                    while not self.should_stop:
                        if self.page.is_closed():
                            logger.error("Página fechada. Reiniciando browser...")
                            break

                        self._verificar_estado()
                        self._processar_fila()
                        self._verificar_respostas() # Monitoramento pedido pelo usuário

                        time.sleep(2)

                    if self.browser:
                        self.browser.close()
                        
            except Exception as e:
                logger.error(f"Erro fatal no worker: {e}")
                self._atualizar_db("erro")
                time.sleep(10) # Wait before retry

    def _verificar_estado(self):
        try:
            # Seletores de verificação
            ja_logado = self.page.query_selector("div[id='pane-side']") or \
                        self.page.query_selector("header[data-testid='chatlist-header']")
            
            tem_qr = self.page.query_selector("canvas")

            if ja_logado:
                if self.status != "conectado":
                    logger.info("WhatsApp Conectado!")
                    self._atualizar_db("conectado")
            elif tem_qr:
                # Captura QR
                qr_data = self.page.evaluate("""() => {
                    const canvas = document.querySelector('canvas');
                    return canvas ? canvas.toDataURL('image/png') : null;
                }""")
                if qr_data:
                    self._atualizar_db("aguardando_qr", qr_data)
            else:
                # Carregando ou desconhecido
                pass

        except Exception as e:
            logger.debug(f"Erro ao verificar estado: {e}")

    def _processar_fila(self):
        if self.status != "conectado" or not self.fila:
            return

        msg = self.fila[0]
        try:
            self._enviar_mensagem(msg['telefone'], msg['texto'])
            logger.info(f"Mensagem enviada para {msg['telefone']}")
            self.fila.pop(0)
        except Exception as e:
            logger.error(f"Erro envio {msg['telefone']}: {e}")
            msg['tentativas'] += 1
            if msg['tentativas'] >= 3:
                self.fila.pop(0)
            time.sleep(5) # Pause on error

    def _enviar_mensagem(self, telefone, texto):
        try:
            # Usa URL direta para iniciar chat
            texto_enc = urllib.parse.quote(texto)
            url = f"https://web.whatsapp.com/send?phone={telefone}&text={texto_enc}"
            self.page.goto(url, wait_until="domcontentloaded")
            
            # Espera o botão enviar aparecer
            # Pode ser o ícone de avião ou o botão Send
            send_btn = self.page.wait_for_selector('span[data-icon="send"]', timeout=30000)
            if send_btn:
                send_btn.click()
                time.sleep(3) # Garante envio
                return True
        except Exception:
            raise

    def _verificar_respostas(self):
        """Monitora respostas 'SIM' ou 'NÃO' nas conversas não lidas."""
        try:
            # Procura bolinhas verdes de não lido
            unreads = self.page.query_selector_all("span[aria-label*='unread message']")
            if not unreads:
                return

            for badge in unreads:
                badge.click() # Abre a conversa
                time.sleep(2)
                
                # Pega ultima mensagem recebida
                msgs = self.page.query_selector_all("div.message-in span.selectable-text")
                if msgs:
                    last_text = msgs[-1].inner_text().strip().upper()
                    
                    if last_text in ["SIM", "OK", "APROVADO", "PODE"]:
                        logger.info(f"Resposta POSITIVA detectada: {last_text}")
                        # Logica simplificada de aprovação (pega a última pendente)
                        self._marcar_aprovacao_pendente(True, last_text)
                    
                    elif last_text in ["NÃO", "NAO", "NEGADO"]:
                        logger.info(f"Resposta NEGATIVA detectada: {last_text}")
                        self._marcar_aprovacao_pendente(False, last_text)
                        
        except Exception as e:
            logger.debug(f"Erro monitor resposta: {e}")

    def _atualizar_db(self, status, qr=None):
        self.status = status
        self.qr_code = qr
        try:
            from api.models import ConfiguracaoWhatsApp
            ConfiguracaoWhatsApp.objects.update_or_create(id=1, defaults={
                'status_conexao': status,
                'qr_code': qr,
                'ultima_atualizacao': datetime.now()
            })
        except:
            pass

    def _marcar_aprovacao_pendente(self, aprovado, texto):
        try:
            from api.models import SolicitacaoAprovacao
            sol = SolicitacaoAprovacao.objects.filter(status='Pendente').last()
            if sol:
                sol.status = 'Aprovada' if aprovado else 'Rejeitada'
                sol.resposta_supervisor = texto
                sol.data_resposta = datetime.now()
                sol.save()
                logger.info(f"Solicitação {sol.id} atualizada para {sol.status}")
        except:
            pass

# Singleton Global
service = WhatsAppService()

# Funções de Atalho (Compatibilidade)
def iniciar(session_id="default"):
    service.iniciar()

def queue_message(telefone, mensagem):
    service.enfileirar_mensagem(telefone, mensagem)

def obter_estado(session_id="default"):
    return service.obter_status()

def is_sessao_rodando():
    return service.thread and service.thread.is_alive()
