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

# Estrutura do XML 32
r32 = etree.fromstring(v32.xml_nfe.encode('utf-8'), parser)
print('=== NFC-e 32 (EMITIDA - id_venda=%d) ===' % v32.id_venda)
print('Root tag:', r32.tag.split('}')[-1])
print('Children:', [c.tag.split('}')[-1] for c in r32])

# Estrutura do XML 33
r33 = etree.fromstring(v33.xml_nfe.encode('utf-8'), parser)
print()
print('=== NFC-e 33 (ERRO - id_venda=%d) ===' % v33.id_venda)
print('Root tag:', r33.tag.split('}')[-1])
print('Children:', [c.tag.split('}')[-1] for c in r33])

# DigestValues gravados nos XMLs
dv32 = re.search(r'<DigestValue>([^<]+)</DigestValue>', v32.xml_nfe)
dv33 = re.search(r'<DigestValue>([^<]+)</DigestValue>', v33.xml_nfe)
print()
print('DigestValue no XML 32:', dv32.group(1).strip() if dv32 else 'N/A')
print('DigestValue no XML 33:', dv33.group(1).strip() if dv33 else 'N/A')

# Calcula o DigestValue correto (contexto SOAP) para cada um
SOAP_NS = {
    'soap12': 'http://www.w3.org/2003/05/soap-envelope',
    'xsd':    'http://www.w3.org/2001/XMLSchema',
    'xsi':    'http://www.w3.org/2001/XMLSchema-instance',
}

def digest_soap(xml_str):
    clean = xml_str.split('?>', 1)[1].strip() if '?>' in xml_str else xml_str
    soap_ns_str = ''.join(f' xmlns:{p}="{u}"' for p, u in SOAP_NS.items())
    first_gt = clean.index('>')
    xml_soap = clean[:first_gt] + soap_ns_str + clean[first_gt:]
    r = etree.fromstring(xml_soap.encode('utf-8'), parser)
    inf = r.xpath('//*[local-name()="infNFe"]')[0]
    c14n = etree.tostring(inf, method='c14n')
    return base64.b64encode(hashlib.sha1(c14n).digest()).decode()

dv32_soap = digest_soap(v32.xml_nfe)
dv33_soap = digest_soap(v33.xml_nfe)
print()
print('DigestValue SOAP correto para 32:', dv32_soap)
print('DigestValue SOAP correto para 33:', dv33_soap)
print()
print('32 - DigestValue gravado == SOAP?', (dv32.group(1).strip() if dv32 else '') == dv32_soap)
print('33 - DigestValue gravado == SOAP?', (dv33.group(1).strip() if dv33 else '') == dv33_soap)
print()
print('CONCLUSAO:')
print('  NFC-e 32 foi assinada com SOAP context?', (dv32.group(1).strip() if dv32 else '') == dv32_soap)
print('  NFC-e 33 foi assinada com SOAP context?', (dv33.group(1).strip() if dv33 else '') == dv33_soap)
