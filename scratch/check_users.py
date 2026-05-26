import os
import sys
import django

sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserPermissoes

print("=== Users in Database ===")
for user in User.objects.all():
    print(f"Username: {user.username}")
    print(f"Is Superuser: {user.is_superuser}")
    print(f"Is Active: {user.is_active}")
    print(f"Is Staff: {user.is_staff}")
    
    # Try to check if they have UserPermissoes
    try:
        perms = UserPermissoes.objects.get(id_user_id=user.id)
        print(f"Permissions - config_acessar: {perms.config_acessar}")
    except UserPermissoes.DoesNotExist:
        print("Permissions: No custom permissions row found.")
    print("-" * 30)
