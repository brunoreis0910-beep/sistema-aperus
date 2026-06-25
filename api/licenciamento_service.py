import datetime
import requests
import re
import logging
from django.utils import timezone
from api.models import Licenca, EmpresaConfig

logger = logging.getLogger(__name__)

def sincronizar_e_verificar_licenca():
    """
    Executado no login ou via checagem do painel.
    Gerencia a tabela local de licenciamento para permitir o fluxo offline por até 3 dias.
    Registra operações em log estruturado similar ao padrão de boletos.
    """
    hoje = timezone.now().date()
    agora = timezone.now()
    
    # 1. Recupera ou cria a licença local única (ID 1)
    licenca_local, created = Licenca.objects.get_or_create(id_licenca=1, defaults={
        'chave_licenca': 'APERUS_LOCAL_LICENSE_KEY',
        'data_validade': hoje + datetime.timedelta(days=3),
        'status': 'Ativa'
    })
    
    # 2. Carrega o CNPJ configurado localmente
    empresa = EmpresaConfig.objects.exclude(cpf_cnpj='').first() or EmpresaConfig.objects.first()
    if not empresa or not empresa.cpf_cnpj:
        logger.warning(f"[LICENCIAMENTO] CNPJ não configurado localmente")
        return {
            "bloqueio_manual": False,
            "bloquear_sistema": True,
            "alerta_estagio": "erro_config",
            "mensagem": "CNPJ da empresa não configurado localmente."
        }
        
    cnpj_limpo = re.sub(r'\D', '', str(empresa.cpf_cnpj))
    
    from django.conf import settings

    # 3. Tenta sincronizar com servidor central
    try:
        central_base = getattr(settings, 'SAAS_MOTHER_URL', None) or "http://localhost:8006"
        central_url = central_base.rstrip('/') + "/api/saas/status-financeiro-saas/"
        payload = {"cnpj": cnpj_limpo}
        
        logger.info(
            f"[LICENCIAMENTO] Sincronizando licença - "
            f"CNPJ: {cnpj_limpo}, "
            f"URL: {central_url}"
        )

        resposta = None
        tentativa = "GET"
        
        try:
            # Tenta GET primeiro
            logger.debug(f"[LICENCIAMENTO] Tentativa 1: GET em {central_url}")
            resposta = requests.get(central_url, params=payload, timeout=5)
            logger.debug(f"[LICENCIAMENTO] GET retornou HTTP {resposta.status_code}")
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            logger.debug(f"[LICENCIAMENTO] GET falhou: {str(e)[:100]}")
            resposta = None
            tentativa = "POST"

        # Se GET falhou ou retornou 405, tenta POST
        if resposta is None or resposta.status_code == 405:
            try:
                logger.debug(f"[LICENCIAMENTO] Tentativa 2: POST em {central_url}")
                resposta = requests.post(central_url, json=payload, timeout=5)
                logger.debug(f"[LICENCIAMENTO] POST retornou HTTP {resposta.status_code}")
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
                logger.debug(f"[LICENCIAMENTO] POST também falhou: {str(e)[:100]}")
                resposta = None

        # 4. Processa resposta da central
        if resposta is not None and resposta.status_code == 200:
            dados = resposta.json()
            logger.info(
                f"[LICENCIAMENTO] Central respondeu OK (HTTP 200) - "
                f"Status: {dados.get('alerta_estagio')}, "
                f"Bloquear: {dados.get('bloquear_sistema')}"
            )

            # Se o cliente está liberado na nuvem, estende a validade offline por mais 3 dias
            if not dados.get('bloquear_sistema'):
                licenca_anterior_status = licenca_local.status
                licenca_anterior_validade = licenca_local.data_validade
                
                licenca_local.data_validade = hoje + datetime.timedelta(days=3)
                licenca_local.ultimo_check = agora
                licenca_local.status = 'Ativa'
                # Salva os recursos do plano liberados
                licenca_local.recursos_planos = dados.get('modulos_liberados', {})
                licenca_local.save()
                
                logger.info(
                    f"[LICENCIAMENTO] Licença atualizada - "
                    f"Status: {licenca_anterior_status} → Ativa, "
                    f"Validade: {licenca_anterior_validade} → {licenca_local.data_validade}, "
                    f"Próx. check: {agora + datetime.timedelta(days=3)}"
                )
            else:
                # Se a central retornar que o sistema deve ser bloqueado, bloqueia localmente na hora!
                licenca_local.data_validade = hoje - datetime.timedelta(days=1)
                licenca_local.ultimo_check = agora
                licenca_local.status = 'Bloqueada'
                licenca_local.save()
                
                logger.warning(
                    f"[LICENCIAMENTO] Sistema bloqueado pela central - "
                    f"Motivo: {dados.get('mensagem')}, "
                    f"Estagio: {dados.get('alerta_estagio')}"
                )

            return dados # Retorna o status oficial em tempo real da nuvem
        else:
            if resposta is not None:
                logger.error(
                    f"[LICENCIAMENTO] Central retornou erro - "
                    f"HTTP {resposta.status_code}, "
                    f"Resposta: {resposta.text[:200]}"
                )
            else:
                logger.error(
                    f"[LICENCIAMENTO] Nenhuma resposta da central - "
                    f"URL: {central_url}"
                )

    except (requests.exceptions.RequestException, Exception) as e:
        logger.error(
            f"[LICENCIAMENTO] Erro na sincronização - "
            f"Erro: {str(e)[:150]}"
        )
        resposta = None

    # 5. CENTRAL INDISPONÍVEL / SEM INTERNET (CONTINGÊNCIA)
    logger.warning(
        f"[LICENCIAMENTO] Modo offline ativado - "
        f"Licença válida até: {licenca_local.data_validade}, "
        f"Status local: {licenca_local.status}"
    )
    
    if licenca_local.data_validade and hoje <= licenca_local.data_validade:
        if licenca_local.status == 'Bloqueada':
            logger.warning(
                f"[LICENCIAMENTO] Sistema bloqueado administrativamente - "
                f"Status: Bloqueada na central, "
                f"Check realizado em: {licenca_local.ultimo_check}"
            )
            return {
                "bloqueio_manual": False,
                "bloquear_sistema": True,
                "alerta_estagio": "critico",
                "mensagem": "Sistema bloqueado administrativamente na última checagem."
            }
        
        logger.info(
            f"[LICENCIAMENTO] Contingência offline - "
            f"Validade: {licenca_local.data_validade}, "
            f"Dias restantes: {(licenca_local.data_validade - hoje).days}"
        )
        return {
            "bloqueio_manual": False,
            "bloquear_sistema": False,
            "alerta_estagio": "modo_offline",
            "dias_atraso": 0,
            "mensagem": "Trabalhando em contingência offline.",
            "modulos_liberados": licenca_local.recursos_planos or {}
        }

    # 6. Sem internet e o prazo limite offline de 3 dias estourou: BLOQUEIA
    licenca_local.status = 'Vencida'
    licenca_local.save()
    
    logger.critical(
        f"[LICENCIAMENTO] SISTEMA BLOQUEADO - "
        f"Prazo offline expirado (venceu em {licenca_local.data_validade}), "
        f"Conecte o servidor à internet para atualizar a licença"
    )
    
    return {
        "bloqueio_manual": False,
        "bloquear_sistema": True,
        "alerta_estagio": "offline_expirado",
        "mensagem": "Sistema bloqueado. Conecte o servidor à internet para atualizar a licença."
    }
