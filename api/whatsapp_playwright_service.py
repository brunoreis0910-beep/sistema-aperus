import threading
import queue
import time
import logging
import os
import re
import asyncio
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from playwright.sync_api import sync_playwright
import pyperclip  # Clipboard para colar texto (mais confiável que digitação)
import pyautogui  # Controle de mouse/teclado para WhatsApp Desktop

logger = logging.getLogger(__name__)

class WhatsAppService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(WhatsAppService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self.queue = queue.Queue()
        self.stop_event = threading.Event()
        self.browser = None
        self.page = None
        self.playwright = None
        self.qr_code_base64 = None
        self.status = "stopped"
        self.last_activity = time.time()
        
        # Lock para garantir que apenas uma mensagem seja enviada por vez
        self.envio_lock = threading.Lock()
        self.ultima_navegacao = 0  # Timestamp da última navegação
        self.contador_envios = 0  # Contador de envios realizados
        self.envios_em_fila = 0  # Contador de mensagens aguardando na fila
        
        # Start worker thread
        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.worker_thread.start()

    def enviar_mensagem(self, telefone, mensagem):
        """Enfileira uma mensagem para envio."""
        self.envios_em_fila += 1
        logger.info(f"📨 [DEBUG] Nova mensagem enfileirada! Total na fila: {self.envios_em_fila}")
        self.queue.put({'type': 'send', 'phone': telefone, 'message': mensagem})
        return True

    def get_status(self):
        return {
            "status": self.status,
            "qr_code": self.qr_code_base64,
            "queue_size": self.queue.qsize()
        }
    
    def conectar(self):
        """Força a inicialização do navegador (útil para auto-start no apps.py)."""
        self.queue.put({'type': 'connect'})

    def capturar_qr(self):
        """Captura o QR Code da tela e atualiza a string base64."""
        try:
            if not self.page:
                return False
                
            # Espera o seletor do QR Code aparecer
            qr_selector = "canvas"  # O canvas do WhatsApp contem o QR
            try:
                # 1. Espera o elemento QR aparecer
                self.page.wait_for_selector(qr_selector, timeout=5000)
                
                # 2. Tira um "print" apenas do elemento do QR
                elemento_qr = self.page.query_selector(qr_selector)
                if elemento_qr:
                    import base64
                    img_bytes = elemento_qr.screenshot()
                    
                    # 3. Converte para Base64
                    # Formata como data URI para exibir direto no HTML
                    self.qr_code_base64 = f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"
                    
                    logger.info(f"✅ [Playwright] QR Code capturado em memória (Base64).")
                    return True
            except Exception:
                pass
                
        except Exception as e:
            logger.error(f"❌ [Playwright] Erro ao capturar QR Code: {e}")
        return False

    def _capturar_qr(self, page, nome_arquivo="qr_code.png"):
        """Captura o QR Code da tela e salva como arquivo."""
        try:
            # Espera o seletor do QR Code aparecer (canvas do WhatsApp Web)
            qr_selector = "canvas[aria-label]"
            page.wait_for_selector(qr_selector, timeout=30000)
            
            # Tira um print apenas do elemento do QR Code
            elemento_qr = page.query_selector(qr_selector)
            if elemento_qr:
                elemento_qr.screenshot(path=nome_arquivo)
                print(f"✅ [Playwright] QR Code salvo em: {os.path.abspath(nome_arquivo)}")
                return True
        except Exception as e:
            print(f"❌ [Playwright] Erro ao capturar QR Code: {e}")
        return False

    def _worker(self):
        """Loop principal do worker que gerencia o navegador."""
        # REMOVE completamente o event loop desta thread para usar Playwright Sync API
        # Django ASGI (com asyncio) roda no thread principal, mas este worker precisa
        # operar SEM event loop para o Playwright sync_api funcionar
        try:
            asyncio.set_event_loop(None)  # Remove qualquer event loop desta thread
        except Exception:
            pass
            
        logger.info("WhatsAppService Worker iniciado.")
        logger.info("🖥️ MODO DESKTOP ATIVADO - Navegador Playwright DESABILITADO")
        
        while not self.stop_event.is_set():
            try:
                # MODO DESKTOP: Navegador desabilitado - usa WhatsApp Desktop App
                # if (not self.browser or not self.page) and self.status not in ("failed", "error"):
                #     self._iniciar_navegador()
                
                # MODO DESKTOP: Não verifica QR Code (não usa navegador)
                # if self.status == "waiting_qr" and self.page:
                #     self._verificar_conexao()
                
                # Processa fila de mensagens
                try:
                    task = self.queue.get(timeout=2) # Espera 2s por tarefa
                    if task['type'] == 'send':
                        self._processar_envio(task['phone'], task['message'])
                    elif task['type'] == 'connect':
                        logger.info("📱 Tarefa de conexão recebida. Navegador será inicializado.")
                        # Navegador será inicializado no próximo ciclo do while
                    self.queue.task_done()
                except queue.Empty:
                    pass

                # MODO DESKTOP: Não monitora chat via navegador
                # if self.status == "connected" and time.time() - self.last_activity > 5:
                #     self._monitorar_chat()
                #     self.last_activity = time.time()
                    
            except Exception as e:
                logger.error(f"Erro no worker do WhatsApp: {e}", exc_info=True)
                self.status = "error"
                time.sleep(5)
                # Tenta reiniciar navegador em caso de falha crítica
                self._fechar_navegador()

    def _limpar_cache_corrompido(self, user_data_dir):
        """Remove arquivos de cache corrompidos do Chromium sem apagar a sessão."""
        import shutil
        import os
        cache_dir = os.path.join(user_data_dir, 'Default', 'Code Cache')
        local_state = os.path.join(user_data_dir, 'Local State')
        try:
            if os.path.exists(cache_dir):
                shutil.rmtree(cache_dir, ignore_errors=True)
                logger.info("🧹 Cache corrompido removido: Default/Code Cache")
            if os.path.exists(local_state):
                os.remove(local_state)
                logger.info("🧹 Arquivo corrompido removido: Local State")
        except Exception as e:
            logger.warning(f"Aviso ao limpar cache: {e}")

    def _iniciar_navegador(self):
        """Inicia o Playwright e abre o WhatsApp Web."""
        logger.info("Iniciando navegador Playwright...")
        try:
            import os
            # Cria diretório para salvar a sessão do WhatsApp
            user_data_dir = os.path.join(os.path.dirname(__file__), '..', 'whatsapp_session')
            os.makedirs(user_data_dir, exist_ok=True)
            # Limpa cache corrompido antes de iniciar (evita falha de leitura de prefs)
            self._limpar_cache_corrompido(user_data_dir)
            
            self.playwright = sync_playwright().start()
            
            # Use um User-Agent recente do Chrome para evitar bloqueios ou "versão antiga"
            # Chrome 133+ (Março 2026)
            ua_string = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
            
            # Usa persistent context para salvar a sessão do WhatsApp
            context = self.playwright.chromium.launch_persistent_context(
                user_data_dir,
                headless=True,  # Modo Headless (oculto) para servidor
                user_agent=ua_string,
                viewport={"width": 1280, "height": 720}, # Define tamanho da viewport explicitamente
                args=[
                    "--disable-blink-features=AutomationControlled", # Esconde flag de automação
                    "--no-first-run",
                    "--no-default-browser-check"
                ]
            )
            self.browser = context  # Para compatibilidade com o código existente
            self.page = context.pages[0] if context.pages else context.new_page()
            
            # Script para mascarar automação (navigator.webdriver)
            self.page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)
            
            self.page.goto("https://web.whatsapp.com", timeout=90000)  # 90 segundos para carregar
            
            logger.info("✅ Página carregada, aguardando elementos do WhatsApp...")
            try:
                # Tenta esperar o network ficar ocioso (página carregada) - Máximo 30s
                try:
                    logger.info("⏳ Aguardando network idle...")
                    self.page.wait_for_load_state("networkidle", timeout=30000)
                    logger.info("✅ Network idle atingido!")
                except Exception as e:
                    logger.warning(f"⚠️ Timeout aguardando networkidle ({e}), mas continuando...")

                # Espera pelo QR Code ou pela lista de chats (se já logado)
                logger.info("🔍 Procurando por QR Code ou chat list...")
                
                # Seletores comuns do WhatsApp Web (atualizados para 2026)
                # Tenta encontrar QUALQUER um destes elementos
                seletores_qr = [
                    "canvas[aria-label]",  # QR Code canvas
                    "canvas",  # QR Code genérico
                    "div[data-ref]",  # Container do QR
                ]
                
                seletores_logado = [
                    "div[data-testid='chat-list']",  # Lista de chats (logado)
                    "#pane-side",  # Panel lateral de conversas
                ]
                
                todos_seletores = seletores_qr + seletores_logado
                seletores_css = ", ".join(todos_seletores)
                
                logger.info(f"🔍 Tentando seletores: {seletores_css[:100]}...")
                self.page.wait_for_selector(seletores_css, timeout=90000)  # 90 segundos
                logger.info("✅ Algum seletor foi encontrado!")
                
                # Verifica qual elemento apareceu
                tem_qr = False
                tem_chatlist = False
                
                for sel in seletores_qr:
                    if self.page.query_selector(sel):
                        tem_qr = True
                        logger.info(f"✅ QR Code encontrado com seletor: {sel}")
                        break
                
                for sel in seletores_logado:
                    if self.page.query_selector(sel):
                        tem_chatlist = True
                        logger.info(f"✅ Chat list encontrada com seletor: {sel}")
                        break
                
                if tem_chatlist:
                    self.status = "connected"
                    logger.info("🎉 WhatsApp conectado com sucesso (sessão salva)!")
                elif tem_qr:
                    self.status = "waiting_qr"
                    logger.info("📱 Aguardando leitura do QR Code...")
                    self.capturar_qr()
                else:
                    logger.warning("⚠️ Nenhum elemento esperado encontrado, tentando capturar QR mesmo assim...")
                    self.status = "waiting_qr"
                    self.capturar_qr()
                    
            except Exception as e:
                logger.warning(f"Timeout aguardando carga inicial: {e}")
                if self.page:
                    try:
                        import os
                        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                        
                        # Salva Screenshot
                        debug_path = os.path.join(base_dir, "debug_timeout.png")
                        self.page.screenshot(path=debug_path)
                        logger.info(f"📸 Screenshot de debug salvo em: {debug_path}")
                        
                        # Salva HTML para análise
                        html_path = os.path.join(base_dir, "debug_page.html")
                        with open(html_path, "w", encoding="utf-8") as f:
                            f.write(self.page.content())
                        logger.info(f"📄 HTML de debug salvo em: {html_path}")
                        
                        # Tenta capturar QR code mesmo com timeout, caso o seletor específico tenha falhado mas o canvas esteja lá
                        if self.page.query_selector("canvas"):
                            self.capturar_qr()
                    except Exception as screenshot_err:
                        logger.error(f"Erro ao salvar debug info: {screenshot_err}")
                
        except Exception as e:
            erro_msg = str(e)
            logger.error(f"Falha ao iniciar navegador: {erro_msg}")
            
            # Cache corrompido: limpa e força retry imediato
            if "wrong file structure" in erro_msg.lower() or "failed to read prefs" in erro_msg.lower() or \
               ("target page" in erro_msg.lower() and "has been closed" in erro_msg.lower()):
                import os
                user_data_dir = os.path.join(os.path.dirname(__file__), '..', 'whatsapp_session')
                logger.warning("⚠️ Cache corrompido detectado. Limpando e tentando novamente...")
                self._limpar_cache_corrompido(user_data_dir)
                self.status = "stopped"  # Força retry imediato (não "failed")
                return

            # Se é erro de asyncio loop, marca como erro permanente
            if "asyncio loop" in erro_msg.lower() or "async api" in erro_msg.lower():
                self.status = "error"  # Erro permanente, não "failed" temporário
                logger.critical("🚫 ERRO CRÍTICO: Playwright Sync API não é compatível com o ambiente asyncio do Django.")
                logger.critical("🚫 Serviço de WhatsApp via Playwright desabilitado permanentemente.")
                logger.critical("💡 Use Evolution API ou WhatsApp Cloud API como alternativa.")
            else:
                self.status = "failed"

    def _fechar_navegador(self):
        if self.page: self.page.close()
        if self.browser: self.browser.close()
        if self.playwright: self.playwright.stop()
        self.page = None
        self.browser = None
        self.playwright = None

    def _verificar_conexao(self):
        """Verifica se o QR Code foi escaneado e a conexão foi estabelecida."""
        try:
            if self.page and self.status == "waiting_qr":
                # Verifica se a lista de chats apareceu (significa que QR foi escaneado)
                chat_list = self.page.query_selector("div[data-testid='chat-list']")
                if chat_list:
                    self.status = "connected"
                    logger.info("✅ QR Code escaneado! WhatsApp conectado com sucesso!")
                    
                    # Processa mensagens pendentes na fila
                    if not self.queue.empty():
                        logger.info(f"Processando {self.queue.qsize()} mensagens pendentes...")
        except Exception as e:
            logger.error(f"Erro ao verificar conexão: {e}", exc_info=True)

    def _processar_envio(self, telefone, mensagem):
        """
        Processa o envio de uma mensagem com LOCK para evitar concorrência.
        Garante que apenas UMA mensagem seja enviada por vez.
        """
        self.envios_em_fila -= 1
        logger.info(f"📥 [DEBUG] Processando mensagem... Restantes na fila: {self.envios_em_fila}")
        
        # Tenta adquirir o lock (aguarda se outra mensagem está sendo enviada)
        logger.info(f"🔒 [DEBUG] Tentando adquirir lock de envio...")
        lock_acquired = self.envio_lock.acquire(blocking=True, timeout=120)
        
        if not lock_acquired:
            logger.error(f"❌ [DEBUG] Timeout ao aguardar lock de envio (120s). Mensagem descartada.")
            return
        
        try:
            logger.info(f"✅ [DEBUG] Lock de envio adquirido! Processando mensagem...")
            
            # Verifica tempo desde última navegação
            tempo_decorrido = time.time() - self.ultima_navegacao
            if tempo_decorrido < 5:
                delay_necessario = 5 - tempo_decorrido
                logger.info(f"⏳ [DEBUG] Aguardando {delay_necessario:.1f}s para evitar sobreposição...")
                time.sleep(delay_necessario)

            # MODO DESKTOP - Usa WhatsApp Desktop App ao invés de Web
            logger.info(f"🖥️ [DESKTOP] Enviando via WhatsApp Desktop App...")
            self._executar_envio_desktop(telefone, mensagem)
            
        finally:
            # SEMPRE libera o lock, mesmo em caso de erro
            logger.info(f"🔓 [DEBUG] Liberando lock de envio...")
            self.envio_lock.release()
    
    def _executar_envio(self, telefone, mensagem):
        """Executa o envio propriamente dito (após adquirir o lock)."""
        try:
            # Atualiza timestamp da navegação
            self.ultima_navegacao = time.time()
            self.contador_envios += 1
            
            logger.info(f"🚀 [DEBUG] INICIANDO ENVIO #{self.contador_envios}")
            
            # Formata telefone (remove 55 se duplicado, garante apenas numeros)
            phone = re.sub(r'[^0-9]', '', telefone)
            
            # ESTRATÉGIA CORRIGIDA: Abre o chat SEM o texto, digita manualmente
            link = f"https://web.whatsapp.com/send?phone={phone}"
            
            logger.info(f"📤 [DEBUG] Abrindo chat vazio...")
            logger.info(f"📱 [DEBUG] Telefone: {phone}")
            logger.info(f"📝 [DEBUG] Mensagem ({len(mensagem)} chars): {mensagem[:100]}...")
            logger.info(f"🔗 [DEBUG] URL: {link}")
            
            # Navega para o chat
            logger.info(f"🌐 [DEBUG] Navegando para o chat...")
            self.page.goto(link, wait_until="networkidle", timeout=60000)
            logger.info(f"✅ [DEBUG] Página carregada (networkidle - sem tráfego de rede)!")
            
            # AGUARDA O CHAT ABRIR (6s para estabilizar - conforme análise do vídeo)
            logger.info(f"⏳ [DEBUG] Aguardando 6s para chat estabilizar completamente...")
            time.sleep(6)
            
            # PROCURA E DIGITA NA CAIXA DE TEXTO
            input_encontrado = False
            
            input_selectors = [
                'div[contenteditable="true"][data-tab="10"]',
                'footer div[contenteditable="true"]',
                'div[contenteditable="true"]',
            ]
            
            for i, selector in enumerate(input_selectors):
                try:
                    logger.info(f"🔍 [DEBUG] Tentando seletor {i+1}/{len(input_selectors)}: {selector}")
                    
                    # Timeout de 10s para campo aparecer (conforme vídeo - campo pode demorar)
                    if self.page.is_visible(selector, timeout=10000):
                        logger.info(f"✅ [DEBUG] Campo de texto encontrado e visível!")
                        
                        # FOCO NO CAMPO
                        logger.info(f"🎯 [DEBUG] Focando e clicando no campo...")
                        self.page.focus(selector)
                        self.page.click(selector)
                        time.sleep(1)  # Cursor piscar
                        
                        # ESTRATÉGIA CLIPBOARD: Mais confiável que digitação
                        # WhatsApp detecta digitação programática, mas colagem (Ctrl+V) funciona
                        logger.info(f"📋 [DEBUG] Copiando mensagem para clipboard...")
                        pyperclip.copy(mensagem)
                        logger.info(f"✅ [DEBUG] Mensagem copiada para área de transferência!")
                        
                        # COLA A MENSAGEM (Ctrl+V)
                        logger.info(f"📋 [DEBUG] Colando mensagem com Ctrl+V...")
                        self.page.keyboard.down("Control")
                        self.page.keyboard.press("v")
                        self.page.keyboard.up("Control")
                        logger.info(f"✅ [DEBUG] Mensagem colada com sucesso!")
                        
                        # AGUARDA PROCESSAMENTO
                        # Colagem ativa o botão de enviar automaticamente
                        logger.info(f"⏳ [DEBUG] Aguardando 2s para botão de enviar ativar...")
                        time.sleep(2)
                        
                        # TENTA ENTER (deve funcionar agora)
                        logger.info(f"⌨️ [DEBUG] Enviando via Enter...")
                        self.page.keyboard.press("Enter")
                        logger.info(f"✅ [DEBUG] Enter enviado!")
                        
                        # PAUSA ENTRE ENTER E BACKUP
                        time.sleep(1)
                        
                        # BACKUP: Clica no botão se Enter falhar
                        logger.info(f"🔄 [DEBUG] Backup: Verificando botão de envio...")
                        try:
                            botao_enviar = 'span[data-icon="send"]'
                            if self.page.is_visible(botao_enviar, timeout=2000):
                                logger.info(f"🖱️ [DEBUG] Clicando no botão de enviar...")
                                self.page.click(botao_enviar)
                                logger.info("✅ [DEBUG] Clique no botão realizado!")
                        except Exception as e:
                            logger.debug(f"⚠️ [DEBUG] Botão de enviar não encontrado: {e}")
                        
                        input_encontrado = True
                        break
                        
                except Exception as e:
                    logger.debug(f"⚠️ [DEBUG] Seletor {i+1} falhou: {e}")
                    continue
            
            if not input_encontrado:
                logger.error(f"❌ [DEBUG] Campo de texto não encontrado!")
                
                # Screenshot para análise
                screenshot_path = f"debug_campo_nao_encontrado_{int(time.time())}.png"
                self.page.screenshot(path=screenshot_path, full_page=True)
                logger.error(f"📸 Screenshot salva em: {screenshot_path}")
                logger.error(f"⚠️ Verifique se o WhatsApp Web carregou corretamente")
            
            # Aguarda confirmação de envio (3s - tempo para reloginho virar check)
            if input_encontrado:
                logger.info(f"⏳ [DEBUG] Aguardando 3s para confirmação de envio...")
                time.sleep(3)
                logger.info(f"🎉 Mensagem #{self.contador_envios} enviada para {phone}!")
            else:
                logger.error(f"❌ FALHA TOTAL ao enviar para {phone}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar mensagem para {telefone}: {e}", exc_info=True)

    def _executar_envio_desktop(self, telefone, mensagem):
        """
        Envia mensagem via WhatsApp DESKTOP (aplicativo instalado).
        Usa PyAutoGUI para controlar mouse/teclado real.
        
        VANTAGENS:
        - Não depende de seletores CSS
        - Não sofre detecção de bot
        - Mais estável que navegador
        - WhatsApp Desktop menos restritivo
        
        REQUISITOS:
        - WhatsApp Desktop instalado no Windows
        - WhatsApp logado no aplicativo
        - Computador desbloqueado
        """
        try:
            self.ultima_navegacao = time.time()
            self.contador_envios += 1
            
            logger.info(f"🚀 [DESKTOP] INICIANDO ENVIO #{self.contador_envios}")
            
            # Formata telefone
            phone = re.sub(r'[^0-9]', '', telefone)
            
            # Link que abre o APLICATIVO (não o navegador)
            # whatsapp:// é um protocolo do Windows que chama o app instalado
            link = f"whatsapp://send?phone={phone}"
            
            logger.info(f"📱 [DESKTOP] Abrindo WhatsApp Desktop...")
            logger.info(f"📱 [DESKTOP] Telefone: {phone}")
            logger.info(f"📝 [DESKTOP] Mensagem ({len(mensagem)} chars): {mensagem[:100]}...")
            
            # Abre o WhatsApp Desktop com o chat específico
            # os.startfile() é exclusivo Windows
            os.startfile(link)
            logger.info(f"✅ [DESKTOP] Comando de abertura enviado!")
            
            # AGUARDA APP ABRIR E CARREGAR CHAT
            # WhatsApp Desktop é mais pesado que web, precisa mais tempo
            logger.info(f"⏳ [DESKTOP] Aguardando 8s para app carregar...")
            time.sleep(8)
            
            # Divide a mensagem em partes (separador §§ = mensagens separadas).
            # URLs isoladas em mensagem própria são sempre clicáveis no WhatsApp.
            partes = [p.strip() for p in mensagem.split('\n§§\n') if p.strip()]
            logger.info(f"📋 [DESKTOP] Enviando {len(partes)} parte(s)...")

            for idx, parte in enumerate(partes):
                # ESTRATÉGIA LINK vs TEXTO:
                # Links: Digitados manualmente (write) para forçar reconhecimento
                # Texto: Colado (pyperclip) para preservar emojis e formatação
                
                if parte.strip().startswith('http'):
                    logger.info(f"⌨️ [DESKTOP] Enviando Link {idx+1}: {parte}")
                    
                    # LINK: Usa Clipboard + Espaço + Delay
                    # Copia e cola o link para evitar erros de caractere
                    pyperclip.copy(parte)
                    pyautogui.hotkey('ctrl', 'v')
                    
                    # O SEGREDO PARA FICAR AZUL:
                    time.sleep(0.3)
                    pyautogui.press('space') # Adiciona um espaço após o link
                    
                    logger.info(f"⏳ [DESKTOP] Aguardando 1.2s para renderização do link...")
                    time.sleep(1.2)          # AGUARDA o WhatsApp processar a URL
                    pyautogui.press('enter')
                    
                else:
                    logger.info(f"📋 [DESKTOP] Enviando Texto {idx+1}...")
                    pyperclip.copy(parte)
                    pyautogui.hotkey('ctrl', 'v')
                    time.sleep(0.5)
                    pyautogui.press('enter')

                logger.info(f"✅ [DESKTOP] Parte {idx+1} enviada!")

                if idx < len(partes) - 1:
                    logger.info(f"⏳ [DESKTOP] Aguardando 0.8s antes da próxima parte...")
                    time.sleep(0.8)

            # AGUARDA CONFIRMAÇÃO FINAL
            logger.info(f"⏳ [DESKTOP] Aguardando 2s para confirmação...")
            time.sleep(2)

            logger.info(f"🎉 [DESKTOP] Mensagem #{self.contador_envios} enviada para {phone} ({len(partes)} parte(s))!")
            
            # OPCIONAL: Minimiza ou fecha o WhatsApp Desktop
            # Descomente se quiser que o app não fique aberto
            # logger.info(f"🪟 [DESKTOP] Minimizando WhatsApp...")
            # pyautogui.hotkey('alt', 'f4')  # Fecha janela ativa
            
        except Exception as e:
            logger.error(f"❌ [DESKTOP] Erro ao enviar via WhatsApp Desktop: {e}", exc_info=True)
            raise  # Propaga erro para tentar fallback (Playwright)

    def _monitorar_chat(self):
        """Verifica se há novas mensagens SIM/NÃO do supervisor."""
        try:
            # Importa MODELS aqui para evitar ciclo
            from api.models import SolicitacaoAprovacao
            
            # Captura últimas mensagens da conversa ativa (assumindo que estamos na conversa do supervisor)
            # Para produção robusta, iteraríamos sobre conversas não lidas.
            
            if not self.page: return
            
            # Tenta encontrar mensagens recebidas (classe .message-in no WhatsApp Web)
            # Nota: Classes do WhatsApp mudam frequentemente. Usar seletores por atributo é melhor.
            # self.page.query_selector_all('div[data-id^="false_"]') # mensagens enviadas por outros (false = incoming)
            
            try:
                mensagens_recebidas = self.page.query_selector_all('div.message-in span.selectable-text span')
            except:
                mensagens_recebidas = []
                
            if not mensagens_recebidas:
                return

            last_msg_container = mensagens_recebidas[-1]
            last_msg_text = last_msg_container.inner_text().strip().upper()
            
            logger.debug(f"[Monitor] Última mensagem recebida: {last_msg_text}")
            
            resposta_aprovada = False
            resposta_rejeitada = False
            
            if "SIM" in last_msg_text or "APROVAR" in last_msg_text or "LIBERA" in last_msg_text:
                resposta_aprovada = True
            elif "NÃO" in last_msg_text or "NAO" in last_msg_text or "REJEITAR" in last_msg_text:
                resposta_rejeitada = True
            
            if resposta_aprovada or resposta_rejeitada:
                self._processar_aprovacao(resposta_aprovada)
                
        except Exception as e:
            logger.error(f"Erro ao monitorar chat: {e}")

    def _processar_aprovacao(self, aprovado):
        from api.models import SolicitacaoAprovacao
        
        # Busca solicitação pendente mais recente
        # IMPORTANTE: Adicionar um filtro de tempo para não aprovar coisas antigas com mensagens novas
        uma_hora_atras = timezone.now() - timedelta(hours=1)
        
        solicitacao = SolicitacaoAprovacao.objects.filter(
            status='Pendente',
            data_solicitacao__gte=uma_hora_atras
        ).order_by('-data_solicitacao').first()
        
        if solicitacao:
            novo_status = 'Aprovada' if aprovado else 'Rejeitada'
            solicitacao.status = novo_status
            solicitacao.observacao_supervisor = f"Resposta via WhatsApp (Auto): {'SIM' if aprovado else 'NÃO'}"
            solicitacao.data_aprovacao = timezone.now()
            solicitacao.save()
            
            logger.info(f"Solicitação {solicitacao.pk} atualizada para {novo_status} via resposta WhatsApp.")
            
            # Feedback no WhatsApp (digitando na caixa de texto)
            texto_feedback = f"✅ Solicitação #{solicitacao.pk} processada: {novo_status}!"
            try:
                # Tenta enviar feedback na mesma conversa
                chat_box = self.page.query_selector("div[contenteditable='true'][data-tab='10']")
                if chat_box:
                    chat_box.fill(texto_feedback)
                    chat_box.press("Enter")
            except:
                pass


# ── Inicialização Global ──────────────────────────────────────────────────────
# Singleton global para acesso via import
_service_instance = None

def iniciar(session_id="default"):
    """
    Inicializa o serviço WhatsApp (se ainda não estiver rodando).
    Chamado automaticamente pelo apps.py no startup do Django.
    """
    global _service_instance
    if _service_instance is None:
        _service_instance = WhatsAppService()
        logger.info(f"WhatsAppService inicializado globalmente (session: {session_id})")
    return _service_instance

def get_service():
    """Retorna a instância do serviço (cria se necessário)."""
    global _service_instance
    if _service_instance is None:
        _service_instance = WhatsAppService()
    return _service_instance

# M�dulo Compatibility (para views_nativo.py)
import os
SESSION_DIR = os.path.join(os.path.dirname(__file__), '..', 'whatsapp_session')
_SESSAO_RODANDO = True

def obter_estado(session_id="default"):
    """
    Retorna (status, qr_code_base64) para compatibilidade com views_nativo.
    """
    svc = get_service()
    
    # Mapeia status do service para o esperado pelo views_nativo
    # service.status pode ser: 'stopped', 'waiting_qr', 'connected', 'failed', 'error'
    
    status_map = {
        'waiting_qr': 'pendente',
        'connected': 'conectado',
        'stopped': 'aguardando',
        'failed': 'erro',
        'error': 'erro'
    }
    
    estado = status_map.get(svc.status, 'aguardando')
    qr_code = svc.qr_code_base64
    
    return estado, qr_code

def is_sessao_rodando():
    svc = get_service()
    # Se tem browser/page, est� rodando
    return svc.browser is not None

def _set_estado(novo_estado):
    # Apenas para limpar estado se necess�rio
    pass


def obter_qr_base64(session='default'):
    """Retorna o QR code base64 para o view gerencial"""
    svc = get_service()
    # Verifica se precisa tentar capturar novamente antes de retornar
    if svc.page and not svc.qr_code_base64:
        svc.capturar_qr()
    return svc.qr_code_base64

