"""
Modelos para gerenciamento de balanças
"""
from django.db import models
from django.contrib.auth.models import User


class ConfiguracaoBalanca(models.Model):
    """Configuração de balança"""
    
    TIPO_BALANCA_CHOICES = [
        ('checkout', 'Balança de Check-out (Fora do Caixa)'),
        ('integrada', 'Balança Integrada ao Caixa'),
    ]
    
    MODELO_BALANCA_CHOICES = [
        ('toledo', 'Toledo'),
        ('filizola', 'Filizola'),
        ('urano', 'Urano'),
        ('elgin', 'Elgin'),
        ('balmak', 'Balmak'),
        ('generica', 'Genérica'),
    ]
    
    FORMATO_EXPORTACAO_CHOICES = [
        ('toledo_mgv6', 'Toledo MGV6'),
        ('filizola_smart', 'Filizola Smart'),
        ('urano_pop', 'Urano POP'),
        ('texto_padrao', 'Texto Padrão'),
        ('csv', 'CSV'),
    ]
    
    nome_configuracao = models.CharField(max_length=100, verbose_name='Nome da Configuração')
    tipo_balanca = models.CharField(max_length=20, choices=TIPO_BALANCA_CHOICES, default='checkout')
    modelo_balanca = models.CharField(max_length=50, choices=MODELO_BALANCA_CHOICES, default='toledo')
    
    # Configurações de integração (para balança integrada)
    porta_serial = models.CharField(max_length=20, blank=True, null=True, verbose_name='Porta Serial', help_text='Ex: COM1, COM3')
    baud_rate = models.IntegerField(default=9600, verbose_name='Baud Rate')
    ip_balanca = models.CharField(max_length=50, blank=True, null=True, verbose_name='IP da Balança', help_text='Para balanças com conexão de rede')
    porta_rede = models.IntegerField(blank=True, null=True, default=9100, verbose_name='Porta de Rede')
    
    # Configurações de exportação (para balança de check-out)
    formato_exportacao = models.CharField(max_length=50, choices=FORMATO_EXPORTACAO_CHOICES, default='texto_padrao')
    codigo_inicial_plu = models.IntegerField(default=1, verbose_name='Código Inicial PLU', help_text='Código inicial para numeração dos produtos')
    
    # Configurações gerais
    usar_codigo_barras = models.BooleanField(default=True, verbose_name='Usar Código de Barras do Produto')
    prefixo_codigo = models.CharField(max_length=10, blank=True, null=True, verbose_name='Prefixo do Código', help_text='Prefixo para códigos gerados')
    tamanho_nome_produto = models.IntegerField(default=50, verbose_name='Tamanho Máximo do Nome')
    incluir_validade = models.BooleanField(default=True, verbose_name='Incluir Validade')
    dias_validade_padrao = models.IntegerField(default=3, verbose_name='Dias de Validade Padrão')
    
    # Filtros de produtos
    apenas_produtos_peso = models.BooleanField(default=True, verbose_name='Apenas Produtos Vendidos por Peso')
    grupos_permitidos = models.JSONField(default=list, blank=True, verbose_name='Grupos de Produtos Permitidos', help_text='IDs dos grupos permitidos')
    
    # Controle
    ativo = models.BooleanField(default=True)
    usuario_criacao = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='balancas_criadas')
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'configuracao_balanca'
        verbose_name = 'Configuração de Balança'
        verbose_name_plural = 'Configurações de Balança'
        ordering = ['nome_configuracao']
    
    def __str__(self):
        return f"{self.nome_configuracao} ({self.get_tipo_balanca_display()})"


class ProdutoBalanca(models.Model):
    """Mapeamento de produtos para balança"""
    
    configuracao = models.ForeignKey(ConfiguracaoBalanca, on_delete=models.CASCADE, related_name='produtos')
    produto = models.ForeignKey('Produto', on_delete=models.CASCADE)
    
    # Código PLU (usado pela balança)
    codigo_plu = models.IntegerField(verbose_name='Código PLU')
    
    # Informações específicas da balança
    tara = models.DecimalField(max_digits=10, decimal_places=3, default=0, verbose_name='Tara (kg)', help_text='Peso da embalagem')
    validade_dias = models.IntegerField(default=3, verbose_name='Validade (dias)')
    departamento = models.IntegerField(default=1, verbose_name='Departamento/Setor')
    
    # Controle
    ativo = models.BooleanField(default=True)
    exportado_em = models.DateTimeField(blank=True, null=True, verbose_name='Última Exportação')
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'produto_balanca'
        verbose_name = 'Produto na Balança'
        verbose_name_plural = 'Produtos na Balança'
        unique_together = [['configuracao', 'codigo_plu'], ['configuracao', 'produto']]
        ordering = ['codigo_plu']
    
    def __str__(self):
        return f"PLU {self.codigo_plu} - {self.produto.nome_produto}"


class ExportacaoBalanca(models.Model):
    """Histórico de exportações para balança"""
    
    configuracao = models.ForeignKey(ConfiguracaoBalanca, on_delete=models.CASCADE, related_name='exportacoes')
    arquivo_gerado = models.CharField(max_length=255, verbose_name='Nome do Arquivo')
    quantidade_produtos = models.IntegerField(default=0)
    formato = models.CharField(max_length=50)
    
    # Dados do arquivo
    conteudo_arquivo = models.TextField(verbose_name='Conteúdo do Arquivo')
    tamanho_bytes = models.IntegerField(default=0)
    
    # Controle
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    data_exportacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'exportacao_balanca'
        verbose_name = 'Exportação de Balança'
        verbose_name_plural = 'Exportações de Balança'
        ordering = ['-data_exportacao']
    
    def __str__(self):
        return f"{self.arquivo_gerado} - {self.data_exportacao.strftime('%d/%m/%Y %H:%M')}"
