import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserParametros, Operacao
from api.serializers import UserSerializer

def test_hotel_params():
    # 1. Pega ou cria um usuário de teste
    username = 'test_hotel_user'
    user, created = User.objects.get_or_create(
        username=username,
        defaults={'email': 'test@hotel.com', 'is_active': True}
    )
    if created:
        user.set_password('testpass123')
        user.save()
    
    # 2. Pega ou cria duas operações de teste
    op1, _ = Operacao.objects.get_or_create(
        nome_operacao='Operacao Teste Hospedagem',
        defaults={'transacao': 'Outras', 'empresa': 'Hotel Aperus'}
    )
    op2, _ = Operacao.objects.get_or_create(
        nome_operacao='Operacao Teste Checkout',
        defaults={'transacao': 'Saida', 'empresa': 'Hotel Aperus', 'gera_financeiro': 1}
    )
    op3, _ = Operacao.objects.get_or_create(
        nome_operacao='Operacao Teste Hotel NFCe',
        defaults={'transacao': 'Saida', 'empresa': 'Hotel Aperus'}
    )
    
    # 3. Garante que existem os parametros do usuario
    params, _ = UserParametros.objects.get_or_create(id_user=user)
    
    # 4. Define os novos valores
    params.id_operacao_hotel = op1
    params.perguntar_operacao_checkout = 1
    params.id_operacao_hotel_checkout = op2
    params.id_operacao_hotel_nfce = op3
    params.save()
    
    print("SUCCESS: Parametros salvos no banco com sucesso!")
    
    # 5. Verifica via Serializer
    serializer = UserSerializer(user)
    data = serializer.data
    
    user_params = data.get('parametros', {})
    
    print("\nINFO: Serialized data:")
    print(f"id_operacao_hotel: {user_params.get('id_operacao_hotel')}")
    print(f"perguntar_operacao_checkout: {user_params.get('perguntar_operacao_checkout')}")
    print(f"id_operacao_hotel_checkout: {user_params.get('id_operacao_hotel_checkout')}")
    print(f"id_operacao_hotel_nfce: {user_params.get('id_operacao_hotel_nfce')}")
    
    # 6. Validação das asserções
    assert user_params.get('id_operacao_hotel') == op1.id_operacao, "Erro: id_operacao_hotel incorreto"
    assert user_params.get('perguntar_operacao_checkout') == 1, "Erro: perguntar_operacao_checkout incorreto"
    assert user_params.get('id_operacao_hotel_checkout') == op2.id_operacao, "Erro: id_operacao_hotel_checkout incorreto"
    assert user_params.get('id_operacao_hotel_nfce') == op3.id_operacao, "Erro: id_operacao_hotel_nfce incorreto"
    
    print("\nSUCCESS: Todos os testes de serializacao dos novos parametros de Hotelaria passaram!")

if __name__ == '__main__':
    test_hotel_params()
