"""
Sistema de Permissões Customizadas
Fornece classes de permissão reutilizáveis para controle de acesso granular
"""

from rest_framework import permissions
from functools import wraps
from django.http import JsonResponse
from django.utils import timezone
from .models import UserPermissoes
import logging

logger = logging.getLogger(__name__)


# =====================================================
# CLASSES DE PERMISSÃO CUSTOMIZADAS
# =====================================================

class HasPermission(permissions.BasePermission):
    """
    Permissão genérica que verifica se o usuário tem uma permissão específica.
    
    Uso:
        permission_classes = [HasPermission]
        permission_required = 'produtos_acessar'
    """
    
    def has_permission(self, request, view):
        # Superusuários sempre têm acesso
        if request.user.is_superuser:
            return True
        
        # Pega o nome da permissão do atributo da view
        required_permission = getattr(view, 'permission_required', None)
        
        if not required_permission:
            # Se não especificou permissão, só verifica autenticação
            return request.user.is_authenticated
        
        # Verifica se o usuário tem a permissão
        return check_user_permission(request.user, required_permission)


class HasAnyPermission(permissions.BasePermission):
    """
    Verifica se o usuário tem QUALQUER UMA das permissões listadas.
    
    Uso:
        permission_classes = [HasAnyPermission]
        permissions_required = ['produtos_acessar', 'produtos_editar']
    """
    
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        
        required_permissions = getattr(view, 'permissions_required', [])
        
        if not required_permissions:
            return request.user.is_authenticated
        
        # Verifica se tem QUALQUER uma das permissões
        return any(
            check_user_permission(request.user, perm)
            for perm in required_permissions
        )


class HasAllPermissions(permissions.BasePermission):
    """
    Verifica se o usuário tem TODAS as permissões listadas.
    
    Uso:
        permission_classes = [HasAllPermissions]
        permissions_required = ['produtos_acessar', 'produtos_editar']
    """
    
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        
        required_permissions = getattr(view, 'permissions_required', [])
        
        if not required_permissions:
            return request.user.is_authenticated
        
        # Verifica se tem TODAS as permissões
        return all(
            check_user_permission(request.user, perm)
            for perm in required_permissions
        )


class IsStaffOrHasPermission(permissions.BasePermission):
    """
    Permite acesso se o usuário for staff OU tiver a permissão específica.
    
    Uso:
        permission_classes = [IsStaffOrHasPermission]
        permission_required = 'config_acessar'
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Staff sempre tem acesso
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        required_permission = getattr(view, 'permission_required', None)
        
        if not required_permission:
            return False
        
        return check_user_permission(request.user, required_permission)


class CanCreateOrReadOnly(permissions.BasePermission):
    """
    Permite leitura para todos autenticados, mas criação apenas com permissão.
    
    Uso:
        permission_classes = [CanCreateOrReadOnly]
        permission_required = 'vendas_criar'
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Métodos de leitura sempre permitidos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Para criação, verifica permissão
        if request.method == 'POST':
            required_permission = getattr(view, 'permission_required', None)
            if required_permission:
                return (
                    request.user.is_superuser or 
                    check_user_permission(request.user, required_permission)
                )
        
        return False


class CanEditOrReadOnly(permissions.BasePermission):
    """
    Permite leitura para todos autenticados, mas edição apenas com permissão.
    
    Uso:
        permission_classes = [CanEditOrReadOnly]
        permission_required = 'vendas_editar'
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Métodos de leitura sempre permitidos
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Para edição/exclusão, verifica permissão
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            required_permission = getattr(view, 'permission_required', None)
            if required_permission:
                return (
                    request.user.is_superuser or 
                    check_user_permission(request.user, required_permission)
                )
        
        return False


# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

def check_user_permission(user, permission_name):
    """
    Verifica se um usuário tem uma permissão específica.
    
    Args:
        user: Objeto User do Django
        permission_name: String com o nome da permissão (ex: 'produtos_acessar')
    
    Returns:
        bool: True se o usuário tem a permissão, False caso contrário
    """
    if not user.is_authenticated:
        return False
    
    # Superusuários sempre têm todas as permissões
    if user.is_superuser:
        return True
    
    try:
        perms = UserPermissoes.objects.get(id_user=user)
        # Verifica se o atributo existe e se é True (ou 1)
        return bool(getattr(perms, permission_name, False))
    except UserPermissoes.DoesNotExist:
        return False
    except AttributeError:
        logger.warning(f"Permissão '{permission_name}' não existe no modelo UserPermissoes")
        return False


def get_user_permissions_dict(user):
    """
    Retorna um dicionário com todas as permissões do usuário.
    
    Args:
        user: Objeto User do Django
    
    Returns:
        dict: Dicionário com todas as permissões (nome: bool)
    """
    if user.is_superuser:
        # Retorna todas as permissões como True
        return {
            field.name: True
            for field in UserPermissoes._meta.get_fields()
            if field.name not in ['id', 'id_user', 'id_permissao']
        }
    
    try:
        perms = UserPermissoes.objects.get(id_user=user)
        return {
            field.name: bool(getattr(perms, field.name))
            for field in UserPermissoes._meta.get_fields()
            if field.name not in ['id', 'id_user', 'id_permissao']
        }
    except UserPermissoes.DoesNotExist:
        return {
            field.name: False
            for field in UserPermissoes._meta.get_fields()
            if field.name not in ['id', 'id_user', 'id_permissao']
        }


# =====================================================
# DECORADORES PARA VIEWS E FUNÇÕES
# =====================================================

def require_permission(permission_name, allow_staff=True):
    """
    Decorator para funções que exigem uma permissão específica.
    
    Uso:
        @require_permission('produtos_editar')
        def minha_funcao(request):
            ...
    
    Args:
        permission_name: Nome da permissão requerida
        allow_staff: Se True, permite acesso para staff mesmo sem a permissão
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Autenticação necessária'}, status=401)
            
            # Verifica permissão
            has_permission = (
                request.user.is_superuser or
                (allow_staff and request.user.is_staff) or
                check_user_permission(request.user, permission_name)
            )
            
            if not has_permission:
                logger.warning(
                    f"Acesso negado: {request.user.username} tentou acessar "
                    f"{request.path} sem permissão '{permission_name}'"
                )
                return JsonResponse({
                    'error': 'Sem permissão',
                    'detail': f'Você não tem permissão para: {permission_name}'
                }, status=403)
            
            # Log de acesso autorizado
            logger.info(
                f"Acesso autorizado: {request.user.username} acessou "
                f"{request.path} com permissão '{permission_name}'"
            )
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(*permission_names, allow_staff=True):
    """
    Decorator que exige QUALQUER UMA das permissões listadas.
    
    Uso:
        @require_any_permission('produtos_acessar', 'produtos_criar')
        def minha_funcao(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Autenticação necessária'}, status=401)
            
            # Verifica se tem alguma das permissões
            has_any = (
                request.user.is_superuser or
                (allow_staff and request.user.is_staff) or
                any(check_user_permission(request.user, perm) for perm in permission_names)
            )
            
            if not has_any:
                logger.warning(
                    f"Acesso negado: {request.user.username} tentou acessar "
                    f"{request.path} sem nenhuma das permissões: {', '.join(permission_names)}"
                )
                return JsonResponse({
                    'error': 'Sem permissão',
                    'detail': f'Você precisa de uma dessas permissões: {", ".join(permission_names)}'
                }, status=403)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator


def log_access(action_description=""):
    """
    Decorator para logar acessos a funções/endpoints.
    
    Uso:
        @log_access("Visualização de relatório financeiro")
        def minha_funcao(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            username = request.user.username if request.user.is_authenticated else "Anônimo"
            logger.info(
                f"ACESSO: {username} | {action_description} | "
                f"Rota: {request.path} | Método: {request.method} | "
                f"IP: {request.META.get('REMOTE_ADDR')} | "
                f"Timestamp: {timezone.now()}"
            )
            return func(request, *args, **kwargs)
        return wrapper
    return decorator
