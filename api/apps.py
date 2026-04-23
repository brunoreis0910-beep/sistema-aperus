from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        """Importar signals quando o app estiver pronto"""
        import api.signals
        import api.signals_boleto  # Signals para geração automática de boletos

        # Auto-inicia a sessão do WhatsApp Web (Playwright) em background.
        # Se já houver sessão salva, conecta sem precisar escanear QR.
        # Isso garante que o provedor Playwright esteja pronto quando uma
        # solicitação de aprovação de desconto chegar.
        #
        # IMPORTANTE: Django runserver roda 2 processos (watcher + servidor).
        # RUN_MAIN='true' identifica o processo filho (o servidor real).
        # Com --noreload, RUN_MAIN não existe, então iniciamos direto.
        import os
        run_main = os.environ.get('RUN_MAIN')
        
        # Inicia se: (1) não é watcher (RUN_MAIN='true') OU (2) runserver com --noreload (sem RUN_MAIN)
        if run_main == 'true' or run_main is None:
            # ── Valida token da Cloud API em background para detectar expiração ──
            # Evita que o sistema reporte "Cloud API OK" com token expirado.
            def _validar_cloud_api():
                try:
                    import time
                    time.sleep(2)  # Aguarda Django terminar de inicializar completamente
                    from api import whatsapp_cloud_service as _cloud
                    if not _cloud.token_com_erro():
                        token, phone_id, _ = _cloud._get_credenciais()
                        if token and phone_id:
                            resultado = _cloud.testar_conexao_api()
                            # Só marca erro de token se a falha NÃO foi por rede inacessível
                            if not resultado.get('ok') and not resultado.get('sem_rede'):
                                _cloud.marcar_token_erro()
                except Exception:
                    pass

            import threading
            threading.Thread(target=_validar_cloud_api, daemon=True).start()

            # ── Auto-inicia Playwright em background ───────────────────────────
            # TEMPORARIAMENTE DESABILITADO - estava bloqueando inicialização do servidor
            # try:
            #     from api import whatsapp_playwright_service as _pw
            #     service = _pw.iniciar("default")
            #     # Força conexão imediata (abre navegador e tenta conectar)
            #     # service.conectar()
            # except Exception as e:
            #     import logging
            #     logging.getLogger(__name__).warning(f"Erro ao iniciar WhatsApp Playwright: {e}")

            # ── Auto-inicia Listener do WhatsApp Desktop em background ─────────
            # Fica monitorando respostas do supervisor via WhatsApp Desktop App.
            # REQUER opt-in explícito via WHATSAPP_DESKTOP_LISTENER_ENABLED=True no .env
            # para evitar que o WhatsApp seja aberto automaticamente bez querer.
            def _iniciar_desktop_listener():
                try:
                    import time
                    time.sleep(5)  # Aguarda Django finalizar inicialização
                    from decouple import config as _config
                    # Só inicia se habilitado explicitamente no .env
                    if not _config('WHATSAPP_DESKTOP_LISTENER_ENABLED', default='False', cast=bool):
                        import logging
                        logging.getLogger(__name__).info(
                            "Listener WhatsApp Desktop desabilitado "
                            "(WHATSAPP_DESKTOP_LISTENER_ENABLED=False no .env)."
                        )
                        return
                    from api import whatsapp_cloud_service as _cloud
                    # Se Cloud API está OK, não precisa do listener Desktop
                    if _cloud.is_configurado() and not _cloud.token_com_erro():
                        import logging
                        logging.getLogger(__name__).info(
                            "Cloud API configurada e válida — listener Desktop não iniciado."
                        )
                        return
                    # Inicia o listener Desktop
                    from api import whatsapp_desktop_listener as _listener
                    _listener.iniciar_listener()
                except Exception as exc:
                    import logging
                    logging.getLogger(__name__).warning(
                        f"Listener WhatsApp Desktop não pôde ser iniciado: {exc}"
                    )

            import threading
            threading.Thread(target=_iniciar_desktop_listener, daemon=True).start()
