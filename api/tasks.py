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


@shared_task
def saas_executar_atualizacao_agendada_task():
    """
    Tarefa periódica que checa as regras de agendamento do SaaS
    e dispara a atualização em lote se os critérios de dia/horário forem atendidos.
    """
    from api.models import ConfiguracaoAgendamento, SaaSCliente, VersaoSistema, HistoricoAtualizacao
    from api.views import realizar_backup_banco
    from django.utils import timezone
    import os
    import logging

    logger = logging.getLogger(__name__)
    logger.info("Checando agendamento inteligente de atualizações SaaS...")

    config = ConfiguracaoAgendamento.objects.first()
    if not config:
        logger.info("Nenhuma configuração de agendamento encontrada.")
        return

    if not config.agendamento_ativo:
        logger.info("Agendamento inteligente está inativo (sistema bloqueado para atualizações automáticas).")
        return

    # Validar dia da semana e horário aproximado (hora atual == hora programada)
    now = timezone.localtime(timezone.now())
    weekday = str(now.weekday()) # 0=Monday, ..., 6=Sunday
    scheduled_time = config.horario_execucao

    # Valida dia da semana
    days = [d.strip() for d in config.dias_da_semana.split(',') if d.strip()]
    if weekday not in days:
        logger.info(f"Hoje (dia da semana {weekday}) não está configurado para atualizações: {days}")
        return

    # Valida hora aproximada (com tolerância de execução)
    if now.hour != scheduled_time.hour:
        logger.info(f"Hora atual {now.hour}h não coincide com a hora agendada {scheduled_time.hour}h.")
        return

    # Busca a versão mais recente cadastrada
    versao = VersaoSistema.objects.all().order_by('-data_lancamento').first()
    if not versao:
        logger.warning("Nenhuma versão cadastrada no sistema. Cancelando agendamento.")
        return

    clientes_ativos = SaaSCliente.objects.filter(status_licenca='ATIVO')
    if not clientes_ativos.exists():
        logger.info("Nenhum cliente ativo encontrado para atualização agendada.")
        return

    # Executa a atualização para cada cliente ativo
    logger.info(f"Iniciando atualizações agendadas para a versão {versao.versao}...")
    for cliente in clientes_ativos:
        # Determina o caminho do script
        script_path = f"C:\\APERUS\\atualizar_{cliente.schema_name}.bat"
        if not os.path.exists(script_path):
            script_path = "C:\\APERUS\\atualizar_central.bat"

        if not os.path.exists(script_path):
            HistoricoAtualizacao.objects.create(
                cliente=cliente,
                versao=versao,
                status='FALHA',
                log_erro=f"Script de atualização não encontrado: {script_path} (Tarefa Agendada)"
            )
            logger.error(f"Script de atualização não encontrado para o cliente {cliente.razao_social}")
        else:
            # Cria histórico como PROCESSANDO e dispara a thread
            historico = HistoricoAtualizacao.objects.create(
                cliente=cliente,
                versao=versao,
                status='PROCESSANDO'
            )
            
            # Executa a atualização
            from api.views import SaaSClienteViewSet
            viewset = SaaSClienteViewSet()
            viewset.executar_script_background(historico.id_historico, script_path)
            logger.info(f"Disparada atualização em background para o cliente {cliente.razao_social}")
