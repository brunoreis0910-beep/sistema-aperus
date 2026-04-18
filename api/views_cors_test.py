from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

@api_view(['GET', 'POST', 'OPTIONS'])
@permission_classes([AllowAny])
def cors_test(request):
    """
    Endpoint de teste para verificar se CORS está funcionando corretamente.
    Pode ser acessado sem autenticação.
    """
    return Response({
        'message': 'CORS está funcionando!',
        'method': request.method,
        'debug': settings.DEBUG,
        'cors_allow_all': getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
        'cors_origin_allow_all': getattr(settings, 'CORS_ORIGIN_ALLOW_ALL', False),
        'origin': request.META.get('HTTP_ORIGIN', 'N/A'),
        'headers': {
            'content-type': request.META.get('CONTENT_TYPE', 'N/A'),
            'authorization': 'present' if request.META.get('HTTP_AUTHORIZATION') else 'absent',
        }
    }, status=status.HTTP_200_OK)
