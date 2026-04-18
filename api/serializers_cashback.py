# Em: C:\Projetos\SistemaGerencial\api\serializers_cashback.py
"""
Serializers para o sistema de Cashback
"""

from rest_framework import serializers
from .models import Cashback, Cliente, Venda
from decimal import Decimal
from django.utils import timezone


class CashbackSerializer(serializers.ModelSerializer):
    """Serializer completo para Cashback"""
    
    # Campos computados
    esta_vencido = serializers.SerializerMethodField()
    nome_cliente = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    numero_venda_origem = serializers.CharField(source='id_venda_origem.numero_documento', read_only=True)
    numero_venda_utilizado = serializers.CharField(source='id_venda_utilizado.numero_documento', read_only=True)
    
    class Meta:
        model = Cashback
        fields = '__all__'
        read_only_fields = ['id_cashback', 'data_geracao', 'data_utilizacao']
    
    def get_esta_vencido(self, obj):
        """Verifica se está vencido"""
        return obj.esta_vencido


class CashbackListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagens"""
    
    nome_cliente = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    esta_vencido = serializers.SerializerMethodField()
    
    class Meta:
        model = Cashback
        fields = [
            'id_cashback', 'id_cliente', 'nome_cliente', 
            'valor_gerado', 'valor_utilizado', 'saldo',
            'data_geracao', 'data_validade', 'ativo', 'esta_vencido'
        ]
    
    def get_esta_vencido(self, obj):
        return obj.esta_vencido


class CashbackSaldoSerializer(serializers.Serializer):
    """Serializer para retornar saldo disponível de cashback"""
    
    id_cliente = serializers.IntegerField()
    nome_cliente = serializers.CharField()
    saldo_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    quantidade_cashbacks = serializers.IntegerField()
    cashbacks = CashbackListSerializer(many=True)


class CashbackGerarSerializer(serializers.Serializer):
    """Serializer para gerar cashback"""
    
    id_venda = serializers.IntegerField()
    
    def validate_id_venda(self, value):
        """Valida se a venda existe"""
        try:
            venda = Venda.objects.get(pk=value)
            return value
        except Venda.DoesNotExist:
            raise serializers.ValidationError("Venda não encontrada")


class CashbackUtilizarSerializer(serializers.Serializer):
    """Serializer para utilizar cashback"""
    
    id_cliente = serializers.IntegerField()
    id_venda = serializers.IntegerField()
    valor_utilizar = serializers.DecimalField(max_digits=12, decimal_places=2)
    ids_cashback = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="IDs específicos de cashback a utilizar (opcional, se não informado usa mais antigos)"
    )
    
    def validate(self, data):
        """Validações gerais"""
        # Valida cliente
        try:
            cliente = Cliente.objects.get(pk=data['id_cliente'])
        except Cliente.DoesNotExist:
            raise serializers.ValidationError({"id_cliente": "Cliente não encontrado"})
        
        # Valida venda
        try:
            venda = Venda.objects.get(pk=data['id_venda'])
        except Venda.DoesNotExist:
            raise serializers.ValidationError({"id_venda": "Venda não encontrada"})
        
        # Valida valor
        if data['valor_utilizar'] <= 0:
            raise serializers.ValidationError({"valor_utilizar": "Valor deve ser maior que zero"})
        
        # Verifica saldo disponível
        cashbacks_disponiveis = Cashback.objects.filter(
            id_cliente=data['id_cliente'],
            ativo=True,
            data_validade__gt=timezone.now()
        )
        
        if 'ids_cashback' in data and data['ids_cashback']:
            cashbacks_disponiveis = cashbacks_disponiveis.filter(id_cashback__in=data['ids_cashback'])
        
        saldo_total = sum(cb.saldo for cb in cashbacks_disponiveis)
        
        if data['valor_utilizar'] > saldo_total:
            raise serializers.ValidationError({
                "valor_utilizar": f"Valor solicitado (R$ {data['valor_utilizar']}) é maior que o saldo disponível (R$ {saldo_total})"
            })
        
        return data
