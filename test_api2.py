import urllib.request
import json
req = urllib.request.Request('http://127.0.0.1:8005/api/token/', data=b'{\"username\": \"admin\", \"password\": \"admin\"}', headers={'Content-Type': 'application/json'}, method='POST')
try:
    resp = urllib.request.urlopen(req)
    token = json.loads(resp.read())['access']
    req2 = urllib.request.Request('http://127.0.0.1:8005/vendas/entregas/?status=ENTREGUE&todos=1', headers={'Authorization': 'Bearer ' + token})
    resp2 = urllib.request.urlopen(req2)
    print(resp2.status)
except Exception as e:
    if hasattr(e, 'read'):
        print(e.read().decode())
