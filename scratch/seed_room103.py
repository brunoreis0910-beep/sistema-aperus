import os
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
import django
django.setup()

from api.models_hotel import Quarto, Reserva, TipoQuarto
from api.models import Cliente

# 1. Limpar dados anteriores do hotel para evitar duplicados
Reserva.objects.all().delete()
Quarto.objects.all().delete()
TipoQuarto.objects.all().delete()

# 2. Criar Tipos de Quarto
t1 = TipoQuarto.objects.create(
    nome='Standard Casal',
    descricao='Quarto aconchegante com cama de casal.',
    valor_diaria_padrao=Decimal('160.00'),
    limite_adultos=2,
    limite_criancas=1
)

# 3. Criar Quarto 103 e outros
q103 = Quarto.objects.create(
    numero_quarto='103',
    tipo=t1,
    status_atual='ocupado',
    capacidade_adultos=2,
    capacidade_criancas=1
)
print("Quarto 103 criado com sucesso.")

# 4. Criar Cliente
cliente, _ = Cliente.objects.get_or_create(
    nome_razao_social='Cliente Teste Quarto 103',
    defaults={
        'cpf_cnpj': '11122233344',
        'ativo': 1
    }
)
print("Cliente criado:", cliente.nome_razao_social)

# 5. Criar Reserva ativa (check-in realizado)
# Entrada: ontem, Saída: hoje (ou há 2 horas atrás)
hoje = timezone.now()
ontem = hoje - timedelta(days=1)
saida_prevista = hoje + timedelta(days=2) # Saída prevista para daqui a 2 dias

r = Reserva.objects.create(
    hospede=cliente,
    quarto=q103,
    data_entrada_prevista=ontem,
    data_saida_prevista=saida_prevista,
    data_checkin_real=ontem,
    status_reserva='checkin',
    valor_diaria_aplicada=Decimal('160.00'),
    observacoes='Reserva ativa de teste para o Quarto 103'
)
print(f"Reserva de check-in criada para Quarto 103. ID: {r.id_reserva}")
