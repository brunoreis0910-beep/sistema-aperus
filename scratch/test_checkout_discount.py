import os
import django
from decimal import Decimal

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils import timezone
from api.models import Cliente, Operacao, Venda
from api.models_hotel import Quarto, TipoQuarto, Reserva, ConsumoQuarto
from rest_framework.test import APIRequestFactory, force_authenticate
from api.views_hotel import ReservaViewSet

def run_test():
    print("Iniciando testes de desconto no checkout do Hotel...")
    
    # 1. Obter ou criar dados necessários
    user, _ = User.objects.get_or_create(username='admin', defaults={'is_superuser': True})
    
    cliente, _ = Cliente.objects.get_or_create(
        nome_razao_social='Hospede de Teste Desconto',
        defaults={'ativo': 1}
    )
    
    tipo_quarto, _ = TipoQuarto.objects.get_or_create(
        nome='Suite Master Desconto Test',
        defaults={'valor_diaria_padrao': Decimal('200.00')}
    )
    
    quarto, _ = Quarto.objects.get_or_create(
        numero_quarto='999D',
        defaults={'tipo': tipo_quarto, 'status_atual': 'disponivel'}
    )
    
    operacao, _ = Operacao.objects.get_or_create(
        nome_operacao='Checkout Hotel Teste Desconto',
        defaults={'transacao': 'Saida', 'empresa': 'Hotel Aperus', 'gera_financeiro': 1}
    )
    
    # 2. Criar uma reserva ativa (status checkin)
    reserva = Reserva.objects.create(
        hospede=cliente,
        quarto=quarto,
        data_entrada_prevista=timezone.now() - timezone.timedelta(days=2),
        data_saida_prevista=timezone.now() + timezone.timedelta(days=1),
        data_checkin_real=timezone.now() - timezone.timedelta(days=2),
        status_reserva='checkin',
        valor_diaria_aplicada=Decimal('150.00')
    )
    
    # 3. Adicionar consumos
    from api.models import Produto
    produto, _ = Produto.objects.get_or_create(
        codigo_produto='TEST_PROD_1',
        defaults={'nome_produto': 'Refrigerante Teste'}
    )
    ConsumoQuarto.objects.create(
        reserva=reserva,
        produto=produto,
        quantidade=Decimal('2.00'),
        valor_unitario=Decimal('5.00'),
        valor_total=Decimal('10.00')
    )
    
    # Total da reserva: 3 diárias de 150.00 = 450.00 + 10.00 consumo = 460.00
    total_geral = reserva.total_geral
    print(f"Reserva criada ID: {reserva.id_reserva}")
    print(f"Total Geral: R$ {total_geral} (esperado 460.00)")
    assert total_geral == Decimal('460.00'), f"Total geral incorreto: {total_geral}"

    # 4. Simular chamada de Checkout com desconto em valor fixo (R$ 10.00)
    print("\n--- Teste 1: Desconto de R$ 10.00 (Fixo) ---")
    factory = APIRequestFactory()
    view = ReservaViewSet.as_view({'post': 'checkout'})
    
    request = factory.post(f'/api/hotel/reservas/{reserva.id_reserva}/checkout/', {
        'id_operacao': operacao.id_operacao,
        'gerar_financeiro': False,  # Desliga financeiro para simplificar
        'tipo_desconto': 'VALOR',
        'valor_desconto': 10.00
    }, format='json')
    
    force_authenticate(request, user=user)
    response = view(request, pk=reserva.id_reserva)
    
    print(f"Status response: {response.status_code}")
    print(f"Dados response: {response.data}")
    
    assert response.status_code == 200, f"Erro no checkout: {response.data}"
    
    # Verificar a Venda criada
    venda_id = response.data['venda_id']
    venda = Venda.objects.get(pk=venda_id)
    print(f"Venda criada ID: {venda.id_venda}")
    print(f"Venda - valor_total (faturado): R$ {venda.valor_total} (esperado 300.00)")
    print(f"Venda - valor_desconto: R$ {venda.valor_desconto} (esperado 10.00)")
    
    assert venda.valor_total == Decimal('300.00'), f"Valor total da venda incorreto: {venda.valor_total}"
    assert venda.valor_desconto == Decimal('10.00'), f"Desconto da venda incorreto: {venda.valor_desconto}"
    
    # 5. Criar outra reserva e testar desconto percentual (10% de 460.00 = 46.00)
    print("\n--- Teste 2: Desconto de 10% (Percentual) ---")
    reserva2 = Reserva.objects.create(
        hospede=cliente,
        quarto=quarto,
        data_entrada_prevista=timezone.now() - timezone.timedelta(days=2),
        data_saida_prevista=timezone.now() + timezone.timedelta(days=1),
        data_checkin_real=timezone.now() - timezone.timedelta(days=2),
        status_reserva='checkin',
        valor_diaria_aplicada=Decimal('150.00')
    )
    ConsumoQuarto.objects.create(
        reserva=reserva2,
        produto=produto,
        quantidade=Decimal('2.00'),
        valor_unitario=Decimal('5.00'),
        valor_total=Decimal('10.00')
    )
    
    request2 = factory.post(f'/api/hotel/reservas/{reserva2.id_reserva}/checkout/', {
        'id_operacao': operacao.id_operacao,
        'gerar_financeiro': False,
        'tipo_desconto': 'PERCENTUAL',
        'valor_desconto': 10.00 # 10%
    }, format='json')
    
    force_authenticate(request2, user=user)
    response2 = view(request2, pk=reserva2.id_reserva)
    
    print(f"Status response: {response2.status_code}")
    print(f"Dados response: {response2.data}")
    
    assert response2.status_code == 200, f"Erro no checkout: {response2.data}"
    
    venda_id2 = response2.data['venda_id']
    venda2 = Venda.objects.get(pk=venda_id2)
    print(f"Venda criada ID: {venda2.id_venda}")
    print(f"Venda - valor_total (faturado): R$ {venda2.valor_total} (esperado 279.00)")
    print(f"Venda - valor_desconto: R$ {venda2.valor_desconto} (esperado 31.00)")
    
    assert venda2.valor_total == Decimal('279.00'), f"Valor total da venda incorreto: {venda2.valor_total}"
    assert venda2.valor_desconto == Decimal('31.00'), f"Desconto da venda incorreto: {venda2.valor_desconto}"
    
    # Limpeza dos dados de teste
    reserva.delete()
    reserva2.delete()
    print("\nSUCCESS: Todos os testes de desconto no checkout passaram com sucesso!")

if __name__ == '__main__':
    run_test()
