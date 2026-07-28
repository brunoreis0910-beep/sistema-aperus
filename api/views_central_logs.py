from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from api.models import CentralErroLog

@api_view(['POST'])
@permission_classes([AllowAny])
def receber_log_erro_tenant(request):
    dados = request.data
    try:
        CentralErroLog.objects.create(
            tenant_schema=dados.get('tenant_schema'),
            url_afetada=dados.get('url_afetada'),
            tipo_excecao=dados.get('tipo_excecao'),
            mensagem_erro=dados.get('mensagem_erro'),
            traceback_completo=dados.get('traceback_completo'),
            nivel=dados.get('nivel', 'ERROR')
        )
        return JsonResponse({'status': 'capturado_com_sucesso'}, status=201)
    except Exception as e:
        return JsonResponse({'status': 'erro_ao_salvar_log', 'detalhe': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_logs_erro(request):
    if not request.user.is_superuser:
        return Response({'detail': 'Não autorizado.'}, status=status.HTTP_403_FORBIDDEN)
    
    logs = CentralErroLog.objects.filter(resolvido=False).order_by('-criado_em')
    data = [{
        'id': log.id,
        'tenant_schema': log.tenant_schema,
        'url_afetada': log.url_afetada,
        'tipo_excecao': log.tipo_excecao,
        'mensagem_erro': log.mensagem_erro,
        'traceback_completo': log.traceback_completo,
        'nivel': log.nivel,
        'criado_em': log.criado_em.isoformat() if log.criado_em else None,
        'resolvido': log.resolvido,
        'observacao_suporte': log.observacao_suporte
    } for log in logs]
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolver_log_erro(request, pk):
    if not request.user.is_superuser:
        return Response({'detail': 'Não autorizado.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        log = CentralErroLog.objects.get(pk=pk)
        log.resolvido = True
        log.observacao_suporte = request.data.get('observacao_suporte', log.observacao_suporte)
        log.save()
        return Response({'status': 'sucesso', 'mensagem': 'Log de erro marcado como resolvido.'})
    except CentralErroLog.DoesNotExist:
        return Response({'error': 'Log de erro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
