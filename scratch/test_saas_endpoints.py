import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import SaaSCliente, SaaSClienteMensalidade, SaaSClienteContrato
from rest_framework.test import APIClient
from django.utils import timezone
from datetime import date

def run_tests():
    client = APIClient()
    
    # 1. Clean existing test client if any
    test_cnpj = "12345678000199"
    SaaSCliente.objects.filter(cnpj=test_cnpj).delete()
    
    # 2. Create test client
    saas_client = SaaSCliente.objects.create(
        cnpj=test_cnpj,
        razao_social="Aperus Test Client Ltda",
        dia_vencimento=15,
        valor_mensalidade=299.90,
        emite_nota=True,
        status_licenca="ATIVO"
    )
    print(f"Created test SaaSCliente: {saas_client}")
    
    # 3. Create test contract
    contract = SaaSClienteContrato.objects.create(
        saas_cliente=saas_client,
        texto_contrato="Termos de uso do software Aperus Central.",
        assinado=False
    )
    print(f"Created unsigned contract: {contract}")
    
    # 4. Generate some monthly payments using the viewset action
    from django.contrib.auth.models import User
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser('admin_temp', 'admin@temp.com', 'admin_pass')
        print(f"Created temporary superuser for test: {admin_user}")
        
    client.force_authenticate(user=admin_user)
    
    # Call generating action
    response = client.post(f'/api/saas-clientes/{saas_client.id_saas_cliente}/gerar_mensalidades/', {'meses': 3}, format='json')
    print(f"Generate payments status: {response.status_code}")
    print(f"Generated payments data count: {len(response.data)}")
    
    # Disconnect auth for public queries
    client.force_authenticate(user=None)
    
    # 5. Test Verify License
    res = client.get(f'/api/saas/licenca/?cnpj={test_cnpj}')
    print("Verify License Response:")
    print(res.status_code, res.json())
    
    # 6. Test Finance List
    res = client.get(f'/api/saas/financeiro/?cnpj={test_cnpj}')
    print("Finance List Response:")
    print(res.status_code, len(res.json()))
    
    # 7. Test Pending Contract
    res = client.get(f'/api/saas/contrato-pendente/?cnpj={test_cnpj}')
    print("Pending Contract Response:")
    print(res.status_code, res.json())
    
    # 8. Test Signing Contract
    contract_id = res.json().get('id_contrato')
    if contract_id:
        res = client.post('/api/saas/assinar-contrato/', {
            'id_contrato': contract_id,
            'usuario_assinou': 'Diretor Aperus Teste'
        }, format='json')
        print("Sign Contract Response:")
        print(res.status_code, res.json())
        
        # Verify no more pending contracts
        res = client.get(f'/api/saas/contrato-pendente/?cnpj={test_cnpj}')
        print("Verify Pending Contract Response after signing:")
        print(res.status_code, res.json())

    # Cleanup temp admin if created
    if not User.objects.filter(username='admin_temp').exists():
         pass
    else:
         User.objects.filter(username='admin_temp').delete()

if __name__ == "__main__":
    run_tests()
