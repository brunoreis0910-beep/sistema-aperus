from rest_framework import serializers
from .models import Cliente, EscritorioContabilidade


class EscritorioContabilidadeSerializer(serializers.ModelSerializer):
    """Serializer para o modelo EscritorioContabilidade"""
    
    class Meta:
        model = EscritorioContabilidade
        fields = [
            'id',
            'cnpj',
            'razao_social',
            'telefone',
            'contador',
            'email',
            'ativo',
            'criado_em',
            'atualizado_em'
        ]
        read_only_fields = ['id', 'criado_em', 'atualizado_em']
    
    def validate_cnpj(self, value):
        """Validação customizada para CNPJ"""
        # Remove caracteres especiais
        cnpj_numeros = ''.join(filter(str.isdigit, value))
        
        if len(cnpj_numeros) != 14:
            raise serializers.ValidationError("CNPJ deve conter 14 dígitos.")
        
        return value


class ClienteSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Cliente"""
    
    escritorio_detalhes = EscritorioContabilidadeSerializer(
        source='escritorio',
        read_only=True
    )
    endereco_completo = serializers.ReadOnlyField()
    regime_tributario_display = serializers.CharField(
        source='get_regime_tributario_display',
        read_only=True
    )
    
    class Meta:
        model = Cliente
        fields = [
            'id',
            'razao_social',
            'nome_fantasia',
            'cnpj',
            'inscricao_estadual',
            'endereco',
            'numero',
            'complemento',
            'bairro',
            'cidade',
            'estado',
            'cep',
            'endereco_completo',
            'proprietario',
            'data_nascimento',
            'cpf',
            'telefone',
            'email',
            'regime_tributario',
            'regime_tributario_display',
            'escritorio',
            'escritorio_detalhes',
            'observacoes',
            'ativo',
            'criado_em',
            'atualizado_em'
        ]
        read_only_fields = ['id', 'criado_em', 'atualizado_em', 'endereco_completo']
    
    def validate_cnpj(self, value):
        """Validação customizada para CNPJ"""
        if not value:
            return None
            
        cnpj_numeros = ''.join(filter(str.isdigit, value))
        
        if len(cnpj_numeros) != 14:
            raise serializers.ValidationError("CNPJ deve conter 14 dígitos.")
        
        return value
    
    def validate_cpf(self, value):
        """Validação customizada para CPF"""
        if not value:
            return None
            
        cpf_numeros = ''.join(filter(str.isdigit, value))
        
        if len(cpf_numeros) != 11:
            raise serializers.ValidationError("CPF deve conter 11 dígitos.")
        
        return value
    
    def validate_cep(self, value):
        """Validação customizada para CEP"""
        cep_numeros = ''.join(filter(str.isdigit, value))
        
        if len(cep_numeros) != 8:
            raise serializers.ValidationError("CEP deve conter 8 dígitos.")
        
        return value


class ClienteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de clientes"""
    
    escritorio_nome = serializers.CharField(
        source='escritorio.razao_social',
        read_only=True
    )
    regime_tributario_display = serializers.CharField(
        source='get_regime_tributario_display',
        read_only=True
    )
    
    class Meta:
        model = Cliente
        fields = [
            'id',
            'razao_social',
            'nome_fantasia',
            'cnpj',
            'cidade',
            'estado',
            'telefone',
            'email',
            'regime_tributario_display',
            'escritorio_nome',
            'ativo'
        ]
