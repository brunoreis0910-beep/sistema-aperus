from django.db import models
from django.contrib.auth.models import User
from api.models import Cliente, Produto, Operacao, Vendedor


class Mesa(models.Model):
    """Modelo para mesas do restaurante/bar"""
    STATUS_CHOICES = [
        ('Livre', 'Livre'),
        ('Ocupada', 'Ocupada'),
        ('Reservada', 'Reservada'),
        ('Limpeza', 'Em Limpeza'),
    ]

    numero = models.CharField(max_length=10, verbose_name='NÃºmero da Mesa')
    capacidade = models.IntegerField(verbose_name='Capacidade (pessoas)')
    localizacao = models.CharField(max_length=100, blank=True, null=True, verbose_name='LocalizaÃ§Ã£o')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Livre')
    ativa = models.BooleanField(default=True, verbose_name='Mesa Ativa')
    observacoes = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mesas'
        verbose_name = 'Mesa'
        verbose_name_plural = 'Mesas'
        ordering = ['numero']

    def __str__(self):
        return f"Mesa {self.numero} - {self.status}"


class Comanda(models.Model):
    """Modelo para comandas/pedidos"""
    STATUS_CHOICES = [
        ('Aberta', 'Aberta'),
        ('Fechada', 'Fechada'),
        ('Cancelada', 'Cancelada'),
    ]
    
    FORMA_PAGAMENTO_CHOICES = [
        ('Dinheiro', 'Dinheiro'),
        ('CartÃ£o de CrÃ©dito', 'CartÃ£o de CrÃ©dito'),
        ('CartÃ£o de DÃ©bito', 'CartÃ£o de DÃ©bito'),
        ('PIX', 'PIX'),
        ('Vale RefeiÃ§Ã£o', 'Vale RefeiÃ§Ã£o'),
        ('Cortesia', 'Cortesia'),
        ('Fiado', 'Fiado'),
    ]

    numero = models.CharField(max_length=20, verbose_name='NÃºmero da Comanda')
    mesa = models.ForeignKey(Mesa, on_delete=models.SET_NULL, null=True, blank=True, related_name='comandas')
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='comandas')
    garcom = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='comandas_atendidas')
    
    # ðŸŽ¯ VENDEDOR: Buscado dos parÃ¢metros do usuÃ¡rio (id_vendedor_nfce)
    id_vendedor = models.ForeignKey(
        Vendedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_vendedor',
        related_name='comandas_vendedor',
        verbose_name='Vendedor',
        help_text='Vendedor da comanda (buscado dos parÃ¢metros do usuÃ¡rio ao fechar)'
    )
    
    # ðŸŽ¯ NOVO: OperaÃ§Ã£o para NFC-e da comanda
    id_operacao_nfce = models.ForeignKey(
        Operacao, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='comandas_nfce',
        verbose_name='OperaÃ§Ã£o NFC-e',
        help_text='OperaÃ§Ã£o fiscal a ser usada ao emitir NFC-e desta comanda'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Aberta')
    forma_pagamento = models.CharField(max_length=255, null=True, blank=True, verbose_name='Forma de Pagamento')
    
    data_abertura = models.DateTimeField(auto_now_add=True)
    data_fechamento = models.DateTimeField(null=True, blank=True)
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    taxa_servico = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    observacoes = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comandas'
        verbose_name = 'Comanda'
        verbose_name_plural = 'Comandas'
        ordering = ['-data_abertura']

    def __str__(self):
        return f"Comanda {self.numero} - Mesa {self.mesa.numero if self.mesa else 'Sem mesa'}"

    def calcular_total(self):
        """Calcula o total da comanda"""
        self.subtotal = sum(item.subtotal for item in self.itens.all())
        self.total = self.subtotal - self.desconto + self.taxa_servico
        self.save()


class ItemComanda(models.Model):
    """Itens de uma comanda"""
    STATUS_CHOICES = [
        ('Pendente', 'Pendente'),
        ('Preparando', 'Em Preparo'),
        ('Pronto', 'Pronto'),
        ('Entregue', 'Entregue'),
        ('Cancelado', 'Cancelado'),
    ]

    comanda = models.ForeignKey(Comanda, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    quantidade = models.DecimalField(max_digits=10, decimal_places=3, default=1)
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pendente')
    observacoes = models.TextField(blank=True, null=True, verbose_name='ObservaÃ§Ãµes do item')
    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'itens_comanda'
        verbose_name = 'Item da Comanda'
        verbose_name_plural = 'Itens da Comanda'

    def save(self, *args, **kwargs):
        self.subtotal = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)
        # Recalcula total da comanda
        self.comanda.calcular_total()

    def __str__(self):
        return f"{self.produto.nome} x{self.quantidade}"


class TransferenciaMesa(models.Model):
    """HistÃ³rico de transferÃªncias de mesa"""
    comanda = models.ForeignKey(Comanda, on_delete=models.CASCADE, related_name='transferencias')
    mesa_origem = models.ForeignKey(Mesa, on_delete=models.SET_NULL, null=True, related_name='transferencias_origem')
    mesa_destino = models.ForeignKey(Mesa, on_delete=models.SET_NULL, null=True, related_name='transferencias_destino')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    data_transferencia = models.DateTimeField(auto_now_add=True)
    motivo = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'transferencias_mesa'
        verbose_name = 'TransferÃªncia de Mesa'
        verbose_name_plural = 'TransferÃªncias de Mesa'
        ordering = ['-data_transferencia']

    def __str__(self):
        return f"Mesa {self.mesa_origem.numero} â†’ {self.mesa_destino.numero}"


class PagamentoComanda(models.Model):
    """Formas de pagamento de uma comanda"""
    comanda = models.ForeignKey(Comanda, on_delete=models.CASCADE, related_name='pagamentos')
    forma_pagamento = models.CharField(max_length=50, verbose_name='Forma de Pagamento')
    valor = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Valor')
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pagamentos_comanda'
        verbose_name = 'Pagamento da Comanda'
        verbose_name_plural = 'Pagamentos da Comanda'

    def __str__(self):
        return f"{self.forma_pagamento}: R$ {self.valor}"
