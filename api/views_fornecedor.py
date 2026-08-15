from rest_framework import viewsets, serializers
import re
from .models import Fornecedor, CodigoMunicipio


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
            'codigo_municipio_ibge',
            'telefone',
            'whatsapp',
            'data_nascimento',
            'email',
            'limite_credito',
            'logo_url',
            'data_cadastro',
        ]


class FornecedorViewSet(viewsets.ModelViewSet):
    """CRUD para Fornecedores (mesmos campos do Cliente)."""
    queryset = Fornecedor.objects.all().order_by('nome_razao_social')
    serializer_class = FornecedorSerializer
    pagination_class = None  # Retorna todos os fornecedores sem paginar (usado em seletores)

    def _sync_ibge(self, serializer):
        cidade = serializer.validated_data.get('cidade')
        estado = serializer.validated_data.get('estado')
        cod_ibge = serializer.validated_data.get('codigo_municipio_ibge')

        if cod_ibge:
            cod_clean = re.sub(r'[^\d]', '', str(cod_ibge)).strip()
            if len(cod_clean) >= 7 and cidade and estado:
                try:
                    CodigoMunicipio.objects.get_or_create(
                        codigo_ibge=cod_clean[:7],
                        defaults={'nome_municipio': cidade.strip(), 'uf': estado.strip().upper()[:2]}
                    )
                except Exception:
                    pass
        elif cidade and estado:
            # Tentar buscar da tabela codigo_municipio se não veio preenchido
            try:
                mun = CodigoMunicipio.objects.filter(
                    nome_municipio__iexact=cidade.strip(),
                    uf__iexact=estado.strip().upper()[:2]
                ).first()
                if mun:
                    serializer.validated_data['codigo_municipio_ibge'] = mun.codigo_ibge
            except Exception:
                pass

    def perform_create(self, serializer):
        self._sync_ibge(serializer)
        serializer.save()

    def perform_update(self, serializer):
        self._sync_ibge(serializer)
        serializer.save()

