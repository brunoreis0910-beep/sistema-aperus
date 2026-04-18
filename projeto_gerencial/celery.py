from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Define o módulo de settings padrão do Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')

app = Celery('projeto_gerencial')

# Lê as configurações do Django (CELERY_*)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Descobre tarefas nos apps instalados (api/tasks.py, etc)
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
