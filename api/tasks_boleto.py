"""
Celery Tasks para Verificação Automática de Boletos Pagos
Configura execução periódica de consulta a APIs bancárias
"""
from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(name='verificar_boletos_pagos')
def verificar_boletos_pagos():
    """
    Task Celery para verificar boletos pagos via API bancária
    Executa baixa automática quando detecta pagamento
    
    Agendar no settings.py:
    CELERY_BEAT_SCHEDULE = {
        'verificar-boletos-pagos': {
            'task': 'verificar_boletos_pagos',
            'schedule': crontab(minute='0'),  # A cada hora
        },
    }
    """
    try:
        from api.services_baixa_automatica import servico_baixa_automatica
        
        logger.info('Iniciando task de verificação de boletos pagos')
        
        resultado = servico_baixa_automatica.verificar_boletos_pendentes()
        
        logger.info(
            f'Task finalizada - '
            f'Processados: {resultado["processados"]}, '
            f'Baixados: {resultado["baixados"]}, '
            f'Erros: {len(resultado["erros"])}'
        )
        
        return {
            'status': 'success',
            'processados': resultado['processados'],
            'baixados': resultado['baixados'],
            'erros': resultado['erros'],
            'timestamp': resultado['timestamp'].isoformat()
        }
        
    except Exception as e:
        logger.error(f'Erro na task de verificação de boletos: {str(e)}', exc_info=True)
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }


@shared_task(name='consultar_boleto_individual')
def consultar_boleto_individual(id_boleto):
    """
    Task para consultar um boleto específico
    Útil para reprocessamento ou consulta sob demanda
    
    Args:
        id_boleto: ID do boleto a ser consultado
    
    Returns:
        dict: Resultado da consulta
    """
    try:
        from api.models import Boleto
        from api.services_baixa_automatica import servico_baixa_automatica
        
        logger.info(f'Consultando boleto {id_boleto}')
        
        boleto = Boleto.objects.get(id_boleto=id_boleto)
        
        sucesso, dados = servico_baixa_automatica.consultar_status_boleto(boleto)
        
        if sucesso and dados.get('status') == 'PAGO':
            servico_baixa_automatica.executar_baixa_automatica(boleto, dados)
            logger.info(f'Boleto {id_boleto} baixado automaticamente')
            return {'status': 'paid_and_cleared', 'boleto_id': id_boleto}
        
        return {'status': 'consulted', 'boleto_status': dados.get('status')}
        
    except Exception as e:
        logger.error(f'Erro ao consultar boleto {id_boleto}: {str(e)}', exc_info=True)
        return {'status': 'error', 'error': str(e)}


@shared_task(name='gerar_relatorio_baixas_diario')
def gerar_relatorio_baixas_diario():
    """
    Gera relatório diário de baixas automáticas
    Enviar por email ou salvar em arquivo
    
    Agendar no settings.py:
    CELERY_BEAT_SCHEDULE = {
        'relatorio-diario-baixas': {
            'task': 'gerar_relatorio_baixas_diario',
            'schedule': crontab(hour='8', minute='0'),  # 8h da manhã
        },
    }
    """
    try:
        from api.services_baixa_automatica import servico_baixa_automatica
        from datetime import date, timedelta
        
        # Relatório do dia anterior
        ontem = date.today() - timedelta(days=1)
        
        logger.info(f'Gerando relatório de baixas do dia {ontem}')
        
        boletos = servico_baixa_automatica.gerar_relatorio_baixas_automaticas(
            data_inicio=ontem,
            data_fim=ontem
        )
        
        total_boletos = boletos.count()
        valor_total = sum(float(b.valor_pago or 0) for b in boletos)
        
        # Aqui você pode enviar email, salvar arquivo, etc
        logger.info(
            f'Relatório gerado - '
            f'Data: {ontem}, '
            f'Boletos: {total_boletos}, '
            f'Valor Total: R$ {valor_total:.2f}'
        )
        
        # TODO: Implementar envio de email
        # send_mail(
        #     subject=f'Relatório de Baixas Automáticas - {ontem}',
        #     message=f'Total: {total_boletos} boletos baixados, R$ {valor_total:.2f}',
        #     from_email='sistema@empresa.com',
        #     recipient_list=['financeiro@empresa.com'],
        # )
        
        return {
            'status': 'success',
            'data': str(ontem),
            'total_boletos': total_boletos,
            'valor_total': float(valor_total)
        }
        
    except Exception as e:
        logger.error(f'Erro ao gerar relatório diário: {str(e)}', exc_info=True)
        return {'status': 'error', 'error': str(e)}


# ====================================================
# Configuração para settings.py
# ====================================================
"""
Adicione no seu settings.py:

# Celery Configuration
CELERY_BROKER_URL = 'redis://localhost:6379/0'  # ou RabbitMQ
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/Sao_Paulo'

# Celery Beat Schedule (agendamento de tasks)
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    # Verifica boletos pagos a cada 1 hora
    'verificar-boletos-pagos': {
        'task': 'verificar_boletos_pagos',
        'schedule': crontab(minute='0'),  # A cada hora cheia
    },
    
    # Relatório diário às 8h da manhã
    'relatorio-diario-baixas': {
        'task': 'gerar_relatorio_baixas_diario',
        'schedule': crontab(hour='8', minute='0'),
    },
    
    # Verificação mais frequente (a cada 15 minutos) - OPCIONAL
    # 'verificar-boletos-frequente': {
    #     'task': 'verificar_boletos_pagos',
    #     'schedule': crontab(minute='*/15'),  # A cada 15 min
    # },
}

# ====================================================
# Comandos para rodar Celery
# ====================================================

# 1. Instalar dependências
pip install celery redis

# 2. Rodar Redis (broker)
# Windows: baixar do https://github.com/microsoftarchive/redis/releases
redis-server

# 3. Rodar Celery Worker (processar tasks)
celery -A seu_projeto worker -l info --pool=solo  # Windows
celery -A seu_projeto worker -l info              # Linux/Mac

# 4. Rodar Celery Beat (agendador)
celery -A seu_projeto beat -l info

# 5. Monitorar tasks (opcional)
celery -A seu_projeto flower
# Acesse: http://localhost:5555

# ====================================================
# Alternativa: Usar Cron do Sistema (sem Celery)
# ====================================================

# Se não quiser usar Celery, pode criar um management command e agendar via cron:

# api/management/commands/verificar_boletos.py
from django.core.management.base import BaseCommand
from api.services_baixa_automatica import servico_baixa_automatica

class Command(BaseCommand):
    help = 'Verifica boletos pagos e executa baixas automáticas'
    
    def handle(self, *args, **options):
        resultado = servico_baixa_automatica.verificar_boletos_pendentes()
        self.stdout.write(f'Processados: {resultado["processados"]}, Baixados: {resultado["baixados"]}')

# Agendar no crontab do Linux:
# 0 * * * * cd /caminho/projeto && python manage.py verificar_boletos

# Agendar no Task Scheduler do Windows:
# Criar tarefa agendada executando: python manage.py verificar_boletos
"""
