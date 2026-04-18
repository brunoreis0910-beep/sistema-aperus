from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import MDFeViewSet

router = DefaultRouter()
router.register(r'', MDFeViewSet, basename='mdfe')

urlpatterns = [
    path('', include(router.urls)),
]
