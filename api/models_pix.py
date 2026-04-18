"""
models_pix.py — Pix Dinâmico: Cobranças Pix com webhook de confirmação
"""
from django.db import models
from django.contrib.auth.models import User
import uuid


class ConfiguracaoPix(models.Model):
    """Configuração da chave Pix por empresa."""
    PSP_CHOICES = [
        ('EFI', 'Efí Bank (Gerencianet)'),
        ('INTER', 'Banco Inter'),
        ('BRADESCO', 'Bradesco'),
        ('ITAU', 'Itaú'),
        ('BB', 'Banco do Brasil'),
        ('SICOOB', 'Sicoob'),
        ('MANUAL', 'Manual / Chave Estática'),
    ]
    TIPO_CHAVE_CHOICES = [
        ('CPF', 'CPF'), ('CNPJ', 'CNPJ'),
        ('EMAIL', 'E-mail'), ('TELEFONE', 'Telefone'),
        ('EVP', 'Chave Aleatória (EVP)'),
    ]

    id_config = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        'EmpresaConfig', on_delete=models.CASCADE,
        related_name='configuracoes_pix',
    )
    psp = models.CharField(max_length=15, choices=PSP_CHOICES, default='MANUAL')
    tipo_chave = models.CharField(max_length=10, choices=TIPO_CHAVE_CHOICES)
    chave_pix = models.CharField(max_length=100, help_text='Chave Pix registrada no PSP')

    # Credenciais OAuth2 (Efí / Inter)
    client_id = models.CharField(max_length=255, blank=True, null=True)
    client_secret = models.CharField(max_length=255, blank=True, null=True)
    certificado_base64 = models.TextField(blank=True, null=True, help_text='Certificado mTLS em base64')
    webhook_secret = models.CharField(max_length=100, blank=True, null=True)

    ambiente = models.CharField(
        max_length=12, default='PRODUCAO',
        choices=[('PRODUCAO', 'Produção'), ('HOMOLOGACAO', 'Homologação')],
    )
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pix_configuracao'
        verbose_name = 'Configuração Pix'

    def __str__(self):
        return f'{self.empresa} — {self.chave_pix} ({self.get_psp_display()})'


class CobrancaPix(models.Model):
    STATUS_CHOICES = [
        ('ATIVA', 'Ativa / Aguardando'),
        ('CONCLUIDA', 'Concluída / Paga'),
        ('EXPIRADA', 'Expirada'),
        ('CANCELADA', 'Cancelada'),
        ('ERRO', 'Erro na geração'),
    ]

    id_cobranca = models.AutoField(primary_key=True)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Empresa / Config
    config_pix = models.ForeignKey(
        ConfiguracaoPix, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='cobrancas',
    )

    # Valor e descrição
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    descricao = models.CharField(max_length=140, blank=True, null=True)
    validade_segundos = models.PositiveIntegerField(default=3600, help_text='TTL da cobrança em segundos')

    # Pagador (opcional)
    pagador_nome = models.CharField(max_length=255, blank=True, null=True)
    pagador_cpf_cnpj = models.CharField(max_length=18, blank=True, null=True)

    # Referência ao pedido (venda)
    id_venda = models.IntegerField(null=True, blank=True)
    referencia_externa = models.CharField(max_length=100, blank=True, null=True)

    # Status
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ATIVA')

    # Dados retornados pelo PSP
    txid = models.CharField(max_length=35, blank=True, null=True, help_text='TXID retornado pelo PSP')
    qr_code_payload = models.TextField(blank=True, null=True, help_text='Payload do QR Code Pix (Copia e Cola)')
    qr_code_imagem_base64 = models.TextField(blank=True, null=True, help_text='QR Code em Base64 PNG')
    link_visualizacao = models.URLField(blank=True, null=True)

    # Confirmação de pagamento
    pago_em = models.DateTimeField(null=True, blank=True)
    valor_pago = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    end_to_end_id = models.CharField(max_length=32, blank=True, null=True, help_text='EndToEndId da transação Pix')
    pagador_nome_confirmado = models.CharField(max_length=255, blank=True, null=True)
    pagador_cpf_confirmado = models.CharField(max_length=18, blank=True, null=True)
    infopagador = models.CharField(max_length=140, blank=True, null=True)

    # Referência ao lançamento financeiro gerado
    id_lancamento_financeiro = models.IntegerField(null=True, blank=True)

    # Controle
    criado_por = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='cobrancas_pix',
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    expira_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'pix_cobranca'
        ordering = ['-criado_em']
        verbose_name = 'Cobrança Pix'
        indexes = [
            models.Index(fields=['txid']),
            models.Index(fields=['status']),
            models.Index(fields=['id_venda']),
        ]

    def __str__(self):
        return f'Pix R$ {self.valor:.2f} — {self.get_status_display()} [{self.uuid}]'

    @property
    def esta_pago(self):
        return self.status == 'CONCLUIDA'


class WebhookPixLog(models.Model):
    """Log de todas as notificações recebidas do PSP via webhook."""
    id_log = models.AutoField(primary_key=True)
    cobranca = models.ForeignKey(
        CobrancaPix, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='webhook_logs',
    )
    txid = models.CharField(max_length=35, blank=True, null=True)
    payload_raw = models.TextField()
    ip_origem = models.CharField(max_length=50, blank=True, null=True)
    processado = models.BooleanField(default=False)
    erro = models.CharField(max_length=500, blank=True, null=True)
    recebido_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pix_webhook_log'
        ordering = ['-recebido_em']
