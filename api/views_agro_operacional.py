from decimal import Decimal
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated

from .models import (
    Safra, Talhao, DespesaAgro, MaquinarioAgro,
    LancamentoMaquinario, MaoDeObraAgro, LancamentoMaoDeObra
)


# ──────────────────────────────────────────────────
# SERIALIZERS
# ──────────────────────────────────────────────────

class TalhaoSerializer(serializers.ModelSerializer):
    descricao_safra        = serializers.CharField(source='id_safra.descricao', read_only=True)
    cultura_display        = serializers.CharField(source='get_cultura_display', read_only=True)
    status_display         = serializers.CharField(source='get_status_display', read_only=True)
    producao_prevista_sacas = serializers.SerializerMethodField()
    producao_real_sacas    = serializers.SerializerMethodField()
    custo_total            = serializers.SerializerMethodField()

    class Meta:
        model = Talhao
        fields = '__all__'

    def get_producao_prevista_sacas(self, obj):
        return obj.producao_prevista_sacas

    def get_producao_real_sacas(self, obj):
        return obj.producao_real_sacas

    def get_custo_total(self, obj):
        desp = obj.despesas.aggregate(t=Sum('valor'))['t'] or Decimal('0')
        mdo  = obj.lancamentos_mdo.aggregate(t=Sum('valor_total'))['t'] or Decimal('0')
        maq  = obj.lancamentos_maquinario.aggregate(t=Sum('valor_total'))['t'] or Decimal('0')
        return float(desp + mdo + maq)


class DespesaAgroSerializer(serializers.ModelSerializer):
    descricao_safra   = serializers.CharField(source='id_safra.descricao', read_only=True)
    nome_talhao       = serializers.CharField(source='id_talhao.nome', read_only=True)
    categoria_display = serializers.CharField(source='get_categoria_display', read_only=True)
    custo_por_hectare = serializers.SerializerMethodField()

    class Meta:
        model = DespesaAgro
        fields = '__all__'

    def get_custo_por_hectare(self, obj):
        return obj.custo_por_hectare


class MaquinarioAgroSerializer(serializers.ModelSerializer):
    tipo_display   = serializers.CharField(source='get_tipo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_horas    = serializers.SerializerMethodField()
    total_custo    = serializers.SerializerMethodField()

    class Meta:
        model = MaquinarioAgro
        fields = '__all__'

    def get_total_horas(self, obj):
        return float(obj.lancamentos.aggregate(t=Sum('horas_trabalhadas'))['t'] or 0)

    def get_total_custo(self, obj):
        return float(obj.lancamentos.aggregate(t=Sum('valor_total'))['t'] or 0)


class LancamentoMaquinarioSerializer(serializers.ModelSerializer):
    descricao_safra   = serializers.CharField(source='id_safra.descricao', read_only=True)
    nome_talhao       = serializers.CharField(source='id_talhao.nome', read_only=True)
    nome_maquinario   = serializers.CharField(source='id_maquinario.nome', read_only=True)
    operacao_display  = serializers.CharField(source='get_operacao_display', read_only=True)

    class Meta:
        model = LancamentoMaquinario
        fields = '__all__'


class MaoDeObraAgroSerializer(serializers.ModelSerializer):
    tipo_display       = serializers.CharField(source='get_tipo_display', read_only=True)
    total_lancamentos  = serializers.SerializerMethodField()
    total_pago         = serializers.SerializerMethodField()

    class Meta:
        model = MaoDeObraAgro
        fields = '__all__'

    def get_total_lancamentos(self, obj):
        return obj.lancamentos.count()

    def get_total_pago(self, obj):
        return float(obj.lancamentos.aggregate(t=Sum('valor_total'))['t'] or 0)


class LancamentoMdoSerializer(serializers.ModelSerializer):
    descricao_safra    = serializers.CharField(source='id_safra.descricao', read_only=True)
    nome_talhao        = serializers.CharField(source='id_talhao.nome', read_only=True)
    nome_trabalhador   = serializers.SerializerMethodField()
    atividade_display  = serializers.CharField(source='get_atividade_display', read_only=True)
    tipo_pagamento_display = serializers.CharField(source='get_tipo_pagamento_display', read_only=True)

    class Meta:
        model = LancamentoMaoDeObra
        fields = '__all__'

    def get_nome_trabalhador(self, obj):
        if obj.id_trabalhador:
            return obj.id_trabalhador.nome
        return obj.nome_avulso or 'Avulso'


# ──────────────────────────────────────────────────
# VIEWSETS
# ──────────────────────────────────────────────────

class TalhaoViewSet(viewsets.ModelViewSet):
    queryset = Talhao.objects.select_related('id_safra').all()
    serializer_class = TalhaoSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        safra = self.request.query_params.get('safra')
        status = self.request.query_params.get('status')
        if safra:
            qs = qs.filter(id_safra=safra)
        if status:
            qs = qs.filter(status=status)
        return qs

    @action(detail=False, methods=['get'])
    def resumo_por_safra(self, request):
        safra_id = request.query_params.get('safra')
        qs = self.get_queryset()
        if safra_id:
            qs = qs.filter(id_safra=safra_id)
        total_ha = qs.aggregate(t=Sum('area_hectares'))['t'] or 0
        por_cultura = list(
            qs.values('cultura').annotate(
                ha=Sum('area_hectares'), qtd=Count('id_talhao')
            )
        )
        return Response({
            'total_ha': float(total_ha),
            'total_talhoes': qs.count(),
            'por_cultura': por_cultura,
        })


class DespesaAgroViewSet(viewsets.ModelViewSet):
    queryset = DespesaAgro.objects.select_related('id_safra', 'id_talhao').all()
    serializer_class = DespesaAgroSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        safra = self.request.query_params.get('safra')
        talhao = self.request.query_params.get('talhao')
        categoria = self.request.query_params.get('categoria')
        if safra:
            qs = qs.filter(id_safra=safra)
        if talhao:
            qs = qs.filter(id_talhao=talhao)
        if categoria:
            qs = qs.filter(categoria=categoria)
        return qs

    @action(detail=False, methods=['get'])
    def resumo(self, request):
        safra_id = request.query_params.get('safra')
        qs = self.get_queryset()
        if safra_id:
            qs = qs.filter(id_safra=safra_id)
        total = qs.aggregate(t=Sum('valor'))['t'] or Decimal('0')
        por_categoria = list(
            qs.values('categoria').annotate(total=Sum('valor')).order_by('-total')
        )
        return Response({
            'total_geral': float(total),
            'por_categoria': por_categoria,
        })


class MaquinarioAgroViewSet(viewsets.ModelViewSet):
    queryset = MaquinarioAgro.objects.all()
    serializer_class = MaquinarioAgroSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        tipo = self.request.query_params.get('tipo')
        status = self.request.query_params.get('status')
        ativo = self.request.query_params.get('ativo')
        if tipo:
            qs = qs.filter(tipo=tipo)
        if status:
            qs = qs.filter(status=status)
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == 'true')
        return qs


class LancamentoMaquinarioViewSet(viewsets.ModelViewSet):
    queryset = LancamentoMaquinario.objects.select_related('id_safra', 'id_talhao', 'id_maquinario').all()
    serializer_class = LancamentoMaquinarioSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        safra = self.request.query_params.get('safra')
        talhao = self.request.query_params.get('talhao')
        maquinario = self.request.query_params.get('maquinario')
        if safra:
            qs = qs.filter(id_safra=safra)
        if talhao:
            qs = qs.filter(id_talhao=talhao)
        if maquinario:
            qs = qs.filter(id_maquinario=maquinario)
        return qs

    @action(detail=False, methods=['get'])
    def resumo(self, request):
        safra_id = request.query_params.get('safra')
        qs = self.get_queryset()
        if safra_id:
            qs = qs.filter(id_safra=safra_id)
        total_horas = qs.aggregate(t=Sum('horas_trabalhadas'))['t'] or 0
        total_custo = qs.aggregate(t=Sum('valor_total'))['t'] or 0
        por_maquinario = list(
            qs.values('id_maquinario__nome').annotate(
                horas=Sum('horas_trabalhadas'), custo=Sum('valor_total')
            ).order_by('-custo')
        )
        return Response({
            'total_horas': float(total_horas),
            'total_custo': float(total_custo),
            'por_maquinario': por_maquinario,
        })


class MaoDeObraAgroViewSet(viewsets.ModelViewSet):
    queryset = MaoDeObraAgro.objects.all()
    serializer_class = MaoDeObraAgroSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        ativo = self.request.query_params.get('ativo')
        tipo = self.request.query_params.get('tipo')
        if ativo is not None:
            qs = qs.filter(ativo=ativo.lower() == 'true')
        if tipo:
            qs = qs.filter(tipo=tipo)
        return qs


class LancamentoMdoViewSet(viewsets.ModelViewSet):
    queryset = LancamentoMaoDeObra.objects.select_related(
        'id_safra', 'id_talhao', 'id_trabalhador'
    ).all()
    serializer_class = LancamentoMdoSerializer
    pagination_class = None
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        safra = self.request.query_params.get('safra')
        talhao = self.request.query_params.get('talhao')
        trabalhador = self.request.query_params.get('trabalhador')
        atividade = self.request.query_params.get('atividade')
        if safra:
            qs = qs.filter(id_safra=safra)
        if talhao:
            qs = qs.filter(id_talhao=talhao)
        if trabalhador:
            qs = qs.filter(id_trabalhador=trabalhador)
        if atividade:
            qs = qs.filter(atividade=atividade)
        return qs

    @action(detail=False, methods=['get'])
    def resumo(self, request):
        safra_id = request.query_params.get('safra')
        qs = self.get_queryset()
        if safra_id:
            qs = qs.filter(id_safra=safra_id)
        total = qs.aggregate(t=Sum('valor_total'))['t'] or 0
        por_atividade = list(
            qs.values('atividade').annotate(
                total=Sum('valor_total'), qtd=Count('id_lancamento_mdo')
            ).order_by('-total')
        )
        return Response({
            'total_geral': float(total),
            'total_lancamentos': qs.count(),
            'por_atividade': por_atividade,
        })
