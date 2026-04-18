from celery import shared_task
import requests
import logging
import time
from django.conf import settings
from django.db import connection

logger = logging.getLogger(__name__)

# Configuração da Evolution API
# Se não estiver definido em settings.py, usa valores padrão
EVOLUTION_API_URL = getattr(settings, 'EVOLUTION_API_URL', 'http://localhost:8080')
EVOLUTION_INSTANCE = getattr(settings, 'EVOLUTION_INSTANCE', 'Gerencial')
EVOLUTION_API_KEY = getattr(settings, 'EVOLUTION_API_KEY', '')

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def enviar_mensagem_whatsapp_task(self, telefone, mensagem, id_fila=None, tipo_envio='texto', arquivo_base64=None):
    """
    Envia mensagem via Evolution API de forma assíncrona.
    Suporta texto simples ou arquivos.
    """
    logger.info(f"Iniciando envio para {telefone}. ID Fila: {id_fila}")

    headers = {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }

    # Limpar telefone (apenas números)
    telefone_limpo = ''.join(filter(str.isdigit, str(telefone)))
    if len(telefone_limpo) <= 11:
        telefone_limpo = f"55{telefone_limpo}"

    try:
        if tipo_envio == 'texto':
            url = f"{EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}"
            payload = {
                "number": telefone_limpo,
                "text": mensagem,
                "options": {
                    "delay": 1200,
                    "presence": "composing",
                    "linkPreview": True
                }
            }
        elif tipo_envio == 'media' and arquivo_base64:
            url = f"{EVOLUTION_API_URL}/message/sendMedia/{EVOLUTION_INSTANCE}"
            payload = {
                "number": telefone_limpo,
                "mediatype": "document", # Pode ser image/video/document
                "mimetype": "application/pdf", # Assumindo PDF por padrão para NFe
                "caption": mensagem,
                "media": arquivo_base64, # Base64 string
                "fileName": "documento.pdf"
            }
        else:
            logger.error(f"Tipo de envio desconhecido: {tipo_envio}")
            return False

        # Chamada HTTP com timeout para não travar o worker
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        resultado = response.json()
        logger.info(f"Envio realizado com sucesso: {resultado}")

        # Atualizar status no banco de dados (se id_fila for fornecido)
        if id_fila:
            try:
                with connection.cursor() as cursor:
                    # Atualiza status para 'enviado' e data de envio
                    cursor.execute("""
                        UPDATE fila_whatsapp 
                        SET status = 'enviado', 
                            data_envio = NOW(),
                            tentativas = tentativas + 1
                        WHERE id = %s
                    """, [id_fila])
            except Exception as e:
                logger.error(f"Erro ao atualizar status no banco: {e}")

        return resultado

    except requests.exceptions.RequestException as exc:
        logger.error(f"Erro de conexão ao enviar WhatsApp para {telefone}: {exc}")
        
        # Atualizar contagem de tentativas no banco
        if id_fila:
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE fila_whatsapp 
                    SET tentativas = tentativas + 1,
                        erro_mensagem = %s
                    WHERE id = %s
                """, [str(exc)[:255], id_fila])

        # Retry com backoff exponencial
        # Se falhar 3 vezes, o Celery vai desistir e logar erro crítico
        raise self.retry(exc=exc)
