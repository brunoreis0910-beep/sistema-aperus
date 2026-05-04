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

# Extrai infNFe de 32 (está dentro de nfeProc > NFe)
r32 = etree.fromstring(v32.xml_nfe.encode('utf-8'), parser)
nfe32 = r32.find('{http://www.portalfiscal.inf.br/nfe}NFe')
inf32 = nfe32.find('{http://www.portalfiscal.inf.br/nfe}infNFe')

# C14N standalone do 32
c14n32 = etree.tostring(inf32, method='c14n')
print('=== C14N infNFe 32 (standalone) primeiros 350 chars ===')
print(c14n32[:350].decode())
print()

# C14N standalone do 33
r33 = etree.fromstring(v33.xml_nfe.encode('utf-8'), parser)
inf33 = r33.find('{http://www.portalfiscal.inf.br/nfe}infNFe')
c14n33 = etree.tostring(inf33, method='c14n')
print('=== C14N infNFe 33 (standalone) primeiros 350 chars ===')
print(c14n33[:350].decode())
print()

# C14N com SOAP context para os dois
SOAP_NS = {
    'soap12': 'http://www.w3.org/2003/05/soap-envelope',
    'xsd':    'http://www.w3.org/2001/XMLSchema',
    'xsi':    'http://www.w3.org/2001/XMLSchema-instance',
}
soap_ns_str = ''.join(f' xmlns:{p}="{u}"' for p, u in SOAP_NS.items())

def c14n_soap(xml_str):
    clean = xml_str.split('?>', 1)[1].strip() if '?>' in xml_str else xml_str
    # Encontra root tag e injeta SOAP ns
    first_gt = clean.index('>')
    xml_soap = clean[:first_gt] + soap_ns_str + clean[first_gt:]
    r = etree.fromstring(xml_soap.encode('utf-8'), parser)
    inf = r.xpath('//*[local-name()="infNFe"]')[0]
    return etree.tostring(inf, method='c14n')

# Para o 32, extrair o NFe do nfeProc primeiro
nfe32_xml = etree.tostring(nfe32, encoding='unicode')
c14n32_soap = c14n_soap(nfe32_xml)
print('=== C14N infNFe 32 (SOAP context) primeiros 350 chars ===')
print(c14n32_soap[:350].decode())
print()

c14n33_soap = c14n_soap(v33.xml_nfe)
print('=== C14N infNFe 33 (SOAP context) primeiros 350 chars ===')
print(c14n33_soap[:350].decode())
print()

# Verifica se na C14N de 32 há xmlns=""
has_empty_ns_32 = b'xmlns=""' in c14n32
has_empty_ns_33 = b'xmlns=""' in c14n33
has_empty_ns_32_soap = b'xmlns=""' in c14n32_soap
has_empty_ns_33_soap = b'xmlns=""' in c14n33_soap
print('32 standalone tem xmlns=""?', has_empty_ns_32)
print('33 standalone tem xmlns=""?', has_empty_ns_33)
print('32 SOAP tem xmlns=""?', has_empty_ns_32_soap)
print('33 SOAP tem xmlns=""?', has_empty_ns_33_soap)

# Calcula DigestValues para comparação
dv32 = re.search(r'<DigestValue>([^<]+)</DigestValue>', v32.xml_nfe)
dv33 = re.search(r'<DigestValue>([^<]+)</DigestValue>', v33.xml_nfe)
print()
print('32 DigestValue no XML:   ', dv32.group(1).strip() if dv32 else 'N/A')
print('32 DigestValue standalone:', base64.b64encode(hashlib.sha1(c14n32).digest()).decode())
print('32 DigestValue SOAP:     ', base64.b64encode(hashlib.sha1(c14n32_soap).digest()).decode())
print()
print('33 DigestValue no XML:   ', dv33.group(1).strip() if dv33 else 'N/A')
print('33 DigestValue standalone:', base64.b64encode(hashlib.sha1(c14n33).digest()).decode())
print('33 DigestValue SOAP:     ', base64.b64encode(hashlib.sha1(c14n33_soap).digest()).decode())
