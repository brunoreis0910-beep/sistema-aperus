"""
Views e Endpoints REST para Text-to-Speech (TTS)

Endpoints:
- POST /api/tts/gerar/ - Gera áudio a partir de texto
- GET /api/tts/vozes/ - Lista vozes disponíveis
- POST /api/tts/testar/ - Testa o TTS com texto de exemplo
- POST /api/tts/aprovacao-desconto/ - TTS específico para aprovação de desconto

Autor: Sistema Gerencial
Data: 13/03/2026
"""

import os
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, HttpResponse
from django.conf import settings
from pathlib import Path
import logging

from .services_tts import (
    TTSService, 
    falar_aprovacao_desconto, 
    falar_rejeicao_desconto,
    falar_alerta_estoque
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def gerar_audio_tts(request):
    """
    POST /api/tts/gerar/
    
    Gera áudio a partir de texto usando TTS
    
    Body:
    {
        "texto": "Olá Bruno, o desconto foi autorizado!",
        "provider": "google",  // opcional: google, elevenlabs, azure
        "voz": "pt-BR-Neural2-B",  // opcional
        "velocidade": 1.0,  // opcional: 0.25 a 4.0
        "retornar_base64": true,  // opcional: se true, retorna audio em base64
        "salvar_arquivo": false  // opcional: se true, mantém arquivo no servidor
    }
    
    Response:
    {
        "sucesso": true,
        "audio_base64": "...",  // se retornar_base64=true
        "audio_url": "/api/tts/audio/abc123.mp3",  // URL para download
        "provider": "google",
        "voz_usada": "pt-BR-Neural2-B",
        "tamanho_bytes": 45123,
        "formato": "mp3"
    }
    """
    try:
        texto = request.data.get('texto')
        if not texto:
            return Response(
                {'erro': 'Campo "texto" é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parâmetros opcionais
        provider = request.data.get('provider', os.getenv('TTS_PROVIDER', 'google'))
        voz = request.data.get('voz')
        velocidade = float(request.data.get('velocidade', 1.0))
        retornar_base64 = request.data.get('retornar_base64', True)
        salvar_arquivo = request.data.get('salvar_arquivo', False)
        
        # Valida velocidade
        if not (0.25 <= velocidade <= 4.0):
            return Response(
                {'erro': 'Velocidade deve estar entre 0.25 e 4.0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Gera o áudio
        logger.info(f"[TTS API] Gerando áudio: provider={provider}, texto={texto[:50]}...")
        tts = TTSService(provider=provider)
        resultado = tts.gerar_audio(
            texto=texto,
            voz=voz,
            velocidade=velocidade,
            salvar_arquivo=salvar_arquivo
        )
        
        if not resultado.get('sucesso'):
            return Response(
                {'erro': resultado.get('erro', 'Erro desconhecido ao gerar áudio')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Monta resposta
        resposta = {
            'sucesso': True,
            'provider': resultado['provider'],
            'voz_usada': resultado['voz_usada'],
            'tamanho_bytes': resultado['tamanho_bytes'],
            'formato': resultado['formato']
        }
        
        # Adiciona base64 se solicitado
        if retornar_base64:
            resposta['audio_base64'] = resultado['audio_base64']
        
        # Adiciona URL do arquivo
        arquivo_path = Path(resultado['audio_path'])
        arquivo_nome = arquivo_path.name
        resposta['audio_url'] = f'/api/tts/audio/{arquivo_nome}'
        resposta['audio_filename'] = arquivo_nome
        
        logger.info(f"[TTS API] Áudio gerado com sucesso: {arquivo_nome}")
        
        return Response(resposta, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[TTS API] Erro ao gerar áudio: {e}", exc_info=True)
        return Response(
            {'erro': f'Erro interno: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_vozes_tts(request):
    """
    GET /api/tts/vozes/?provider=google
    
    Lista todas as vozes disponíveis do provider
    
    Query Params:
    - provider: google, elevenlabs ou azure (padrão: google)
    
    Response:
    {
        "sucesso": true,
        "provider": "google",
        "vozes": [
            {
                "nome": "pt-BR-Neural2-A",
                "genero": "FEMALE",
                "tipo": "Neural"
            },
            ...
        ],
        "total": 12
    }
    """
    try:
        provider = request.GET.get('provider', os.getenv('TTS_PROVIDER', 'google'))
        
        logger.info(f"[TTS API] Listando vozes: provider={provider}")
        tts = TTSService(provider=provider)
        resultado = tts.listar_vozes()
        
        if not resultado.get('sucesso'):
            return Response(
                {'erro': resultado.get('erro', 'Erro ao listar vozes')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(resultado, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[TTS API] Erro ao listar vozes: {e}", exc_info=True)
        return Response(
            {'erro': f'Erro interno: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def testar_tts(request):
    """
    POST /api/tts/testar/
    
    Testa o TTS com uma frase de exemplo
    
    Body:
    {
        "provider": "google",  // opcional
        "voz": "pt-BR-Neural2-B"  // opcional
    }
    
    Response: igual ao /api/tts/gerar/
    """
    try:
        provider = request.data.get('provider', os.getenv('TTS_PROVIDER', 'google'))
        voz = request.data.get('voz')
        
        # Texto de teste
        texto_teste = "Olá! Este é um teste do sistema de voz do APERUS. A qualidade do áudio é natural e fluida, perfeita para notificações e alertas."
        
        logger.info(f"[TTS API] Teste de TTS: provider={provider}, voz={voz}")
        tts = TTSService(provider=provider)
        resultado = tts.gerar_audio(
            texto=texto_teste,
            voz=voz,
            velocidade=1.0,
            salvar_arquivo=False
        )
        
        if not resultado.get('sucesso'):
            return Response(
                {'erro': resultado.get('erro', 'Erro ao gerar áudio de teste')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Monta resposta
        arquivo_path = Path(resultado['audio_path'])
        arquivo_nome = arquivo_path.name
        
        resposta = {
            'sucesso': True,
            'mensagem': 'Áudio de teste gerado com sucesso',
            'texto_teste': texto_teste,
            'provider': resultado['provider'],
            'voz_usada': resultado['voz_usada'],
            'audio_base64': resultado['audio_base64'],
            'audio_url': f'/api/tts/audio/{arquivo_nome}',
            'tamanho_bytes': resultado['tamanho_bytes'],
            'formato': resultado['formato']
        }
        
        return Response(resposta, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[TTS API] Erro no teste de TTS: {e}", exc_info=True)
        return Response(
            {'erro': f'Erro interno: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tts_aprovacao_desconto(request):
    """
    POST /api/tts/aprovacao-desconto/
    
    Gera TTS específico para aprovação/rejeição de desconto
    
    Body:
    {
        "aprovado": true,
        "supervisor": "João Silva",
        "valor_desconto": 150.00,
        "cliente": "Maria Santos",
        "motivo_rejeicao": "Desconto acima do limite"  // opcional, só se aprovado=false
    }
    
    Response: igual ao /api/tts/gerar/
    """
    try:
        aprovado = request.data.get('aprovado')
        supervisor = request.data.get('supervisor')
        
        if aprovado is None or not supervisor:
            return Response(
                {'erro': 'Campos "aprovado" e "supervisor" são obrigatórios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Gera áudio apropriado
        if aprovado:
            valor_desconto = float(request.data.get('valor_desconto', 0))
            cliente = request.data.get('cliente', 'o cliente')
            resultado = falar_aprovacao_desconto(supervisor, valor_desconto, cliente)
        else:
            motivo = request.data.get('motivo_rejeicao', 'não especificado')
            resultado = falar_rejeicao_desconto(supervisor, motivo)
        
        if not resultado.get('sucesso'):
            return Response(
                {'erro': resultado.get('erro', 'Erro ao gerar áudio')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Monta resposta
        arquivo_path = Path(resultado['audio_path'])
        arquivo_nome = arquivo_path.name
        
        resposta = {
            'sucesso': True,
            'tipo': 'aprovacao' if aprovado else 'rejeicao',
            'provider': resultado['provider'],
            'voz_usada': resultado['voz_usada'],
            'audio_base64': resultado['audio_base64'],
            'audio_url': f'/api/tts/audio/{arquivo_nome}',
            'tamanho_bytes': resultado['tamanho_bytes'],
            'formato': resultado['formato']
        }
        
        logger.info(f"[TTS API] TTS de {'aprovação' if aprovado else 'rejeição'} gerado para supervisor {supervisor}")
        
        return Response(resposta, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[TTS API] Erro no TTS de aprovação: {e}", exc_info=True)
        return Response(
            {'erro': f'Erro interno: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def download_audio_tts(request, filename):
    """
    GET /api/tts/audio/<filename>
    
    Baixa o arquivo de áudio gerado
    
    Nota: Endpoint público (sem autenticação) para facilitar reprodução
    """
    try:
        import tempfile
        from pathlib import Path
        
        # Diretório temporário do TTS
        temp_dir = Path(tempfile.gettempdir()) / 'sistema_gerencial_tts'
        audio_path = temp_dir / filename
        
        if not audio_path.exists():
            return Response(
                {'erro': 'Arquivo de áudio não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Retorna o arquivo
        logger.info(f"[TTS API] Download de áudio: {filename}")
        return FileResponse(
            open(audio_path, 'rb'),
            content_type='audio/mpeg',
            as_attachment=False,
            filename=filename
        )
    
    except Exception as e:
        logger.error(f"[TTS API] Erro no download de áudio: {e}", exc_info=True)
        return Response(
            {'erro': f'Erro ao baixar áudio: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tts_alerta_estoque(request):
    """
    POST /api/tts/alerta-estoque/
    
    Gera TTS de alerta de estoque baixo
    
    Body:
    {
        "produto": "Notebook Dell Inspiron",
        "quantidade": 3
    }
    """
    try:
        produto = request.data.get('produto')
        quantidade = request.data.get('quantidade')
        
        if not produto or quantidade is None:
            return Response(
                {'erro': 'Campos "produto" e "quantidade" são obrigatórios'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        resultado = falar_alerta_estoque(produto, int(quantidade))
        
        if not resultado.get('sucesso'):
            return Response(
                {'erro': resultado.get('erro')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        arquivo_path = Path(resultado['audio_path'])
        arquivo_nome = arquivo_path.name
        
        resposta = {
            'sucesso': True,
            'tipo': 'alerta_estoque',
            'provider': resultado['provider'],
            'audio_base64': resultado['audio_base64'],
            'audio_url': f'/api/tts/audio/{arquivo_nome}'
        }
        
        return Response(resposta, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"[TTS API] Erro no TTS de alerta: {e}", exc_info=True)
        return Response(
            {'erro': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
