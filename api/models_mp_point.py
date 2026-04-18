"""
models_mp_point.py — Mercado Pago Point Tap: Configuração e Transações
"""
import uuid
from django.db import models
from django.contrib.auth.models import User


class ConfiguracaoMercadoPago(models.Model):
    """
    Configuração da integração com Mercado Pago Point Tap.
    Um registro por empresa (ou por caixa, se desejar múltiplos dispositivos).
    """
    AMBIENTE_CHOICES = [
        ('PRODUCAO', 'Produção'),
        ('HOMOLOGACAO', 'Homologação / Sandbox'),
    ]

    id_config = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        'EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='configuracoes_mp_point',
    )
    # Access Token obtido no painel MP (começa com APP_USR-...)
    access_token = models.TextField(help_text='Access Token do Mercado Pago (APP_USR-...)')
    # ID numérico do vendedor (user_id do MP — aparece na URL do painel)
    mp_user_id = models.CharField(max_length=50, help_text='ID numérico do usuário/vendedor no MP')
    # Device ID do terminal Point Tap (ex: PAX_A910_123456)
    device_id = models.CharField(max_length=100, help_text='Device ID do terminal Point Tap (ex: PAX_A910__123456)')
    ambiente = models.CharField(max_length=15, choices=AMBIENTE_CHOICES, default='PRODUCAO')
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mp_point_configuracao'
        verbose_name = 'Configuração Mercado Pago'
        verbose_name_plural = 'Configurações Mercado Pago'

    def __str__(self):
        return f'{self.empresa} — Point Tap ({self.device_id})'


class TransacaoMPPoint(models.Model):
    """
    Registro de cada intenção de pagamento enviada ao terminal Point Tap.
    """
    STATUS_CHOICES = [
        ('CRIADA', 'Criada / Aguardando terminal'),
        ('PROCESSANDO', 'Processando pagamento'),
        ('APROVADA', 'Aprovada'),
        ('RECUSADA', 'Recusada/Negada'),
        ('CANCELADA', 'Cancelada pelo operador'),
        ('ERRO', 'Erro de comunicação'),
    ]

    id_transacao = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)

    # Vínculo com a venda
    id_venda = models.ForeignKey(
        'Venda',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='transacoes_mp_point',
    )

    # Config usada
    config = models.ForeignKey(
        ConfiguracaoMercadoPago,
        on_delete=models.SET_NULL,
        null=True, blank=True,
    )

    # IDs retornados pelo MP
    payment_intent_id = models.CharField(max_length=100, blank=True, null=True, db_index=True,
                                         help_text='ID da intenção de pagamento no MP')
    payment_id = models.CharField(max_length=100, blank=True, null=True,
                                  help_text='ID do pagamento aprovado no MP')

    valor = models.DecimalField(max_digits=12, decimal_places=2)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='CRIADA')
    detalhe_status = models.CharField(max_length=255, blank=True, null=True,
                                      help_text='Mensagem de retorno do MP (ex: cc_rejected_insufficient_amount)')

    # Tipo de pagamento capturado (retornado pelo MP após aprovação)
    tipo_pagamento = models.CharField(max_length=30, blank=True, null=True,
                                      help_text='credit_card, debit_card, etc.')
    parcelas = models.IntegerField(default=1)

    # Payload completo do webhook (para auditoria)
    payload_webhook = models.JSONField(blank=True, null=True)

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    criado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='transacoes_mp_criadas',
    )

    class Meta:
        db_table = 'mp_point_transacoes'
        verbose_name = 'Transação MP Point'
        verbose_name_plural = 'Transações MP Point'
        ordering = ['-criado_em']

    def __str__(self):
        return f'Transação {self.uuid} — R$ {self.valor} ({self.get_status_display()})'
