import os
import django
import sys
from decimal import Decimal
from datetime import date, timedelta

# Set up django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Cliente, Produto, Venda, Operacao, FinanceiroConta, FormaPagamento, ContaBancaria
from api.models_hotel import TipoQuarto, Quarto, Reserva, ConsumoQuarto
from django.utils import timezone
from api.services.venda_financeiro import ensure_financeiro_for_venda

def run_tests():
    print("Iniciando testes de faturamento e baixa automática no Checkout...")
    
    # 1. Setup/Mock data
    # Limpar qualquer dado anterior de teste se aplicável ou apenas criar novos
    cliente, _ = Cliente.objects.get_or_create(
        nome_razao_social="Hóspede de Teste",
        defaults={"cpf_cnpj": "12345678901"}
    )
    
    tipo_quarto, _ = TipoQuarto.objects.get_or_create(
        nome="Quarto Executivo Teste",
        defaults={"valor_diaria_padrao": Decimal("200.00")}
    )
    
    quarto, _ = Quarto.objects.get_or_create(
        numero_quarto="999-Test",
        defaults={
            "tipo": tipo_quarto,
            "status_atual": "disponivel",
            "capacidade_adultos": 2,
            "capacidade_criancas": 0
        }
    )
    
    operacao, _ = Operacao.objects.get_or_create(
        nome_operacao="Venda Balcão Hotel Teste",
        defaults={
            "transacao": "Saida",
            "gera_financeiro": 1,
            "baixa_automatica": False
        }
    )
    
    forma_pgto, _ = FormaPagamento.objects.get_or_create(
        nome_forma="DINHEIRO TESTE",
        defaults={"dias_vencimento": 0}
    )
    
    conta_bancaria, _ = ContaBancaria.objects.get_or_create(
        nome_conta="CAIXA GERAL TESTE",
        defaults={"saldo_inicial": Decimal("0.00")}
    )
    
    # 2. Test 1: Checkout com Vencimento Hoje (Baixa Automática)
    print("\n--- Teste 1: Checkout com Vencimento Hoje (Deve dar Baixa Automática) ---")
    
    # Criar uma reserva ativa (status = checkin)
    reserva_1 = Reserva.objects.create(
        hospede=cliente,
        quarto=quarto,
        data_entrada_prevista=timezone.now() - timedelta(days=2),
        data_saida_prevista=timezone.now(),
        data_checkin_real=timezone.now() - timedelta(days=2),
        valor_diaria_aplicada=Decimal("200.00"),
        status_reserva="checkin"
    )
    
    # Simular a lógica do checkout da views_hotel.py
    today = timezone.now().date()
    vencimento_hoje = today
    baixa_automatica_1 = (vencimento_hoje == today)
    
    venda_1 = Venda.objects.create(
        id_operacao=operacao,
        id_cliente=reserva_1.hospede,
        valor_total=reserva_1.total_geral,
        data_documento=today,
        origem='HOTEL_PMS',
        status_pagamento='PENDENTE'
    )
    
    payload_fin_1 = {
        'id_forma_pagamento': forma_pgto.id_forma_pagamento,
        'vencimento': vencimento_hoje.isoformat(),
        'id_conta_cobranca': conta_bancaria.id_conta_bancaria,
        'criar_financeiro': True,
        'baixa_automatica': baixa_automatica_1
    }
    
    created_1, fin_pk_1, err_1 = ensure_financeiro_for_venda(venda_1, payload=payload_fin_1, force=True)
    
    assert err_1 is None, f"Erro ao criar financeiro: {err_1}"
    assert created_1 is True, "Financeiro deveria ter sido criado"
    
    fc_1 = FinanceiroConta.objects.get(pk=fin_pk_1)
    print(f"Status da conta criada (Vencimento Hoje): {fc_1.status_conta}")
    print(f"Valor liquidado: {fc_1.valor_liquidado}")
    print(f"Data de pagamento: {fc_1.data_pagamento}")
    print(f"Conta cobrança: {fc_1.id_conta_cobranca}")
    
    assert fc_1.status_conta == 'Paga', "Status da conta deveria ser 'Paga'"
    assert fc_1.valor_liquidado == venda_1.valor_total, "Valor liquidado deveria ser igual ao total da venda"
    assert fc_1.data_pagamento == today, "Data de pagamento deveria ser hoje"
    assert fc_1.id_conta_cobranca == conta_bancaria, "Conta de cobrança deveria ser a especificada"
    print("Teste 1 com sucesso!")
    
    # 3. Test 2: Checkout com Vencimento Futuro (Não deve dar baixa automática)
    print("\n--- Teste 2: Checkout com Vencimento Futuro (Deve ficar Pendente) ---")
    
    reserva_2 = Reserva.objects.create(
        hospede=cliente,
        quarto=quarto,
        data_entrada_prevista=timezone.now() - timedelta(days=2),
        data_saida_prevista=timezone.now(),
        data_checkin_real=timezone.now() - timedelta(days=2),
        valor_diaria_aplicada=Decimal("200.00"),
        status_reserva="checkin"
    )
    
    vencimento_futuro = today + timedelta(days=5)
    baixa_automatica_2 = (vencimento_futuro == today)
    
    venda_2 = Venda.objects.create(
        id_operacao=operacao,
        id_cliente=reserva_2.hospede,
        valor_total=reserva_2.total_geral,
        data_documento=today,
        origem='HOTEL_PMS',
        status_pagamento='PENDENTE'
    )
    
    payload_fin_2 = {
        'id_forma_pagamento': forma_pgto.id_forma_pagamento,
        'vencimento': vencimento_futuro.isoformat(),
        'id_conta_cobranca': conta_bancaria.id_conta_bancaria,
        'criar_financeiro': True,
        'baixa_automatica': baixa_automatica_2
    }
    
    created_2, fin_pk_2, err_2 = ensure_financeiro_for_venda(venda_2, payload=payload_fin_2, force=True)
    
    assert err_2 is None, f"Erro ao criar financeiro: {err_2}"
    assert created_2 is True, "Financeiro deveria ter sido criado"
    
    fc_2 = FinanceiroConta.objects.get(pk=fin_pk_2)
    print(f"Status da conta criada (Vencimento Futuro): {fc_2.status_conta}")
    print(f"Valor liquidado: {fc_2.valor_liquidado}")
    print(f"Data de pagamento: {fc_2.data_pagamento}")
    
    assert fc_2.status_conta == 'Pendente', "Status da conta deveria ser 'Pendente'"
    assert fc_2.valor_liquidado == Decimal('0.00'), "Valor liquidado deveria ser 0"
    assert fc_2.data_pagamento is None, "Data de pagamento deveria ser nula"
    print("Teste 2 com sucesso!")
    
    # Limpar registros criados no banco de dados de teste
    fc_1.delete()
    fc_2.delete()
    venda_1.delete()
    venda_2.delete()
    reserva_1.delete()
    reserva_2.delete()
    
    print("\nTodos os testes foram executados com sucesso!")

if __name__ == '__main__':
    run_tests()
