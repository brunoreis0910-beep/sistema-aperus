# Em: projeto_gerencial/urls.py

"""
URL configuration for projeto_gerencial project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import RedirectView
from django.views.static import serve
from django.conf import settings
import os

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.views.decorators.csrf import csrf_exempt
from api.views_nfce_config import ConfigNFceView
from api.views_ui import PDVNFCeView, NFSeOSView, OrdemServicoIndexView
from api.views_redirects import ConfiguracoesRedirectView, GenericHashRedirectView
# Imporar views do Agro
from api.views_frontend_agro import agro_index, agro_safras, agro_contratos, agro_conversoes

def serve_frontend(request, path=''):
    """Serve arquivos do frontend React"""
    # Tenta frontend/dist primeiro, depois frontend/
    frontend_dist = os.path.join(settings.BASE_DIR, 'frontend', 'dist')
    if not os.path.isdir(frontend_dist):
        frontend_dist = os.path.join(settings.BASE_DIR, 'frontend')
    
    # Se for um arquivo estático, serve diretamente
    if path and os.path.isfile(os.path.join(frontend_dist, path)):
        response = serve(request, path, document_root=frontend_dist)
        # Assets com hash no nome podem ser cacheados por longo tempo
        if '/assets/' in path and any(path.endswith(ext) for ext in ('.js', '.css', '.woff2', '.woff', '.ttf')):
            response['Cache-Control'] = 'public, max-age=31536000, immutable'
        return response
    
    # Caso contrário, serve o index.html (SPA routing)
    # NUNCA cachear index.html para garantir que o bundle mais recente seja carregado
    response = serve(request, 'index.html', document_root=frontend_dist)
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

def lista_relatorios(request):
    """Serve a página HTML com a lista de relatórios disponíveis"""
    html_path = os.path.join(settings.BASE_DIR, 'LISTA_RELATORIOS.html')
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    from django.http import HttpResponse
    return HttpResponse(html_content)

urlpatterns = [
    path('admin/', admin.site.urls),

    # IMPORTANTE AQUI:
    path('api/', include('api.urls')),
    path('api/comandas/', include('comandas.urls')),
    path('api/etiquetas/', include('etiquetas.urls')),
    
    # Sistema de Cadastro de Clientes
    path('cadastro/', include('cadastro_clientes.urls')),

    # Calculadora Fiscal (CBS/IBS)
    # path('api/calculadora/', include('calculadora_fiscal.urls')),

    path('api/token/', csrf_exempt(TokenObtainPairView.as_view()), name='token_obtain_pair'),
    path('api/token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh'),

    # Tela de Configuração NFC-e (Independente do React)
    path('config-nfce/', ConfigNFceView.as_view(), name='config_nfce'),
    
    # Modulo CTe
    path('cte/', include('cte.urls')),
    
    # Módulo MDF-e
    path('api/mdfe/', include('mdfe.urls')),
    
    # Nova Tela de Emissão NFS-e para OS
    path('nfse-os/', NFSeOSView.as_view(), name='nfse_os_page'),
    
    # Tela de Lista/Impressão de OS (Nota de Serviço)
    path('ordem-servico/', OrdemServicoIndexView.as_view(), name='ordem_servico_index'),

    # Tela de PDV NFC-e
    path('pdv-nfce/', PDVNFCeView.as_view(), name='pdv_nfce'),

    # Módulo Agro (Direto no Django, sem React)
    path('agro/', agro_index, name='agro_index_direct'),
    path('agro/safras/', agro_safras, name='agro_safras_direct'),
    path('agro/contratos/', agro_contratos, name='agro_contratos_direct'),
    path('agro/conversoes/', agro_conversoes, name='agro_conversoes_direct'),

    # Redirecionamentos para Hash Router (React) - Principais páginas
    path('configuracoes/', ConfiguracoesRedirectView.as_view(), name='configuracoes_redirect'),
    path('clientes/', GenericHashRedirectView.as_view(), {'path': 'clientes'}, name='clientes_redirect'),
    path('produtos/', GenericHashRedirectView.as_view(), {'path': 'produtos'}, name='produtos_redirect'),
    path('vendas/', GenericHashRedirectView.as_view(), {'path': 'vendas'}, name='vendas_redirect'),
    path('financeiro/', GenericHashRedirectView.as_view(), {'path': 'financeiro'}, name='financeiro_redirect'),
    path('relatorios/', GenericHashRedirectView.as_view(), {'path': 'relatorios'}, name='relatorios_redirect'),
    
    # Lista de Relatórios Disponíveis (HTML standalone)
    path('relatorios-disponiveis/', lista_relatorios, name='lista_relatorios'),

    # Frontend React - deve ser o último
    re_path(r'^(?P<path>.*)$', serve_frontend, name='frontend'),
]
