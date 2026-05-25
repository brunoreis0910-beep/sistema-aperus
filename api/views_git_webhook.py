import hmac
import hashlib
import json
import os
import subprocess
import logging
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings

logger = logging.getLogger(__name__)

@csrf_exempt
@require_POST
def github_webhook_update(request):
    """
    Recebe requisições de Webhook do GitHub para atualização automática do servidor.
    Se configurado, valida a assinatura HMAC-SHA256 usando GITHUB_WEBHOOK_SECRET.
    """
    secret = getattr(settings, 'GITHUB_WEBHOOK_SECRET', None)
    
    # 1. Validar a assinatura HMAC do GitHub se um segredo estiver configurado
    if secret:
        signature = request.headers.get('X-Hub-Signature-256')
        if not signature:
            logger.warning("[Webhook Git] Requisição recebida sem cabeçalho X-Hub-Signature-256.")
            return HttpResponseForbidden("Assinatura ausente.")
        
        try:
            sha_name, signature_hash = signature.split('=')
            if sha_name != 'sha256':
                logger.warning(f"[Webhook Git] Formato de assinatura desconhecido: {sha_name}")
                return HttpResponseForbidden("Formato de assinatura inválido.")
        except ValueError:
            logger.warning("[Webhook Git] Cabeçalho de assinatura inválido.")
            return HttpResponseForbidden("Formato de cabeçalho inválido.")
            
        # Calcular HMAC SHA256 do corpo da requisição
        mac = hmac.new(secret.encode('utf-8'), msg=request.body, digestmod=hashlib.sha256)
        if not hmac.compare_digest(mac.hexdigest(), signature_hash):
            logger.warning("[Webhook Git] Falha na validação HMAC da assinatura.")
            return HttpResponseForbidden("Assinatura inválida.")
            
        logger.info("[Webhook Git] Assinatura validada com sucesso.")

    # 2. Filtrar para executar apenas em eventos de push na branch padrão (ex: refs/heads/main)
    try:
        payload = json.loads(request.body.decode('utf-8'))
        ref = payload.get('ref', '')
        
        # Se for apenas um ping de teste enviado pelo GitHub ao criar o webhook
        zen = payload.get('zen')
        if zen:
            logger.info(f"[Webhook Git] Ping de teste recebido do GitHub: {zen}")
            return JsonResponse({"status": "success", "message": f"Ping recebido: {zen}"})

        # Verificar se é a branch main/production
        if ref and ref != 'refs/heads/main':
            logger.info(f"[Webhook Git] Evento de push na branch '{ref}' ignorado. Apenas 'refs/heads/main' dispara a atualização.")
            return JsonResponse({"status": "ignored", "reason": f"A branch '{ref}' não é a main."})
            
    except Exception as e:
        # Se falhar a decodificação do payload, registramos mas prosseguimos para não interromper caso falte algum detalhe.
        logger.warning(f"[Webhook Git] Não foi possível analisar o payload JSON: {str(e)}")

    # 3. Disparar o script de atualização do Windows Server em background
    # O caminho físico do script .bat foi definido na Parte 2
    bat_path = r"C:\aperus\atualizar_central.bat"
    
    if not os.path.exists(bat_path):
        logger.error(f"[Webhook Git] Script de atualização não encontrado em: {bat_path}")
        return JsonResponse({"status": "error", "message": "Script de atualização não encontrado no servidor."}, status=500)

    try:
        logger.info(f"[Webhook Git] Disparando script de atualização: {bat_path}")
        
        # subprocess.CREATE_NEW_PROCESS_GROUP evita que o subprocesso herde o grupo de processos do Django e seja finalizado
        # shell=True é necessário para executar arquivos .bat no Windows
        subprocess.Popen([bat_path], shell=True, creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
        
        return JsonResponse({
            "status": "success",
            "message": "Script de atualização disparado em background."
        })
    except Exception as e:
        logger.exception("[Webhook Git] Falha ao iniciar execução do script batch.")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
