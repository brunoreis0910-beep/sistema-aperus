# Settings para executavel - sem collectstatic
from projeto_gerencial.settings import *

# Remove staticfiles para evitar erro de STATIC_ROOT
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'django.contrib.staticfiles']
STATIC_ROOT = None

print("Settings do executavel carregado sem staticfiles")
