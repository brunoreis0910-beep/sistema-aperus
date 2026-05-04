import os, sys
sys.path.insert(0, r'C:\APERUS\SistemaAperus')
os.environ['DJANGO_SETTINGS_MODULE'] = 'projeto_gerencial.settings'
import django; django.setup()

from api.models import Venda
from lxml import etree
import hashlib, base64, re

v32 = Venda.objects.get(numero_nfe=32)
v33 = Venda.objects.get(numero_nfe=33)
parser = etree.XMLParser(remove_blank_text=False)

# Extrai o NFe de dentro do nfeProc (32)
r32 = etree.fromstring(v32.xml_nfe.encode('utf-8'), parser)
nfe32 = r32.find('{http://www.portalfiscal.inf.br/nfe}NFe')
inf32 = nfe32.find('{http://www.portalfiscal.inf.br/nfe}infNFe')

# infNFe do 33 direto
r33 = etree.fromstring(v33.xml_nfe.encode('utf-8'), parser)
inf33 = r33.find('{http://www.portalfiscal.inf.br/nfe}infNFe')

# Compara namespace dos filhos
print('=== Namespaces filhos do infNFe 32 (primeiro nível) ===')
for child in inf32:
    print(f'  tag={child.tag}, nsmap keys={list(child.nsmap.keys())[:3]}')
    break  # só o primeiro (ide)

print()
print('=== Namespaces filhos do infNFe 33 (primeiro nível) ===')
for child in inf33:
    print(f'  tag={child.tag}, nsmap keys={list(child.nsmap.keys())[:3]}')
    break

# C14N do infNFe 33 (standalone)
c14n33 = etree.tostring(inf33, method='c14n')
print()
print('C14N infNFe 33 (primeiros 250 chars):')
print(c14n33[:250].decode())

# Verifica netos do infNFe 33
print()
print('=== Primeiros elementos do ide em 33 (nsmap) ===')
ide33 = inf33.find('{http://www.portalfiscal.inf.br/nfe}ide')
if ide33 is None:
    ide33 = inf33.find('ide')
    print('  (encontrado sem namespace!)', ide33)
else:
    print('  ide namespace:', ide33.tag)
    for child in ide33:
        print(f'  child: tag={child.tag}')
        break

# Verifica raw XML do início do 33
print()
print('=== Primeiros 500 chars do xml_nfe 33 ===')
print(v33.xml_nfe[:500])
