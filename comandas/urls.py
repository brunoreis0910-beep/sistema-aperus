from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MesaViewSet, ComandaViewSet, ItemComandaViewSet, TransferenciaMesaViewSet
from .backup_views import backup_manager, backup_info, backup_delete, backup_restore, backup_download, backup_scheduler_control, backup_now

router = DefaultRouter()
router.register(r'mesas', MesaViewSet, basename='mesa')
router.register(r'comandas', ComandaViewSet, basename='comanda')
router.register(r'itens-comanda', ItemComandaViewSet, basename='item-comanda')
router.register(r'transferencias', TransferenciaMesaViewSet, basename='transferencia')

urlpatterns = [
    path('', include(router.urls)),
    path('backups/', backup_manager, name='backup-manager'),
    path('backups/info/', backup_info, name='backup-info'),
    path('backups/scheduler/control/', backup_scheduler_control, name='backup-scheduler'),
    path('backups/scheduler/now/', backup_now, name='backup-now'),
    path('backups/<str:filename>/download/', backup_download, name='backup-download'),
    path('backups/<str:filename>/restore/', backup_restore, name='backup-restore'),
    path('backups/<str:filename>/', backup_delete, name='backup-delete'),
]
