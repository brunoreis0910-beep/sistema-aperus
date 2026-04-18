"""
Views para gerenciamento WhatsApp
Adicione estas views ao api/views.py
"""

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import requests
from datetime import datetime

@api_view(['GET', 'POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def fila_whatsapp_view(request):
    """Gerencia fila de mensagens WhatsApp"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Require authentication for GET/POST
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        # Listar fila
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
                data.append(item)
            
            return Response(data)
    
    elif request.method == 'POST':
        # Adicionar mensagem à fila
        data = request.data
        
        # Validações
        if not data.get('telefone') or not data.get('mensagem'):
            return Response(
                {'error': 'telefone e mensagem são obrigatórios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO fila_whatsapp 
                (telefone, mensagem, tipo_envio, nome_destinatario, 
                 prioridade, id_usuario_criador, id_relacionado)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [
                data.get('telefone'),
                data.get('mensagem'),
                data.get('tipo_envio', 'manual'),
                data.get('nome_destinatario'),
                data.get('prioridade', 5),
                request.user.id,
                data.get('id_relacionado')
            ])
            
            return Response(
                {'success': True, 'message': 'Mensagem adicionada à fila'},
                status=status.HTTP_201_CREATED
            )


@api_view(['PATCH', 'DELETE', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def fila_whatsapp_detail(request, pk):
    """Atualiza ou cancela mensagem específica"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Require authentication for PATCH/DELETE
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'PATCH':
        data = request.data
        
        with connection.cursor() as cursor:
            # Atualizar apenas se status for pendente
            cursor.execute("""
                UPDATE fila_whatsapp 
                SET status = %s
                WHERE id = %s AND status = 'pendente'
            """, [data.get('status', 'cancelado'), pk])
            
            if cursor.rowcount == 0:
                return Response(
                    {'error': 'Mensagem não encontrada ou já processada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({'success': True})
    
    elif request.method == 'DELETE':
        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM fila_whatsapp 
                WHERE id = %s AND status = 'pendente'
            """, [pk])
            
            if cursor.rowcount == 0:
                return Response(
                    {'error': 'Mensagem não encontrada ou já processada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({'success': True})


def _garantir_colunas_cloud(cursor):
    """Adiciona colunas de Cloud API na tabela config_whatsapp se ainda não existirem."""
    try:
        cursor.execute("SHOW COLUMNS FROM config_whatsapp LIKE 'cloud_token'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE config_whatsapp ADD COLUMN cloud_token VARCHAR(512) NULL DEFAULT NULL")
            cursor.execute("ALTER TABLE config_whatsapp ADD COLUMN cloud_phone_id VARCHAR(64) NULL DEFAULT NULL")
            cursor.execute("ALTER TABLE config_whatsapp ADD COLUMN cloud_verify_token VARCHAR(128) NULL DEFAULT NULL")
    except Exception:
        pass
    try:
        cursor.execute("SHOW COLUMNS FROM config_whatsapp LIKE 'cloud_numero'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE config_whatsapp ADD COLUMN cloud_numero VARCHAR(30) NULL DEFAULT NULL COMMENT 'Número real do WhatsApp Cloud API (ex: 5511999999999)'")
    except Exception:
        pass
    try:
        cursor.execute("SHOW COLUMNS FROM config_whatsapp LIKE 'status_validacao'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE config_whatsapp ADD COLUMN status_validacao VARCHAR(20) NULL DEFAULT NULL COMMENT 'PENDENTE | VALIDADO'")
    except Exception:
        pass


@api_view(['GET', 'PATCH', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def config_whatsapp_view(request):
    """Gerencia configuração WhatsApp"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Require authentication for GET/PATCH
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        with connection.cursor() as cursor:
            _garantir_colunas_cloud(cursor)
            cursor.execute("""
                SELECT 
                    id, nome_instancia, api_url, api_key, instancia_ativa,
                    status_conexao, telefone_conectado, delay_entre_mensagens,
                    limite_envios_por_hora, ativar_delay_randomico,
                    cloud_token, cloud_phone_id, cloud_verify_token,
                    cloud_numero, status_validacao
                FROM config_whatsapp 
                WHERE instancia_ativa = 1
                LIMIT 1
            """)
            
            row = cursor.fetchone()
            if not row:
                # Criar configuração padrão se não existir
                cursor.execute("""
                    INSERT INTO config_whatsapp 
                    (nome_instancia, api_url, api_key, instancia_ativa, 
                     status_conexao, delay_entre_mensagens, limite_envios_por_hora, 
                     ativar_delay_randomico)
                    VALUES ('empresa', 'http://localhost:8080', '', 1, 'desconectado', 15, 20, 1)
                """)
                
                # Buscar a configuração recém-criada
                cursor.execute("""
                    SELECT 
                        id, nome_instancia, api_url, api_key, instancia_ativa,
                        status_conexao, telefone_conectado, delay_entre_mensagens,
                        limite_envios_por_hora, ativar_delay_randomico,
                        cloud_token, cloud_phone_id, cloud_verify_token,
                        cloud_numero, status_validacao
                    FROM config_whatsapp 
                    WHERE instancia_ativa = 1
                    LIMIT 1
                """)
                row = cursor.fetchone()
            
            colunas = [col[0] for col in cursor.description]
            data = dict(zip(colunas, row))
            
            return Response(data)
    
    elif request.method == 'PATCH':
        data = request.data
        
        with connection.cursor() as cursor:
            _garantir_colunas_cloud(cursor)
            cursor.execute("""
                UPDATE config_whatsapp 
                SET 
                    api_url = %s,
                    api_key = %s,
                    delay_entre_mensagens = %s,
                    limite_envios_por_hora = %s,
                    ativar_delay_randomico = %s,
                    cloud_token = %s,
                    cloud_phone_id = %s,
                    cloud_verify_token = %s,
                    cloud_numero = %s
                WHERE id = 1
            """, [
                data.get('api_url'),
                data.get('api_key'),
                data.get('delay_entre_mensagens', 15),
                data.get('limite_envios_por_hora', 20),
                data.get('ativar_delay_randomico', True),
                data.get('cloud_token', '') or '',
                data.get('cloud_phone_id', '') or '',
                data.get('cloud_verify_token', '') or '',
                data.get('cloud_numero', '') or '',
            ])
            
            return Response({'success': True})


@api_view(['GET', 'POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def gerar_qrcode_whatsapp(request):
    """Cria instância WhatsApp e retorna QR Code (v1.7.1)"""
    
    # Handle CORS preflight - no authentication needed
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Require authentication for GET/POST
    if not request.user.is_authenticated:
        return Response(
            {'success': False, 'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        # Buscar configuração
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT api_url, api_key 
                FROM config_whatsapp 
                WHERE instancia_ativa = 1 
                LIMIT 1
            """)
            
            row = cursor.fetchone()
            if not row:
                return Response(
                    {'success': False, 'error': 'Configuração não encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            api_url, api_key = row
        
        # Health Check: Verificar se Evolution API está online
        try:
            health_check = requests.get(f"{api_url}/", timeout=3)
            # 200 ou 404 são OK (404 significa que a API está rodando mas a rota raiz não existe)
            if health_check.status_code not in [200, 404]:
                raise Exception("API não respondeu corretamente")
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Evolution API está offline',
                'message': 'A Evolution API (porta 8080) não está respondendo. Verifique se o serviço Docker está rodando.',
                'details': str(e),
                'solution': 'Execute: docker-compose up -d ou inicie o container Docker'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        headers = {'Content-Type': 'application/json'}
        if api_key:
            headers['apikey'] = api_key
        
        import time
        
        instance_name = 'instancia_principal'
        
        # Deletar instância existente
        try:
            requests.delete(f"{api_url}/instance/delete/{instance_name}", headers=headers, timeout=5)
            time.sleep(1)
        except:
            pass
        
        # Criar nova instância (v1.7.1 retorna QR code na criação)
        payload = {
            "instanceName": instance_name,
            "qrcode": True,
            "webhook": "",
            "webhookByEvents": False,
            "webhookBase64": False
        }
        
        response = requests.post(
            f"{api_url}/instance/create",
            json=payload,
            headers=headers,
            timeout=15
        )
        
        if response.status_code not in [200, 201]:
            return Response({
                'success': False,
                'error': f"Erro ao criar instância: {response.text}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = response.json()
        qr_code = None
        
        # v1.7.1 retorna QR code na criação
        if 'qrcode' in data:
            if isinstance(data['qrcode'], dict) and 'base64' in data['qrcode']:
                qr_code = data['qrcode']['base64']
            elif isinstance(data['qrcode'], str):
                qr_code = data['qrcode']
        
        if qr_code:
            # Garantir prefixo data:image se necessário
            if not qr_code.startswith('data:'):
                qr_code = f'data:image/png;base64,{qr_code}'
            
            # Salvar no banco
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE config_whatsapp 
                    SET qr_code = %s, status_conexao = 'qr_pendente'
                    WHERE instancia_ativa = 1
                """, [qr_code])
            
            return Response({
                'success': True,
                'qr_code': qr_code,
                'message': 'Escaneie o QR Code com seu WhatsApp'
            })
        
        # Se não conseguiu, retornar erro
        return Response({
            'success': False,
            'error': 'QR Code não foi retornado pela API',
            'debug_data': data
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except requests.exceptions.RequestException as e:
        return Response({
            'success': False,
            'error': f"Erro de conexão com Evolution API: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def buscar_qrcode_whatsapp(request):
    """Busca QR Code da instância criada (para polling do frontend)"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Require authentication for GET
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        # Buscar configuração
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT api_url, api_key 
                FROM config_whatsapp 
                WHERE instancia_ativa = 1 
                LIMIT 1
            """)
            
            row = cursor.fetchone()
            if not row:
                return Response(
                    {'success': False, 'error': 'Configuração não encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            api_url, api_key = row
        
        headers = {'apikey': api_key}
        
        # PRIMEIRO: Verificar se já está conectado
        try:
            status_response = requests.get(
                f"{api_url}/instance/connectionState/instancia_principal",
                headers=headers,
                timeout=5
            )
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                if status_data.get('state') == 'open':
                    # Já está conectado!
                    with connection.cursor() as cursor:
                        cursor.execute("""
                            UPDATE config_whatsapp 
                            SET status_conexao = 'conectado'
                            WHERE instancia_ativa = 1
                        """)
                    
                    return Response({
                        'success': True,
                        'connected': True,
                        'message': 'WhatsApp conectado com sucesso!'
                    })
        except:
            pass  # Se falhar, continua para buscar o QR code
        
        # Buscar QR code
        qr_response = requests.get(
            f"{api_url}/instance/connect/instancia_principal",
            headers=headers,
            timeout=5
        )
        
        if qr_response.status_code != 200:
            return Response({
                'success': False,
                'error': 'Erro ao buscar QR Code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        qr_data = qr_response.json()
        
        # Verificar se tem QR code base64
        if 'base64' in qr_data and qr_data['base64']:
            qr_code = qr_data['base64']
            if not qr_code.startswith('data:'):
                qr_code = f'data:image/png;base64,{qr_code}'
            
            # Salvar no banco
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE config_whatsapp 
                    SET qr_code = %s, status_conexao = 'qr_pendente'
                    WHERE instancia_ativa = 1
                """, [qr_code])
            
            return Response({
                'success': True,
                'qr_code': qr_code,
                'ready': True
            })
        
        # Verificar estrutura aninhada
        if 'qrcode' in qr_data and isinstance(qr_data['qrcode'], dict):
            count = qr_data['qrcode'].get('count', 0)
            if count > 0:
                qr_code = qr_data['qrcode'].get('base64') or qr_data['qrcode'].get('code')
                if qr_code:
                    if not qr_code.startswith('data:'):
                        qr_code = f'data:image/png;base64,{qr_code}'
                    
                    with connection.cursor() as cursor:
                        cursor.execute("""
                            UPDATE config_whatsapp 
                            SET qr_code = %s, status_conexao = 'qr_pendente'
                            WHERE instancia_ativa = 1
                        """, [qr_code])
                    
                    return Response({
                        'success': True,
                        'qr_code': qr_code,
                        'ready': True
                    })
        
        # Código de pareamento
        if 'pairingCode' in qr_data:
            return Response({
                'success': True,
                'pairing_code': qr_data['pairingCode'],
                'ready': True
            })
        
        # ainda não está pronto
        return Response({
            'success': True,
            'ready': False,
            'message': 'Aguardando QR Code...'
        })
            
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def verificar_status_whatsapp(request):
    """Verifica status da conexão WhatsApp"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Require authentication for GET
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT api_url, api_key 
                FROM config_whatsapp 
                WHERE instancia_ativa = 1 
                LIMIT 1
            """)
            
            row = cursor.fetchone()
            if not row:
                return Response({'connected': False})
            
            api_url, api_key = row
        
        headers = {}
        if api_key:
            headers['apikey'] = api_key
        
        response = requests.get(
            f"{api_url}/instance/connectionState/instancia_principal",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            is_connected = data.get('state') == 'open'
            
            # Atualizar status no banco
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE config_whatsapp 
                    SET status_conexao = %s
                    WHERE instancia_ativa = 1
                """, ['conectado' if is_connected else 'desconectado'])
            
            return Response({
                'connected': is_connected,
                'state': data.get('state'),
                'instance': data.get('instance')
            })
        else:
            return Response({'connected': False})
            
    except Exception as e:
        return Response({'connected': False, 'error': str(e)})


@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def estatisticas_whatsapp(request):
    """Retorna estatísticas de envios"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    # Require authentication for GET
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    with connection.cursor() as cursor:
        # Total por status
        cursor.execute("""
            SELECT status, COUNT(*) as total
            FROM fila_whatsapp
            GROUP BY status
        """)
        
        stats_status = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Envios das últimas 24h
        cursor.execute("""
            SELECT COUNT(*) 
            FROM fila_whatsapp 
            WHERE data_envio >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """)
        
        envios_24h = cursor.fetchone()[0]
        
        # Taxa de sucesso
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN status = 'enviado' THEN 1 ELSE 0 END) as enviados,
                COUNT(*) as total
            FROM fila_whatsapp
            WHERE status IN ('enviado', 'falha')
        """)
        
        row = cursor.fetchone()
        taxa_sucesso = (row[0] / row[1] * 100) if row[1] > 0 else 0
        
        return Response({
            'por_status': stats_status,
            'envios_24h': envios_24h,
            'taxa_sucesso': round(taxa_sucesso, 2)
        })
