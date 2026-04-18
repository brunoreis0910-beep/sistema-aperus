from django.db import models
from django.core.validators import RegexValidator


class EscritorioContabilidade(models.Model):
    """Model para cadastro de escritórios de contabilidade"""
    
    cnpj = models.CharField(
        'CNPJ',
        max_length=18,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$',
                message='CNPJ deve estar no formato: XX.XXX.XXX/XXXX-XX'
            )
        ]
    )
    razao_social = models.CharField('Razão Social', max_length=255)
    telefone = models.CharField(
        'Telefone',
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\(\d{2}\)\s?\d{4,5}-\d{4}$',
                message='Telefone deve estar no formato: (XX) XXXXX-XXXX'
            )
        ]
    )
    contador = models.CharField('Nome do Contador', max_length=255)
    email = models.EmailField('E-mail')
    
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    ativo = models.BooleanField('Ativo', default=True)
    
    class Meta:
        db_table = 'escritorio_contabilidade'
        verbose_name = 'Escritório de Contabilidade'
        verbose_name_plural = 'Escritórios de Contabilidade'
        ordering = ['razao_social']
    
    def save(self, *args, **kwargs):
        # Converter campos de texto para maiúsculo
        _campos_upper_excluidos = {'email'}
        for field in self._meta.fields:
            if field.name in _campos_upper_excluidos:
                continue
            if isinstance(field, (models.CharField, models.TextField)):
                valor = getattr(self, field.name)
                if isinstance(valor, str):
                    setattr(self, field.name, valor.upper())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.razao_social} - {self.cnpj}"


class Cliente(models.Model):
    """Model para cadastro de clientes"""
    
    REGIME_CHOICES = [
        ('SIMPLES', 'Simples Nacional'),
        ('LUCRO_REAL', 'Lucro Real'),
        ('LUCRO_PRESUMIDO', 'Lucro Presumido'),
        ('MEI', 'Microempreendedor Individual (MEI)'),
        ('IMUNES_ISENTAS', 'Imunes e Isentas'),
    ]
    
    # Dados da Empresa
    razao_social = models.CharField('Razão Social', max_length=255)
    nome_fantasia = models.CharField('Nome Fantasia', max_length=255, blank=True, null=True)
    
    cnpj = models.CharField(
        'CNPJ',
        max_length=18,
        unique=True,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$',
                message='CNPJ deve estar no formato: XX.XXX.XXX/XXXX-XX'
            )
        ]
    )
    inscricao_estadual = models.CharField(
        'Inscrição Estadual',
        max_length=20,
        blank=True,
        null=True
    )
    
    # Endereço
    endereco = models.CharField('Endereço', max_length=255)
    numero = models.CharField('Número', max_length=20)
    complemento = models.CharField('Complemento', max_length=100, blank=True, null=True)
    bairro = models.CharField('Bairro', max_length=100)
    cidade = models.CharField('Cidade', max_length=100)
    estado = models.CharField('Estado', max_length=2)
    cep = models.CharField(
        'CEP',
        max_length=10,
        validators=[
            RegexValidator(
                regex=r'^\d{5}-\d{3}$',
                message='CEP deve estar no formato: XXXXX-XXX'
            )
        ]
    )
    
    # Dados do Proprietário
    proprietario = models.CharField('Nome do Proprietário', max_length=255, blank=True, null=True)
    data_nascimento = models.DateField('Data de Nascimento', blank=True, null=True)
    cpf = models.CharField(
        'CPF do Proprietário',
        max_length=14,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'^\d{3}\.\d{3}\.\d{3}-\d{2}$',
                message='CPF deve estar no formato: XXX.XXX.XXX-XX'
            )
        ]
    )
    telefone = models.CharField(
        'Telefone',
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\(\d{2}\)\s?\d{4,5}-\d{4}$',
                message='Telefone deve estar no formato: (XX) XXXXX-XXXX'
            )
        ]
    )
    email = models.EmailField('E-mail')
    
    # Regime Tributário
    regime_tributario = models.CharField(
        'Regime Tributário',
        max_length=20,
        choices=REGIME_CHOICES,
        default='SIMPLES'
    )
    
    # Relacionamento com Escritório de Contabilidade
    escritorio = models.ForeignKey(
        EscritorioContabilidade,
        on_delete=models.PROTECT,
        related_name='clientes',
        verbose_name='Escritório de Contabilidade',
        blank=True,
        null=True
    )
    
    # Campos de controle
    criado_em = models.DateTimeField('Criado em', auto_now_add=True)
    atualizado_em = models.DateTimeField('Atualizado em', auto_now=True)
    ativo = models.BooleanField('Ativo', default=True)
    observacoes = models.TextField('Observações', blank=True, null=True)
    
    class Meta:
        db_table = 'cliente'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['razao_social']
        indexes = [
            models.Index(fields=['cnpj']),
            models.Index(fields=['razao_social']),
            models.Index(fields=['regime_tributario']),
        ]
    
    def save(self, *args, **kwargs):
        # Converter campos de texto para maiúsculo
        _campos_upper_excluidos = {'email'}
        for field in self._meta.fields:
            if field.name in _campos_upper_excluidos:
                continue
            if isinstance(field, (models.CharField, models.TextField)):
                valor = getattr(self, field.name)
                if isinstance(valor, str):
                    setattr(self, field.name, valor.upper())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.razao_social} - {self.cnpj}"
    
    @property
    def endereco_completo(self):
        """Retorna o endereço completo formatado"""
        endereco = f"{self.endereco}, {self.numero}"
        if self.complemento:
            endereco += f", {self.complemento}"
        endereco += f" - {self.bairro}, {self.cidade}/{self.estado} - CEP: {self.cep}"
        return endereco
