from rest_framework import viewsets, serializers
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Operacao, ConjuntoOperacao, OperacaoNumeracao, Numeracao


# ===========================
# NUMERAÇÃO (tabela numeracao)
# ===========================

class NumeracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Numeracao
        fields = ['id_numeracao', 'descricao', 'numeracao']


class NumeracaoViewSet(viewsets.ModelViewSet):
    queryset = Numeracao.objects.all().order_by('descricao')
    serializer_class = NumeracaoSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class OperacaoSerializer(serializers.ModelSerializer):
    numeracao_descricao = serializers.SerializerMethodField()

    class Meta:
        model = Operacao
        # expõe todos os campos do modelo, incluindo os novos campos de incremento
        fields = '__all__'

    def get_numeracao_descricao(self, obj):
        if obj.id_numeracao:
            return f"{obj.id_numeracao.descricao} ({obj.id_numeracao.numeracao})"
        return None


class OperacaoViewSet(viewsets.ModelViewSet):
    queryset = Operacao.objects.all().order_by('nome_operacao')
    serializer_class = OperacaoSerializer
    permission_classes = [AllowAny]
    pagination_class = None # Desabilitar paginacao para retornar tudo
    
    def list(self, request, *args, **kwargs):
        print("🔍 LISTAR OPERACOES - REQUEST RECEBIDA")
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        print("=" * 60)
        print("🆕 CRIAR NOVA OPERAÇÃO")
        print("=" * 60)
        print("📥 Dados recebidos:", request.data)
        print("💰 cashback_percentual:", request.data.get('cashback_percentual'))
        print("📅 cashback_validade_dias:", request.data.get('cashback_validade_dias'))
        print("=" * 60)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        print("=" * 60)
        print("✏️ ATUALIZAR OPERAÇÃO")
        print("=" * 60)
        print("📥 Dados recebidos:", request.data)
        print("💰 cashback_percentual:", request.data.get('cashback_percentual'))
        print("📅 cashback_validade_dias:", request.data.get('cashback_validade_dias'))
        print("=" * 60)
        response = super().update(request, *args, **kwargs)
        self._sincronizar_numeracao(request)
        return response
    
    def partial_update(self, request, *args, **kwargs):
        print("=" * 60)
        print("📝 PATCH OPERAÇÃO")
        print("=" * 60)
        print("📥 Dados recebidos:", request.data)
        print("💰 cashback_percentual:", request.data.get('cashback_percentual'))
        print("📅 cashback_validade_dias:", request.data.get('cashback_validade_dias'))
        print("=" * 60)
        response = super().partial_update(request, *args, **kwargs)
        self._sincronizar_numeracao(request)
        return response

    def _sincronizar_numeracao(self, request):
        """Após salvar a Operação, sincroniza Numeracao.numeracao com proximo_numero_nf."""
        novo_proximo = request.data.get('proximo_numero_nf')
        id_numeracao = request.data.get('id_numeracao')
        if novo_proximo is not None and id_numeracao:
            try:
                num_obj = Numeracao.objects.get(pk=id_numeracao)
                num_obj.numeracao = str(int(novo_proximo))
                num_obj.save()
            except (Numeracao.DoesNotExist, ValueError, TypeError):
                pass


class ConjuntoOperacaoSerializer(serializers.ModelSerializer):
    """Serializer para conjunto de operações com operações aninhadas"""
    operacoes = OperacaoSerializer(many=True, read_only=True)
    operacoes_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Operacao.objects.all(),
        write_only=True,
        source='operacoes',
        required=False
    )
    
    class Meta:
        model = ConjuntoOperacao
        fields = [
            'id_conjunto',
            'nome_conjunto',
            'descricao',
            'operacoes',
            'operacoes_ids',
            'ativo',
            'data_criacao',
            'data_modificacao'
        ]
        read_only_fields = ['id_conjunto', 'data_criacao', 'data_modificacao']


class ConjuntoOperacaoViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar conjuntos de operações"""
    queryset = ConjuntoOperacao.objects.all().prefetch_related('operacoes').order_by('nome_conjunto')
    serializer_class = ConjuntoOperacaoSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Desabilitar paginação
    
    def create(self, request, *args, **kwargs):
        print("=" * 60)
        print("🆕 CRIAR NOVO CONJUNTO DE OPERAÇÕES")
        print("=" * 60)
        print("📥 Dados recebidos:", request.data)
        print("=" * 60)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        print("=" * 60)
        print("✏️ ATUALIZAR CONJUNTO DE OPERAÇÕES")
        print("=" * 60)
        print("📥 Dados recebidos:", request.data)
        print("=" * 60)
        return super().update(request, *args, **kwargs)


# ===========================
# NUMERAÇÃO DE OPERAÇÕES
# ===========================

class OperacaoNumeracaoSerializer(serializers.ModelSerializer):
    operacao_nome = serializers.CharField(source='id_operacao.nome_operacao', read_only=True)
    ambiente_display = serializers.CharField(source='get_ambiente_display', read_only=True)

    class Meta:
        model = OperacaoNumeracao
        fields = [
            'id_numeracao',
            'id_operacao',
            'operacao_nome',
            'serie',
            'ambiente',
            'ambiente_display',
            'numero_inicial',
            'numero_atual',
            'ativo',
            'criado_em',
            'atualizado_em',
        ]
        read_only_fields = ['id_numeracao', 'criado_em', 'atualizado_em']


class OperacaoNumeracaoViewSet(viewsets.ModelViewSet):
    queryset = OperacaoNumeracao.objects.all().select_related('id_operacao').order_by('id_operacao', 'serie')
    serializer_class = OperacaoNumeracaoSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        operacao_id = self.request.query_params.get('id_operacao')
        if operacao_id:
            qs = qs.filter(id_operacao=operacao_id)
        return qs

    @action(detail=False, methods=['get'], url_path='por-operacao/(?P<operacao_id>[^/.]+)')
    def por_operacao(self, request, operacao_id=None):
        numeracoes = OperacaoNumeracao.objects.filter(id_operacao=operacao_id).order_by('serie', 'ambiente')
        serializer = self.get_serializer(numeracoes, many=True)
        return Response(serializer.data)
