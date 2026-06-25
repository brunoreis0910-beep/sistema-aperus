import re
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from api import models

@api_view(['GET'])
@permission_classes([AllowAny])
def saas_mapear_tenant(request):
    """
    Localiza o cliente na tabela SaaSCliente pelo CNPJ,
    valida se a licença está regular (não bloqueada ou inativa)
    e devolve a URL correta do tenant.
    URL: /api/saas/mapear-tenant/?cnpj=XXXXXXXXXXXXXX
    """
    cnpj = request.query_params.get('cnpj')
    if not cnpj:
        return Response({'error': 'CNPJ é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Limpa o CNPJ mantendo apenas dígitos
    cnpj_limpo = re.sub(r'\D', '', cnpj)
    
    # Define o banco de dados central
    db_name = 'aperus_central'
    from django.conf import settings
    if db_name not in settings.DATABASES:
        import copy
        default_db = settings.DATABASES['default']
        settings.DATABASES[db_name] = copy.deepcopy(default_db)
        settings.DATABASES[db_name]['NAME'] = db_name
        
    try:
        # Busca o cliente na base central
        cliente = models.SaaSCliente.objects.using(db_name).filter(cnpj=cnpj_limpo).first()
        if not cliente:
            return Response({'error': 'Empresa não cadastrada com este CNPJ.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Validação do status da licença
        if cliente.status_licenca in ['BLOQUEADO', 'CANCELADO', 'SUSPENSO', 'INATIVO']:
            return Response({
                'status_licenca': cliente.status_licenca,
                'error': f'A licença do sistema está {cliente.status_licenca.lower()}. Entre em contato com o suporte.'
            }, status=status.HTTP_403_FORBIDDEN)
            
        # Constrói a URL do tenant
        # Se houver link_acesso customizado cadastrado, usa ele normalizando para terminar com '/api/'
        if cliente.link_acesso:
            url_tenant = cliente.link_acesso.strip()
            if not url_tenant.endswith('/'):
                url_tenant += '/'
            if '/api/' not in url_tenant:
                url_tenant = url_tenant.rstrip('/') + '/api/'
        else:
            url_tenant = f"https://{cliente.schema_name}.aperus.com.br/api/"
        
        return Response({
            'cnpj': cliente.cnpj,
            'razao_social': cliente.razao_social,
            'schema_name': cliente.schema_name,
            'status_licenca': cliente.status_licenca,
            'url_api': url_tenant
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'Erro ao processar mapeamento: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
