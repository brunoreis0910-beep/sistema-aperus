"""
views_crm.py — CRM: Pipeline Kanban, Leads, Atividades
"""
import logging
from rest_framework import viewsets, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone

from .models_crm import Lead, EtapaPipeline, OrigemLead, AtividadeLead

logger = logging.getLogger(__name__)

# ── Serializers ──────────────────────────────────────────────────────────────


class OrigemLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrigemLead
        fields = '__all__'


class EtapaPipelineSerializer(serializers.ModelSerializer):
    total_leads = serializers.SerializerMethodField()
    valor_total = serializers.SerializerMethodField()

    class Meta:
        model = EtapaPipeline
        fields = ['id_etapa', 'nome', 'ordem', 'cor', 'probabilidade', 'ativo', 'total_leads', 'valor_total']

    def get_total_leads(self, obj):
        return obj.leads.filter(status__in=['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO']).count()

    def get_valor_total(self, obj):
        from django.db.models import Sum
        total = obj.leads.filter(
            status__in=['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO'],
            valor_estimado__isnull=False,
        ).aggregate(s=Sum('valor_estimado'))['s']
        return float(total or 0)


class AtividadeLeadSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.SerializerMethodField()

    class Meta:
        model = AtividadeLead
        fields = '__all__'

    def get_responsavel_nome(self, obj):
        return obj.responsavel.get_full_name() or obj.responsavel.username if obj.responsavel else None


class LeadSerializer(serializers.ModelSerializer):
    etapa_nome = serializers.SerializerMethodField()
    origem_nome = serializers.SerializerMethodField()
    responsavel_nome = serializers.SerializerMethodField()
    atividades_pendentes = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = '__all__'

    def get_etapa_nome(self, obj):
        return obj.etapa.nome if obj.etapa else None

    def get_origem_nome(self, obj):
        return obj.origem.nome if obj.origem else None

    def get_responsavel_nome(self, obj):
        if obj.responsavel:
            return obj.responsavel.get_full_name() or obj.responsavel.username
        return None

    def get_atividades_pendentes(self, obj):
        return obj.atividades.filter(status='PENDENTE').count()


# ── ViewSets ─────────────────────────────────────────────────────────────────


class OrigemLeadViewSet(viewsets.ModelViewSet):
    queryset = OrigemLead.objects.filter(ativo=True)
    serializer_class = OrigemLeadSerializer
    permission_classes = [IsAuthenticated]


class EtapaPipelineViewSet(viewsets.ModelViewSet):
    queryset = EtapaPipeline.objects.filter(ativo=True).order_by('ordem')
    serializer_class = EtapaPipelineSerializer
    permission_classes = [IsAuthenticated]


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Lead.objects.select_related('etapa', 'origem', 'responsavel').all()
        status_f = self.request.query_params.get('status')
        etapa = self.request.query_params.get('etapa')
        responsavel = self.request.query_params.get('responsavel')
        q = self.request.query_params.get('q')

        if status_f:
            qs = qs.filter(status=status_f)
        if etapa:
            qs = qs.filter(etapa_id=etapa)
        if responsavel:
            qs = qs.filter(responsavel_id=responsavel)
        if q:
            qs = qs.filter(
                Q(nome__icontains=q) | Q(empresa__icontains=q)
                | Q(email__icontains=q) | Q(telefone__icontains=q)
            )
        return qs.order_by('-criado_em')

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        """Retorna dados estruturados por etapa para o Kanban."""
        etapas = EtapaPipeline.objects.filter(ativo=True).order_by('ordem')
        leads_ativos = Lead.objects.filter(
            status__in=['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO']
        ).select_related('etapa', 'origem', 'responsavel')

        dados = []
        for etapa in etapas:
            leads_etapa = leads_ativos.filter(etapa=etapa)
            dados.append({
                **EtapaPipelineSerializer(etapa).data,
                'leads': LeadSerializer(leads_etapa, many=True).data,
            })

        # Leads sem etapa
        sem_etapa = leads_ativos.filter(etapa__isnull=True)
        if sem_etapa.exists():
            dados.insert(0, {
                'id_etapa': None,
                'nome': 'Sem Etapa',
                'cor': '#9e9e9e',
                'ordem': -1,
                'probabilidade': 0,
                'leads': LeadSerializer(sem_etapa, many=True).data,
            })

        return Response(dados)

    @action(detail=True, methods=['post'])
    def mover_etapa(self, request, pk=None):
        """Move o lead para outra etapa do pipeline."""
        lead = self.get_object()
        etapa_id = request.data.get('etapa_id')
        if etapa_id:
            lead.etapa_id = etapa_id
            lead.save(update_fields=['etapa_id', 'atualizado_em'])
        return Response(LeadSerializer(lead).data)

    @action(detail=True, methods=['post'])
    def converter(self, request, pk=None):
        """Converte o lead em cliente."""
        from .models import Cliente
        lead = self.get_object()
        if lead.cliente_convertido_id:
            return Response({'erro': 'Lead já convertido.'}, status=400)

        cliente, criado = Cliente.objects.get_or_create(
            cpf_cnpj=lead.cpf_cnpj,
            defaults={
                'nome_razao_social': lead.nome,
                'email': lead.email or '',
                'telefone': lead.telefone or '',
                'whatsapp': lead.whatsapp or '',
            }
        ) if lead.cpf_cnpj else (None, False)

        if not cliente:
            cliente = Cliente.objects.create(
                nome_razao_social=lead.nome,
                email=lead.email or '',
                telefone=lead.telefone or '',
                whatsapp=lead.whatsapp or '',
                cpf_cnpj='',
            )

        lead.cliente_convertido = cliente
        lead.status = 'GANHO'
        lead.convertido_em = timezone.now()
        lead.save(update_fields=['cliente_convertido', 'status', 'convertido_em'])

        return Response({
            'mensagem': 'Lead convertido com sucesso.',
            'id_cliente': cliente.id_cliente,
            'cliente_nome': cliente.nome_razao_social,
            'criado_agora': criado,
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Métricas do CRM para o dashboard."""
        from django.db.models import Sum, Avg
        leads = Lead.objects.all()
        hoje = timezone.now().date()

        return Response({
            'total': leads.count(),
            'novos_hoje': leads.filter(criado_em__date=hoje).count(),
            'por_status': {
                s: leads.filter(status=s).count()
                for s, _ in Lead.STATUS_CHOICES
            },
            'ganhos_mes': leads.filter(
                status='GANHO',
                convertido_em__month=hoje.month,
                convertido_em__year=hoje.year,
            ).count(),
            'valor_pipeline': float(
                leads.filter(
                    status__in=['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO'],
                    valor_estimado__isnull=False,
                ).aggregate(s=Sum('valor_estimado'))['s'] or 0
            ),
            'taxa_conversao': round(
                leads.filter(status='GANHO').count() / max(leads.count(), 1) * 100, 1
            ),
        })


class AtividadeLeadViewSet(viewsets.ModelViewSet):
    serializer_class = AtividadeLeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AtividadeLead.objects.select_related('lead', 'responsavel').all()
        lead_id = self.request.query_params.get('lead')
        status_f = self.request.query_params.get('status')
        pendentes = self.request.query_params.get('pendentes')

        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        if status_f:
            qs = qs.filter(status=status_f)
        if pendentes == '1':
            qs = qs.filter(status='PENDENTE')
        return qs.order_by('-data_prevista')

    def perform_create(self, serializer):
        serializer.save(responsavel=self.request.user)

    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        atividade = self.get_object()
        atividade.status = 'REALIZADO'
        atividade.data_realizada = timezone.now()
        atividade.save(update_fields=['status', 'data_realizada'])
        return Response(AtividadeLeadSerializer(atividade).data)
