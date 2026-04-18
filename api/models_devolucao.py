from django.db import models
from django.contrib.auth.models import User


class Devolucao(models.Model):
    """
    Model para registrar devoluções de vendas e compras
    """
    TIPO_CHOICES = [
        ('venda', 'Devolução de Venda'),
        ('compra', 'Devolução de Compra'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aprovada', 'Aprovada'),
        ('cancelada', 'Cancelada'),
    ]
    
    id_devolucao = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    
    # Relacionamentos com vendas/compras (usando CharField pois as tabelas originais não têm FK)
    id_venda = models.IntegerField(null=True, blank=True, help_text="ID da venda sendo devolvida")
    id_compra = models.IntegerField(null=True, blank=True, help_text="ID da compra sendo devolvida")
    
    # IDs relacionados
    id_cliente = models.IntegerField(null=True, blank=True)
    id_fornecedor = models.IntegerField(null=True, blank=True)
    id_operacao = models.IntegerField(null=True, blank=True, help_text="Operação de devolução")
    
    # Dados da devolução
    data_devolucao = models.DateTimeField(auto_now_add=True)
    numero_devolucao = models.CharField(max_length=50, unique=True, help_text="Número único da devolução")
    motivo = models.TextField(help_text="Motivo da devolução")
    observacoes = models.TextField(blank=True, null=True)
    
    # Controle de crédito (apenas para devolução de venda)
    gerar_credito = models.BooleanField(default=False, help_text="Gerar crédito para o cliente?")
    valor_total_devolucao = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Referência à NF-e de origem (refNFe — obrigatório na NF-e de devolução)
    chave_nfe_referenciada = models.CharField(
        max_length=44,
        blank=True,
        null=True,
        help_text="Chave de Acesso da NF-e/NFC-e de origem (campo refNFe na devolução)"
    )
    
    # Status e controle
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    estoque_atualizado = models.BooleanField(default=False)
    financeiro_gerado = models.BooleanField(default=False)
    
    # Auditoria
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='devolucoes_criadas')
    aprovado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='devolucoes_aprovadas')
    data_aprovacao = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'devolucoes'
        ordering = ['-data_devolucao']
        verbose_name = 'Devolução'
        verbose_name_plural = 'Devoluções'
    
    def __str__(self):
        return f"Devolução {self.numero_devolucao} - {self.get_tipo_display()}"
    
    def save(self, *args, **kwargs):
        # Gerar número de devolução se não existir
        if not self.numero_devolucao:
            import datetime
            hoje = datetime.datetime.now()
            ultimo = Devolucao.objects.filter(
                numero_devolucao__startswith=f"DEV{hoje.year}"
            ).order_by('-id_devolucao').first()
            
            if ultimo:
                try:
                    ultimo_numero = int(ultimo.numero_devolucao.split('-')[1])
                    novo_numero = ultimo_numero + 1
                except:
                    novo_numero = 1
            else:
                novo_numero = 1
            
            self.numero_devolucao = f"DEV{hoje.year}-{novo_numero:06d}"
        
        super().save(*args, **kwargs)


class DevolucaoItem(models.Model):
    """
    Model para itens devolvidos (produtos)
    """
    id_devolucao_item = models.AutoField(primary_key=True)
    devolucao = models.ForeignKey(Devolucao, on_delete=models.CASCADE, related_name='itens')
    
    # Produto
    id_produto = models.IntegerField()
    nome_produto = models.CharField(max_length=255, help_text="Nome do produto no momento da devolução")
    codigo_produto = models.CharField(max_length=100, blank=True, null=True)
    
    # Quantidades e valores
    quantidade_devolvida = models.DecimalField(max_digits=10, decimal_places=3)
    quantidade_original = models.DecimalField(max_digits=10, decimal_places=3, help_text="Quantidade na venda/compra original")
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Motivo específico do item
    motivo_item = models.TextField(blank=True, null=True, help_text="Motivo específico deste item")
    
    # Controle
    id_venda_item = models.IntegerField(null=True, blank=True, help_text="ID do item da venda original")
    id_compra_item = models.IntegerField(null=True, blank=True, help_text="ID do item da compra original")
    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'devolucao_itens'
        verbose_name = 'Item de Devolução'
        verbose_name_plural = 'Itens de Devolução'
    
    def __str__(self):
        return f"{self.nome_produto} - Qtd: {self.quantidade_devolvida}"
    
    def save(self, *args, **kwargs):
        # Calcular valor total
        self.valor_total = self.quantidade_devolvida * self.valor_unitario
        super().save(*args, **kwargs)


class CreditoCliente(models.Model):
    """
    Model para controlar créditos gerados por devoluções de vendas
    """
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('utilizado', 'Totalmente Utilizado'),
        ('parcialmente_utilizado', 'Parcialmente Utilizado'),
        ('expirado', 'Expirado'),
        ('cancelado', 'Cancelado'),
    ]
    
    id_credito = models.AutoField(primary_key=True)
    id_cliente = models.IntegerField(db_index=True)
    
    # Origem do crédito
    devolucao = models.ForeignKey(Devolucao, on_delete=models.CASCADE, related_name='creditos', null=True, blank=True)
    
    # Valores
    valor_credito = models.DecimalField(max_digits=10, decimal_places=2, help_text="Valor total do crédito")
    valor_utilizado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    saldo = models.DecimalField(max_digits=10, decimal_places=2, help_text="Saldo disponível")
    
    # Validade
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_validade = models.DateField(null=True, blank=True, help_text="Data de expiração do crédito")
    
    # Status
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='disponivel')
    
    # Auditoria
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'creditos_cliente'
        ordering = ['-data_criacao']
        verbose_name = 'Crédito de Cliente'
        verbose_name_plural = 'Créditos de Clientes'
        indexes = [
            models.Index(fields=['id_cliente', 'status']),
        ]
    
    def __str__(self):
        return f"Crédito Cliente {self.id_cliente} - R$ {self.saldo}"
    
    def save(self, *args, **kwargs):
        # Calcular saldo
        self.saldo = self.valor_credito - self.valor_utilizado
        
        # Atualizar status baseado no saldo
        if self.saldo <= 0:
            self.status = 'utilizado'
        elif self.valor_utilizado > 0:
            self.status = 'parcialmente_utilizado'
        else:
            self.status = 'disponivel'
        
        super().save(*args, **kwargs)
    
    def pode_utilizar(self, valor):
        """Verifica se há saldo suficiente para utilizar o valor informado"""
        return self.status in ['disponivel', 'parcialmente_utilizado'] and self.saldo >= valor
    
    def utilizar(self, valor):
        """Utiliza um valor do crédito"""
        if not self.pode_utilizar(valor):
            raise ValueError("Crédito indisponível ou saldo insuficiente")
        
        self.valor_utilizado += valor
        self.save()


class CreditoUtilizacao(models.Model):
    """
    Model para registrar utilizações de créditos em vendas
    """
    id_utilizacao = models.AutoField(primary_key=True)
    credito = models.ForeignKey(CreditoCliente, on_delete=models.CASCADE, related_name='utilizacoes')
    
    # Venda onde o crédito foi utilizado
    id_venda = models.IntegerField(db_index=True)
    
    # Valor utilizado
    valor_utilizado = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Auditoria
    data_utilizacao = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        db_table = 'credito_utilizacoes'
        ordering = ['-data_utilizacao']
        verbose_name = 'Utilização de Crédito'
        verbose_name_plural = 'Utilizações de Créditos'
    
    def __str__(self):
        return f"Utilização R$ {self.valor_utilizado} - Venda {self.id_venda}"
