"""
models_rh.py — RH: Funcionários, Ponto, Holerite, EPI
"""
from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal


class Funcionario(models.Model):
    GENERO_CHOICES = [('M', 'Masculino'), ('F', 'Feminino'), ('O', 'Outro')]
    ESTADO_CIVIL_CHOICES = [
        ('SOLTEIRO', 'Solteiro(a)'), ('CASADO', 'Casado(a)'),
        ('DIVORCIADO', 'Divorciado(a)'), ('VIUVO', 'Viúvo(a)'),
        ('UNIAO_ESTAVEL', 'União Estável'),
    ]
    TIPO_CONTRATO_CHOICES = [
        ('CLT', 'CLT'), ('PJ', 'PJ'), ('ESTAGIO', 'Estágio'),
        ('AUTONOMO', 'Autônomo'), ('TEMPORARIO', 'Temporário'),
    ]

    id_funcionario = models.AutoField(primary_key=True)
    nome_completo = models.CharField(max_length=255)
    matricula = models.CharField(max_length=30, blank=True, null=True, unique=True)
    cpf = models.CharField(max_length=14, unique=True)
    rg = models.CharField(max_length=20, blank=True, null=True)
    data_nascimento = models.DateField(null=True, blank=True)
    genero = models.CharField(max_length=1, choices=GENERO_CHOICES, blank=True, null=True)
    estado_civil = models.CharField(max_length=15, choices=ESTADO_CIVIL_CHOICES, blank=True, null=True)

    # Contato
    email = models.EmailField(blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)

    # Endereço
    cep = models.CharField(max_length=9, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=10, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)

    # Dados trabalhistas
    cargo = models.CharField(max_length=100)
    departamento = models.CharField(max_length=100, blank=True, null=True)
    tipo_contrato = models.CharField(max_length=15, choices=TIPO_CONTRATO_CHOICES, default='CLT')
    data_admissao = models.DateField()
    data_demissao = models.DateField(null=True, blank=True)
    salario_base = models.DecimalField(max_digits=10, decimal_places=2)
    carga_horaria_semanal = models.PositiveSmallIntegerField(default=44, help_text='Horas por semana')

    # Dados bancários
    banco = models.CharField(max_length=10, blank=True, null=True)
    agencia = models.CharField(max_length=10, blank=True, null=True)
    conta = models.CharField(max_length=20, blank=True, null=True)
    tipo_conta = models.CharField(max_length=10, blank=True, null=True, choices=[('CC', 'Corrente'), ('CP', 'Poupança'), ('PIX', 'Pix')])
    chave_pix = models.CharField(max_length=100, blank=True, null=True)

    # Documentos INSS/FGTS
    pis_pasep = models.CharField(max_length=15, blank=True, null=True)
    ctps = models.CharField(max_length=20, blank=True, null=True)
    titulo_eleitor = models.CharField(max_length=20, blank=True, null=True)

    # Controle
    ativo = models.BooleanField(default=True)
    usuario_sistema = models.OneToOneField(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='funcionario',
    )
    foto_url = models.CharField(max_length=500, blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rh_funcionario'
        ordering = ['nome_completo']
        verbose_name = 'Funcionário'

    def __str__(self):
        return f'{self.nome_completo} — {self.cargo}'

    @property
    def ativo_texto(self):
        return 'Ativo' if self.ativo else 'Inativo'


class RegistroPonto(models.Model):
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SAIDA_ALMOCO', 'Saída Almoço'),
        ('RETORNO_ALMOCO', 'Retorno Almoço'),
        ('SAIDA', 'Saída'),
    ]

    id_ponto = models.AutoField(primary_key=True)
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='pontos')
    data_hora = models.DateTimeField()
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    observacao = models.CharField(max_length=255, blank=True, null=True)
    registrado_por = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='pontos_registrados',
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rh_registro_ponto'
        ordering = ['-data_hora']
        verbose_name = 'Registro de Ponto'
        indexes = [
            models.Index(fields=['funcionario', 'data_hora']),
        ]

    def __str__(self):
        return f'{self.funcionario.nome_completo} — {self.get_tipo_display()} {self.data_hora:%d/%m/%Y %H:%M}'


class Holerite(models.Model):
    STATUS_CHOICES = [
        ('RASCUNHO', 'Rascunho'),
        ('CALCULADO', 'Calculado'),
        ('APROVADO', 'Aprovado'),
        ('PAGO', 'Pago'),
    ]

    id_holerite = models.AutoField(primary_key=True)
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='holerites')
    competencia = models.CharField(max_length=7, help_text='MM/AAAA')
    mes = models.PositiveSmallIntegerField()
    ano = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='RASCUNHO')

    # Proventos
    salario_base = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    horas_extras = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    adicional_noturno = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    comissao = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    outros_proventos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_proventos = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Descontos
    inss = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    irrf = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fgts = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vale_transporte = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vale_refeicao = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    plano_saude = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    outros_descontos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_descontos = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Líquido
    salario_liquido = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Dias/horas trabalhados
    dias_trabalhados = models.PositiveSmallIntegerField(default=30)
    horas_trabalhadas = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    horas_extras_valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    observacoes = models.TextField(blank=True, null=True)
    data_pagamento = models.DateField(null=True, blank=True)
    aprovado_por = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='holerites_aprovados',
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rh_holerite'
        ordering = ['-ano', '-mes']
        unique_together = [('funcionario', 'mes', 'ano')]
        verbose_name = 'Holerite'

    def __str__(self):
        return f'Holerite {self.competencia} — {self.funcionario.nome_completo}'

    def calcular(self):
        """Calcula os totais do holerite automaticamente."""
        self.total_proventos = (
            self.salario_base + self.horas_extras + self.adicional_noturno
            + self.comissao + self.outros_proventos
        )
        # INSS 2025: faixas progressivas simplificadas
        if self.total_proventos <= Decimal('1412.00'):
            self.inss = self.total_proventos * Decimal('0.075')
        elif self.total_proventos <= Decimal('2666.68'):
            self.inss = self.total_proventos * Decimal('0.09')
        elif self.total_proventos <= Decimal('4000.03'):
            self.inss = self.total_proventos * Decimal('0.12')
        else:
            self.inss = self.total_proventos * Decimal('0.14')

        # IRRF simplificado 2025
        base_irrf = self.total_proventos - self.inss
        if base_irrf <= Decimal('2259.20'):
            self.irrf = Decimal('0')
        elif base_irrf <= Decimal('2826.65'):
            self.irrf = base_irrf * Decimal('0.075') - Decimal('169.44')
        elif base_irrf <= Decimal('3751.05'):
            self.irrf = base_irrf * Decimal('0.15') - Decimal('381.44')
        elif base_irrf <= Decimal('4664.68'):
            self.irrf = base_irrf * Decimal('0.225') - Decimal('662.77')
        else:
            self.irrf = base_irrf * Decimal('0.275') - Decimal('896.00')
        if self.irrf < 0:
            self.irrf = Decimal('0')

        self.fgts = self.total_proventos * Decimal('0.08')
        self.total_descontos = (
            self.inss + self.irrf + self.vale_transporte
            + self.vale_refeicao + self.plano_saude + self.outros_descontos
        )
        self.salario_liquido = self.total_proventos - self.total_descontos
        return self


class CategoriaEPI(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    descricao = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'rh_categoria_epi'
        ordering = ['nome']

    def __str__(self):
        return self.nome


class EPI(models.Model):
    id_epi = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=200)
    ca = models.CharField(max_length=20, blank=True, null=True, help_text='Certificado de Aprovação MTE')
    categoria = models.ForeignKey(CategoriaEPI, null=True, blank=True, on_delete=models.SET_NULL)
    descricao = models.TextField(blank=True, null=True)
    validade_dias = models.PositiveIntegerField(default=365, help_text='Vida útil em dias')
    estoque_atual = models.PositiveIntegerField(default=0)
    estoque_minimo = models.PositiveIntegerField(default=1)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'rh_epi'
        ordering = ['nome']
        verbose_name = 'EPI'
        verbose_name_plural = 'EPIs'

    def __str__(self):
        return self.nome


class EntregaEPI(models.Model):
    id_entrega = models.AutoField(primary_key=True)
    funcionario = models.ForeignKey(Funcionario, on_delete=models.CASCADE, related_name='epis_entregues')
    epi = models.ForeignKey(EPI, on_delete=models.CASCADE, related_name='entregas')
    quantidade = models.PositiveSmallIntegerField(default=1)
    data_entrega = models.DateField()
    data_vencimento = models.DateField(null=True, blank=True)
    data_devolucao = models.DateField(null=True, blank=True)
    assinado = models.BooleanField(default=False, help_text='Funcionário assinou o recibo')
    observacao = models.CharField(max_length=255, blank=True, null=True)
    entregue_por = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='epis_entregues_por',
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rh_entrega_epi'
        ordering = ['-data_entrega']
        verbose_name = 'Entrega de EPI'

    def __str__(self):
        return f'{self.epi.nome} → {self.funcionario.nome_completo} ({self.data_entrega})'


class OcorrenciaFuncionario(models.Model):
    """Registra faltas, atestados, afastamentos e outras ocorrências."""
    TIPO_CHOICES = [
        ('FALTA',            'Falta'),
        ('FALTA_JUSTIFICADA','Falta Justificada'),
        ('ATESTADO',         'Atestado Médico'),
        ('ATESTADO_ODONTO',  'Atestado Odontológico'),
        ('AFASTAMENTO',      'Afastamento INSS'),
        ('FERIAS',           'Férias'),
        ('LICENCA',          'Licença'),
        ('ATRASO',           'Atraso'),
        ('SAIDA_ANTECIPADA', 'Saída Antecipada'),
        ('OUTROS',           'Outros'),
    ]
    STATUS_CHOICES = [
        ('PENDENTE',  'Pendente'),
        ('APROVADO',  'Aprovado'),
        ('REJEITADO', 'Rejeitado'),
    ]

    id_ocorrencia = models.AutoField(primary_key=True)
    funcionario = models.ForeignKey(
        Funcionario, on_delete=models.CASCADE, related_name='ocorrencias',
    )
    tipo = models.CharField(max_length=25, choices=TIPO_CHOICES)
    data_inicio = models.DateField()
    data_fim = models.DateField()
    dias = models.PositiveSmallIntegerField(default=1, help_text='Total de dias de afastamento/ausência')
    descricao = models.TextField(blank=True, null=True)
    desconta_salario = models.BooleanField(
        default=False,
        help_text='Se marcado, desconta proporcionalmente do salário no holerite',
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDENTE')
    arquivo_url = models.CharField(max_length=500, blank=True, null=True, help_text='URL do documento digitalizado')
    registrado_por = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='ocorrencias_registradas',
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rh_ocorrencia_funcionario'
        ordering = ['-data_inicio']
        verbose_name = 'Ocorrência'
        verbose_name_plural = 'Ocorrências'
        indexes = [
            models.Index(fields=['funcionario', 'data_inicio']),
        ]

    def __str__(self):
        return f'{self.get_tipo_display()} — {self.funcionario.nome_completo} ({self.data_inicio})'

    def save(self, *args, **kwargs):
        # Auto-calcula dias se não informado
        if self.data_inicio and self.data_fim and self.dias == 1:
            delta = (self.data_fim - self.data_inicio).days + 1
            if delta > 0:
                self.dias = delta
        super().save(*args, **kwargs)
