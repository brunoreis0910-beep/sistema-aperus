import os
import sys
import django
from django.conf import settings

sys.path.append(os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

import copy
settings.DATABASES['sistema_gerencial_db'] = copy.deepcopy(settings.DATABASES['default'])
settings.DATABASES['sistema_gerencial_db']['NAME'] = 'sistema_gerencial'

from django.db import connections

try:
    with connections['sistema_gerencial_db'].cursor() as cursor:
        cursor.execute("SELECT id_empresa, nome_razao_social, cpf_cnpj FROM empresa_config")
        for row in cursor.fetchall():
            print(f"Company ID: {row[0]}")
            print(f"Razão Social: {row[1]}")
            print(f"CPF/CNPJ: {row[2]}")
            print("-" * 30)
except Exception as e:
    print("Error querying company:", e)
