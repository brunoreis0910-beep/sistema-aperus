# -*- coding: utf-8 -*-
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.http import JsonResponse, FileResponse, Http404
from django.conf import settings
import os


def _admin_required():
    return [IsAuthenticated]


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def backup_manager(request):
    from comandas.backup_utils import create_database_backup, list_backups

    if request.method == 'POST':
        compress = request.data.get('compress', True)
        try:
            backup_file = create_database_backup(compress=compress)
            import os
            size_mb = round(os.path.getsize(backup_file) / (1024 * 1024), 2)
            return JsonResponse({
                'success': True,
                'message': 'Backup criado com sucesso',
                'filename': os.path.basename(backup_file),
                'size_mb': size_mb,
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    backups = list_backups()
    return JsonResponse({'success': True, 'backups': backups})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_info(request):
    from comandas.backup_utils import list_backups

    backups = list_backups()
    db_config = settings.DATABASES['default']
    engine = db_config.get('ENGINE', '')
    db_type = 'MySQL' if 'mysql' in engine else 'SQLite' if 'sqlite' in engine else 'Desconhecido'
    db_name = db_config.get('NAME', '-')

    total_size = sum(b['size_mb'] for b in backups)

    return JsonResponse({
        'success': True,
        'info': {
            'database_type': db_type,
            'database_name': db_name,
            'total_backups': len(backups),
            'total_size_mb': round(total_size, 2),
            'newest_backup': backups[0]['created_at'] if backups else None,
            'oldest_backup': backups[-1]['created_at'] if backups else None,
        }
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def backup_delete(request, filename):
    from comandas.backup_utils import delete_backup

    try:
        success = delete_backup(filename)
        if success:
            return JsonResponse({'success': True, 'message': 'Backup removido'})
        return JsonResponse({'success': False, 'error': 'Backup não encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def backup_restore(request, filename):
    from comandas.backup_utils import restore_database_backup

    try:
        restore_database_backup(filename)
        return JsonResponse({'success': True, 'message': 'Backup restaurado com sucesso'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_download(request, filename):
    from comandas.backup_utils import get_backup_dir

    # Validação de segurança
    if not filename.startswith('backup_') or '..' in filename or '/' in filename or '\\' in filename:
        return JsonResponse({'error': 'Arquivo inválido'}, status=400)

    backup_dir = get_backup_dir()
    filepath = os.path.join(backup_dir, filename)

    if not os.path.exists(filepath):
        return JsonResponse({'error': 'Arquivo não encontrado'}, status=404)

    content_type = 'application/zip' if filename.endswith('.zip') else 'application/octet-stream'
    response = FileResponse(open(filepath, 'rb'), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def backup_scheduler_control(request):
    from comandas.backup_scheduler import BackupSchedulerService

    scheduler = BackupSchedulerService()

    if request.method == 'POST':
        action = request.data.get('action', 'start')
        schedule_config = request.data.get('schedule', {})

        if action == 'stop':
            scheduler.stop_scheduler()
        else:
            hour = schedule_config.get('hour', 2)
            minute = schedule_config.get('minute', 0)
            scheduler.start_scheduler(hour=hour, minute=minute)

    status_info = scheduler.get_scheduler_status()
    return JsonResponse({'success': True, 'scheduler': status_info})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def backup_now(request):
    from comandas.backup_utils import create_database_backup

    try:
        backup_file = create_database_backup(compress=True)
        return JsonResponse({
            'success': True,
            'message': 'Backup executado com sucesso',
            'filename': os.path.basename(backup_file),
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

