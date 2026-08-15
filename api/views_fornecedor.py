from rest_framework import viewsets, serializers
import re
import urllib.request
import json
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
        read_only_fields = ['id_fornecedor', 'data_cadastro']
        extra_kwargs = {
            'cpf_cnpj': {'validators': []},  # Evitar que o validator padrão do DRF bloqueie updates do mesmo registro
        }

    def validate_cpf_cnpj(self, value):
        if not value:
            return value
        clean_val = re.sub(r'\D', '', str(value))
        qs = Fornecedor.objects.all()
        if self.instance:
            qs = qs.exclude(id_fornecedor=self.instance.id_fornecedor)
        for f in qs.iterator():
            if re.sub(r'\D', '', f.cpf_cnpj or '') == clean_val:
                raise serializers.ValidationError("Fornecedor com este CPF/CNPJ já existe.")
        return clean_val


class FornecedorViewSet(viewsets.ModelViewSet):
    """CRUD para Fornecedores com sincronização e preenchimento de código IBGE."""
    queryset = Fornecedor.objects.all().order_by('nome_razao_social')
    serializer_class = FornecedorSerializer
    pagination_class = None  # Retorna todos os fornecedores sem paginar (usado em seletores)

    def _sync_ibge(self, serializer):
        cidade = serializer.validated_data.get('cidade')
        if not cidade and serializer.instance:
            cidade = serializer.instance.cidade
            
        estado = serializer.validated_data.get('estado')
        if not estado and serializer.instance:
            estado = serializer.instance.estado
            
        cod_ibge = serializer.validated_data.get('codigo_municipio_ibge')
        cep = serializer.validated_data.get('cep')
        if not cep and serializer.instance:
            cep = serializer.instance.cep

        # 1. Se veio código IBGE informado
        if cod_ibge:
            cod_clean = re.sub(r'[^\d]', '', str(cod_ibge)).strip()
            if len(cod_clean) >= 7:
                serializer.validated_data['codigo_municipio_ibge'] = cod_clean[:7]
                if cidade and estado:
                    try:
                        CodigoMunicipio.objects.get_or_create(
                            codigo_ibge=cod_clean[:7],
                            defaults={'nome_municipio': cidade.strip(), 'uf': estado.strip().upper()[:2]}
                        )
                    except Exception:
                        pass
                return

        # 2. Se não veio código IBGE mas tem CEP, tentar buscar via ViaCEP
        if cep:
            cep_clean = re.sub(r'\D', '', str(cep))
            if len(cep_clean) == 8:
                try:
                    url = f"https://viacep.com.br/ws/{cep_clean}/json/"
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=3) as response:
                        data = json.loads(response.read().decode())
                        if not data.get('erro') and data.get('ibge'):
                            ibge_val = str(data.get('ibge')).strip()[:7]
                            serializer.validated_data['codigo_municipio_ibge'] = ibge_val
                            if data.get('localidade') and data.get('uf'):
                                CodigoMunicipio.objects.get_or_create(
                                    codigo_ibge=ibge_val,
                                    defaults={'nome_municipio': data.get('localidade'), 'uf': data.get('uf')}
                                )
                            return
                except Exception:
                    pass

        # 3. Tentar buscar da tabela codigo_municipio por Cidade e UF
        if cidade and estado:
            try:
                mun = CodigoMunicipio.objects.filter(
                    nome_municipio__iexact=cidade.strip(),
                    uf__iexact=estado.strip().upper()[:2]
                ).first()
                if mun:
                    serializer.validated_data['codigo_municipio_ibge'] = mun.codigo_ibge[:7]
            except Exception:
                pass

    def perform_create(self, serializer):
        self._sync_ibge(serializer)
        serializer.save()

    def perform_update(self, serializer):
        self._sync_ibge(serializer)
        serializer.save()


