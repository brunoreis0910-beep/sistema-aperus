"""
Django Signals para integração de TTS com Aprovação de Desconto

Quando uma solicitação de desconto for aprovada/rejeitada,
o sistema automaticamente gera e reproduz um áudio de notificação.

Autor: Sistema Gerencial
Data: 13/03/2026
"""

import logging
import json
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
import os

from .models import SolicitacaoAprovacao
from .services_tts import falar_aprovacao_desconto, falar_rejeicao_desconto

logger = logging.getLogger(__name__)


@receiver(post_save, sender=SolicitacaoAprovacao)
def notificar_aprovacao_via_tts(sender, instance, created, **kwargs):
    """
    Signal que dispara TTS quando uma solicitação é aprovada/rejeitada
    
    Funciona apenas quando:
    - A solicitação mudou de status para 'Aprovada' ou 'Recusada'
    - A configuração TTS_ATIVAR_NOTIFICACOES está True no .env
    """
    # Checa se TTS está ativado
    ativar_tts = os.getenv('TTS_ATIVAR_NOTIFICACOES', 'False').lower() == 'true'
    if not ativar_tts:
        logger.debug("[TTS Signal] TTS desativado via configuração")
        return
    
    # Só processa se não é criação (é atualização de status)
    if created:
        return
    
    # Só processa aprovação/rejeição de desconto
    if instance.tipo != 'desconto':
        return
    
    # Só processa se mudou para Aprovada ou Recusada
    if instance.status not in ['Aprovada', 'Recusada']:
        return
    
    try:
        # Extrai dados da solicitação
        dados = json.loads(instance.dados_solicitacao) if instance.dados_solicitacao else {}
        supervisor = instance.supervisor.get_full_name() or instance.supervisor.username
        valor_desconto = dados.get('valor_desconto', 0)
        cliente = dados.get('nome_cliente', 'o cliente')
        motivo = instance.observacoes or 'não especificado'
        
        logger.info(
            f"[TTS Signal] Gerando áudio de notificação: "
            f"Solicitação #{instance.id_solicitacao} - {instance.status}"
        )
        
        # Gera e toca o áudio apropriado
        if instance.status == 'Aprovada':
            resultado = falar_aprovacao_desconto(supervisor, valor_desconto, cliente)
        else:
            resultado = falar_rejeicao_desconto(supervisor, motivo)
        
        if resultado.get('sucesso'):
            logger.info(
                f"[TTS Signal] Áudio gerado com sucesso: {resultado['audio_path']}"
            )
            
            # Opcional: Reproduzir o áudio automaticamente no servidor
            reproduzir_auto = os.getenv('TTS_REPRODUZIR_AUTOMATICAMENTE', 'False').lower() == 'true'
            if reproduzir_auto:
                _reproduzir_audio_local(resultado['audio_path'])
        else:
            logger.error(
                f"[TTS Signal] Erro ao gerar áudio: {resultado.get('erro')}"
            )
    
    except Exception as e:
        logger.error(
            f"[TTS Signal] Erro ao processar notificação TTS: {e}",
            exc_info=True
        )


def _reproduzir_audio_local(audio_path: str):
    """
    Reproduz o áudio localmente no servidor usando pygame
    
    Útil para notificações sonoras em ambiente de PDV/balcão
    """
    try:
        import pygame
        pygame.mixer.init()
        pygame.mixer.music.load(audio_path)
        pygame.mixer.music.play()
        
        # Aguarda terminar de tocar
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        
        logger.info(f"[TTS Player] Áudio reproduzido: {audio_path}")
    
    except ImportError:
        logger.warning(
            "[TTS Player] pygame não instalado. "
            "Para reprodução automática, instale: pip install pygame"
        )
    except Exception as e:
        logger.error(f"[TTS Player] Erro ao reproduzir áudio: {e}")
