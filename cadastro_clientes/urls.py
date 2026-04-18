from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, EscritorioContabilidadeViewSet

# Configura o router para as URLs da API
router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'escritorios', EscritorioContabilidadeViewSet, basename='escritorio')

app_name = 'cadastro_clientes'

urlpatterns = [
    path('api/', include(router.urls)),
]
