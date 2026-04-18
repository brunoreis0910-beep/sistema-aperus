"""
views_mp_point.py — Mercado Pago Point Tap Integration

Endpoints:
  GET/POST  /api/mp-point/config/              → Ler/salvar configuração do terminal
  POST      /api/mp-point/cobrar/              → Criar intenção de pagamento no terminal
  GET       /api/mp-point/status/<uuid>/       → Consultar status da transação (polling)
  POST      /api/mp-point/webhook/             → Webhook de confirmação do MP (AllowAny)
  DELETE    /api/mp-point/cancelar/<uuid>/     → Cancelar intenção de pagamento no terminal

Fluxo:
  1. Caixa clica "Cobrar no Point Tap" → POST /api/mp-point/cobrar/
  2. Backend cria payment_intent no MP → retorna {uuid, payment_intent_id}
  3. Frontend faz polling em GET /api/mp-point/status/<uuid>/ a cada 3s
  4. Quando status=APROVADA, frontend finaliza a venda normalmente
  5. Opcional: MP envia POST no webhook confirmando o pagamento
"""
import logging
import hmac
import hashlib
import uuid as uuid_lib

import requests
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models_mp_point import ConfiguracaoMercadoPago, TransacaoMPPoint
from .models import EmpresaConfig

logger = logging.getLogger(__name__)

# ── URLs da API do Mercado Pago Point ─────────────────────────────────────────
MP_API_BASE = 'https://api.mercadopago.com'
MP_POINT_INTENT_URL = MP_API_BASE + '/point/integration-api/devices/{device_id}/payment-intents'
MP_POINT_STATUS_URL = MP_API_BASE + '/point/integration-api/payment-intents/{payment_intent_id}'
MP_POINT_CANCEL_URL = MP_API_BASE + '/point/integration-api/devices/{device_id}/payment-intents'
MP_POINT_DEVICE_URL = MP_API_BASE + '/point/integration-api/devices/{device_id}'


def _get_config_ativa():
    """Retorna a configuração MP ativa, ou None."""
    return ConfiguracaoMercadoPago.objects.filter(ativo=True).first()


def _garantir_modo_pdv(device_id, access_token):
    """
    Garante que o terminal esteja em modo PDV (integrado).
    Sem isso o MP retorna HTTP 405 ao tentar criar payment-intents.
    Retorna (patch_http_status: int|None, patch_body: dict|str).
    """
    url = MP_POINT_DEVICE_URL.format(device_id=device_id)
    headers = _headers_mp(access_token)
    try:
        resp = requests.patch(url, json={'operating_mode': 'PDV'}, headers=headers, timeout=10)
        try:
            body = resp.json()
        except Exception:
            body = resp.text[:200]
        if resp.status_code in (200, 204):
            logger.info(f'[MP Point] Device {device_id} comutado para modo PDV.')
            return resp.status_code, body
        # 409 = já está em PDV (alguns ambientes retornam isso)
        if resp.status_code == 409:
            return resp.status_code, body
        logger.warning(f'[MP Point] Aviso ao comutar PDV: HTTP {resp.status_code} — {body}')
        return resp.status_code, body
    except Exception as ex:
        logger.warning(f'[MP Point] Exceção ao comutar PDV: {ex}')
        return None, str(ex)


def _headers_mp(access_token):
    return {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }


# ── Config ─────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mp_point_config(request):
    """
    GET  → retorna a configuração ativa (sem expor o access_token completo)
    POST → cria ou atualiza a configuração
    """
    if request.method == 'GET':
        config = _get_config_ativa()
        if not config:
            return Response({'configurado': False})
        # Mascara o token por segurança
        token_mask = config.access_token[:10] + '...' + config.access_token[-4:] if config.access_token else ''
        return Response({
            'configurado': True,
            'id_config': config.id_config,
            'mp_user_id': config.mp_user_id,
            'device_id': config.device_id,
            'ambiente': config.ambiente,
            'ativo': config.ativo,
            'access_token_mask': token_mask,
        })

    # POST — salvar/atualizar
    data = request.data
    access_token = (data.get('access_token') or '').strip()
    mp_user_id = (data.get('mp_user_id') or '').strip()
    device_id = (data.get('device_id') or '').strip()
    ambiente = data.get('ambiente', 'PRODUCAO')

    if not mp_user_id or not device_id:
        return Response({'erro': 'mp_user_id e device_id são obrigatórios'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Busca empresa
    empresa = EmpresaConfig.objects.first()
    if not empresa:
        return Response({'erro': 'Nenhuma empresa cadastrada no sistema'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Se access_token = 'MANTER' ou vazio, preserva o token já salvo
    config_existente = ConfiguracaoMercadoPago.objects.filter(empresa=empresa).first()
    manter_token = (access_token == 'MANTER' or access_token == '')

    if manter_token and not config_existente:
        return Response({'erro': 'Access Token obrigatório na primeira configuração.'},
                        status=status.HTTP_400_BAD_REQUEST)

    token_para_salvar = config_existente.access_token if manter_token else access_token

    defaults = {
        'access_token': token_para_salvar,
        'mp_user_id': mp_user_id,
        'device_id': device_id,
        'ambiente': ambiente,
        'ativo': True,
    }

    try:
        config, criado = ConfiguracaoMercadoPago.objects.update_or_create(
            empresa=empresa,
            defaults=defaults,
        )
    except Exception as ex:
        logger.exception(f'[MP Config] Erro ao salvar configuração: {ex}')
        return Response({'erro': f'Erro ao salvar no banco: {str(ex)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'ok': True,
        'id_config': config.id_config,
        'criado': criado,
    }, status=status.HTTP_201_CREATED if criado else status.HTTP_200_OK)


# ── Criar Intenção de Pagamento ────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mp_point_cobrar(request):
    """
    Cria uma intenção de pagamento no terminal Point Tap.

    Body:
      valor       float   Valor a cobrar (ex: 99.90)
      descricao   str     Descrição da cobrança (ex: "Venda #42")
      id_venda    int     (opcional) ID da venda vinculada
      parcelas    int     (opcional, default 1)
    """
    config = _get_config_ativa()
    if not config:
        return Response(
            {'erro': 'Integração com Mercado Pago não configurada. Acesse Configurações > Mercado Pago.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    valor = request.data.get('valor')
    descricao = (request.data.get('descricao') or 'Venda').strip()[:255]
    id_venda = request.data.get('id_venda') or None
    parcelas = int(request.data.get('parcelas') or 1)

    if not valor:
        return Response({'erro': 'Campo "valor" é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        valor_decimal = float(valor)
        if valor_decimal <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return Response({'erro': 'Valor inválido'}, status=status.HTTP_400_BAD_REQUEST)

    # Cria registro local da transação
    from .models import Venda
    venda_obj = None
    if id_venda:
        venda_obj = Venda.objects.filter(pk=id_venda).first()

    transacao = TransacaoMPPoint.objects.create(
        id_venda=venda_obj,
        config=config,
        valor=valor_decimal,
        descricao=descricao,
        parcelas=parcelas,
        status='CRIADA',
        criado_por=request.user,
    )

    # Monta payload para a API do MP Point
    # Valor deve ser enviado em centavos (inteiro)
    valor_centavos = int(round(valor_decimal * 100))
    idempotency_key = str(transacao.uuid)

    payload = {
        'amount': valor_centavos,
        'description': descricao,
        'payment': {
            'installments': parcelas,
            'type': 'credit_card',  # MP decide o tipo no terminal; este campo é sugestão
        },
        'additional_info': {
            'external_reference': str(transacao.uuid),
            'print_on_terminal': True,
        },
    }

    url = MP_POINT_INTENT_URL.format(device_id=config.device_id)
    headers = _headers_mp(config.access_token)
    headers['X-Idempotency-Key'] = idempotency_key

    # Garante modo PDV antes de criar a intent (evita HTTP 405 "Standalone mode")
    pdv_patch_status, pdv_patch_body = _garantir_modo_pdv(config.device_id, config.access_token)

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)

        # Parse JSON com segurança — MP pode retornar HTML em erros inesperados
        try:
            resp_json = resp.json()
        except Exception:
            resp_json = {}

        if resp.status_code in (200, 201):
            payment_intent_id = resp_json.get('id', '')
            transacao.payment_intent_id = payment_intent_id
            transacao.status = 'PROCESSANDO'
            transacao.save(update_fields=['payment_intent_id', 'status', 'atualizado_em'])

            logger.info(f'[MP Point] Intent criada: {payment_intent_id} — venda {id_venda}')
            return Response({
                'ok': True,
                'uuid': str(transacao.uuid),
                'payment_intent_id': payment_intent_id,
                'status': transacao.status,
            }, status=status.HTTP_201_CREATED)

        else:
            # Erro retornado pelo MP — usa text bruto como fallback se JSON vier vazio
            erro_msg = (resp_json.get('message') or resp_json.get('error')
                        or resp.text[:200] or f'HTTP {resp.status_code}')

            # HTTP 405 = terminal em modo Standalone (não PDV)
            if resp.status_code == 405:
                pdv_ok = pdv_patch_status in (200, 204, 409)
                erro_msg = (
                    'Terminal em modo Standalone. '
                    'No app Mercado Pago do celular, acesse Configurações > Point > Modo de operação '
                    'e ative o Modo Integrado (PDV). '
                    f'[PATCH PDV: HTTP {pdv_patch_status} — {str(pdv_patch_body)[:100]}]'
                )
                logger.error(f'[MP Point] 405 Standalone — PATCH PDV status={pdv_patch_status} body={pdv_patch_body}')

            transacao.status = 'ERRO'
            transacao.detalhe_status = f'HTTP {resp.status_code}: {erro_msg}'[:255]
            transacao.save(update_fields=['status', 'detalhe_status', 'atualizado_em'])
            logger.error(f'[MP Point] Erro MP {resp.status_code}: {resp.text[:500]}')
            return Response(
                {
                    'erro': f'Mercado Pago (HTTP {resp.status_code}): {erro_msg}',
                    'http_status': resp.status_code,
                    'detalhe': resp.text[:500],
                    'pdv_patch_status': pdv_patch_status,
                    'pdv_patch_body': str(pdv_patch_body)[:300],
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

    except requests.Timeout:
        transacao.status = 'ERRO'
        transacao.detalhe_status = 'Timeout na comunicação com Mercado Pago'
        transacao.save(update_fields=['status', 'detalhe_status', 'atualizado_em'])
        return Response({'erro': 'Timeout ao conectar ao Mercado Pago. Tente novamente.'},
                        status=status.HTTP_504_GATEWAY_TIMEOUT)

    except Exception as ex:
        erro_detalhe = str(ex)
        logger.exception(f'[MP Point] Exceção ao criar intent: {erro_detalhe}')
        try:
            transacao.status = 'ERRO'
            transacao.detalhe_status = erro_detalhe[:255]
            transacao.save(update_fields=['status', 'detalhe_status', 'atualizado_em'])
        except Exception:
            pass
        return Response(
            {'erro': 'Erro interno ao processar pagamento', 'detalhe': erro_detalhe},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ── Polling de Status ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mp_point_status(request, transacao_uuid):
    """
    Consulta o status atualizado de uma transação.
    Faz request na API do MP e atualiza o registro local.
    Retorna o status ao frontend para que ele decida o que exibir.
    """
    try:
        transacao = TransacaoMPPoint.objects.get(uuid=transacao_uuid)
    except TransacaoMPPoint.DoesNotExist:
        return Response({'erro': 'Transação não encontrada'}, status=status.HTTP_404_NOT_FOUND)

    # Se já está num estado final, retorna direto sem chamar o MP
    if transacao.status in ('APROVADA', 'RECUSADA', 'CANCELADA', 'ERRO'):
        return Response({
            'status': transacao.status,
            'detalhe': transacao.detalhe_status,
            'payment_id': transacao.payment_id,
            'tipo_pagamento': transacao.tipo_pagamento,
            'parcelas': transacao.parcelas,
        })

    # Consulta o MP para status atualizado
    config = transacao.config
    if not config or not transacao.payment_intent_id:
        return Response({'status': transacao.status})

    try:
        url = MP_POINT_STATUS_URL.format(payment_intent_id=transacao.payment_intent_id)
        resp = requests.get(url, headers=_headers_mp(config.access_token), timeout=10)
        resp_json = resp.json()

        if resp.status_code == 200:
            mp_state = resp_json.get('state', '').upper()  # OPEN, PROCESSING, PROCESSED, CANCELED

            if mp_state == 'PROCESSED':
                payment = resp_json.get('payment', {})
                payment_id_mp = str(payment.get('id', ''))
                transacao.payment_id = payment_id_mp
                transacao.status = 'APROVADA'
                transacao.tipo_pagamento = payment.get('payment_method_id', '')
                transacao.parcelas = payment.get('installments', 1)
                transacao.save(update_fields=[
                    'payment_id', 'status', 'tipo_pagamento', 'parcelas', 'atualizado_em'
                ])
                logger.info(f'[MP Point] Pagamento aprovado: {payment_id_mp}')

            elif mp_state == 'CANCELED':
                transacao.status = 'CANCELADA'
                transacao.save(update_fields=['status', 'atualizado_em'])

            elif mp_state in ('ERROR', 'REJECTED'):
                transacao.status = 'RECUSADA'
                transacao.detalhe_status = resp_json.get('reason', 'Pagamento recusado')[:255]
                transacao.save(update_fields=['status', 'detalhe_status', 'atualizado_em'])

        return Response({
            'status': transacao.status,
            'detalhe': transacao.detalhe_status,
            'payment_id': transacao.payment_id,
            'tipo_pagamento': transacao.tipo_pagamento,
            'parcelas': transacao.parcelas,
        })

    except Exception as ex:
        logger.warning(f'[MP Point] Erro ao consultar status: {ex}')
        # Não muda o status local — retorna o que está salvo
        return Response({'status': transacao.status})


# ── Cancelar Intenção ──────────────────────────────────────────────────────────

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def mp_point_cancelar(request, transacao_uuid):
    """
    Cancela uma intenção de pagamento pendente no terminal.
    """
    try:
        transacao = TransacaoMPPoint.objects.get(uuid=transacao_uuid)
    except TransacaoMPPoint.DoesNotExist:
        return Response({'erro': 'Transação não encontrada'}, status=status.HTTP_404_NOT_FOUND)

    if transacao.status in ('APROVADA', 'CANCELADA', 'ERRO'):
        return Response({'ok': True, 'status': transacao.status})

    config = transacao.config
    if config and transacao.payment_intent_id:
        try:
            url = MP_POINT_CANCEL_URL.format(device_id=config.device_id)
            requests.delete(url, headers=_headers_mp(config.access_token), timeout=10)
        except Exception as ex:
            logger.warning(f'[MP Point] Erro ao cancelar no MP: {ex}')

    transacao.status = 'CANCELADA'
    transacao.save(update_fields=['status', 'atualizado_em'])

    return Response({'ok': True, 'status': 'CANCELADA'})


# ── Webhook (AllowAny — validado por signature) ────────────────────────────────

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def mp_point_webhook(request):
    """
    Endpoint que recebe notificações do Mercado Pago (topic=payment).
    O MP envia POST quando o pagamento é confirmado/recusado.

    O MP envia:  {"action": "payment.created", "data": {"id": "123456"}}
    """
    data = request.data
    action = data.get('action', '')
    payment_id_mp = str(data.get('data', {}).get('id', ''))

    if not payment_id_mp:
        return Response({'status': 'ignored'})

    logger.info(f'[MP Point Webhook] action={action} payment_id={payment_id_mp}')

    # Busca a transação pelo payment_intent_id ou pelo payment_id
    transacao = (
        TransacaoMPPoint.objects.filter(payment_id=payment_id_mp).first()
        or TransacaoMPPoint.objects.filter(payment_intent_id=payment_id_mp).first()
    )

    if not transacao:
        logger.warning(f'[MP Point Webhook] Transação não encontrada para payment_id={payment_id_mp}')
        return Response({'status': 'not_found'})

    if action in ('payment.created', 'payment.updated'):
        # Consulta detalhes do pagamento na API do MP
        config = transacao.config
        if config:
            try:
                resp = requests.get(
                    f'{MP_API_BASE}/v1/payments/{payment_id_mp}',
                    headers=_headers_mp(config.access_token),
                    timeout=10,
                )
                if resp.status_code == 200:
                    pdata = resp.json()
                    mp_status = pdata.get('status', '')  # approved, rejected, cancelled

                    if mp_status == 'approved':
                        transacao.payment_id = payment_id_mp
                        transacao.status = 'APROVADA'
                        transacao.tipo_pagamento = pdata.get('payment_method_id', '')
                        transacao.parcelas = pdata.get('installments', 1)
                        transacao.payload_webhook = pdata
                        transacao.save()
                        logger.info(f'[MP Point Webhook] Pagamento aprovado via webhook: {payment_id_mp}')
                    elif mp_status in ('rejected', 'cancelled'):
                        transacao.status = 'RECUSADA' if mp_status == 'rejected' else 'CANCELADA'
                        transacao.detalhe_status = pdata.get('status_detail', '')[:255]
                        transacao.payload_webhook = pdata
                        transacao.save()
            except Exception as ex:
                logger.error(f'[MP Point Webhook] Erro ao consultar payment: {ex}')

    return Response({'status': 'ok'})


# ── Diagnóstico ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mp_point_diagnostico(request):
    """
    Diagnóstico completo da integração MP Point:
    - Valida o access_token (GET /users/me)
    - Lista os devices vinculados à conta
    - Mostra o device_id configurado e se está entre os disponíveis
    - Tenta comutar o device para PDV e mostra o resultado
    """
    config = _get_config_ativa()
    if not config:
        return Response({'erro': 'Integração não configurada.'}, status=status.HTTP_400_BAD_REQUEST)

    resultado = {
        'device_id_configurado': config.device_id,
        'mp_user_id_configurado': config.mp_user_id,
        'access_token_mask': config.access_token[:12] + '...' if config.access_token else '',
        'passos': [],
    }

    headers = _headers_mp(config.access_token)

    # Passo 1 — valida o token
    try:
        r = requests.get(f'{MP_API_BASE}/users/me', headers=headers, timeout=10)
        if r.status_code == 200:
            me = r.json()
            resultado['passos'].append({
                'passo': '1. Validar token',
                'ok': True,
                'user_id': me.get('id'),
                'email': me.get('email'),
                'site_id': me.get('site_id'),
            })
        else:
            resultado['passos'].append({
                'passo': '1. Validar token',
                'ok': False,
                'http': r.status_code,
                'resposta': r.text[:300],
            })
            return Response(resultado)
    except Exception as ex:
        resultado['passos'].append({'passo': '1. Validar token', 'ok': False, 'erro': str(ex)})
        return Response(resultado)

    # Passo 2 — lista devices
    try:
        r = requests.get(f'{MP_API_BASE}/point/integration-api/devices', headers=headers, timeout=10)
        try:
            devices_data = r.json()
        except Exception:
            devices_data = {}
        devices = devices_data.get('devices', [])
        device_ids = [d.get('id') for d in devices]
        configurado_encontrado = config.device_id in device_ids
        resultado['passos'].append({
            'passo': '2. Listar devices',
            'ok': r.status_code == 200,
            'http': r.status_code,
            'devices_disponiveis': devices,
            'device_id_configurado_encontrado': configurado_encontrado,
            'aviso': None if configurado_encontrado else f'⚠️ "{config.device_id}" NÃO está entre os devices disponíveis! Corrija nas configurações.',
        })
    except Exception as ex:
        resultado['passos'].append({'passo': '2. Listar devices', 'ok': False, 'erro': str(ex)})

    # Passo 3 — tenta comutar para PDV
    try:
        url_patch = MP_POINT_DEVICE_URL.format(device_id=config.device_id)
        r = requests.patch(url_patch, json={'operating_mode': 'PDV'}, headers=headers, timeout=10)
        try:
            patch_body = r.json()
        except Exception:
            patch_body = r.text[:300]
        resultado['passos'].append({
            'passo': '3. Comutar para PDV',
            'ok': r.status_code in (200, 204, 409),
            'http': r.status_code,
            'resposta': patch_body,
        })
    except Exception as ex:
        resultado['passos'].append({'passo': '3. Comutar para PDV', 'ok': False, 'erro': str(ex)})

    # Passo 4 — tenta criar uma intent de R$0,10 (valor mínimo) para testar
    # Não cria no banco — só testa a API
    try:
        url_intent = MP_POINT_INTENT_URL.format(device_id=config.device_id)
        import uuid as _uuid
        test_payload = {
            'amount': 10,
            'description': 'Teste diagnóstico',
            'payment': {'installments': 1, 'type': 'credit_card'},
            'additional_info': {'external_reference': str(_uuid.uuid4()), 'print_on_terminal': False},
        }
        test_headers = dict(headers)
        test_headers['X-Idempotency-Key'] = str(_uuid.uuid4())
        r = requests.post(url_intent, json=test_payload, headers=test_headers, timeout=10)
        try:
            intent_body = r.json()
        except Exception:
            intent_body = r.text[:300]

        if r.status_code in (200, 201):
            # Cancela imediatamente para não deixar intent pendurada
            intent_id = intent_body.get('id', '')
            if intent_id:
                try:
                    requests.delete(
                        f'{MP_API_BASE}/point/integration-api/payment-intents/{intent_id}',
                        headers=headers, timeout=5,
                    )
                except Exception:
                    pass
        resultado['passos'].append({
            'passo': '4. Criar intent de teste (R$0,10)',
            'ok': r.status_code in (200, 201),
            'http': r.status_code,
            'resposta': intent_body,
        })
    except Exception as ex:
        resultado['passos'].append({'passo': '4. Criar intent de teste', 'ok': False, 'erro': str(ex)})

    return Response(resultado)
