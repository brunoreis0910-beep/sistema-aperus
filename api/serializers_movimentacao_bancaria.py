"""
Serializers para Movimentações Bancárias (Financeiro Bancário)
"""
from rest_framework import serializers
from .models import FinanceiroBancario, ContaBancaria, Cliente


class FinanceiroBancarioSerializer(serializers.ModelSerializer):
    """
    Serializer para Movimentações Bancárias
    
    Campos aceitos:
    - descricao: string (obrigatório)
    - tipo: string - 'ENTRADA', 'SAIDA', 'ESTORNO', 'TRANSFERENCIA', etc. (convertido para tipo_movimentacao)
    - tipo_movimentacao: string - 'Crédito' ou 'Débito' (obrigatório)
    - valor: decimal (obrigatório)
    - data_movimentacao: date (opcional - default hoje)
    - id_conta_bancaria: int (obrigatório)
    - observacao: string (opcional)
    - documento_numero: string (opcional)
    - id_cliente_fornecedor: int (opcional)
    - forma_pagamento: string (opcional)
    """
    
    # ForeignKey como PrimaryKeyRelatedField (aceita int direto)
    id_conta_bancaria = serializers.PrimaryKeyRelatedField(
        queryset=ContaBancaria.objects.all(),
        required=True
    )
    
    id_cliente_fornecedor = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        required=False,
        allow_null=True
    )
    
    # Campos somente leitura
    nome_conta_bancaria = serializers.CharField(
        source='id_conta_bancaria.nome_conta',
        read_only=True
    )
    cliente_fornecedor_nome = serializers.CharField(
        source='id_cliente_fornecedor.nome_razao_social',
        read_only=True,
        allow_null=True
    )
    
    # Campos alternativos (write_only)
    valor = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        write_only=True,
        required=False
    )
    
    data_movimentacao = serializers.DateField(
        write_only=True,
        required=False,
        allow_null=True
    )
    
    observacao = serializers.CharField(
        write_only=True,
        required=False,
        allow_null=True
    )
    
    tipo = serializers.CharField(
        write_only=True,
        required=False
    )
    
    # Sobrescrever campos do model para torná-los opcionais no input
    tipo_movimento = serializers.CharField(required=False)
    tipo_movimentacao = serializers.CharField(required=False, write_only=True)  # Alias para tipo_movimento
    
    data_pagamento = serializers.DateField(required=False)
    
    valor_movimento = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        required=False
    )
    descricao = serializers.CharField(required=False)
    
    class Meta:
        model = FinanceiroBancario
        fields = [
            'id_movimento',
            'id_conta_bancaria',
            'nome_conta_bancaria',
            'tipo_movimento',
            'tipo_movimentacao',  # Alias para tipo_movimento
            'tipo',  # Campo alternativo
            'data_pagamento',
            'data_movimentacao',  # Campo alternativo
            'valor_movimento',
            'valor',  # Campo alternativo
            'descricao',
            'observacao',  # Campo alternativo
            'documento_numero',
            'id_cliente_fornecedor',
            'cliente_fornecedor_nome',
            'forma_pagamento',
            'data_criacao',
        ]
        read_only_fields = ['id_movimento', 'data_criacao']
    
    def validate(self, data):
        """
        Valida e mapeia campos alternativos para os campos do model
        """
        # Mapear 'valor' para 'valor_movimento'
        if 'valor' in data and 'valor_movimento' not in data:
            data['valor_movimento'] = data.pop('valor')
        elif 'valor' in data:
            data.pop('valor')  # Remove duplicado
        
        # Mapear 'data_movimentacao' para 'data_pagamento'
        if 'data_movimentacao' in data and 'data_pagamento' not in data:
            data['data_pagamento'] = data.pop('data_movimentacao')
        elif 'data_movimentacao' in data:
            data.pop('data_movimentacao')  # Remove duplicado
        
        # Se não tiver data_pagamento, usar hoje
        if 'data_pagamento' not in data or not data['data_pagamento']:
            from datetime import date
            data['data_pagamento'] = date.today()
        
        # Mapear 'observacao' para 'descricao' (se observacao vier e descricao não)
        if 'observacao' in data and data['observacao']:
            if 'descricao' not in data or not data['descricao']:
                data['descricao'] = data.pop('observacao')
            else:
                data.pop('observacao')
        elif 'observacao' in data:
            data.pop('observacao')
        
        # Remover 'tipo' (não é usado, tipo_movimentacao é obrigatório)
        if 'tipo' in data:
            data.pop('tipo')
        
        # Mapear 'tipo_movimentacao' para 'tipo_movimento'
        if 'tipo_movimentacao' in data and 'tipo_movimento' not in data:
            data['tipo_movimento'] = data.pop('tipo_movimentacao')
        elif 'tipo_movimentacao' in data:
            data.pop('tipo_movimentacao')
        
        # Normalizar tipo_movimento
        if 'tipo_movimento' in data:
            value_upper = data['tipo_movimento'].upper()
            if value_upper in ['CRÉDITO', 'CREDITO', 'C']:
                data['tipo_movimento'] = 'C'
            elif value_upper in ['DÉBITO', 'DEBITO', 'D']:
                data['tipo_movimento'] = 'D'
            else:
                raise serializers.ValidationError({
                    'tipo_movimentacao': "Deve ser 'Crédito' ou 'Débito' (ou 'C'/'D')"
                })
        
        # Validar campos obrigatórios
        if 'valor_movimento' not in data:
            raise serializers.ValidationError({
                'valor': 'Este campo é obrigatório (valor ou valor_movimento)'
            })
        
        if 'tipo_movimento' not in data:
            raise serializers.ValidationError({
                'tipo_movimentacao': 'Este campo é obrigatório'
            })
        
        if 'descricao' not in data:
            raise serializers.ValidationError({
                'descricao': 'Este campo é obrigatório (descricao ou observacao)'
            })
        
        return data
    
    def create(self, validated_data):
        """
        Cria movimentação bancária (campos já mapeados no validate)
        """
        return super().create(validated_data)
    
    def validate_tipo_movimentacao(self, value):
        """
        Valida e normaliza tipo_movimentacao
        Aceita: 'Crédito', 'Débito', 'C', 'D', 'credito', 'debito'
        """
        value_upper = value.upper()
        
        if value_upper in ['CRÉDITO', 'CREDITO', 'C']:
            return 'C'
        elif value_upper in ['DÉBITO', 'DEBITO', 'D']:
            return 'D'
        else:
            raise serializers.ValidationError(
                "tipo_movimentacao deve ser 'Crédito' ou 'Débito' (ou 'C'/'D')"
            )
