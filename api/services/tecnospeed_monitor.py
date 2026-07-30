import os
import json
import time
import logging
import requests
import threading
from datetime import datetime
from django.utils import timezone
from django.db import close_old_connections

logger = logging.getLogger(__name__)

CONFIG_PATH = r"C:\APERUS\aperus_mae\contingencia_config.json"

DEFAULT_CONFIG = {
    "status_atual": "NORMAL",
    "ultimo_erro": "",
    "tempo_resposta": 0,
    "ultima_atualizacao": "",
    "comunicado_ativo_id": None,
    "templates": {
        "OSCILACAO": {
            "titulo": "[ALERTA] SEFAZ-{uf} em Oscilação",
            "mensagem": "Atenção: Identificamos instabilidade/oscilação na SEFAZ de {uf} para o documento {documento} às {hora_evento}.\n\nOrientação: Sugerimos aguardar ou realizar emissões no modo de contingência offline caso ocorram erros de conexão.",
            "enviar_whatsapp": True,
            "enviar_notificacao": True
        },
        "CONTINGENCIA": {
            "titulo": "[AVISO] Contingência Ativada para SEFAZ-{uf}",
            "mensagem": "Atenção: A contingência foi ativada oficialmente na SEFAZ de {uf} para o documento {documento} às {hora_evento}.\n\nOrientação: Suas emissões continuarão ocorrendo normalmente no modo Contingência Offline no sistema.",
            "enviar_whatsapp": True,
            "enviar_notificacao": True
        },
        "NORMAL": {
            "titulo": "[INFO] SEFAZ-{uf} Normalizada",
            "mensagem": "Prezados clientes, informamos que os serviços da SEFAZ de {uf} para o documento {documento} foram normalizados às {hora_evento}.",
            "enviar_whatsapp": True,
            "enviar_notificacao": True
        }
    },
    "historico": []
}

def carregar_config():
    if not os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
                json.dump(DEFAULT_CONFIG, f, indent=4, ensure_ascii=False)
            return DEFAULT_CONFIG
        except Exception as e:
            logger.error(f"Erro ao criar arquivo de contingencia: {e}")
            return DEFAULT_CONFIG
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Erro ao ler arquivo de contingencia: {e}")
        return DEFAULT_CONFIG

def salvar_config(config):
    try:
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Erro ao salvar arquivo de contingencia: {e}")

def checar_status_tecnospeed(uf="MG", doc="nfce"):
    """
    Consulta o monitor da TecnoSpeed para saber o status do envio.
    Retorna (status, tempo, erro)
    """
    # 1. Checar se está em contingência oficial (borderContingencia)
    border_url = f"https://monitor.tecnospeed.com.br/monitores?borderContingencia=true&doc={doc.lower()}"
    current_url = f"https://monitor.tecnospeed.com.br/monitores?current=true&worker_id=sefaz_{doc.lower()}_envio_{uf.lower()}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
    }
    
    esta_contingencia = False
    try:
        res = requests.get(border_url, headers=headers, timeout=10)
        if res.status_code == 200:
            border_data = res.json()
            # border_data é uma lista como [{"uf": "mg"}, {"uf": "sp"}]
            if isinstance(border_data, list):
                ufs_contingencia = [item.get('uf', '').lower() for item in border_data]
                if uf.lower() in ufs_contingencia:
                    esta_contingencia = True
    except Exception as e:
        logger.warning(f"Falha ao consultar borderContingencia: {e}")

    if esta_contingencia:
        return "CONTINGENCIA", 0, ""

    # 2. Consultar o status atual (tempo de resposta e status numérico)
    try:
        res = requests.get(current_url, headers=headers, timeout=10)
        if res.status_code == 200:
            current_data = res.json()
            if isinstance(current_data, list) and len(current_data) > 0:
                monitor = current_data[0]
                status_num = monitor.get('status', 1)
                tempo = monitor.get('tempo', 0)
                erro = monitor.get('erro', '')
                
                # status_num: 1=Normal, 2=Lento, 3=Muito lento, 4=Timeout, 5=Erro
                if status_num == 1:
                    return "NORMAL", tempo, erro
                else:
                    return "OSCILACAO", tempo, f"Status TecnoSpeed: {status_num}. {erro}"
    except Exception as e:
        return "INDETERMINADO", 0, str(e)

def processar_transicao_status(uf, doc, status_anterior, status_novo, tempo, erro):
    """
    Trata a mudança de status, enviando WhatsApp e criando Comunicados no Mural
    """
    logger.info(f"Monitor SEFAZ ({uf}-{doc}): Transição de status {status_anterior} -> {status_novo}")
    
    config = carregar_config()
    
    if "documentos" not in config:
        config["documentos"] = {}
    if uf not in config["documentos"]:
        config["documentos"][uf] = {}
    if doc not in config["documentos"][uf]:
        config["documentos"][uf][doc] = {}

    # 1. Desativar comunicado anterior se existir
    from api.models import ComunicadoSaaS
    comunicado_ativo_id = config["documentos"][uf][doc].get("comunicado_ativo_id")
    desativou = False
    
    if comunicado_ativo_id:
        try:
            comunicado = ComunicadoSaaS.objects.get(pk=comunicado_ativo_id)
            comunicado.ativo = False
            comunicado.save()
            logger.info(f"Comunicado anterior {comunicado_ativo_id} para {uf}-{doc} desativado via ID.")
            desativou = True
        except ComunicadoSaaS.DoesNotExist:
            pass
        config["documentos"][uf][doc]["comunicado_ativo_id"] = None

    # Fallback: Se não desativou via ID (ex: devido a sobrescritas do JSON em memória),
    # busca no banco de dados por comunicados ativos para esta UF e tipo de documento e desativa-os.
    try:
        comunicados_busca = ComunicadoSaaS.objects.filter(
            ativo=True,
            titulo__icontains=f"SEFAZ-{uf.upper()}"
        )
        for c in comunicados_busca:
            content_lower = (c.conteudo_texto or "").lower()
            title_lower = (c.titulo or "").lower()
            doc_lower = doc.lower()
            # Trata variações comuns como NFC-e, NFCe, nfce
            match_doc = (
                doc_lower in content_lower or 
                doc_lower.replace("e", "-e") in content_lower or 
                doc_lower in title_lower or 
                doc_lower.replace("e", "-e") in title_lower
            )
            if match_doc:
                c.ativo = False
                c.save()
                logger.info(f"Comunicado {c.id} ('{c.titulo}') para {uf}-{doc} desativado via busca fallback no banco.")
                desativou = True
    except Exception as db_err:
        logger.error(f"Erro ao desativar comunicados ativos via busca no banco para {uf}-{doc}: {db_err}")

    # 2. Obter template correspondente ao novo status
    template_config = config["templates"].get(status_novo)
    if not template_config:
        salvar_config(config)
        return

    # Injetar variáveis nas mensagens
    hora_atual = timezone.localtime(timezone.now()).strftime("%d/%m/%Y %H:%M")
    
    titulo_formatado = template_config["titulo"].format(uf=uf.upper(), documento=doc.upper())
    mensagem_formatada = template_config["mensagem"].format(
        uf=uf.upper(), 
        documento=doc.upper(), 
        hora_evento=hora_atual
    )

    # 3. Criar comunicado no mural se estiver ativado
    if template_config.get("enviar_notificacao") and status_novo != "NORMAL":
        from api.models import ComunicadoSaaS
        from datetime import date, timedelta
        try:
            comunicado_novo = ComunicadoSaaS.objects.create(
                titulo=titulo_formatado,
                tipo='TEXTO',
                conteudo_texto=mensagem_formatada,
                data_inicio=date.today(),
                data_fim=date.today() + timedelta(days=2), # Válido por 2 dias por padrão
                ativo=True
            )
            config["documentos"][uf][doc]["comunicado_ativo_id"] = comunicado_novo.id
            logger.info(f"Novo comunicado {comunicado_novo.id} criado para {uf}-{doc} ({status_novo}).")
        except Exception as e:
            logger.error(f"Erro ao criar ComunicadoSaaS para {uf}-{doc}: {e}")

    # 4. Disparar WhatsApp em background se ativado
    if template_config.get("enviar_whatsapp"):
        from api.models import SaaSCliente
        from api.tasks import enviar_mensagem_whatsapp_task
        
        # Obter todos os clientes ativos da UF
        clientes = SaaSCliente.objects.filter(estado=uf.upper(), status_licenca='ATIVO')
        logger.info(f"Disparando WhatsApp para {clientes.count()} clientes em {uf.upper()}...")
        for cliente in clientes:
            if cliente.telefone:
                # Limpa o telefone
                telefone_limpo = ''.join(filter(str.isdigit, str(cliente.telefone)))
                if telefone_limpo:
                    try:
                        # Envia de forma assíncrona usando Celery
                        enviar_mensagem_whatsapp_task.delay(telefone_limpo, mensagem_formatada)
                    except Exception as e:
                        logger.error(f"Erro ao enfileirar tarefa de WhatsApp para {telefone_limpo}: {e}")

    # 5. Adicionar ao histórico
    config["historico"].insert(0, {
        "datahora": timezone.now().isoformat(),
        "documento": doc.upper(),
        "status_anterior": status_anterior,
        "status_novo": status_novo,
        "tempo_resposta": tempo,
        "erro": erro
    })
    
    # Limitar histórico aos últimos 100 registros
    config["historico"] = config["historico"][:100]
    salvar_config(config)

def monitor_loop():
    logger.info("Thread do Monitor SEFAZ TecnoSpeed iniciada.")
    
    # Aguarda o Django finalizar a inicialização completa
    time.sleep(10)
    
    docs = ["nfce", "nfe", "cte"]
    
    while True:
        try:
            close_old_connections()
            
            # Obter UFs ativas dos clientes no banco
            try:
                from api.models import SaaSCliente
                db_ufs = list(SaaSCliente.objects.exclude(estado__isnull=True).exclude(estado='').values_list('estado', flat=True).distinct())
                db_ufs = [uf.upper() for uf in db_ufs if uf]
            except Exception as db_exc:
                logger.warning(f"Erro ao buscar UFs ativas no banco: {db_exc}")
                db_ufs = []
                
            main_ufs = ["MG", "SP", "RJ", "ES", "PR", "RS", "SC", "BA", "GO", "DF"]
            active_ufs = list(set(db_ufs + main_ufs))
            
            # Carregar estado atual
            config = carregar_config()
            
            if "documentos" not in config:
                config["documentos"] = {}
                
            for uf in active_ufs:
                if uf not in config["documentos"]:
                    config["documentos"][uf] = {}
                    
                for doc in docs:
                    if doc not in config["documentos"][uf]:
                        config["documentos"][uf][doc] = {
                            "status_atual": "NORMAL",
                            "ultimo_erro": "",
                            "tempo_resposta": 0,
                            "ultima_atualizacao": "",
                            "comunicado_ativo_id": None,
                            "tempos_resposta": []
                        }
                    
                    doc_config = config["documentos"][uf][doc]
                    status_anterior = doc_config.get("status_atual", "NORMAL")
                    
                    # Consultar status
                    status_novo, tempo, erro = checar_status_tecnospeed(uf, doc)
                    
                    if status_novo == "INDETERMINADO":
                        doc_config["ultimo_erro"] = erro
                        doc_config["ultima_atualizacao"] = timezone.now().isoformat()
                        config["documentos"][uf][doc] = doc_config
                        salvar_config(config)
                    else:
                        doc_config["tempo_resposta"] = tempo
                        doc_config["ultimo_erro"] = erro
                        doc_config["ultima_atualizacao"] = timezone.now().isoformat()
                        
                        if "tempos_resposta" not in doc_config:
                            doc_config["tempos_resposta"] = []
                        doc_config["tempos_resposta"].append({
                            "datahora": timezone.now().isoformat(),
                            "tempo": tempo,
                            "status": status_novo
                        })
                        doc_config["tempos_resposta"] = doc_config["tempos_resposta"][-30:]
                        
                        if status_novo != status_anterior:
                            doc_config["status_atual"] = status_novo
                            config["documentos"][uf][doc] = doc_config
                            salvar_config(config)
                            processar_transicao_status(uf, doc, status_anterior, status_novo, tempo, erro)
                        else:
                            config["documentos"][uf][doc] = doc_config
                            salvar_config(config)
            
            # Retrocompatibilidade: espelhar o nfce de MG nas propriedades do topo do json
            if "MG" in config["documentos"] and "nfce" in config["documentos"]["MG"]:
                nfce_cfg = config["documentos"]["MG"]["nfce"]
                config["status_atual"] = nfce_cfg.get("status_atual", "NORMAL")
                config["ultimo_erro"] = nfce_cfg.get("ultimo_erro", "")
                config["tempo_resposta"] = nfce_cfg.get("tempo_resposta", 0)
                config["ultima_atualizacao"] = nfce_cfg.get("ultima_atualizacao", "")
                config["tempos_resposta"] = nfce_cfg.get("tempos_resposta", [])
                config["comunicado_ativo_id"] = nfce_cfg.get("comunicado_ativo_id")
                salvar_config(config)
                
        except Exception as e:
            logger.error(f"Erro no loop do monitor SEFAZ: {e}", exc_info=True)
            
        # Espera 120 segundos (2 minutos) antes da próxima checagem
        time.sleep(120)

def iniciar_monitor_sefaz():
    """
    Inicia o loop de monitoramento em uma thread daemon em background.
    """
    t = threading.Thread(target=monitor_loop, name="SefazMonitorThread", daemon=True)
    t.start()
