import os
import time
import json
import logging
import threading
import psutil
from django.utils import timezone
from django.db import connection

logger = logging.getLogger(__name__)

CONFIG_PATH = r"C:\APERUS\aperus_mae\infra_metrics.json"

DEFAULT_CONFIG = {
    "system": {
        "cpu_percent": 0.0,
        "ram_total_gb": 0.0,
        "ram_used_gb": 0.0,
        "ram_percent": 0.0,
        "disk_total_gb": 0.0,
        "disk_free_gb": 0.0,
        "disk_percent": 0.0
    },
    "databases": {
        "aperus_central": 0.0,
        "sistema_gerencial": 0.0
    },
    "tenants": [],
    "historico": []
}

def carregar_config_infra():
    if not os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
                json.dump(DEFAULT_CONFIG, f, indent=4, ensure_ascii=False)
            return DEFAULT_CONFIG
        except Exception as e:
            logger.error(f"Erro ao criar arquivo de métricas de infraestrutura: {e}")
            return DEFAULT_CONFIG
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Erro ao carregar métricas de infraestrutura: {e}")
        return DEFAULT_CONFIG

def salvar_config_infra(config):
    try:
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Erro ao salvar métricas de infraestrutura: {e}")

def get_dir_size(path):
    total = 0
    if not os.path.exists(path):
        return 0.0
    try:
        for entry in os.scandir(path):
            if entry.is_file():
                total += entry.stat().st_size
            elif entry.is_dir():
                total += get_dir_size(entry.path)
    except Exception:
        pass
    return round(total / (1024 * 1024), 2) # Size in MB

def get_mysql_db_sizes():
    sizes = {}
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    table_schema, 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) 
                FROM 
                    information_schema.TABLES 
                GROUP BY 
                    table_schema
            """)
            for row in cursor.fetchall():
                sizes[row[0]] = float(row[1]) if row[1] is not None else 0.0
    except Exception as e:
        logger.error(f"Erro ao consultar tamanhos de bancos no MySQL: {e}")
    return sizes

def coletar_infra_loop():
    logger.info("Thread do Coletor de Métricas de Infraestrutura iniciada.")
    
    # Aguarda o Django finalizar a inicialização completa
    time.sleep(15)
    
    while True:
        try:
            # 1. Métricas de Hardware
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('C:\\')
            cpu = psutil.cpu_percent(interval=1)
            
            system_metrics = {
                "cpu_percent": round(cpu, 1),
                "ram_total_gb": round(mem.total / (1024**3), 2),
                "ram_used_gb": round(mem.used / (1024**3), 2),
                "ram_percent": mem.percent,
                "disk_total_gb": round(disk.total / (1024**3), 2),
                "disk_free_gb": round(disk.free / (1024**3), 2),
                "disk_percent": disk.percent
            }
            
            # 2. Métricas de Bancos MySQL
            db_sizes = get_mysql_db_sizes()
            
            # 3. Métricas dos Tenants (SaaSClientes)
            from api.models import SaaSCliente
            tenants_data = []
            
            # Obter lista de clientes cadastrados
            clientes = list(SaaSCliente.objects.all())
            
            for client in clientes:
                schema = client.schema_name
                db_name = f"aperus_{schema}" if client.banco_criado else None
                db_size = db_sizes.get(db_name, 0.0) if db_name else 0.0
                
                # Tamanho da pasta do tenant
                folder_paths = [
                    os.path.join(r"C:\APERUS\arquivos_clientes", f"aperus_{schema}"),
                    os.path.join(r"C:\APERUS\arquivos_clientes", schema)
                ]
                
                folder_size = 0.0
                for path in folder_paths:
                    if os.path.exists(path):
                        folder_size = get_dir_size(path)
                        break
                        
                tenants_data.append({
                    "id_saas_cliente": client.id_saas_cliente,
                    "nome_fantasia": client.nome_fantasia,
                    "schema_name": schema,
                    "cnpj": client.cnpj,
                    "status_licenca": client.status_licenca,
                    "db_name": db_name,
                    "db_size_mb": db_size,
                    "folder_size_mb": folder_size
                })
                
            # 4. Atualizar Configuração
            config = carregar_config_infra()
            config["system"] = system_metrics
            config["databases"] = {
                "aperus_central": db_sizes.get("aperus_central", 0.0),
                "sistema_gerencial": db_sizes.get("sistema_gerencial", 0.0)
            }
            config["tenants"] = tenants_data
            
            # Histórico (últimas 288 medições -> 24h medindo a cada 5min)
            if "historico" not in config:
                config["historico"] = []
                
            config["historico"].append({
                "datahora": timezone.now().isoformat(),
                "cpu_percent": system_metrics["cpu_percent"],
                "ram_percent": system_metrics["ram_percent"],
                "disk_percent": system_metrics["disk_percent"]
            })
            config["historico"] = config["historico"][-288:]
            
            salvar_config_infra(config)
            
        except Exception as e:
            logger.error(f"Erro no coletor de infraestrutura: {e}", exc_info=True)
            
        # Coletar a cada 5 minutos (300 segundos)
        time.sleep(300)

def iniciar_monitor_infra():
    t = threading.Thread(target=coletar_infra_loop, name="InfraMonitorThread", daemon=True)
    t.start()
