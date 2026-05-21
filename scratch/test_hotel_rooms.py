import os
import django
import sys
from decimal import Decimal

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models_hotel import TipoQuarto, Quarto
from api.serializers_hotel import QuartoSerializer

def main():
    print("--- Testando Módulo Hoteleiro (PMS) ---")
    
    # 1. Obter ou Criar TipoQuarto de teste
    tipo_quarto, created = TipoQuarto.objects.get_or_create(
        nome="Standard Casal Teste",
        defaults={
            "descricao": "Quarto de teste para automatização",
            "valor_diaria_padrao": Decimal("150.00"),
            "limite_adultos": 2,
            "limite_criancas": 1
        }
    )
    print(f"Tipo Quarto: {tipo_quarto} (Criado: {created})")

    # 2. Testar serializer para cadastro (POST)
    data_post = {
        "numero_quarto": "T101",
        "tipo": tipo_quarto.id_tipo_quarto,
        "status_atual": "disponivel",
        "capacidade_adultos": 2,
        "capacidade_criancas": 1
    }
    
    # Deleta se já existir para testar fluxo limpo
    Quarto.objects.filter(numero_quarto="T101").delete()
    
    serializer = QuartoSerializer(data=data_post)
    if serializer.is_valid():
        quarto = serializer.save()
        print(f"Quarto T101 cadastrado com sucesso! ID: {quarto.id_quarto}")
        print(f"Dados serializados: {serializer.data}")
    else:
        print(f"Erro na validação do cadastro: {serializer.errors}")
        return

    # 3. Testar serializer para edição (PUT)
    data_put = {
        "numero_quarto": "T101",
        "tipo": tipo_quarto.id_tipo_quarto,
        "status_atual": "sujo",  # alterando status
        "capacidade_adultos": 3,  # alterando capacidade
        "capacidade_criancas": 0
    }
    
    serializer_edit = QuartoSerializer(instance=quarto, data=data_put)
    if serializer_edit.is_valid():
        quarto_atualizado = serializer_edit.save()
        print(f"Quarto T101 editado com sucesso! Novo status: {quarto_atualizado.status_atual}, Capacidade: {quarto_atualizado.capacidade_adultos}")
        print(f"Dados serializados atualizados: {serializer_edit.data}")
    else:
        print(f"Erro na validação da edição: {serializer_edit.errors}")
        return

    # 4. Limpeza do quarto de teste
    quarto_atualizado.delete()
    print("Quarto de teste removido do banco.")
    print("--- Teste concluído com sucesso! ---")

if __name__ == '__main__':
    main()
