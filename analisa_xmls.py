import hashlib, base64, re
from lxml import etree

SOAP_NS = {
    'soap12': 'http://www.w3.org/2003/05/soap-envelope',
    'xsd':    'http://www.w3.org/2001/XMLSchema',
    'xsi':    'http://www.w3.org/2001/XMLSchema-instance',
}

def digest_standalone(xml_str):
    parser = etree.XMLParser(remove_blank_text=False)
    clean = xml_str.split('?>', 1)[1].strip() if '?>' in xml_str else xml_str
    r = etree.fromstring(clean.encode('utf-8'), parser)
    inf = r.xpath('//*[local-name()="infNFe"]')[0]
    c14n = etree.tostring(inf, method='c14n')
    return base64.b64encode(hashlib.sha1(c14n).digest()).decode(), c14n

def digest_soap(xml_str):
    parser = etree.XMLParser(remove_blank_text=False)
    clean = xml_str.split('?>', 1)[1].strip() if '?>' in xml_str else xml_str
    # Encontra o root (pode ser NFe ou nfeProc)
    soap_ns_str = ''.join(f' xmlns:{p}="{u}"' for p, u in SOAP_NS.items())
    first_gt = clean.index('>')
    xml_soap = clean[:first_gt] + soap_ns_str + clean[first_gt:]
    r = etree.fromstring(xml_soap.encode('utf-8'), parser)
    inf = r.xpath('//*[local-name()="infNFe"]')[0]
    c14n = etree.tostring(inf, method='c14n')
    return base64.b64encode(hashlib.sha1(c14n).digest()).decode(), c14n

# Lê os dois arquivos (UTF-8)
with open(r'C:\Users\brunow\Downloads\494-nfce(2).xml', encoding='utf-8') as f:
    xml494 = f.read()

with open(r'C:\Users\brunow\Downloads\31260348010363000134650010000000321652913235-nfce.xml', encoding='utf-8') as f:
    xml32 = f.read()

print('='*60)
print('NFC-e 33 (494-nfce(2).xml) - tentativa anterior')
print('='*60)
dv494 = re.search(r'<DigestValue>([^<]+)</DigestValue>', xml494)
print('chave:   ', re.search(r'Id="(NFe[^"]+)"', xml494).group(1))
print('dhEmi:   ', re.search(r'<dhEmi>([^<]+)</dhEmi>', xml494).group(1))
print('cNF:     ', re.search(r'<cNF>([^<]+)</cNF>', xml494).group(1))
print('xBairro: ', re.search(r'<xBairro>([^<]+)</xBairro>', xml494).group(1))
print('xMun:    ', re.search(r'<xMun>([^<]+)</xMun>', xml494).group(1))
print('PIS tag: ', re.search(r'<(PIS\w+)>', xml494).group(1))
print('COFINS tag:', re.search(r'<(COFINS\w+)>', xml494).group(1))

d_sa, c14n_sa = digest_standalone(xml494)
d_so, c14n_so = digest_soap(xml494)
print()
print('DigestValue no XML:    ', dv494.group(1).strip() if dv494 else 'N/A')
print('DigestValue standalone:', d_sa)
print('DigestValue SOAP ctx:  ', d_so)
print('Coincide com gravado?  ', dv494.group(1).strip() == d_sa if dv494 else 'N/A', '(standalone)')
print('Coincide com gravado?  ', dv494.group(1).strip() == d_so if dv494 else 'N/A', '(SOAP)')

print()
print('C14N infNFe (standalone) - primeiros 300:')
print(c14n_sa[:300].decode())

print()
print('='*60)
print('NFC-e 32 (autorizada) - referência')
print('='*60)
dv32 = re.search(r'<DigestValue>([^<]+)</DigestValue>', xml32)
print('chave:   ', re.search(r'Id="(NFe[^"]+)"', xml32).group(1))
print('dhEmi:   ', re.search(r'<dhEmi>([^<]+)</dhEmi>', xml32).group(1))
print('xBairro: ', re.search(r'<xBairro>([^<]+)</xBairro>', xml32).group(1))
print('xMun:    ', re.search(r'<xMun>([^<]+)</xMun>', xml32).group(1))
print('PIS tag: ', re.search(r'<(PIS\w+)>', xml32).group(1))
print('COFINS tag:', re.search(r'<(COFINS\w+)>', xml32).group(1))

d_sa32, c14n_sa32 = digest_standalone(xml32)
d_so32, c14n_so32 = digest_soap(xml32)
print()
print('DigestValue no XML:    ', dv32.group(1).strip() if dv32 else 'N/A')
print('DigestValue standalone:', d_sa32)
print('DigestValue SOAP ctx:  ', d_so32)
print('Coincide com gravado?  ', dv32.group(1).strip() == d_sa32 if dv32 else 'N/A', '(standalone)')
print('Coincide com gravado?  ', dv32.group(1).strip() == d_so32 if dv32 else 'N/A', '(SOAP)')

print()
print('C14N infNFe (standalone) - primeiros 300:')
print(c14n_sa32[:300].decode())
