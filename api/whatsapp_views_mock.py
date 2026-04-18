"""
Views Mock para WhatsApp - Modo Desenvolvimento
Permite testar sem Evolution API rodando
"""
from rest_framework.decorators import api_view, authentication_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
import base64
from io import BytesIO

def gerar_qrcode_fake():
    """Gera um QR Code fake para desenvolvimento - NÃO FUNCIONA COM WHATSAPP REAL"""
    # SVG com mensagem clara de que é apenas para teste de interface
    svg = '''<svg width="400" height="450" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="450" fill="#1e1e1e"/>
        
        <!-- Borda -->
        <rect x="50" y="50" width="300" height="300" fill="white" stroke="#25D366" stroke-width="3"/>
        
        <!-- Padrão de QR Code simulado -->
        <rect x="70" y="70" width="50" height="50" fill="#000"/>
        <rect x="280" y="70" width="50" height="50" fill="#000"/>
        <rect x="70" y="280" width="50" height="50" fill="#000"/>
        
        <rect x="140" y="140" width="30" height="30" fill="#000"/>
        <rect x="230" y="140" width="30" height="30" fill="#000"/>
        <rect x="140" y="230" width="30" height="30" fill="#000"/>
        <rect x="230" y="230" width="30" height="30" fill="#000"/>
        
        <rect x="185" y="185" width="30" height="30" fill="#000"/>
        
        <!-- Ícone WhatsApp -->
        <circle cx="200" cy="200" r="40" fill="#25D366" opacity="0.9"/>
        <text x="200" y="215" text-anchor="middle" fill="white" font-size="30" font-weight="bold">?</text>
        
        <!-- Texto de aviso -->
        <text x="200" y="380" text-anchor="middle" fill="#ff6b6b" font-size="18" font-weight="bold">
            ⚠ MODO TESTE
        </text>
        <text x="200" y="405" text-anchor="middle" fill="#ffcc00" font-size="14">
            QR Code simulado - não escaneie
        </text>
        <text x="200" y="430" text-anchor="middle" fill="#aaa" font-size="12">
            Instale Evolution API para WhatsApp real
        </text>
    </svg>'''
    svg_b64 = base64.b64encode(svg.encode()).decode()
    return f'data:image/svg+xml;base64,{svg_b64}'

# Importar todas as views originais e sobrescrever apenas as que precisam de Evolution API
from .whatsapp_views import (
    fila_whatsapp_view,
    fila_whatsapp_detail,
    config_whatsapp_view,
    estatisticas_whatsapp
)

@api_view(['GET', 'POST', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def gerar_qrcode_whatsapp(request):
    """MOCK: Gera QR Code fake para desenvolvimento"""
    
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    if not request.user.is_authenticated:
        return Response(
            {'success': False, 'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Gerar QR Code fake
    qr_code = gerar_qrcode_fake()
    
    # Salvar no banco
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE config_whatsapp 
                SET qr_code = %s, status_conexao = 'qr_pendente'
                WHERE instancia_ativa = 1
            """, [qr_code])
    except Exception:
        pass  # Ignora erro se tabela não existir
    
    return Response({
        'success': True,
        'qr_code': qr_code,
        'message': '⚠️ MODO DESENVOLVIMENTO - QR Code simulado (NÃO ESCANEAR). Para usar WhatsApp real, instale Evolution API.',
        'modo_dev': True,
        'aviso': 'Este QR Code não funciona com WhatsApp real. É apenas para teste da interface.'
    })

@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def buscar_qrcode_whatsapp(request):
    """MOCK: Retorna QR Code fake"""
    
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'success': True,
        'ready': True,
        'qr_code': gerar_qrcode_fake(),
        'modo_dev': True
    })

@api_view(['GET', 'OPTIONS'])
@authentication_classes([JWTAuthentication])
def verificar_status_whatsapp(request):
    """MOCK: Simula conexão ativa"""
    
    if request.method == 'OPTIONS':
        return Response(status=status.HTTP_200_OK)
    
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # Atualizar status no banco
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE config_whatsapp 
                SET status_conexao = 'conectado', telefone_conectado = '55119999999999'
                WHERE instancia_ativa = 1
            """)
    except Exception:
        pass
    
    return Response({
        'connected': True,
        'state': 'open',
        'instance': 'mock_development',
        'telefone': '55119999999999',
        'modo_dev': True,
        'message': '⚠️ Conexão simulada - Modo Desenvolvimento'
    })
