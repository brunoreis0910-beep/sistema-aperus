"""
ServiÃ§o de agendamento automÃ¡tico de backups
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BackupSchedulerService:
    _instance = None
    _scheduler = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._scheduler is None:
            self._scheduler = BackgroundScheduler()
            self._scheduler.start()
            logger.info(" Scheduler de backup iniciado")
    
    def start_scheduler(self, hour=2, minute=0):
        """Inicia o agendamento automÃ¡tico"""
        try:
            # Remover job anterior se existir
            if self._scheduler.get_job('backup_job'):
                self._scheduler.remove_job('backup_job')
            
            # Adicionar novo job
            trigger = CronTrigger(hour=hour, minute=minute)
            self._scheduler.add_job(
                self.create_automatic_backup,
                trigger=trigger,
                id='backup_job',
                name='Backup AutomÃ¡tico',
                replace_existing=True
            )
            
            logger.info(f" Backup agendado para {hour:02d}:{minute:02d}")
            return True
            
        except Exception as e:
            logger.error(f" Erro ao agendar backup: {e}")
            return False
    
    def stop_scheduler(self):
        """Para o agendamento automÃ¡tico"""
        try:
            if self._scheduler.get_job('backup_job'):
                self._scheduler.remove_job('backup_job')
                logger.info(" Agendamento de backup parado")
            return True
        except Exception as e:
            logger.error(f" Erro ao parar scheduler: {e}")
            return False
    
    def create_automatic_backup(self):
        """Executa o backup automÃ¡tico"""
        from comandas.backup_utils import create_database_backup
        
        logger.info(" Iniciando backup automÃ¡tico...")
        backup_file = create_database_backup(compress=True)
        
        if backup_file:
            logger.info(f" Backup automÃ¡tico concluÃ­do: {backup_file}")
            self.cleanup_old_backups()
        else:
            logger.error(" Falha no backup automÃ¡tico")
    
    def cleanup_old_backups(self, keep_count=10):
        """Remove backups antigos, mantendo apenas os mais recentes"""
        from comandas.backup_utils import list_backups, delete_backup
        
        backups = list_backups()
        if len(backups) > keep_count:
            old_backups = backups[keep_count:]
            for backup in old_backups:
                delete_backup(backup['filename'])
                logger.info(f" Backup antigo removido: {backup['filename']}")
    
    def get_scheduler_status(self):
        """Retorna o status do scheduler"""
        job = self._scheduler.get_job('backup_job')
        
        if job:
            next_run = job.next_run_time
            return {
                'active': True,
                'next_run': next_run.isoformat() if next_run else None,
                'job_name': job.name,
                'trigger': str(job.trigger)
            }
        
        return {
            'active': False,
            'next_run': None,
            'job_name': None,
            'trigger': None
        }
    
    def update_schedule(self, hour, minute):
        """Atualiza o horÃ¡rio do agendamento"""
        return self.start_scheduler(hour, minute)
