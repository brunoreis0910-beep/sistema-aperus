from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from api.models import AgendamentoBackupLocal
from api.services.backup_local_service import realizar_backup_unidade_g
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def saas_obter_backup_config(request):
    # Verifica se o usuário é superuser (admin do SaaS)
    if not request.user.is_superuser:
        return Response({'detail': 'Não autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    config = AgendamentoBackupLocal.objects.first()
    if not config:
        # Cria uma padrão se não existir
        config = AgendamentoBackupLocal.objects.create(
            diretorio_destino="G:\\Meu Drive\\BackupsAperus",
            horarios_execucao="02:00",
            retencao_arquivos=30,
            ativo=True
        )
    
    return Response({
        'id_agendamento': config.id_agendamento,
        'diretorio_destino': config.diretorio_destino,
        'segunda': config.segunda,
        'terca': config.terca,
        'quarta': config.quarta,
        'quinta': config.quinta,
        'sexta': config.sexta,
        'sabado': config.sabado,
        'domingo': config.domingo,
        'horarios_execucao': config.horarios_execucao,
        'retencao_arquivos': config.retencao_arquivos,
        'ativo': config.ativo,
        'ultimo_backup_em': config.ultimo_backup_em.isoformat() if config.ultimo_backup_em else None,
        'status_ultimo_backup': config.status_ultimo_backup
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def saas_salvar_backup_config(request):
    if not request.user.is_superuser:
        return Response({'detail': 'Não autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    config = AgendamentoBackupLocal.objects.first()
    if not config:
        config = AgendamentoBackupLocal(diretorio_destino="G:\\Meu Drive\\BackupsAperus")
        
    data = request.data
    config.diretorio_destino = data.get('diretorio_destino', config.diretorio_destino)
    config.segunda = data.get('segunda', config.segunda)
    config.terca = data.get('terca', config.terca)
    config.quarta = data.get('quarta', config.quarta)
    config.quinta = data.get('quinta', config.quinta)
    config.sexta = data.get('sexta', config.sexta)
    config.sabado = data.get('sabado', config.sabado)
    config.domingo = data.get('domingo', config.domingo)
    config.horarios_execucao = data.get('horarios_execucao', config.horarios_execucao)
    config.retencao_arquivos = int(data.get('retencao_arquivos', config.retencao_arquivos))
    config.ativo = data.get('ativo', config.ativo)
    config.save()
    
    return Response({'mensagem': 'Configuração de backup salva com sucesso!'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def saas_forcar_backup(request):
    if not request.user.is_superuser:
        return Response({'detail': 'Não autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    logger.info(f"[BACKUP] Backup forçado manualmente por {request.user.username}")
    sucesso, mensagem = realizar_backup_unidade_g()
    if sucesso:
        return Response({'mensagem': mensagem})
    else:
        return Response({'error': mensagem}, status=status.HTTP_400_BAD_REQUEST)
