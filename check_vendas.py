import os, sys
sys.path.insert(0, r'C:\APERUS\SistemaAperus')
os.environ['DJANGO_SETTINGS_MODULE'] = 'projeto_gerencial.settings'
import django; django.setup()

from api.models import Venda

# Busca vendas 490-500
for id in range(490, 500):
    try:
        v = Venda.objects.get(pk=id)
        print(f'id={v.pk}, numero_nfe={v.numero_nfe}, status={v.status_nfe}, mensagem={str(v.mensagem_nfe)[:40] if v.mensagem_nfe else "-"}')
    except:
        print(f'id={id}: NÃO EXISTE')
