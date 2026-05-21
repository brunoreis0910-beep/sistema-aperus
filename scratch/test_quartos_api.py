import os
import sys
sys.path.append('C:\\Projetos\\SistemaGerencial\\1_Sistema_Gerencial_Backend')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
import django
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
import json

c = APIClient()
user = User.objects.first()
c.force_authenticate(user=user)

res = c.get('/api/hotel/quartos/')
print(json.dumps(res.data, indent=2))
