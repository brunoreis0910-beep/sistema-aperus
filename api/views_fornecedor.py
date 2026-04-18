from rest_framework import viewsets, serializers

from .models import Fornecedor


class FornecedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fornecedor
        fields = [
            'id_fornecedor',
            'nome_razao_social',
            'nome_fantasia',
            'cpf_cnpj',
            'inscricao_estadual',
            'endereco',
            'numero',
            'bairro',
            'cidade',
            'estado',
            'cep',
            'telefone',
            'email',
            'limite_credito',
            'logo_url',
            'data_cadastro',
        ]


class FornecedorViewSet(viewsets.ModelViewSet):
    """CRUD para Fornecedores (mesmos campos do Cliente)."""
    queryset = Fornecedor.objects.all().order_by('nome_razao_social')
    serializer_class = FornecedorSerializer
