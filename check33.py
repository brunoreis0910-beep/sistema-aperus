import os, sys
sys.path.insert(0, r'C:\APERUS\SistemaAperus')
os.environ['DJANGO_SETTINGS_MODULE'] = 'projeto_gerencial.settings'
import django; django.setup()

from api.models import Venda
from lxml import etree
import hashlib, base64, re

v33 = Venda.objects.get(numero_nfe=33)
print('=== Venda 33 (id=%d) ===' % v33.id_venda)
print('status_nfe:', v33.status_nfe)
print('mensagem_nfe:', v33.mensagem_nfe)
print('campos:', [f.name for f in v33._meta.fields if 'data' in f.name.lower() or 'hora' in f.name.lower()])

parser = etree.XMLParser(remove_blank_text=False)

# Verifica todas as assinaturas no XML 33
xml = v33.xml_nfe
r33 = etree.fromstring(xml.encode('utf-8'), parser)
sig = r33.find('.//{http://www.w3.org/2000/09/xmldsig#}Signature')
if sig is not None:
    si = sig.find('{http://www.w3.org/2000/09/xmldsig#}SignedInfo')
    dv = sig.find('.//{http://www.w3.org/2000/09/xmldsig#}DigestValue')
    sv = sig.find('{http://www.w3.org/2000/09/xmldsig#}SignatureValue')
    print()
    print('DigestValue:', dv.text.strip() if dv is not None else 'N/A')
    print('SignatureValue (50 chars):', sv.text[:50].strip() if sv is not None else 'N/A')

# Verifica se o SignedInfo C14N no contexto standalone é correto
SOAP_NS = {
    'soap12': 'http://www.w3.org/2003/05/soap-envelope',
    'xsd':    'http://www.w3.org/2001/XMLSchema',
    'xsi':    'http://www.w3.org/2001/XMLSchema-instance',
}

# Calcula o DigestValue correto para o contexto SOAP
soap_ns_str = ''.join(f' xmlns:{p}="{u}"' for p, u in SOAP_NS.items())
clean = xml.split('?>', 1)[1].strip() if '?>' in xml else xml
first_gt = clean.index('>')
xml_soap = clean[:first_gt] + soap_ns_str + clean[first_gt:]
r_soap = etree.fromstring(xml_soap.encode('utf-8'), parser)
inf = r_soap.xpath('//*[local-name()="infNFe"]')[0]
c14n = etree.tostring(inf, method='c14n')
digest_soap = base64.b64encode(hashlib.sha1(c14n).digest()).decode()
print()
print('DigestValue armazenado:', dv.text.strip() if dv is not None else 'N/A')
print('DigestValue correto (SOAP):', digest_soap)
print('DigestValue correto (standalone):', base64.b64encode(hashlib.sha1(etree.tostring(
    r33.xpath('//*[local-name()="infNFe"]')[0], method='c14n'
)).digest()).decode())
print()
print('Corresponde ao SOAP context?', (dv.text.strip() if dv is not None else '') == digest_soap)

# Verifica o SignedInfo C14N
si_c14n = etree.tostring(
    r_soap.find('.//{http://www.w3.org/2000/09/xmldsig#}SignedInfo'),
    method='c14n'
)
print()
print('SignedInfo C14N (primeiros 200 chars):')
print(si_c14n[:200].decode())
print()
print('dhEmi no XML:', re.search(r'<dhEmi>([^<]+)</dhEmi>', xml).group(1) if re.search(r'<dhEmi>([^<]+)</dhEmi>', xml) else 'N/A')
print('cNF no XML:', re.search(r'<cNF>([^<]+)</cNF>', xml).group(1) if re.search(r'<cNF>([^<]+)</cNF>', xml) else 'N/A')
