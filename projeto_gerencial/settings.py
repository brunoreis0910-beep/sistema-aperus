# Em: C:\Projetos\SistemaGerencial\projeto_gerencial\settings.py

import sys
import os
from pathlib import Path
from datetime import timedelta # Para o JWT
from corsheaders.defaults import default_headers
from decouple import config, Csv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# Agora carregado do arquivo .env
SECRET_KEY = config('SECRET_KEY', default='django-insecure-CHANGE-THIS-IN-PRODUCTION')

# Chave da API do Google Gemini para IA
GEMINI_API_KEY = config('GEMINI_API_KEY', default='')

# --- CORREÇÃO DO DEBUG ---
# DEBUG agora é configurável via .env (True para desenvolvimento, False para produção)
DEBUG = config('DEBUG', default=True, cast=bool)

# Permite acesso de localhost e rede local (192.168.x.x, 10.x.x.x)
# Agora configurável via .env
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,testserver', cast=Csv())

# Adiciona IPs específicos da rede local para garantir acesso
# O '*' permite qualquer domínio (incluindo aperus.com.br via túnel Cloudflare)
ALLOWED_HOSTS += ['192.168.1.8', '192.168.1.6', '10.0.6.186', '*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Nossos Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders', # <-- App de CORS
    'django_filters', # <-- Filtros para API
    'api.apps.ApiConfig',
    'comandas.apps.ComandasConfig',
    'etiquetas.apps.EtiquetasConfig',
    'cadastro_clientes.apps.CadastroClientesConfig',
    'cte.apps.CteConfig',
    'mdfe.apps.MdfeConfig',  # MDF-e
    # 'calculadora_fiscal.apps.CalculadoraFiscalConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS deve ser o PRIMEIRO
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # <-- WhiteNoise para arquivos estáticos
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    
    # DEBUG MIDDLEWARE (movido para depois do CORS para não interferir)
    'api.middleware_debug.DebugMiddleware',
    
    # Middleware to support X-HTTP-Method-Override header from frontend
    'api.middleware_method_override.XHTTPMethodOverrideMiddleware',
    
    # CSRF desabilitado - API usa JWT para autenticação/autorização
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Middleware de Auditoria (deve vir após autenticação)
    'api.middleware_auditoria.AuditoriaMiddleware',
]

# Usa o nome correto do seu projeto
ROOT_URLCONF = 'projeto_gerencial.urls' 

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'api' / 'templates',
            BASE_DIR / 'api' / 'templates' / 'api',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Usa o nome correto do seu projeto
WSGI_APPLICATION = 'projeto_gerencial.wsgi.application' 


# --- 1. CONFIGURAÇÃO DO BANCO DE DADOS ---
# Agora carregado do arquivo .env para maior segurança

if config('USE_SQLITE', default=False, cast=bool):
    # SQLite para executável
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # MySQL para desenvolvimento - credenciais no .env
    DATABASES = {
        'default': {
            'ENGINE': config('DB_ENGINE', default='django.db.backends.mysql'),
            'NAME': config('DB_NAME', default='sistema_gerencial'),
            'USER': config('DB_USER', default='root'),
            
            # --- SENHA AGORA NO .env ---
            'PASSWORD': config('DB_PASSWORD', default=''), 
            
            'HOST': config('DB_HOST', default='127.0.0.1'),
            'PORT': config('DB_PORT', default='3306'),
            'CONN_MAX_AGE': 60,  # Reutiliza conexões por 60s (evita overhead de conexão/request)
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }

# --- 2. CONFIGURAÇÃO DE AUTENTICAÇÃO (JWT) ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Permissões definidas individualmente em cada view
    # Fallback global: exige autenticação em qualquer ViewSet sem permission_classes explícito
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    
    # Desabilita CSRF para todas as views da API (JWT já fornece proteção)
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    
    # Configurações para filtros e paginação (Sistema de Cadastro)
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8), # Duração do token: 8 horas
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),    # Duração do refresh token: 7 dias
}

# --- 3. CONFIGURAÇÃO DO CORS (CORRIGIDO E CONSOLIDADO) ---
# SEGURANÇA: Em produção, especifique origens permitidas no .env
# Em desenvolvimento, permite todas as origens

# 🔥 TEMPORÁRIO: Permite TODAS as origens para depuração do APK
# TODO: Remover após confirmar que o app funciona
CORS_ALLOW_ALL_ORIGINS = True
CORS_ORIGIN_ALLOW_ALL = True

# Configuração via .env (sobrescreve em produção)
CORS_ALLOWED_ORIGINS_STR = config('CORS_ALLOWED_ORIGINS', default='')

# Lista explícita de origens permitidas (backup + app mobile)
CORS_ALLOWED_ORIGINS = [
    # Web browser (desenvolvimento)
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    
    # Capacitor app (Android/iOS)
    "https://localhost",  # ← Capacitor serve via HTTPS localhost
    "http://localhost",   # ← Fallback HTTP
    "capacitor://localhost",  # ← Capacitor custom scheme
    "ionic://localhost",      # ← Ionic custom scheme
    
    # Domínio de produção
    "https://sistema.aperus.com.br",
    "http://sistema.aperus.com.br",
]

# Permite envio de cookies e credenciais
CORS_ALLOW_CREDENTIALS = True

# Regex para permitir qualquer porta localhost/127.0.0.1 em desenvolvimento (como backup)
if DEBUG:
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^http://localhost:\d+$",
        r"^http://127\.0\.0\.1:\d+$",
        r"^http://192\.168\.\d+\.\d+:\d+$",  # Rede local
        r"^http://10\.\d+\.\d+\.\d+:\d+$",   # Rede local
    ]

# Headers permitidos (consolidado)
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-http-method-override",
    "content-disposition",
    "accept-encoding",
    "content-type",
    "accept",
    "origin",
    "authorization",
]

# Métodos HTTP permitidos (consolidado)
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# Permite que o navegador acesse headers customizados na resposta
CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken', 'Content-Disposition']

# Cache do preflight request (1 hora)
CORS_PREFLIGHT_MAX_AGE = 3600

# Origens confiáveis para CSRF
if DEBUG:
    CSRF_TRUSTED_ORIGINS = [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ]
else:
    CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='', cast=Csv())

# Desabilitar CSRF para endpoints da API (JWT já fornece proteção)
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_USE_SESSIONS = False


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Sao_Paulo'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Diretórios adicionais de arquivos estáticos
_frontend_assets_dist = BASE_DIR / 'frontend' / 'dist'
_frontend_assets = BASE_DIR / 'frontend' / 'assets'
STATICFILES_DIRS = [p for p in [_frontend_assets_dist, _frontend_assets] if p.exists()]

# Configuração do WhiteNoise para servir arquivos estáticos
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'debug_cte_backend.log',
            'formatter': 'verbose',
            'encoding': 'utf-8',  # ✅ FIX: Suporte a emojis no Windows
        },
    },
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

