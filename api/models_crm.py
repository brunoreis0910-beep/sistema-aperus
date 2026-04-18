"""
models_crm.py — CRM: Funil de Vendas, Leads, Pipeline Kanban
"""
from django.db import models
from django.contrib.auth.models import User


class OrigemLead(models.Model):
    CANAL_CHOICES = [
        ('BALCAO', 'Balcão / Presencial'),
        ('WHATSAPP', 'WhatsApp'),
        ('INSTAGRAM', 'Instagram'),
        ('FACEBOOK', 'Facebook'),
        ('GOOGLE_ADS', 'Google Ads'),
        ('INDICACAO', 'Indicação'),
        ('TELEFONE', 'Telefone'),
        ('EMAIL', 'E-mail'),
        ('SITE', 'Site / Formulário'),
        ('MARKETPLACE', 'Marketplace'),
        ('OUTROS', 'Outros'),
    ]
    id_origem = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    canal = models.CharField(max_length=20, choices=CANAL_CHOICES, default='OUTROS')
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'crm_origem_lead'
        verbose_name = 'Origem de Lead'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class EtapaPipeline(models.Model):
    id_etapa = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    ordem = models.PositiveSmallIntegerField(default=0)
    cor = models.CharField(max_length=7, default='#1976d2', help_text='Cor hex da etapa no Kanban')
    probabilidade = models.PositiveSmallIntegerField(
        default=50,
        help_text='Probabilidade de fechamento em % para esta etapa',
    )
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'crm_etapa_pipeline'
        ordering = ['ordem']
        verbose_name = 'Etapa do Pipeline'

    def __str__(self):
        return f'{self.ordem}. {self.nome}'


class Lead(models.Model):
    STATUS_CHOICES = [
        ('NOVO', 'Novo'),
        ('CONTATO', 'Em Contato'),
        ('QUALIFICADO', 'Qualificado'),
        ('PROPOSTA', 'Proposta Enviada'),
        ('NEGOCIACAO', 'Em Negociação'),
        ('GANHO', 'Ganho / Convertido'),
        ('PERDIDO', 'Perdido'),
    ]

    id_lead = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=255, help_text='Nome do lead / empresa')
    email = models.EmailField(blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    empresa = models.CharField(max_length=255, blank=True, null=True)
    cpf_cnpj = models.CharField(max_length=18, blank=True, null=True)
    cargo = models.CharField(max_length=100, blank=True, null=True)

    # Relacionamentos
    origem = models.ForeignKey(
        OrigemLead, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='leads',
    )
    etapa = models.ForeignKey(
        EtapaPipeline, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='leads',
    )
    responsavel = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='leads_responsavel',
    )
    # Conversão: quando virar cliente
    cliente_convertido = models.ForeignKey(
        'Cliente', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='lead_origem',
    )

    # Pipeline
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOVO')
    valor_estimado = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    data_fechamento_prevista = models.DateField(null=True, blank=True)
    motivo_perda = models.TextField(blank=True, null=True)

    # Produto/Serviço de interesse
    produto_interesse = models.CharField(max_length=255, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)

    # Controle
    criado_por = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='leads_criados',
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    convertido_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'crm_lead'
        ordering = ['-criado_em']
        verbose_name = 'Lead'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['etapa']),
            models.Index(fields=['responsavel']),
        ]

    def __str__(self):
        return f'{self.nome} [{self.get_status_display()}]'


class AtividadeLead(models.Model):
    TIPO_CHOICES = [
        ('LIGACAO', 'Ligação'),
        ('WHATSAPP', 'WhatsApp'),
        ('EMAIL', 'E-mail'),
        ('REUNIAO', 'Reunião'),
        ('VISITA', 'Visita'),
        ('PROPOSTA', 'Envio de Proposta'),
        ('FOLLOW_UP', 'Follow-up'),
        ('NOTA', 'Anotação'),
    ]
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('REALIZADO', 'Realizado'),
        ('CANCELADO', 'Cancelado'),
    ]

    id_atividade = models.AutoField(primary_key=True)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='atividades')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    data_prevista = models.DateTimeField(null=True, blank=True)
    data_realizada = models.DateTimeField(null=True, blank=True)
    responsavel = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='atividades_crm',
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'crm_atividade_lead'
        ordering = ['-data_prevista']
        verbose_name = 'Atividade de Lead'

    def __str__(self):
        return f'{self.get_tipo_display()} — {self.lead.nome}'
