import os
import subprocess
import gzip
import shutil
import glob
import time
import logging
import threading
from django.utils import timezone
from django.conf import settings
from api.models import AgendamentoBackupLocal

logger = logging.getLogger(__name__)

# Lock para evitar que backups concorrentes sejam executados ao mesmo tempo
_backup_lock = threading.Lock()

def localizar_mysqldump():
    """Localiza o executável mysqldump.exe no Windows de forma resiliente."""
    # Se já estiver no PATH global
    if shutil.which("mysqldump"):
        return "mysqldump"
        
    # Caminhos comuns de instalação no Windows
    caminhos = [
        r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.3\bin\mysqldump.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.2\bin\mysqldump.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.1\bin\mysqldump.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        r"C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe",
        r"C:\xampp\mysql\bin\mysqldump.exe",
    ]
    for caminho in caminhos:
        if os.path.exists(caminho):
            return f'"{caminho}"'
            
    return "mysqldump"  # fallback final caso não ache nada

def realizar_backup_unidade_g():
    """Gera o dump de cada banco de dados individualmente e salva compactado no destino configurado."""
    if not _backup_lock.acquire(blocking=False):
        logger.warning("[BACKUP] Já existe uma execução de backup em andamento.")
        return False, "Backup já está em andamento."

    config = AgendamentoBackupLocal.objects.filter(ativo=True).first()
    if not config:
        _backup_lock.release()
        return False, "Nenhuma configuração de backup ativa encontrada."

    dest_dir = config.diretorio_destino
    
    try:
        logger.info(f"[BACKUP] Iniciando processo de backup individual de bancos para: {dest_dir}")
        
        # 1. Garante que a pasta de destino exista
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir, exist_ok=True)

        # 2. Obtém a lista de bancos de dados a serem salvos
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            databases = [row[0] for row in cursor.fetchall()]

        db_config = settings.DATABASES['default']
        mother_db = db_config['NAME']
        
        databases_to_backup = []
        for db in databases:
            if db in ['information_schema', 'mysql', 'performance_schema', 'sys']:
                continue
            if db.startswith('test_'):
                continue
            if db == mother_db or db.startswith('aperus_') or db.startswith('sistema_'):
                databases_to_backup.append(db)

        if not databases_to_backup:
            raise Exception("Nenhum banco de dados qualificado encontrado para backup.")

        db_user = db_config['USER']
        db_password = db_config['PASSWORD']
        db_host = db_config.get('HOST', '127.0.0.1')
        db_port = db_config.get('PORT', '3306')
        mysqldump_bin = localizar_mysqldump()
        
        timestamp = timezone.localtime(timezone.now()).strftime('%Y%m%d_%H%M%S')
        sucessos = []
        falhas = []

        # 3. Executa o dump para cada banco de dados
        for db_name in databases_to_backup:
            temp_sql = os.path.join(dest_dir, f"temp_backup_{db_name}_{timestamp}.sql")
            nome_arquivo = f"{db_name}_{timestamp}.sql.gz"
            caminho_final = os.path.join(dest_dir, nome_arquivo)
            
            try:
                logger.info(f"[BACKUP] Gerando dump do banco {db_name}...")
                comando = f'{mysqldump_bin} -u {db_user} -p"{db_password}" -h {db_host} -P {db_port} {db_name} > "{temp_sql}"'
                resultado = subprocess.run(comando, shell=True, capture_output=True, text=True)
                
                if resultado.returncode != 0:
                    error_msg = resultado.stderr or "Erro desconhecido no mysqldump."
                    raise Exception(f"Falha no mysqldump do banco {db_name}: {error_msg}")

                if not os.path.exists(temp_sql) or os.path.getsize(temp_sql) == 0:
                    raise Exception(f"O dump temporário do banco {db_name} está vazio ou não foi criado.")

                # Compacta usando gzip nativo em Python
                logger.info(f"[BACKUP] Compactando backup de {db_name}...")
                with open(temp_sql, 'rb') as f_in:
                    with gzip.open(caminho_final, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)

                # Regra de retenção para este banco específico
                logger.info(f"[BACKUP] Aplicando regra de retenção para {db_name} (limite: {config.retencao_arquivos})...")
                padrao_busca = os.path.join(dest_dir, f"{db_name}_*.sql.gz")
                arquivos_backup = sorted(glob.glob(padrao_busca), key=os.path.getmtime)
                
                while len(arquivos_backup) > config.retencao_arquivos:
                    antigo = arquivos_backup.pop(0)
                    try:
                        os.remove(antigo)
                        logger.info(f"[BACKUP] Retenção: Removido backup antigo de {db_name}: {antigo}")
                    except Exception as e:
                        logger.error(f"[BACKUP] Falha ao remover backup antigo {antigo}: {e}")

                sucessos.append(db_name)
            except Exception as e_db:
                logger.error(f"[BACKUP] Falha ao realizar backup do banco {db_name}: {e_db}")
                falhas.append(f"{db_name}: {str(e_db)[:30]}")
            finally:
                if temp_sql and os.path.exists(temp_sql):
                    try:
                        os.remove(temp_sql)
                    except Exception:
                        pass

        # 4. Atualiza status no banco de dados com resumo
        config.ultimo_backup_em = timezone.now()
        if not falhas:
            config.status_ultimo_backup = f"Sucesso ({len(sucessos)} bases)"
            config.save()
            msg = f"Backup concluído com sucesso para todas as bases ({', '.join(sucessos)})."
            logger.info(f"[BACKUP] {msg}")
            return True, msg
        else:
            if sucessos:
                resumo_erro = f"Sucesso parcial: erro em {', '.join(falhas)}"
            else:
                resumo_erro = f"Falha total: {', '.join(falhas)}"
            config.status_ultimo_backup = resumo_erro[:45]
            config.save()
            return len(sucessos) > 0, f"Processo concluído com falhas: {resumo_erro}"

    except Exception as e:
        logger.error(f"[BACKUP] Erro crítico no processo de backups: {e}")
        try:
            config.status_ultimo_backup = f"Falha: {str(e)[:45]}"
            config.save()
        except Exception:
            pass
        return False, str(e)

    finally:
        _backup_lock.release()


def iniciar_agendador_backup():
    """Loop da Thread em background que verifica se é hora de realizar o backup."""
    logger.info("[BACKUP] Thread do agendador de backups iniciada em segundo plano.")
    
    # Aguarda o Django subir por completo antes de começar a pesquisar no banco
    time.sleep(10)
    
    while True:
        try:
            # Busca a configuração ativa de backup local
            config = AgendamentoBackupLocal.objects.filter(ativo=True).first()
            if not config:
                time.sleep(30)
                continue

            agora = timezone.localtime(timezone.now())
            dia_semana_num = agora.weekday() # 0 = Segunda, ..., 6 = Domingo
            
            # Mapeamento do dia da semana
            dias_map = {
                0: config.segunda,
                1: config.terca,
                2: config.quarta,
                3: config.quinta,
                4: config.sexta,
                5: config.sabado,
                6: config.domingo
            }
            
            dia_habilitado = dias_map.get(dia_semana_num, False)
            if not dia_habilitado:
                time.sleep(30)
                continue

            # Formata a hora/minuto atual (ex: "02:00")
            hora_atual_str = agora.strftime("%H:%M")
            horarios_configurados = [h.strip() for h in config.horarios_execucao.split(",") if h.strip()]

            if hora_atual_str in horarios_configurados:
                # Evita executar múltiplas vezes no mesmo minuto
                duplicado = False
                if config.ultimo_backup_em:
                    ultimo_local = timezone.localtime(config.ultimo_backup_em)
                    if ultimo_local.date() == agora.date() and ultimo_local.strftime("%H:%M") == hora_atual_str:
                        duplicado = True
                
                if not duplicado:
                    logger.info(f"[BACKUP] Horário agendado atingido ({hora_atual_str}). Iniciando backup automático...")
                    # Executa o backup em uma thread separada para não bloquear a thread do scheduler
                    t = threading.Thread(target=realizar_backup_unidade_g)
                    t.start()
                    
            # Dorme por 30 segundos para a próxima verificação
            time.sleep(30)
            
        except Exception as e:
            logger.error(f"[BACKUP] Erro no loop do agendador: {e}")
            time.sleep(30)
