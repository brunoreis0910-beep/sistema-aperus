"""
models_hotel.py — PMS: Quartos, Reservas, Consumo
"""
from django.db import models
from decimal import Decimal

class TipoQuarto(models.Model):
    id_tipo_quarto = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True, help_text="Ex: Single, Duplo, Suíte Master")
    descricao = models.TextField(blank=True, null=True)
    valor_diaria_padrao = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    limite_adultos = models.PositiveIntegerField(default=2)
    limite_criancas = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'hotel_tipo_quarto'
        ordering = ['nome']
        verbose_name = 'Tipo de Quarto'
        verbose_name_plural = 'Tipos de Quarto'

    def __str__(self):
        return self.nome

class Quarto(models.Model):
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('ocupado', 'Ocupado'),
        ('sujo', 'Sujo'),
        ('manutencao', 'Manutenção'),
    ]

    id_quarto = models.AutoField(primary_key=True)
    numero_quarto = models.CharField(max_length=10, unique=True, help_text="Ex: 101, 102")
    tipo = models.ForeignKey(TipoQuarto, on_delete=models.PROTECT, db_column='tipo_id', related_name='quartos')
    status_atual = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disponivel')
    capacidade_adultos = models.PositiveIntegerField(default=2)
    capacidade_criancas = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'hotel_quarto'
        ordering = ['numero_quarto']
        verbose_name = 'Quarto'
        verbose_name_plural = 'Quartos'

    def __str__(self):
        return f"Quarto {self.numero_quarto} ({self.tipo.nome})"

class Reserva(models.Model):
    STATUS_CHOICES = [
        ('confirmada', 'Confirmada'),
        ('checkin', 'Check-in Realizado'),
        ('finalizada', 'Finalizada'),
        ('cancelada', 'Cancelada'),
        ('noshow', 'No-show'),
    ]

    id_reserva = models.AutoField(primary_key=True)
    hospede = models.ForeignKey('Cliente', on_delete=models.PROTECT, db_column='hospede_id', related_name='reservas')
    quarto = models.ForeignKey(Quarto, on_delete=models.PROTECT, db_column='quarto_id', related_name='reservas')
    data_entrada_prevista = models.DateTimeField()
    data_saida_prevista = models.DateTimeField()
    data_checkin_real = models.DateTimeField(null=True, blank=True)
    data_checkout_real = models.DateTimeField(null=True, blank=True)
    status_reserva = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmada')
    valor_diaria_aplicada = models.DecimalField(max_digits=10, decimal_places=2)
    observacoes = models.TextField(blank=True, null=True)
    venda = models.ForeignKey('Venda', on_delete=models.SET_NULL, null=True, blank=True, db_column='venda_id', related_name='reservas')
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hotel_reserva'
        ordering = ['-data_entrada_prevista']
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'

    def __str__(self):
        return f"Reserva {self.id_reserva} — Quarto {self.quarto.numero_quarto} ({self.hospede.nome_razao_social})"

    @property
    def total_diarias(self):
        """Calcula o valor total das diárias com base nas datas e valor aplicado."""
        if not self.data_entrada_prevista or not self.data_saida_prevista:
            return Decimal('0.00')
        
        # Se check-in/out ocorreram, calcula pelas datas reais, senão previstas
        entrada = self.data_checkin_real or self.data_entrada_prevista
        saida = self.data_checkout_real or self.data_saida_prevista
        
        dias = (saida.date() - entrada.date()).days
        # Garantir pelo menos 1 diária se entrada/saída forem no mesmo dia
        dias = max(dias, 1)
        
        return Decimal(dias) * self.valor_diaria_aplicada

    @property
    def total_consumo(self):
        """Calcula o valor total dos lançamentos de consumo."""
        total = self.consumos.aggregate(models.Sum('valor_total'))['valor_total__sum']
        return total or Decimal('0.00')

    @property
    def total_geral(self):
        """Total geral: diárias + consumo."""
        return self.total_diarias + self.total_consumo

class ConsumoQuarto(models.Model):
    id_consumo = models.AutoField(primary_key=True)
    reserva = models.ForeignKey(Reserva, on_delete=models.CASCADE, db_column='reserva_id', related_name='consumos')
    produto = models.ForeignKey('Produto', on_delete=models.PROTECT, db_column='produto_id', related_name='consumos_hospedagem')
    quantidade = models.DecimalField(max_digits=10, decimal_places=3, default=1.000)
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    valor_total = models.DecimalField(max_digits=12, decimal_places=2)
    data_lancamento = models.DateTimeField(auto_now_add=True)
    observacao = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'hotel_consumo'
        ordering = ['-data_lancamento']
        verbose_name = 'Consumo de Quarto'
        verbose_name_plural = 'Consumo de Quartos'

    def __str__(self):
        return f"{self.produto.nome_produto} x{self.quantidade} — Reserva {self.reserva_id}"

    def save(self, *args, **kwargs):
        # Auto-calcula o valor total
        self.valor_total = Decimal(str(self.quantidade)) * self.valor_unitario
        super().save(*args, **kwargs)
