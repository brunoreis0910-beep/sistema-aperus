from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal


class ComposicaoProduto(models.Model):
    """
    Ficha Técnica (BOM — Bill of Materials).
    Define quais insumos/matérias-primas são necessários para fabricar
    uma unidade de um determinado produto acabado.
    """

    id_composicao = models.AutoField(primary_key=True)

    produto_acabado = models.ForeignKey(
        'Produto',
        on_delete=models.CASCADE,
        related_name='composicao_como_acabado',
        db_column='id_produto_acabado',
        help_text='Produto fabricado (produto acabado).',
    )
    insumo = models.ForeignKey(
        'Produto',
        on_delete=models.CASCADE,
        related_name='composicao_como_insumo',
        db_column='id_insumo',
        help_text='Produto utilizado como insumo / matéria-prima.',
    )
    quantidade_necessaria = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        help_text='Quantidade de insumo necessária por 1 unidade do produto acabado.',
    )
    percentual_perda = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Percentual de perda/desperdício (%). Ex: 5 = 5%',
    )
    ativo = models.BooleanField(default=True, help_text='Item ativo na ficha técnica.')
    observacao = models.CharField(max_length=255, blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pcp_composicao_produto'
        unique_together = [['produto_acabado', 'insumo']]
        ordering = ['produto_acabado', 'insumo']
        verbose_name = 'Composição do Produto'
        verbose_name_plural = 'Composições de Produtos'

    def __str__(self):
        return f"{self.insumo.nome_produto} → {self.produto_acabado.nome_produto}"


class OrdemProducao(models.Model):
    """
    Ordem de Produção (OP).
    Representa a intenção e a execução da fabricação de um produto acabado.
    Ao ser finalizada, baixa automaticamente os insumos do estoque e dá
    entrada no produto acabado — tudo dentro de uma transação atômica.
    """

    STATUS_CHOICES = [
        ('ABERTA', 'Aberta'),
        ('EM_PRODUCAO', 'Em Produção'),
        ('FINALIZADA', 'Finalizada'),
        ('CANCELADA', 'Cancelada'),
    ]

    id_op = models.AutoField(primary_key=True)

    produto = models.ForeignKey(
        'Produto',
        on_delete=models.PROTECT,
        related_name='ordens_producao',
        db_column='id_produto',
        help_text='Produto acabado a ser fabricado.',
    )
    deposito = models.ForeignKey(
        'Deposito',
        on_delete=models.PROTECT,
        related_name='ordens_producao',
        db_column='id_deposito',
        help_text='Depósito de onde saem os insumos e onde entra o produto acabado.',
    )
    quantidade_planejada = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        help_text='Quantidade planejada para esta OP.',
    )
    quantidade_produzida = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=Decimal('0.000'),
        help_text='Quantidade efetivamente produzida (preenchido ao finalizar).',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ABERTA',
        db_index=True,
    )
    custo_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Custo total dos insumos consumidos (calculado ao finalizar).',
    )
    observacoes = models.TextField(blank=True, null=True)
    data_abertura = models.DateTimeField(auto_now_add=True)
    data_inicio_producao = models.DateTimeField(
        blank=True,
        null=True,
        help_text='Momento em que a produção foi iniciada.',
    )
    data_finalizacao = models.DateTimeField(
        blank=True,
        null=True,
        help_text='Momento em que a produção foi finalizada.',
    )
    criado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_criado_por',
    )

    class Meta:
        db_table = 'pcp_ordem_producao'
        ordering = ['-data_abertura']
        verbose_name = 'Ordem de Produção'
        verbose_name_plural = 'Ordens de Produção'

    def __str__(self):
        return f"OP #{self.id_op} — {self.produto.nome_produto} ({self.quantidade_planejada})"

    @property
    def custo_unitario(self):
        if self.quantidade_produzida and self.quantidade_produzida > 0:
            return self.custo_total / self.quantidade_produzida
        return Decimal('0')
