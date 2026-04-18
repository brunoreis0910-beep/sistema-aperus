"""
Views WhatsApp - Modo NATIVO (Abre WhatsApp Desktop/Web do computador)
Seguro, sem APIs externas, sem riscos!
"""
from rest_framework.decorators import api_view, authentication_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import urllib.parse
import os

def gerar_link_whatsapp(telefone, mensagem):
    """
    Gera link para abrir WhatsApp em diferentes plataformas:
    - Desktop: wa.me (universal, funciona em todos os dispositivos)
    - Web: web.whatsapp.com (navegador PC)
    - Mobile: api.whatsapp.com (app mobile)
    """
    # Limpar telefone (remover caracteres especiais)
    telefone_limpo = ''.join(filter(str.isdigit, telefone))
    
    # Adicionar código do Brasil se necessário
    if len(telefone_limpo) == 11 or len(telefone_limpo) == 10:
        telefone_limpo = '55' + telefone_limpo
    
    # Codificar mensagem para URL
    mensagem_encoded = urllib.parse.quote(mensagem)
    
    # Retornar todos os formatos (agora usando wa.me para evitar conflitos)
    return {
        'desktop': f'https://wa.me/{telefone_limpo}?text={mensagem_encoded}',
        'web': f'https://web.whatsapp.com/send?phone={telefone_limpo}&text={mensagem_encoded}',
        'mobile': f'https://api.whatsapp.com/send?phone={telefone_limpo}&text={mensagem_encoded}',
        'universal': f'https://wa.me/{telefone_limpo}?text={mensagem_encoded}',
        'telefone_formatado': telefone_limpo
    }

# Importar views de fila e config do arquivo original
from .whatsapp_views import (
    config_whatsapp_view,
    estatisticas_whatsapp
)

@api_view(['GET', 'POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def fila_whatsapp_view(request):
    """Gerencia fila de mensagens WhatsApp - Modo NATIVO"""
    
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        # Listar fila com links WhatsApp
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id, telefone, mensagem, tipo_envio, nome_destinatario,
                    status, tentativas, data_criacao, data_envio, erro_mensagem,
                    prioridade
                FROM fila_whatsapp 
                ORDER BY 
                    CASE status 
                        WHEN 'pendente' THEN 1
                        WHEN 'enviado' THEN 2
                        WHEN 'falha' THEN 3
                        ELSE 4
                    END,
                    data_criacao DESC
                LIMIT 100
            """)
            
            colunas = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            
            data = []
            for row in rows:
                item = dict(zip(colunas, row))
                
                # Formatar datas
                if item['data_criacao']:
                    item['data_criacao'] = item['data_criacao'].isoformat()
                if item['data_envio']:
                    item['data_envio'] = item['data_envio'].isoformat()
                
                # Gerar links WhatsApp para todas as plataformas
                if item['telefone'] and item['mensagem']:
                    links = gerar_link_whatsapp(item['telefone'], item['mensagem'])
                    item['whatsapp_desktop'] = links['desktop']
                    item['whatsapp_web'] = links['web']
                    item['whatsapp_mobile'] = links['mobile']
                    item['whatsapp_universal'] = links['universal']
                
                data.append(item)
            
            return Response(data)
    
    elif request.method == 'POST':
        # Adicionar mensagem na fila
        data = request.data
        
        if not data.get('telefone') or not data.get('mensagem'):
            return Response(
                {'error': 'telefone e mensagem são obrigatórios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from . import whatsapp_cloud_service as _cloud
        usar_cloud = _cloud.is_configurado()
        status_inicial = 'pendente' if not usar_cloud else 'pendente'

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO fila_whatsapp 
                (telefone, mensagem, tipo_envio, nome_destinatario, 
                 prioridade, id_usuario_criador, id_relacionado, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'pendente')
            """, [
                data.get('telefone'),
                data.get('mensagem'),
                data.get('tipo_envio', 'manual'),
                data.get('nome_destinatario'),
                data.get('prioridade', 5),
                request.user.id,
                data.get('id_relacionado'),
            ])
            novo_id = cursor.lastrowid

            # ── Envio imediato via Cloud API ──────────────────────────────────
            if usar_cloud:
                ok = _cloud.enviar_texto(data.get('telefone'), data.get('mensagem'))
                if ok:
                    cursor.execute(
                        "UPDATE fila_whatsapp SET status = 'enviado', data_envio = NOW() WHERE id = %s",
                        [novo_id],
                    )
                    return Response({
                        'success': True,
                        'modo': 'cloud_api',
                        'enviado_api': True,
                        'id': novo_id,
                    }, status=status.HTTP_201_CREATED)
                else:
                    cursor.execute(
                        "UPDATE fila_whatsapp SET status = 'falha', erro_mensagem = 'Falha ao enviar via Cloud API' WHERE id = %s",
                        [novo_id],
                    )
                    return Response({
                        'success': False,
                        'modo': 'cloud_api',
                        'enviado_api': False,
                        'id': novo_id,
                        'error': 'Falha ao enviar via Cloud API. Verifique token e número no .env',
                    }, status=status.HTTP_201_CREATED)

            # ── Envio via Playwright (WhatsApp Web) ───────────────────────────
            from . import whatsapp_playwright_service as _pw
            estado_pw, _ = _pw.obter_estado("default")
            if estado_pw == "conectado":
                ok = _pw.enviar("default", data.get('telefone', ''), data.get('mensagem', ''))
                if ok:
                    cursor.execute(
                        "UPDATE fila_whatsapp SET status = 'enviado', data_envio = NOW() WHERE id = %s",
                        [novo_id],
                    )
                    return Response({
                        'success': True,
                        'modo': 'playwright',
                        'enviado_api': True,
                        'id': novo_id,
                    }, status=status.HTTP_201_CREATED)

            # ── Modo Nativo: retorna links wa.me ──────────────────────────────
            links = gerar_link_whatsapp(data.get('telefone'), data.get('mensagem'))
            return Response({
                'success': True,
                'whatsapp_desktop': links['desktop'],
                'whatsapp_web': links['web'],
                'whatsapp_mobile': links['mobile'],
                'whatsapp_universal': links['universal'],
                'modo': 'nativo',
                'id': novo_id,
                'instrucoes': 'Use desktop para PC, mobile para celular, ou universal para ambos',
            }, status=status.HTTP_201_CREATED)

@api_view(['PATCH', 'DELETE', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def fila_whatsapp_detail(request, pk):
    """Atualiza ou remove mensagem específica"""
    
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'PATCH':
        data = request.data
        
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE fila_whatsapp 
                SET status = %s
                WHERE id = %s
            """, [data.get('status', 'enviado'), pk])
            
            if cursor.rowcount == 0:
                return Response(
                    {'error': 'Mensagem não encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({'success': True})
    
    elif request.method == 'DELETE':
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM fila_whatsapp WHERE id = %s", [pk])
            
            if cursor.rowcount == 0:
                return Response(
                    {'error': 'Mensagem não encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({'success': True})

@api_view(['POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def abrir_whatsapp_direto(request):
    """Abre WhatsApp diretamente com a mensagem"""
    
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    telefone = request.data.get('telefone')
    mensagem = request.data.get('mensagem')
    
    if not telefone or not mensagem:
        return Response(
            {'error': 'telefone e mensagem são obrigatórios'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    links = gerar_link_whatsapp(telefone, mensagem)
    
    return Response({
        'whatsapp_desktop': links['desktop'],
        'whatsapp_web': links['web'],
        'whatsapp_mobile': links['mobile'],
        'whatsapp_universal': links['universal'],
        'telefone': links['telefone_formatado'],
        'instrucoes': {
            'desktop': 'Link para WhatsApp Desktop (app instalado no PC)',
            'web': 'Link para WhatsApp Web (navegador PC)',
            'mobile': 'Link para WhatsApp app (celular/tablet)',
            'universal': 'Link universal (funciona em todas as plataformas - RECOMENDADO)'
        },
        'recomendacao': 'Use whatsapp_universal para compatibilidade máxima'
    })

@api_view(['GET', 'POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def gerar_qrcode_whatsapp(request):
    """Verifica / inicializa conexão WhatsApp.
    Prioridade: Cloud API → Playwright (WhatsApp Web) → Nativo (links wa.me)."""

    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    # ── 1. Cloud API (Meta Oficial) ───────────────────────────────────────────
    from . import whatsapp_cloud_service as _cloud
    if _cloud.is_configurado():
        _, phone_id, _ = _cloud._get_credenciais()
        return Response({
            'success': True,
            'modo': 'cloud_api',
            'connected': True,
            'phone_id': phone_id,
            'message': '✅ WhatsApp Cloud API (Meta Oficial) configurada e ativa!',
            'instrucoes': [
                'Esta integração usa a API Oficial da Meta (sem risco de banimento)',
                'Mensagens são enviadas automaticamente ao adicionar à fila',
                'Não é necessário QR Code — autenticação via Token de Acesso',
                f'Phone Number ID: {phone_id}',
            ],
        })

    # ── 2. Playwright — WhatsApp Web via Chromium headless ────────────────────
    from . import whatsapp_playwright_service as _pw

    # Verifica se já existe sessão ativa antes de iniciar nova
    estado_atual, qr_atual = _pw.obter_estado("default")

    if estado_atual == "conectado":
        return Response({
            'success': True,
            'modo': 'playwright',
            'connected': True,
            'message': '✅ WhatsApp Web conectado via Playwright!',
        })

    # QR disponível E browser ainda está rodando — retorna para exibir
    if estado_atual == "pendente" and qr_atual and _pw.is_sessao_rodando():
        return Response({
            'success': True,
            'modo': 'playwright',
            'qr_code': qr_atual,
            'message': 'Escaneie o QR Code com seu WhatsApp.',
        })

    # Sessão não está rodando (aguardando, erro ou QR expirado) — reinicia
    _pw.iniciar("default")

    return Response({
        'success': True,
        'modo': 'playwright',
        'polling': True,
        'estado': 'iniciando',
        'message': 'Iniciando sessão WhatsApp Web, aguarde...',
    })


@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def buscar_qrcode_whatsapp(request):
    """Polling para obter QR code / status do Playwright (ignora Cloud API)."""
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    from . import whatsapp_playwright_service as _pw
    estado, qr_b64 = _pw.obter_estado("default")

    if estado == "conectado":
        return Response({'success': True, 'connected': True, 'modo': 'playwright'})

    if qr_b64:
        return Response({'success': True, 'ready': True, 'qr_code': qr_b64, 'modo': 'playwright'})

    if estado in ("erro", "timeout"):
        return Response({'success': False, 'erro': True, 'estado': estado,
                         'message': 'Falha ao iniciar WhatsApp Web. Verifique os logs do servidor.'})

    return Response({'success': True, 'ready': False, 'estado': estado, 'message': 'Aguardando QR Code...'})


@api_view(['POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def iniciar_playwright(request):
    """Inicia sessão Playwright em background e retorna imediatamente para polling."""
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    from . import whatsapp_playwright_service as _pw

    # Dispara o browser em background thread (não bloqueia o request Django)
    _pw.iniciar("default")

    return Response({
        'success': True,
        'modo': 'playwright',
        'message': 'Iniciando WhatsApp Web em segundo plano. Aguarde o QR Code...',
        'polling': True,
    })


@api_view(['POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def limpar_sessao_playwright(request):
    """Apaga os arquivos de sessão salvos do Playwright forçando novo QR Code no próximo acesso."""
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    import shutil
    from . import whatsapp_playwright_service as _pw

    # Zera o estado em memória e a flag de sessão rodando
    _pw._set_estado('aguardando')
    _pw._SESSAO_RODANDO = False

    # Apaga os arquivos de sessão do disco
    session_dir = _pw.SESSION_DIR
    apagados = []
    if session_dir and os.path.exists(session_dir):
        for item in os.listdir(session_dir):
            item_path = os.path.join(session_dir, item)
            try:
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
                apagados.append(item)
            except Exception as e:
                pass

    return Response({
        'success': True,
        'message': 'Sessão limpa com sucesso. Escaneie o QR Code para reconectar.',
        'itens_apagados': len(apagados),
    })


@api_view(['POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def enviar_agora_whatsapp(request, pk):
    """Reenvia via Cloud API uma mensagem específica da fila (falha ou pendente)."""

    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    from . import whatsapp_cloud_service as _cloud

    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT telefone, mensagem FROM fila_whatsapp WHERE id = %s', [pk]
        )
        row = cursor.fetchone()
        if not row:
            return Response({'error': 'Mensagem não encontrada'}, status=status.HTTP_404_NOT_FOUND)

        telefone, mensagem = row

        # ── Tentativa 1: Cloud API ────────────────────────────────────────────
        if _cloud.is_configurado():
            ok = _cloud.enviar_texto(telefone, mensagem)
            if ok:
                cursor.execute(
                    "UPDATE fila_whatsapp SET status = 'enviado', data_envio = NOW(), erro_mensagem = NULL WHERE id = %s",
                    [pk],
                )
                return Response({'success': True, 'modo': 'cloud_api'})
            cursor.execute(
                "UPDATE fila_whatsapp SET status = 'falha', erro_mensagem = 'Falha ao enviar via Cloud API' WHERE id = %s",
                [pk],
            )
            return Response(
                {'error': 'Falha ao enviar via Cloud API. Verifique o token e o número.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # ── Tentativa 2: Playwright ───────────────────────────────────────────
        from . import whatsapp_playwright_service as _pw
        estado_pw, _ = _pw.obter_estado("default")
        if estado_pw == "conectado":
            ok = _pw.enviar("default", telefone, mensagem)
            if ok:
                cursor.execute(
                    "UPDATE fila_whatsapp SET status = 'enviado', data_envio = NOW(), erro_mensagem = NULL WHERE id = %s",
                    [pk],
                )
                return Response({'success': True, 'modo': 'playwright'})
            cursor.execute(
                "UPDATE fila_whatsapp SET status = 'falha', erro_mensagem = 'Falha ao enviar via Playwright' WHERE id = %s",
                [pk],
            )
            return Response(
                {'error': 'Falha ao enviar via WhatsApp Web. Verifique se ainda está conectado.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {'error': 'Nenhum provedor WhatsApp ativo. Conecte via QR Code primeiro.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def gerar_qr_teste_whatsapp(request):
    """
    Testa as credenciais da Cloud API gerando um QR Code para validação manual.
    """
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    from . import whatsapp_cloud_service as _cloud

    if not _cloud.is_configurado():
        return Response(
            {'error': 'Cloud API não configurada. Preencha o Token e o Phone Number ID nas configurações.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    resultado = _cloud.gerar_qr_code_teste()

    if "erro" in resultado:
        return Response(
            {'error': resultado["erro"]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        'qr_code': 'data:image/png;base64,' + resultado['qr_code'],
        'chave_validacao': resultado['chave_validacao'],
        'numero': resultado['numero'],
        'link_direto': resultado['link_direto']
    })


@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def verificar_status_whatsapp(request):
    """Retorna o provedor ativo: cloud_api | playwright | nativo."""

    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    # ── Cloud API ────────────────────────────────────────────────────────────
    from . import whatsapp_cloud_service as _cloud
    # is_configurado() retorna False se token expirou recentemente (401/403)
    if _cloud.is_configurado():
        from decouple import config as _cfg
        return Response({
            'connected': True,
            'state': 'cloud_api',
            'modo': 'cloud_api',
            'phone_id': _cfg('WHATSAPP_CLOUD_PHONE_ID', default=''),
            'message': 'WhatsApp Cloud API (Meta Oficial) ativa',
        })

    # ── Playwright (MODO DESKTOP: DESABILITADO) ─────────────────────────────
    # MODO DESKTOP: Não usa navegador Playwright,usa WhatsApp Desktop App
    # Portanto, não instanciamos o serviço aqui (evita auto-start do Worker)
    #
    # from .whatsapp_playwright_service import WhatsAppService
    # try:
    #     service = WhatsAppService()
    #     estado = service.get_status()
    # except Exception:
    #     estado = "inactive"
    
    # No modo Desktop, sempre retorna "nativo" (usa app instalado localmente)
    return Response({
        'connected': False,
        'state': 'desktop',
        'modo': 'desktop',
        'message': 'Modo Desktop Ativo - Use WhatsApp instalado localmente',
        'seguro': True,
    })


@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def verificar_status_validacao(request):
    """
    GET /api/whatsapp/status-validacao/
    Retorna o status_validacao atual da configuração ativa.
    Usado pelo frontend para polling após gerar QR de teste.
    """
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)

    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT status_validacao FROM config_whatsapp WHERE instancia_ativa = 1 LIMIT 1"
            )
            row = cursor.fetchone()
            sv = row[0] if row else None
    except Exception:
        sv = None

    return Response({'status_validacao': sv})
