from django.db import models
from django.contrib.auth.models import User


class LayoutEtiqueta(models.Model):
    """Modelo para layouts personalizados de etiquetas"""
    
    TAMANHO_CHOICES = [
        ('A4', 'A4 (210x297mm)'),
        ('CARTA', 'Carta (215.9x279.4mm)'),
        ('10X15', '10x15cm'),
        ('5X5', '5x5cm'),
        ('7X5', '7x5cm'),
        ('CUSTOM', 'Personalizado'),
    ]
    
    nome_layout = models.CharField(max_length=100, verbose_name='Nome do Layout')
    descricao = models.TextField(blank=True, null=True, verbose_name='Descrição')
    
    # Configurações de página
    tamanho_papel = models.CharField(max_length=20, choices=TAMANHO_CHOICES, default='A4')
    largura_papel = models.DecimalField(max_digits=6, decimal_places=2, default=210, verbose_name='Largura do Papel (mm)')
    altura_papel = models.DecimalField(max_digits=6, decimal_places=2, default=297, verbose_name='Altura do Papel (mm)')
    
    # Configurações de etiqueta
    largura_etiqueta = models.DecimalField(max_digits=6, decimal_places=2, default=50, verbose_name='Largura da Etiqueta (mm)')
    altura_etiqueta = models.DecimalField(max_digits=6, decimal_places=2, default=30, verbose_name='Altura da Etiqueta (mm)')
    
    # Configurações de layout
    colunas = models.IntegerField(default=3, verbose_name='Número de Colunas')
    linhas = models.IntegerField(default=10, verbose_name='Número de Linhas')
    
    # Margens
    margem_superior = models.DecimalField(max_digits=6, decimal_places=2, default=10, verbose_name='Margem Superior (mm)')
    margem_inferior = models.DecimalField(max_digits=6, decimal_places=2, default=10, verbose_name='Margem Inferior (mm)')
    margem_esquerda = models.DecimalField(max_digits=6, decimal_places=2, default=5, verbose_name='Margem Esquerda (mm)')
    margem_direita = models.DecimalField(max_digits=6, decimal_places=2, default=5, verbose_name='Margem Direita (mm)')
    
    # Espaçamentos entre etiquetas
    espaco_horizontal = models.DecimalField(max_digits=6, decimal_places=2, default=2, verbose_name='Espaço Horizontal (mm)')
    espaco_vertical = models.DecimalField(max_digits=6, decimal_places=2, default=2, verbose_name='Espaço Vertical (mm)')
    
    # Campos a serem exibidos (JSON com configurações)
    campos_visiveis = models.JSONField(default=dict, verbose_name='Campos Visíveis', help_text='JSON com campos e suas configurações')
    
    # Controle
    ativo = models.BooleanField(default=True)
    usuario_criacao = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='layouts_criados')
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'layouts_etiqueta'
        verbose_name = 'Layout de Etiqueta'
        verbose_name_plural = 'Layouts de Etiqueta'
        ordering = ['nome_layout']
    
    def __str__(self):
        return f"{self.nome_layout} ({self.colunas}x{self.linhas})"


class ImpressaoEtiqueta(models.Model):
    """Histórico de impressões de etiquetas"""
    
    layout = models.ForeignKey(LayoutEtiqueta, on_delete=models.PROTECT, related_name='impressoes')
    produtos = models.JSONField(verbose_name='Produtos Impressos', help_text='Lista de IDs e quantidades')
    cliente_id = models.IntegerField(null=True, blank=True, verbose_name='ID do Cliente')
    quantidade_total = models.IntegerField(default=0)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    data_impressao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'impressoes_etiqueta'
        verbose_name = 'Impressão de Etiqueta'
        verbose_name_plural = 'Impressões de Etiqueta'
        ordering = ['-data_impressao']
    
    def __str__(self):
        return f"Impressão {self.id} - {self.quantidade_total} etiquetas"
