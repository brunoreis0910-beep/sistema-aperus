"""
views_rh.py — RH: Funcionários, Ponto, Holerite, EPI
"""
import logging
from datetime import date, datetime
from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models_rh import (
    Funcionario, RegistroPonto, Holerite,
    CategoriaEPI, EPI, EntregaEPI, OcorrenciaFuncionario,
)

logger = logging.getLogger(__name__)

# ── Serializers ──────────────────────────────────────────────────────────────


class FuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = '__all__'


class FuncionarioResumoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Funcionario
        fields = ['id_funcionario', 'nome_completo', 'matricula', 'cargo', 'departamento', 'ativo']


class RegistroPontoSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.SerializerMethodField()

    class Meta:
        model = RegistroPonto
        fields = '__all__'

    def get_funcionario_nome(self, obj):
        return obj.funcionario.nome_completo


class HoleriteSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.SerializerMethodField()

    class Meta:
        model = Holerite
        fields = '__all__'

    def get_funcionario_nome(self, obj):
        return obj.funcionario.nome_completo


class OcorrenciaFuncionarioSerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.SerializerMethodField()
    tipo_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = OcorrenciaFuncionario
        fields = '__all__'

    def get_funcionario_nome(self, obj):
        return obj.funcionario.nome_completo

    def get_tipo_display(self, obj):
        return obj.get_tipo_display()

    def get_status_display(self, obj):
        return obj.get_status_display()


class CategoriaEPISerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaEPI
        fields = '__all__'


class EPISerializer(serializers.ModelSerializer):
    categoria_nome = serializers.SerializerMethodField()

    class Meta:
        model = EPI
        fields = '__all__'

    def get_categoria_nome(self, obj):
        return obj.categoria.nome if obj.categoria else None


class EntregaEPISerializer(serializers.ModelSerializer):
    funcionario_nome = serializers.SerializerMethodField()
    epi_nome = serializers.SerializerMethodField()

    class Meta:
        model = EntregaEPI
        fields = '__all__'

    def get_funcionario_nome(self, obj):
        return obj.funcionario.nome_completo

    def get_epi_nome(self, obj):
        return obj.epi.nome


# ── ViewSets ─────────────────────────────────────────────────────────────────


class FuncionarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return FuncionarioResumoSerializer
        return FuncionarioSerializer

    def get_queryset(self):
        qs = Funcionario.objects.all()
        ativo = self.request.query_params.get('ativo')
        departamento = self.request.query_params.get('departamento')
        q = self.request.query_params.get('q')

        if ativo is not None:
            qs = qs.filter(ativo=ativo in ('1', 'true', 'True'))
        else:
            qs = qs.filter(ativo=True)
        if departamento:
            qs = qs.filter(departamento=departamento)
        if q:
            qs = qs.filter(nome_completo__icontains=q)
        return qs.order_by('nome_completo')

    @action(detail=False, methods=['get'])
    def departamentos(self, request):
        deps = Funcionario.objects.filter(ativo=True).values_list('departamento', flat=True).distinct()
        return Response(sorted(d for d in deps if d))

    @action(detail=True, methods=['get'])
    def espelho_ponto(self, request, pk=None):
        """Retorna espelho de ponto do funcionário no mês/ano."""
        funcionario = self.get_object()
        mes = int(request.query_params.get('mes', date.today().month))
        ano = int(request.query_params.get('ano', date.today().year))

        pontos = RegistroPonto.objects.filter(
            funcionario=funcionario,
            data_hora__month=mes,
            data_hora__year=ano,
        ).order_by('data_hora')

        return Response({
            'funcionario': FuncionarioResumoSerializer(funcionario).data,
            'mes': mes,
            'ano': ano,
            'registros': RegistroPontoSerializer(pontos, many=True).data,
        })


class RegistroPontoViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroPontoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = RegistroPonto.objects.select_related('funcionario').all()
        funcionario = self.request.query_params.get('funcionario')
        data = self.request.query_params.get('data')

        if funcionario:
            qs = qs.filter(funcionario_id=funcionario)
        from datetime import datetime, timedelta
        from django.utils import timezone as dj_tz

        if data:
            try:
                dt = datetime.strptime(data, '%Y-%m-%d')
                qs = qs.filter(data_hora__gte=dj_tz.make_aware(dt),
                               data_hora__lt=dj_tz.make_aware(dt + timedelta(days=1)))
            except ValueError:
                pass

        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        if data_inicio:
            try:
                dt = datetime.strptime(data_inicio, '%Y-%m-%d')
                qs = qs.filter(data_hora__gte=dj_tz.make_aware(dt))
            except ValueError:
                pass
        if data_fim:
            try:
                dt = datetime.strptime(data_fim, '%Y-%m-%d')
                qs = qs.filter(data_hora__lt=dj_tz.make_aware(dt + timedelta(days=1)))
            except ValueError:
                pass

        return qs.order_by('data_hora')

    @action(detail=False, methods=['post'])
    def registrar(self, request):
        """Registra batida de ponto (ENTRADA / SAIDA_ALMOCO / RETORNO_ALMOCO / SAIDA)."""
        from django.utils import timezone
        funcionario_id = request.data.get('funcionario_id')
        tipo = request.data.get('tipo', 'ENTRADA')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        observacao = request.data.get('observacao', '')

        try:
            funcionario = Funcionario.objects.get(id_funcionario=funcionario_id, ativo=True)
        except Funcionario.DoesNotExist:
            return Response({'erro': 'Funcionário não encontrado.'}, status=404)

        ponto = RegistroPonto.objects.create(
            funcionario=funcionario,
            tipo=tipo,
            data_hora=timezone.now(),
            latitude=latitude or None,
            longitude=longitude or None,
            observacao=observacao,
        )
        return Response(RegistroPontoSerializer(ponto).data, status=201)


class HoleriteViewSet(viewsets.ModelViewSet):
    serializer_class = HoleriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Holerite.objects.select_related('funcionario').all()
        funcionario = self.request.query_params.get('funcionario')
        mes = self.request.query_params.get('mes')
        ano = self.request.query_params.get('ano')
        status_f = self.request.query_params.get('status')

        if funcionario:
            qs = qs.filter(funcionario_id=funcionario)
        if mes:
            qs = qs.filter(mes=mes)
        if ano:
            qs = qs.filter(ano=ano)
        if status_f:
            qs = qs.filter(status=status_f)
        return qs.order_by('-ano', '-mes')

    @action(detail=False, methods=['post'])
    def calcular(self, request):
        """Calcula/gera holerite para um funcionário no mês/ano."""
        funcionario_id = request.data.get('funcionario_id')
        mes = int(request.data.get('mes', date.today().month))
        ano = int(request.data.get('ano', date.today().year))

        try:
            funcionario = Funcionario.objects.get(id_funcionario=funcionario_id)
        except Funcionario.DoesNotExist:
            return Response({'erro': 'Funcionário não encontrado.'}, status=404)

        holerite, criado = Holerite.objects.get_or_create(
            funcionario=funcionario,
            mes=mes,
            ano=ano,
            defaults={
                'competencia': f'{mes:02d}/{ano}',
                'salario_base': funcionario.salario_base,
                'status': 'RASCUNHO',
            }
        )

        if not criado and holerite.status == 'APROVADO':
            return Response({'erro': 'Holerite já aprovado.'}, status=400)

        holerite.salario_base = funcionario.salario_base

        # ── Integrar dias trabalhados do ponto ──────────────────────────────
        import calendar
        from django.utils import timezone as dj_tz
        from decimal import Decimal
        from datetime import timedelta

        dt_inicio = datetime(ano, mes, 1)
        ultimo_dia = calendar.monthrange(ano, mes)[1]
        dt_fim_prox = datetime(ano, mes, ultimo_dia) + timedelta(days=1)

        pontos_entradas = RegistroPonto.objects.filter(
            funcionario=funcionario,
            tipo='ENTRADA',
            data_hora__gte=dj_tz.make_aware(dt_inicio),
            data_hora__lt=dj_tz.make_aware(dt_fim_prox),
        ).values_list('data_hora', flat=True)

        dias_com_ponto = {p.date() for p in pontos_entradas}
        if dias_com_ponto:
            holerite.dias_trabalhados = len(dias_com_ponto)

        # ── Descontar faltas aprovadas ──────────────────────────────────────
        faltas_aprovadas = OcorrenciaFuncionario.objects.filter(
            funcionario=funcionario,
            desconta_salario=True,
            status='APROVADO',
            data_inicio__year=ano,
            data_inicio__month=mes,
        )
        total_dias_falta = sum(f.dias for f in faltas_aprovadas)
        if total_dias_falta > 0:
            desconto_faltas = (funcionario.salario_base / Decimal('30')) * Decimal(str(total_dias_falta))
            holerite.outros_descontos = desconto_faltas
            obs_extra = f'Desconto de {total_dias_falta} falta(s) injustificada(s)'
            holerite.observacoes = obs_extra if not holerite.observacoes else f'{holerite.observacoes} | {obs_extra}'
        else:
            holerite.outros_descontos = Decimal('0')
        # ───────────────────────────────────────────────────────────────────

        holerite.calcular()
        holerite.save()

        return Response(HoleriteSerializer(holerite).data, status=200)

    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        holerite = self.get_object()
        if holerite.status == 'APROVADO':
            return Response({'erro': 'Holerite já aprovado.'}, status=400)
        holerite.status = 'APROVADO'
        holerite.aprovado_por = request.user
        holerite.save(update_fields=['status', 'aprovado_por'])
        return Response(HoleriteSerializer(holerite).data)


class OcorrenciaFuncionarioViewSet(viewsets.ModelViewSet):
    serializer_class = OcorrenciaFuncionarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = OcorrenciaFuncionario.objects.select_related('funcionario').all()
        funcionario = self.request.query_params.get('funcionario')
        tipo = self.request.query_params.get('tipo')
        mes = self.request.query_params.get('mes')
        ano = self.request.query_params.get('ano')
        status_f = self.request.query_params.get('status')

        if funcionario:
            qs = qs.filter(funcionario_id=funcionario)
        if tipo:
            qs = qs.filter(tipo=tipo)
        if mes:
            qs = qs.filter(data_inicio__month=mes)
        if ano:
            qs = qs.filter(data_inicio__year=ano)
        if status_f:
            qs = qs.filter(status=status_f)
        return qs.order_by('-data_inicio')

    def perform_create(self, serializer):
        serializer.save(registrado_por=self.request.user)

    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        oc = self.get_object()
        oc.status = 'APROVADO'
        oc.save(update_fields=['status'])
        return Response(OcorrenciaFuncionarioSerializer(oc).data)

    @action(detail=True, methods=['post'])
    def rejeitar(self, request, pk=None):
        oc = self.get_object()
        oc.status = 'REJEITADO'
        oc.save(update_fields=['status'])
        return Response(OcorrenciaFuncionarioSerializer(oc).data)


class CategoriaEPIViewSet(viewsets.ModelViewSet):
    queryset = CategoriaEPI.objects.all()
    serializer_class = CategoriaEPISerializer
    permission_classes = [IsAuthenticated]


class EPIViewSet(viewsets.ModelViewSet):
    serializer_class = EPISerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EPI.objects.select_related('categoria').all()
        ativo = self.request.query_params.get('ativo')
        estoque_baixo = self.request.query_params.get('estoque_baixo')

        if ativo is not None:
            qs = qs.filter(ativo=ativo in ('1', 'true', 'True'))
        if estoque_baixo == '1':
            from django.db.models import F
            qs = qs.filter(estoque_atual__lte=F('estoque_minimo'))
        return qs.order_by('nome')

    @action(detail=False, methods=['get'])
    def alertas_estoque(self, request):
        from django.db.models import F
        epis = EPI.objects.filter(
            ativo=True,
            estoque_atual__lte=F('estoque_minimo'),
        )
        return Response(EPISerializer(epis, many=True).data)


class EntregaEPIViewSet(viewsets.ModelViewSet):
    serializer_class = EntregaEPISerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = EntregaEPI.objects.select_related('funcionario', 'epi').all()
        funcionario = self.request.query_params.get('funcionario')
        epi = self.request.query_params.get('epi')

        if funcionario:
            qs = qs.filter(funcionario_id=funcionario)
        if epi:
            qs = qs.filter(epi_id=epi)
        return qs.order_by('-data_entrega')

    def perform_create(self, serializer):
        entrega = serializer.save(entregue_por=self.request.user)
        # Baixa no estoque
        epi = entrega.epi
        epi.estoque_atual = max(0, epi.estoque_atual - entrega.quantidade)
        epi.save(update_fields=['estoque_atual'])
