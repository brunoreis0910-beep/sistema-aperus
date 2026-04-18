"""
Modelos para Hierarquia Mercadológica e Inteligência de Produtos
Criado para suportar funcionalidades avançadas de supermercados
"""
from django.db import models
from api.models import Produto


class CategoriaMercadologica(models.Model):
    """
    Hierarquia de 3 níveis para classificação mercadológica
    Nível 1: Departamento (ex: Mercearia Doce)
    Nível 2: Categoria (ex: Culinária Doce)
    Nível 3: Subcategoria (ex: Recheios e Coberturas)
    
    Exemplo de árvore completa:
    Mercearia Doce > Culinária Doce > Recheios e Coberturas
    """
    NIVEL_CHOICES = [
        (1, 'Departamento'),
        (2, 'Categoria'),
        (3, 'Subcategoria'),
    ]
    
    id_categoria = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, help_text='Nome da categoria')
    nivel = models.IntegerField(choices=NIVEL_CHOICES, help_text='Nível hierárquico')
    pai = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='filhos',
        help_text='Categoria pai (nível superior)'
    )
    ativo = models.BooleanField(default=True)
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição')
    
    # Campos para IA/Analytics
    keywords = models.TextField(
        blank=True,
        null=True,
        help_text='Palavras-chave para classificação (separadas por vírgula)'
    )
    
    class Meta:
        db_table = 'categorias_mercadologicas'
        ordering = ['nivel', 'ordem', 'nome']
        verbose_name = 'Categoria Mercadológica'
        verbose_name_plural = 'Categorias Mercadológicas'
        indexes = [
            models.Index(fields=['nivel', 'ativo']),
            models.Index(fields=['pai', 'nivel']),
        ]
    
    def __str__(self):
        return self.get_caminho_completo()
    
    def get_caminho_completo(self):
        """
        Retorna caminho completo: Departamento > Categoria > Subcategoria
        """
        if self.pai:
            return f"{self.pai.get_caminho_completo()} > {self.nome}"
        return self.nome
    
    def get_departamento(self):
        """Retorna o departamento (nível 1) desta categoria"""
        if self.nivel == 1:
            return self
        elif self.pai:
            return self.pai.get_departamento()
        return None
    
    def get_todas_subcategorias(self):
        """Retorna recursivamente todas as subcategorias filhas"""
        subcategorias = []
        for filho in self.filhos.all():
            subcategorias.append(filho)
            subcategorias.extend(filho.get_todas_subcategorias())
        return subcategorias


class InformacaoProdutoAPI(models.Model):
    """
    Armazena dados enriquecidos obtidos via APIs externas (Cosmos, GS1, etc.)
    """
    produto = models.OneToOneField(
        Produto,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='info_api'
    )
    
    # Dados da API
    fonte_api = models.CharField(
        max_length=50,
        choices=[
            ('COSMOS', 'Cosmos API (Bluesoft)'),
            ('GS1', 'GS1 Brasil'),
            ('MERCADOLIVRE', 'Mercado Livre'),
            ('MANUAL', 'Cadastro Manual'),
        ],
        default='MANUAL'
    )
    
    dados_completos_json = models.JSONField(
        blank=True,
        null=True,
        help_text='JSON completo retornado pela API (backup)'
    )
    
    imagem_url_externa = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='URL original da imagem fornecida pela API'
    )
    
    descricao_api = models.TextField(
        blank=True,
        null=True,
        help_text='Descrição original da API'
    )
    
    marca_api = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Marca retornada pela API'
    )
    
    categoria_sugerida = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='Categoria sugerida pela API (GPC ou similar)'
    )
    
    # Metadados
    data_sincronizacao = models.DateTimeField(auto_now=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    usuario_sincronizacao = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )
    
    confianca_dados = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=1.00,
        help_text='Nível de confiança dos dados (0.0 a 1.0)'
    )
    
    class Meta:
        db_table = 'informacoes_produto_api'
        verbose_name = 'Informação de Produto (API)'
        verbose_name_plural = 'Informações de Produtos (API)'
    
    def __str__(self):
        return f"{self.produto.nome_produto} - {self.fonte_api}"


class PrecoConcorrente(models.Model):
    """
    Histórico de preços da concorrência por região
    Alimentado via APIs de pesquisa de mercado
    """
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='precos_concorrencia'
    )
    
    ean = models.CharField(max_length=14, db_index=True)
    
    # Dados do concorrente
    nome_loja = models.CharField(max_length=200, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    distancia_km = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    
    # Preço
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    data_coleta = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Fonte
    fonte = models.CharField(
        max_length=50,
        choices=[
            ('INFOPRICE', 'InfoPrice'),
            ('NFE_PUBLICA', 'NFe Pública'),
            ('SCRAP', 'Web Scraping'),
            ('MANUAL', 'Entrada Manual'),
        ]
    )
    
    dados_origem_json = models.JSONField(blank=True, null=True)
    
    class Meta:
        db_table = 'precos_concorrencia'
        ordering = ['-data_coleta']
        verbose_name = 'Preço Concorrente'
        verbose_name_plural = 'Preços da Concorrência'
        indexes = [
            models.Index(fields=['ean', 'data_coleta']),
            models.Index(fields=['produto', 'data_coleta']),
        ]
    
    def __str__(self):
        return f"{self.produto.nome_produto} - R$ {self.preco} ({self.nome_loja})"


class ClassificacaoIA(models.Model):
    """
    Log de classificações feitas pela IA
    Usado para retreinamento e auditoria
    """
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='classificacoes_ia'
    )
    
    categoria_sugerida = models.ForeignKey(
        CategoriaMercadologica,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='sugestoes_ia'
    )
    
    confianca = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        help_text='Nível de confiança (0.0 a 1.0)'
    )
    
    aceita = models.BooleanField(
        null=True,
        blank=True,
        help_text='Se o usuário aceitou ou rejeitou a sugestão'
    )
    
    categoria_escolhida_usuario = models.ForeignKey(
        CategoriaMercadologica,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='escolhas_manuais'
    )
    
    data_classificacao = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    
    # Dados para retreinamento
    texto_analisado = models.TextField(help_text='Nome + Descrição usado na análise')
    modelo_ia = models.CharField(max_length=50, default='gemini-2.5-flash')
    
    class Meta:
        db_table = 'classificacoes_ia'
        ordering = ['-data_classificacao']
        verbose_name = 'Classificação IA'
        verbose_name_plural = 'Classificações IA'
    
    def __str__(self):
        return f"{self.produto.nome_produto} -> {self.categoria_sugerida}"
