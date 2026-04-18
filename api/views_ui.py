from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from .models import EmpresaConfig

class PDVNFCeView(APIView):
    """
    Renderiza a interface de Frente de Caixa para NFC-e.
    """
    authentication_classes = [] # Remove autenticação para evitar 401 com token expirado
    permission_classes = [AllowAny] # MVP: Simplificar acesso, depois restringir se necessário

    def get(self, request):
        config = EmpresaConfig.get_ativa()
        return render(request, 'api/nfce_pdv.html', {'empresa_config': config})

class NFSeOSView(APIView):
    """
    Renderiza a interface de Emissão de NFS-e para Ordens de Serviço.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return render(request, 'api/nfse_os.html')

class OrdemServicoIndexView(APIView):
    """
    Renderiza a lista de Ordens de Serviço para impressão.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return render(request, 'api/ordem_servico_index.html')
