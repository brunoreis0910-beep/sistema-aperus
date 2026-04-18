"""
models_recorrencia.py — Contratos de Recorrência / Assinaturas com faturamento automático
"""
from django.db import models
from django.contrib.auth.models import User


class ContratoRecorrencia(models.Model):
    PERIODICIDADE_CHOICES = [
        ('MENSAL', 'Mensal'),
        ('BIMENSAL', 'Bimestral'),
        ('TRIMESTRAL', 'Trimestral'),
        ('SEMESTRAL', 'Semestral'),
        ('ANUAL', 'Anual'),
    ]
    STATUS_CHOICES = [
        ('ATIVO', 'Ativo'),
        ('SUSPENSO', 'Suspenso'),
        ('CANCELADO', 'Cancelado'),
        ('ENCERRADO', 'Encerrado'),
    ]
    INDICE_REAJUSTE_CHOICES = [
        ('NENHUM', 'Sem reajuste'),
        ('IGPM', 'IGP-M'),
        ('IPCA', 'IPCA'),
        ('INPC', 'INPC'),
        ('FIXO', 'Percentual Fixo'),
    ]

    id_contrato = models.AutoField(primary_key=True)
    numero = models.CharField(max_length=30, unique=True, blank=True)

    # Partes
    cliente = models.ForeignKey(
        'Cliente', on_delete=models.PROTECT, related_name='contratos_recorrencia',
    )
    responsavel = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='contratos_recorrencia',
    )

    # Objeto do contrato
    descricao = models.CharField(max_length=500, blank=True, default='', help_text='Descrição do serviço/produto')
    observacoes = models.TextField(blank=True, null=True)

    # Valores
    valor_mensal = models.DecimalField(max_digits=12, decimal_places=2)
    dia_vencimento = models.PositiveSmallIntegerField(
        default=10,
        help_text='Dia do mês para gerar a cobrança (1–28)',
    )

    # Vigência
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ATIVO')
    data_inicio = models.DateField()
    data_fim = models.DateField(null=True, blank=True, help_text='Vazio = indeterminado')
    periodicidade = models.CharField(max_length=15, choices=PERIODICIDADE_CHOICES, default='MENSAL')

    # Reajuste automático
    indice_reajuste = models.CharField(max_length=10, choices=INDICE_REAJUSTE_CHOICES, default='NENHUM')
    percentual_reajuste_fixo = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='Usado somente quando índice = FIXO',
    )
    mes_aniversario = models.PositiveSmallIntegerField(
        null=True, blank=True,
        help_text='Mês do ano em que ocorre o reajuste (1=Jan, 12=Dez)',
    )
    ultimo_reajuste = models.DateField(null=True, blank=True)

    # Faturamento automático
    gerar_nfe = models.BooleanField(default=False)
    gerar_nfse = models.BooleanField(default=False)
    gerar_boleto = models.BooleanField(default=False)
    gerar_pix = models.BooleanField(default=False)
    operacao = models.ForeignKey(
        'Operacao', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='contratos_recorrencia',
    )

    # Controle
    ultimo_faturamento = models.DateField(null=True, blank=True)
    proximo_faturamento = models.DateField(null=True, blank=True)
    criado_por = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='contratos_criados',
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recorrencia_contrato'
        ordering = ['cliente__nome_razao_social', 'data_inicio']
        verbose_name = 'Contrato de Recorrência'

    def __str__(self):
        return f'Contrato #{self.numero} — {self.cliente} R$ {self.valor_mensal}/mês'

    def save(self, *args, **kwargs):
        if not self.numero:
            ultimo = ContratoRecorrencia.objects.order_by('-id_contrato').first()
            seq = (ultimo.id_contrato if ultimo else 0) + 1
            self.numero = f'REC-{seq:05d}'
        super().save(*args, **kwargs)


class ParcelaRecorrencia(models.Model):
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('ENVIADA', 'Enviada / Em cobrança'),
        ('PAGA', 'Paga'),
        ('ATRASADA', 'Atrasada'),
        ('CANCELADA', 'Cancelada'),
    ]

    id_parcela = models.AutoField(primary_key=True)
    contrato = models.ForeignKey(
        ContratoRecorrencia, on_delete=models.CASCADE, related_name='parcelas',
    )
    competencia = models.CharField(max_length=7, help_text='MM/AAAA')
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    data_vencimento = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDENTE')
    data_pagamento = models.DateField(null=True, blank=True)
    valor_pago = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Documentos gerados
    id_financeiro_conta = models.IntegerField(null=True, blank=True, help_text='ID em FinanceiroConta')
    id_venda = models.IntegerField(null=True, blank=True, help_text='ID da venda gerada para NF')
    id_cobranca_pix = models.IntegerField(null=True, blank=True)
    numero_boleto = models.CharField(max_length=50, blank=True, null=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recorrencia_parcela'
        ordering = ['data_vencimento']
        unique_together = [('contrato', 'competencia')]
        verbose_name = 'Parcela de Recorrência'

    def __str__(self):
        return f'{self.contrato.numero} {self.competencia} R$ {self.valor}'
