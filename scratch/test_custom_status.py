import os
import sys
import django
from rest_framework import serializers

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from api.models import Quarto, TipoQuarto
from api.serializers_hotel import QuartoSerializer

class OverriddenQuartoSerializer(QuartoSerializer):
    status_atual = serializers.CharField(max_length=20, default='disponivel')

def test():
    tipo = TipoQuarto.objects.first()
    if not tipo:
        print("Nenhum TipoQuarto encontrado.")
        return

    data = {
        "numero_quarto": "9999",
        "tipo": tipo.id_tipo_quarto,
        "status_atual": "customizado",
        "capacidade_adultos": 2,
        "capacidade_criancas": 0
    }

    serializer = OverriddenQuartoSerializer(data=data)
    if serializer.is_valid():
        print("Overridden serializer accepted custom status!")
        # Let's try to save it (in transaction rollback or just delete it after)
        from django.db import transaction
        try:
            with transaction.atomic():
                instance = serializer.save()
                print("Saved to DB successfully! Status in DB:", instance.status_atual)
                # Rollback automatically or delete
                instance.delete()
                print("Instance deleted successfully.")
        except Exception as e:
            print("Failed to save to DB:", e)
    else:
        print("Overridden serializer rejected custom status:", serializer.errors)

if __name__ == "__main__":
    test()
