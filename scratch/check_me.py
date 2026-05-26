import os, sys, django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.contrib.auth.models import User
from api.serializers import UserSerializer

user = User.objects.filter(username='ADMIN').first()
serializer = UserSerializer(user)
print(serializer.data)
