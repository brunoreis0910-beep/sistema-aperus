"""
Evolution API - Views para gerenciamento de instância
Placeholder: Implementação futura
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status as http_status


@api_view(['POST'])
def evolution_criar_instancia(request):
    """Cria instância Evolution API (não implementado)."""
    return Response({
        'error': 'Evolution API não configurada',
        'message': 'Use WhatsApp Cloud API ou Playwright'
    }, status=http_status.HTTP_501_NOT_IMPLEMENTED)


@api_view(['GET'])
def evolution_qrcode(request):
    """Retorna QR Code da instância Evolution (não implementado)."""
    return Response({
        'error': 'Evolution API não configurada',
        'message': 'Use WhatsApp Cloud API ou Playwright'
    }, status=http_status.HTTP_501_NOT_IMPLEMENTED)


@api_view(['GET'])
def evolution_status(request):
    """Verifica status da instância Evolution (não implementado)."""
    return Response({
        'error': 'Evolution API não configurada',
        'message': 'Use WhatsApp Cloud API ou Playwright'
    }, status=http_status.HTTP_501_NOT_IMPLEMENTED)
