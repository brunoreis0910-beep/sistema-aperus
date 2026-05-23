"""
serializers_hotel.py — Serializers para o módulo hoteleiro
"""
from rest_framework import serializers
from .models import TipoQuarto, Quarto, Reserva, ConsumoQuarto, Venda
from .models_hotel import Comodidade

class ComodidadeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comodidade
        fields = '__all__'

class TipoQuartoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoQuarto
        fields = '__all__'

class QuartoSerializer(serializers.ModelSerializer):
    tipo_nome = serializers.CharField(source='tipo.nome', read_only=True)
    status_atual = serializers.CharField(max_length=20, default='disponivel')
    comodidades_detalhes = ComodidadeSerializer(source='comodidades', many=True, read_only=True)
    comodidades = serializers.PrimaryKeyRelatedField(
        queryset=Comodidade.objects.all(), many=True, required=False
    )

    class Meta:
        model = Quarto
        fields = [
            'id_quarto', 'numero_quarto', 'tipo', 'tipo_nome', 
            'status_atual', 'capacidade_adultos', 'capacidade_criancas', 
            'comodidades', 'comodidades_detalhes'
        ]

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

    nfce_emitida = serializers.SerializerMethodField()
    nfe_emitida = serializers.SerializerMethodField()
    nfse_emitida = serializers.SerializerMethodField()
    documento_fiscal_emitido = serializers.SerializerMethodField()
    nfce_venda_id = serializers.SerializerMethodField()
    nfe_venda_id = serializers.SerializerMethodField()

    class Meta:
        model = Reserva
        fields = [
            'id_reserva', 'hospede', 'hospede_nome', 'quarto', 'quarto_numero', 'tipo_quarto_nome',
            'data_entrada_prevista', 'data_saida_prevista', 'data_checkin_real', 'data_checkout_real',
            'status_reserva', 'valor_diaria_aplicada', 'observacoes', 'venda', 'data_criacao', 'data_atualizacao',
            'consumos', 'total_diarias', 'total_consumo', 'total_geral',
            'nfce_emitida', 'nfe_emitida', 'nfse_emitida', 'documento_fiscal_emitido',
            'nfce_venda_id', 'nfe_venda_id'
        ]
        read_only_fields = ['data_criacao', 'data_atualizacao', 'venda']

    def get_nfce_emitida(self, obj):
        if not obj.venda:
            return False
        if obj.venda.id_operacao and obj.venda.id_operacao.modelo_documento == '65' and obj.venda.status_nfe in ['AUTORIZADA', 'EMITIDA']:
            return True
        return Venda.objects.filter(venda_futura_origem=obj.venda, id_operacao__modelo_documento='65').exclude(status_nfe='CANCELADA').exists()

    def get_nfe_emitida(self, obj):
        if not obj.venda:
            return False
        if obj.venda.status_nfe in ['AUTORIZADA', 'EMITIDA'] or bool(obj.venda.numero_nfe):
            # Se a venda original foi emitida como NFe
            if not obj.venda.id_operacao or obj.venda.id_operacao.modelo_documento != '65':
                return True
        return Venda.objects.filter(venda_futura_origem=obj.venda, id_operacao__modelo_documento='55').exclude(status_nfe='CANCELADA').exists()

    def get_nfse_emitida(self, obj):
        if not obj.venda:
            return False
        return obj.venda.status_nfse in ['AUTORIZADA', 'EMITIDA'] or bool(obj.venda.numero_nfse) or bool(obj.venda.chave_nfse)

    def get_documento_fiscal_emitido(self, obj):
        return self.get_nfce_emitida(obj) or self.get_nfe_emitida(obj)

    def get_nfce_venda_id(self, obj):
        if not obj.venda:
            return None
        venda_nfce = Venda.objects.filter(venda_futura_origem=obj.venda, id_operacao__modelo_documento='65').exclude(status_nfe='CANCELADA').first()
        if venda_nfce:
            return venda_nfce.id_venda
        if obj.venda.id_operacao and obj.venda.id_operacao.modelo_documento == '65':
            return obj.venda.id_venda
        return None

    def get_nfe_venda_id(self, obj):
        if not obj.venda:
            return None
        # Procura venda filha com modelo 55 (NFe)
        venda_nfe = Venda.objects.filter(venda_futura_origem=obj.venda, id_operacao__modelo_documento='55').exclude(status_nfe='CANCELADA').first()
        if venda_nfe:
            return venda_nfe.id_venda
        # Procura qualquer venda filha que não seja modelo 65 (NFCe)
        venda_nfe_fallback = Venda.objects.filter(venda_futura_origem=obj.venda).exclude(id_operacao__modelo_documento='65').exclude(status_nfe='CANCELADA').first()
        if venda_nfe_fallback:
            return venda_nfe_fallback.id_venda
        # Se a própria venda original foi emitida
        if obj.venda.status_nfe in ['AUTORIZADA', 'EMITIDA'] or bool(obj.venda.numero_nfe):
            if not obj.venda.id_operacao or obj.venda.id_operacao.modelo_documento != '65':
                return obj.venda.id_venda
        return None
