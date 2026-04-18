"""
Sistema de Auditoria de Acesso
Registra tentativas de acesso e ações realizadas por usuários
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.http import JsonResponse
from functools import wraps
import json
import logging

logger = logging.getLogger(__name__)


# =====================================================
# MODELO DE LOG DE AUDITORIA
# =====================================================

class AcessoLog(models.Model):
    """
    Modelo para registrar acessos e ações dos usuários
    """
    STATUS_CHOICES = [
        ('sucesso', 'Sucesso'),
        ('negado', 'Negado'),
        ('erro', 'Erro'),
    ]
    
    ACTION_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('acesso', 'Acesso a Página/Endpoint'),
        ('criar', 'Criar Registro'),
        ('editar', 'Editar Registro'),
        ('excluir', 'Excluir Registro'),
        ('visualizar', 'Visualizar Registro'),
        ('exportar', 'Exportar Dados'),
        ('importar', 'Importar Dados'),
        ('permissao', 'Verificação de Permissão'),
        ('outro', 'Outro'),
    ]
    
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='acessos_log'
    )
    username = models.CharField(max_length=150, blank=True)  # Backup caso usuário seja deletado
    tipo_acao = models.CharField(max_length=20, choices=ACTION_TYPES, default='acesso')
    descricao = models.CharField(max_length=500)
    rota = models.CharField(max_length=500, blank=True)
    metodo_http = models.CharField(max_length=10, blank=True)  # GET, POST, PUT, DELETE, etc
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sucesso')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    permissao_verificada = models.CharField(max_length=100, blank=True)
    dados_adicionais = models.TextField(blank=True)  # JSON com dados extras
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    tempo_resposta_ms = models.IntegerField(null=True, blank=True)  # Tempo de resposta em ms
    
    class Meta:
        db_table = 'acesso_log'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['usuario', '-timestamp']),
            models.Index(fields=['status', '-timestamp']),
            models.Index(fields=['tipo_acao', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.username} - {self.tipo_acao} - {self.timestamp}"
    
    @classmethod
    def log_acesso(cls, request, tipo_acao='acesso', descricao='', status='sucesso', 
                   permissao=None, dados_extras=None):
        """
        Método auxiliar para criar um log de acesso
        """
        try:
            username = request.user.username if request.user.is_authenticated else 'Anônimo'
            
            log_entry = cls.objects.create(
                usuario=request.user if request.user.is_authenticated else None,
                username=username,
                tipo_acao=tipo_acao,
                descricao=descricao,
                rota=request.path,
                metodo_http=request.method,
                status=status,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                permissao_verificada=permissao or '',
                dados_adicionais=json.dumps(dados_extras) if dados_extras else ''
            )
            
            return log_entry
        except Exception as e:
            logger.error(f"Erro ao criar log de acesso: {e}")
            return None


# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

def get_client_ip(request):
    """
    Obtém o IP real do cliente, considerando proxies
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_acesso_negado(request, permissao, motivo=''):
    """
    Registra tentativa de acesso negado
    """
    descricao = f"Acesso negado: {motivo}" if motivo else "Acesso negado"
    AcessoLog.log_acesso(
        request=request,
        tipo_acao='permissao',
        descricao=descricao,
        status='negado',
        permissao=permissao
    )
    logger.warning(
        f"ACESSO NEGADO: {request.user.username if request.user.is_authenticated else 'Anônimo'} "
        f"tentou acessar {request.path} sem permissão '{permissao}'"
    )


def log_acesso_sucesso(request, tipo_acao='acesso', descricao='', permissao=None, dados_extras=None):
    """
    Registra acesso bem-sucedido
    """
    AcessoLog.log_acesso(
        request=request,
        tipo_acao=tipo_acao,
        descricao=descricao,
        status='sucesso',
        permissao=permissao,
        dados_extras=dados_extras
    )


def log_erro(request, tipo_acao='acesso', descricao='', erro=None):
    """
    Registra erro durante operação
    """
    dados_extra = {'erro': str(erro)} if erro else None
    AcessoLog.log_acesso(
        request=request,
        tipo_acao=tipo_acao,
        descricao=descricao,
        status='erro',
        dados_extras=dados_extra
    )


# =====================================================
# DECORADORES COM AUDITORIA
# =====================================================

def audit_access(tipo_acao='acesso', descricao_base=''):
    """
    Decorator que audita acessos a views/funções
    
    Uso:
        @audit_access(tipo_acao='visualizar', descricao_base='Visualização de relatório')
        def minha_view(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            import time
            start_time = time.time()
            
            descricao = descricao_base or f"Acesso a {func.__name__}"
            
            try:
                # Executa a função
                result = func(request, *args, **kwargs)
                
                # Calcula tempo de resposta
                tempo_resposta = int((time.time() - start_time) * 1000)
                
                # Log de sucesso
                log_entry = AcessoLog.log_acesso(
                    request=request,
                    tipo_acao=tipo_acao,
                    descricao=descricao,
                    status='sucesso'
                )
                
                if log_entry:
                    log_entry.tempo_resposta_ms = tempo_resposta
                    log_entry.save(update_fields=['tempo_resposta_ms'])
                
                return result
                
            except Exception as e:
                # Log de erro
                log_erro(request, tipo_acao=tipo_acao, descricao=descricao, erro=e)
                raise
        
        return wrapper
    return decorator


def audit_data_change(tipo_acao='editar', modelo_nome=''):
    """
    Decorator específico para operações que modificam dados
    Registra informações sobre o registro modificado
    
    Uso:
        @audit_data_change(tipo_acao='editar', modelo_nome='Produto')
        def editar_produto(request, produto_id):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Captura IDs dos argumentos
            registro_id = None
            for arg in args:
                if isinstance(arg, int):
                    registro_id = arg
                    break
            
            if not registro_id:
                registro_id = kwargs.get('pk') or kwargs.get('id')
            
            descricao = f"{tipo_acao.title()} {modelo_nome}"
            if registro_id:
                descricao += f" #{registro_id}"
            
            dados_extras = {
                'modelo': modelo_nome,
                'registro_id': registro_id,
                'dados_request': {
                    key: value for key, value in request.POST.items()
                    if key not in ['password', 'senha', 'token']  # Evita logar senhas
                }
            }
            
            try:
                result = func(request, *args, **kwargs)
                
                log_acesso_sucesso(
                    request=request,
                    tipo_acao=tipo_acao,
                    descricao=descricao,
                    dados_extras=dados_extras
                )
                
                return result
                
            except Exception as e:
                log_erro(request, tipo_acao=tipo_acao, descricao=descricao, erro=e)
                raise
        
        return wrapper
    return decorator


# =====================================================
# MIDDLEWARE DE AUDITORIA
# =====================================================

class AuditoriaMiddleware:
    """
    Middleware que audita todas as requisições
    Útil para ter um log centralizado de todos os acessos
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        import time
        start_time = time.time()
        
        # Processa a requisição
        response = self.get_response(request)
        
        # Calcula tempo de resposta
        tempo_resposta = int((time.time() - start_time) * 1000)
        
        # Determina status
        if response.status_code >= 400:
            status = 'erro' if response.status_code >= 500 else 'negado'
        else:
            status = 'sucesso'
        
        # Log apenas se for uma rota da API (para não poluir o log)
        if request.path.startswith('/api/'):
            try:
                log_entry = AcessoLog.log_acesso(
                    request=request,
                    tipo_acao='acesso',
                    descricao=f"Acesso a {request.path}",
                    status=status
                )
                
                if log_entry:
                    log_entry.tempo_resposta_ms = tempo_resposta
                    log_entry.save(update_fields=['tempo_resposta_ms'])
            except:
                pass  # Não deixa um erro de auditoria quebrar a aplicação
        
        return response
