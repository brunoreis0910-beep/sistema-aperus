from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'layouts', views.LayoutEtiquetaViewSet)
router.register(r'impressoes', views.ImpressaoEtiquetaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
