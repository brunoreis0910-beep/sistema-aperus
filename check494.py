import os, sys
sys.path.insert(0, r'C:\APERUS\SistemaAperus')
os.environ['DJANGO_SETTINGS_MODULE'] = 'projeto_gerencial.settings'
import django; django.setup()

from api.models import Venda

# Busca todas as vendas com numero_nfe=33 ou xml com nNF>32
v33 = Venda.objects.filter(numero_nfe=33)
print('=== Vendas com numero_nfe=33 ===')
for v in v33:
    print(f'  id={v.id_venda}, status={v.status_nfe}, mensagem={v.mensagem_nfe[:50] if v.mensagem_nfe else ""}')
    import re
    if v.xml_nfe:
        dhEmi = re.search(r'<dhEmi>([^<]+)</dhEmi>', v.xml_nfe)
        chave = re.search(r'Id="(NFe[^"]+)"', v.xml_nfe)
        print(f'      dhEmi={dhEmi.group(1) if dhEmi else "N/A"}, chave={chave.group(1)[-8:] if chave else "N/A"}')

# Busca venda 494
v494 = Venda.objects.get(id_venda=494)
print()
print(f'=== Venda 494 ===')
print(f'  numero_nfe={v494.numero_nfe}, status={v494.status_nfe}, mensagem={v494.mensagem_nfe}')
if v494.xml_nfe:
    import re
    dhEmi = re.search(r'<dhEmi>([^<]+)</dhEmi>', v494.xml_nfe)
    chave = re.search(r'Id="(NFe[^"]+)"', v494.xml_nfe)
    dv = re.search(r'<DigestValue>([^<]+)</DigestValue>', v494.xml_nfe)
    print(f'  dhEmi={dhEmi.group(1) if dhEmi else "N/A"}')
    print(f'  chave={chave.group(1) if chave else "N/A"}')
    print(f'  DigestValue={dv.group(1).strip() if dv else "N/A"}')
