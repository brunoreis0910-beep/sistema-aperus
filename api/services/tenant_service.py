import os
import subprocess
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def registrar_servico_windows_nssm(cliente_schema, porta_cliente):
    """
    Cria e inicia automaticamente o serviço do Windows (via NSSM) para a nova instância do cliente.
    """
    db_name = f"aperus_{cliente_schema}"
    nome_servico = f"AperusServer{cliente_schema.capitalize()}"
    
    app_dir = f"C:\\APERUS\\arquivos_clientes\\{db_name}"
    python_path = os.path.join(app_dir, "venv", "Scripts", "python.exe")
    nssm_path = "C:\\APERUS\\nssm.exe"
    
    # Argumentos para o runserver
    arguments = f"manage.py runserver 0.0.0.0:{porta_cliente} --noreload"
    
    # Caminhos para logs do serviço
    logs_dir = os.path.join(app_dir, "logs")
    os.makedirs(logs_dir, exist_ok=True)
    stdout_log = os.path.join(logs_dir, f"service_stdout_{porta_cliente}.log")
    stderr_log = os.path.join(logs_dir, f"service_stderr_{porta_cliente}.log")
    
    logger.info(f"[TENANT SERVICE] Registrando serviço Windows: {nome_servico} na porta {porta_cliente}")
    
    try:
        # 1. Tenta parar e remover o serviço se já existir (para evitar erros de conflito)
        subprocess.run([nssm_path, "stop", nome_servico], capture_output=True)
        subprocess.run([nssm_path, "remove", nome_servico, "confirm"], capture_output=True)
        
        # 2. Instala o serviço via NSSM
        res_install = subprocess.run([nssm_path, "install", nome_servico, python_path, arguments], capture_output=True, text=True)
        if res_install.returncode != 0:
            error_output = res_install.stderr or res_install.stdout
            raise Exception(f"Falha no comando install: {error_output}")
            
        # 3. Configura o AppDirectory
        subprocess.run([nssm_path, "set", nome_servico, "AppDirectory", app_dir], check=True, capture_output=True)
        
        # 4. Configura a descrição do serviço
        description = f"Servico em segundo plano do cliente {cliente_schema} (Porta {porta_cliente})"
        subprocess.run([nssm_path, "set", nome_servico, "Description", description], check=True, capture_output=True)
        
        # 5. Configura as saídas de log
        subprocess.run([nssm_path, "set", nome_servico, "AppStdout", stdout_log], check=True, capture_output=True)
        subprocess.run([nssm_path, "set", nome_servico, "AppStderr", stderr_log], check=True, capture_output=True)
        
        # 6. Configura para iniciar automaticamente com o Windows
        subprocess.run([nssm_path, "set", nome_servico, "Start", "SERVICE_AUTO_START"], check=True, capture_output=True)
        
        # 7. Configura rotacionamento de logs básico
        subprocess.run([nssm_path, "set", nome_servico, "AppRotateFiles", "1"], check=True, capture_output=True)
        subprocess.run([nssm_path, "set", nome_servico, "AppRotateOnline", "1"], check=True, capture_output=True)
        subprocess.run([nssm_path, "set", nome_servico, "AppRotateBytes", "10485760"], check=True, capture_output=True)
        
        # 8. Inicia o serviço
        logger.info(f"[TENANT SERVICE] Iniciando serviço {nome_servico}...")
        res_start = subprocess.run([nssm_path, "start", nome_servico], capture_output=True, text=True)
        if res_start.returncode != 0:
            # Tenta usar o net start como fallback secundário
            res_net = subprocess.run(f"net start {nome_servico}", shell=True, capture_output=True, text=True)
            if res_net.returncode != 0:
                error_output = res_start.stderr or res_start.stdout or res_net.stderr or res_net.stdout
                raise Exception(f"Falha ao iniciar o serviço: {error_output}")
        
        logger.info(f"[TENANT SERVICE] Serviço {nome_servico} instalado e iniciado com sucesso.")
        return True, f"Serviço {nome_servico} registrado e iniciado com sucesso na porta {porta_cliente}."
        
    except subprocess.CalledProcessError as e:
        error_output = e.stderr or e.stdout or str(e)
        logger.error(f"[TENANT SERVICE] Erro ao registrar serviço Windows {nome_servico}: {error_output}")
        return False, f"Falha ao registrar serviço Windows: {error_output}"
    except Exception as e:
        logger.error(f"[TENANT SERVICE] Erro geral ao registrar serviço Windows {nome_servico}: {e}")
        return False, str(e)
