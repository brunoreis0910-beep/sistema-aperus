"""
Módulo Clínica Veterinária — Serializers + ViewSets
Rotas:
  /api/veterinarios/
  /api/consultas-vet/
  /api/vacinas-pet/
  /api/exames-vet/
  /api/internacoes-vet/
"""
from rest_framework import viewsets, serializers, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import (
    Veterinario, ConsultaVeterinaria, VacinaAplicada,
    ExameLaboratorial, Internacao, Pet, Cliente
)


# ─────────────────────────────────────────────────────────────────
#  SERIALIZERS
# ─────────────────────────────────────────────────────────────────

class VeterinarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veterinario
        fields = '__all__'


class ConsultaVeterinariaSerializer(serializers.ModelSerializer):
    nome_pet = serializers.CharField(source='id_pet.nome_pet', read_only=True)
    especie_pet = serializers.CharField(source='id_pet.especie', read_only=True)
    nome_cliente = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    nome_veterinario = serializers.SerializerMethodField()
    tipo_consulta_display = serializers.CharField(source='get_tipo_consulta_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ConsultaVeterinaria
        fields = '__all__'

    def get_nome_veterinario(self, obj):
        if obj.id_veterinario:
            return f"Dr(a). {obj.id_veterinario.nome}"
        return None


class VacinaAplicadaSerializer(serializers.ModelSerializer):
    nome_pet = serializers.CharField(source='id_pet.nome_pet', read_only=True)
    especie_pet = serializers.CharField(source='id_pet.especie', read_only=True)
    nome_cliente = serializers.SerializerMethodField()
    nome_veterinario = serializers.SerializerMethodField()
    vencida = serializers.SerializerMethodField()

    class Meta:
        model = VacinaAplicada
        fields = '__all__'

    def get_nome_cliente(self, obj):
        return obj.id_pet.id_cliente.nome_razao_social if obj.id_pet.id_cliente else None

    def get_nome_veterinario(self, obj):
        if obj.id_veterinario:
            return f"Dr(a). {obj.id_veterinario.nome}"
        return None

    def get_vencida(self, obj):
        if obj.proxima_dose:
            return obj.proxima_dose < timezone.now().date()
        return False


class ExameLaboratorialSerializer(serializers.ModelSerializer):
    nome_pet = serializers.CharField(source='id_pet.nome_pet', read_only=True)
    especie_pet = serializers.CharField(source='id_pet.especie', read_only=True)
    nome_cliente = serializers.SerializerMethodField()
    nome_veterinario = serializers.SerializerMethodField()
    tipo_exame_display = serializers.CharField(source='get_tipo_exame_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ExameLaboratorial
        fields = '__all__'

    def get_nome_cliente(self, obj):
        return obj.id_pet.id_cliente.nome_razao_social if obj.id_pet.id_cliente else None

    def get_nome_veterinario(self, obj):
        if obj.id_veterinario:
            return f"Dr(a). {obj.id_veterinario.nome}"
        return None


class InternacaoSerializer(serializers.ModelSerializer):
    nome_pet = serializers.CharField(source='id_pet.nome_pet', read_only=True)
    especie_pet = serializers.CharField(source='id_pet.especie', read_only=True)
    nome_cliente = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    nome_veterinario = serializers.SerializerMethodField()
    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)
    alta_concedida = serializers.BooleanField(read_only=True)
    dias_internado = serializers.SerializerMethodField()

    class Meta:
        model = Internacao
        fields = '__all__'

    def get_nome_veterinario(self, obj):
        if obj.id_veterinario:
            return f"Dr(a). {obj.id_veterinario.nome}"
        return None

    def get_dias_internado(self, obj):
        fim = obj.data_alta or timezone.now()
        inicio = obj.data_entrada
        if hasattr(fim, 'date'):
            fim = fim.date()
        if hasattr(inicio, 'date'):
            inicio = inicio.date()
        delta = fim - inicio
        return max(delta.days, 1)


#Serializer simplificado para o Pet com campos da clínica
class PetClinicaSerializer(serializers.ModelSerializer):
    nome_cliente = serializers.CharField(source='id_cliente.nome_razao_social', read_only=True)
    telefone_cliente = serializers.CharField(source='id_cliente.telefone', read_only=True)
    total_consultas = serializers.SerializerMethodField()
    ultima_consulta = serializers.SerializerMethodField()
    vacinas_vencendo = serializers.SerializerMethodField()
    internado = serializers.SerializerMethodField()

    class Meta:
        model = Pet
        fields = [
            'id_pet', 'nome_pet', 'especie', 'raca', 'sexo', 'data_nascimento',
            'peso', 'cor', 'microchip', 'observacoes', 'data_cadastro',
            'id_cliente', 'nome_cliente', 'telefone_cliente',
            'total_consultas', 'ultima_consulta', 'vacinas_vencendo', 'internado',
        ]

    def get_total_consultas(self, obj):
        return obj.consultas.count()

    def get_ultima_consulta(self, obj):
        ultima = obj.consultas.order_by('-data_consulta').first()
        if ultima:
            return str(ultima.data_consulta)[:16]
        return None

    def get_vacinas_vencendo(self, obj):
        hoje = timezone.now().date()
        em_30_dias = hoje.replace(day=min(hoje.day, 28)) if False else \
            (hoje.replace(month=hoje.month % 12 + 1, day=1) if hoje.day > 1 else hoje)
        # Próximas vacinas nos próximos 30 dias
        import datetime
        prazo = hoje + datetime.timedelta(days=30)
        return obj.vacinas.filter(
            proxima_dose__isnull=False,
            proxima_dose__lte=prazo
        ).count()

    def get_internado(self, obj):
        return obj.internacoes.filter(data_alta__isnull=True).exists()


# ─────────────────────────────────────────────────────────────────
#  VIEWSETS
# ─────────────────────────────────────────────────────────────────

class VeterinarioViewSet(viewsets.ModelViewSet):
    queryset = Veterinario.objects.all()
    serializer_class = VeterinarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'crmv', 'especialidade']
    ordering_fields = ['nome']
    pagination_class = None


class ConsultaVeterinariaViewSet(viewsets.ModelViewSet):
    queryset = ConsultaVeterinaria.objects.select_related(
        'id_pet', 'id_cliente', 'id_veterinario'
    ).all()
    serializer_class = ConsultaVeterinariaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_pet', 'id_cliente', 'id_veterinario', 'status', 'tipo_consulta']
    search_fields = ['id_pet__nome_pet', 'id_cliente__nome_razao_social', 'diagnostico', 'queixa_principal']
    ordering_fields = ['data_consulta', 'status']

    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        consulta = self.get_object()
        consulta.status = 'Em Atendimento'
        consulta.save(update_fields=['status', 'data_modificacao'])
        return Response({'status': 'consulta iniciada'})

    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        consulta = self.get_object()
        consulta.status = 'Concluída'
        consulta.save(update_fields=['status', 'data_modificacao'])
        return Response({'status': 'consulta concluída'})

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        consulta = self.get_object()
        consulta.status = 'Cancelada'
        consulta.save(update_fields=['status', 'data_modificacao'])
        return Response({'status': 'consulta cancelada'})

    @action(detail=False, methods=['get'])
    def agenda_hoje(self, request):
        """Consultas do dia atual"""
        hoje = timezone.now().date()
        qs = self.get_queryset().filter(
            data_consulta__date=hoje
        ).exclude(status='Cancelada').order_by('data_consulta')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class VacinaAplicadaViewSet(viewsets.ModelViewSet):
    queryset = VacinaAplicada.objects.select_related(
        'id_pet', 'id_pet__id_cliente', 'id_veterinario'
    ).all()
    serializer_class = VacinaAplicadaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_pet', 'id_veterinario']
    search_fields = ['id_pet__nome_pet', 'nome_vacina', 'fabricante']
    ordering_fields = ['data_aplicacao', 'proxima_dose']

    @action(detail=False, methods=['get'])
    def vencendo(self, request):
        """Vacinas com próxima dose nos próximos 30 dias"""
        import datetime
        hoje = timezone.now().date()
        prazo = hoje + datetime.timedelta(days=30)
        qs = self.get_queryset().filter(
            proxima_dose__isnull=False,
            proxima_dose__lte=prazo,
        ).order_by('proxima_dose')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ExameLaboratorialViewSet(viewsets.ModelViewSet):
    queryset = ExameLaboratorial.objects.select_related(
        'id_pet', 'id_pet__id_cliente', 'id_veterinario', 'id_consulta'
    ).all()
    serializer_class = ExameLaboratorialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_pet', 'id_veterinario', 'status', 'tipo_exame']
    search_fields = ['id_pet__nome_pet', 'tipo_exame', 'descricao', 'laboratorio']
    ordering_fields = ['data_solicitacao', 'status']

    @action(detail=True, methods=['post'])
    def registrar_resultado(self, request, pk=None):
        exame = self.get_object()
        resultado = request.data.get('resultado', '')
        exame.resultado = resultado
        exame.status = 'Concluído'
        exame.data_resultado = timezone.now().date()
        exame.save(update_fields=['resultado', 'status', 'data_resultado'])
        return Response({'status': 'resultado registrado'})


class InternacaoViewSet(viewsets.ModelViewSet):
    queryset = Internacao.objects.select_related(
        'id_pet', 'id_cliente', 'id_veterinario'
    ).all()
    serializer_class = InternacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_pet', 'id_cliente', 'id_veterinario', 'motivo']
    search_fields = ['id_pet__nome_pet', 'id_cliente__nome_razao_social', 'motivo', 'numero_baia']
    ordering_fields = ['data_entrada', 'data_alta']

    @action(detail=False, methods=['get'])
    def internados_ativos(self, request):
        """Pets atualmente internados (sem data de alta)"""
        qs = self.get_queryset().filter(data_alta__isnull=True).order_by('data_entrada')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def dar_alta(self, request, pk=None):
        internacao = self.get_object()
        internacao.data_alta = timezone.now()
        valor = request.data.get('valor_total')
        if valor is not None:
            internacao.valor_total = valor
        obs = request.data.get('observacoes_alta')
        if obs:
            internacao.observacoes = (internacao.observacoes or '') + f'\n\n[ALTA] {obs}'
        internacao.save(update_fields=['data_alta', 'valor_total', 'observacoes', 'data_modificacao'])
        return Response({'status': 'alta concedida'})


class PetClinicaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet read-only com informações clínicas dos pets (para prontuário)"""
    queryset = Pet.objects.select_related('id_cliente').prefetch_related(
        'consultas', 'vacinas', 'exames', 'internacoes'
    ).all()
    serializer_class = PetClinicaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['id_cliente', 'especie', 'sexo']
    search_fields = ['nome_pet', 'raca', 'microchip', 'id_cliente__nome_razao_social']
    ordering_fields = ['nome_pet', 'data_cadastro']
    pagination_class = None

    @action(detail=True, methods=['get'])
    def prontuario(self, request, pk=None):
        """Prontuário completo de um pet"""
        pet = self.get_object()
        consultas = ConsultaVeterinariaSerializer(
            pet.consultas.order_by('-data_consulta'), many=True
        ).data
        vacinas = VacinaAplicadaSerializer(
            pet.vacinas.order_by('-data_aplicacao'), many=True
        ).data
        exames = ExameLaboratorialSerializer(
            pet.exames.order_by('-data_solicitacao'), many=True
        ).data
        internacoes = InternacaoSerializer(
            pet.internacoes.order_by('-data_entrada'), many=True
        ).data
        return Response({
            'pet': PetClinicaSerializer(pet).data,
            'consultas': consultas,
            'vacinas': vacinas,
            'exames': exames,
            'internacoes': internacoes,
        })
