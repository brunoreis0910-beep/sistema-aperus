"""
serializers_hotel.py — Serializers para o módulo hoteleiro
"""
from rest_framework import serializers
from .models import TipoQuarto, Quarto, Reserva, ConsumoQuarto

class TipoQuartoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoQuarto
        fields = '__all__'

class QuartoSerializer(serializers.ModelSerializer):
    tipo_nome = serializers.CharField(source='tipo.nome', read_only=True)

    class Meta:
        model = Quarto
        fields = ['id_quarto', 'numero_quarto', 'tipo', 'tipo_nome', 'status_atual', 'capacidade_adultos', 'capacidade_criancas']

class ConsumoQuartoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome_produto', read_only=True)
    produto_codigo = serializers.CharField(source='produto.codigo_produto', read_only=True)

    class Meta:
        model = ConsumoQuarto
        fields = ['id_consumo', 'reserva', 'produto', 'produto_nome', 'produto_codigo', 'quantidade', 'valor_unitario', 'valor_total', 'data_lancamento', 'observacao']
        read_only_fields = ['valor_total', 'data_lancamento']

class ReservaSerializer(serializers.ModelSerializer):
    hospede_nome = serializers.CharField(source='hospede.nome_razao_social', read_only=True)
    quarto_numero = serializers.CharField(source='quarto.numero_quarto', read_only=True)
    tipo_quarto_nome = serializers.CharField(source='quarto.tipo.nome', read_only=True)
    consumos = ConsumoQuartoSerializer(many=True, read_only=True)
    total_diarias = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_consumo = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_geral = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Reserva
        fields = [
            'id_reserva', 'hospede', 'hospede_nome', 'quarto', 'quarto_numero', 'tipo_quarto_nome',
            'data_entrada_prevista', 'data_saida_prevista', 'data_checkin_real', 'data_checkout_real',
            'status_reserva', 'valor_diaria_aplicada', 'observacoes', 'venda', 'data_criacao', 'data_atualizacao',
            'consumos', 'total_diarias', 'total_consumo', 'total_geral'
        ]
        read_only_fields = ['data_criacao', 'data_atualizacao', 'venda']
