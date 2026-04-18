from django.db import models
from api.models import Cliente
from django.contrib.auth.models import User


class ManifestoEletronico(models.Model):
    """Model para MDF-e (Manifesto Eletrônico de Documentos Fiscais)"""
    
    id_mdfe = models.AutoField(primary_key=True)
    
    # Status e Info Fiscal
    chave_mdfe = models.CharField(max_length=44, blank=True, null=True)
    protocolo_mdfe = models.CharField(max_length=50, blank=True, null=True)
    numero_mdfe = models.IntegerField(blank=True, null=True)
    serie_mdfe = models.IntegerField(default=1)
    status_mdfe = models.CharField(max_length=20, default='PENDENTE')  # PENDENTE, EMITIDO, ENCERRADO, CANCELADO, ERRO
    xml_mdfe = models.TextField(blank=True, null=True)
    qrcode_url = models.CharField(max_length=500, blank=True, null=True)
    cstat = models.IntegerField(blank=True, null=True)
    xmotivo = models.CharField(max_length=255, blank=True, null=True)
    
    # Dados da Emissão
    data_emissao = models.DateTimeField(auto_now_add=True)
    data_inicio_viagem = models.DateTimeField(blank=True, null=True)
    data_saida = models.DateField(blank=True, null=True, help_text="Data de saída da carga")
    hora_saida = models.TimeField(blank=True, null=True, help_text="Hora de saída da carga")
    cfop = models.CharField(max_length=4, default='5932')  # Prestação de serviço de transporte
    modelo = models.CharField(max_length=2, default='58')  # 58 = MDF-e
    tipo_emitente = models.IntegerField(default=1)  # 1-Prestador de serviço de transporte, 2-Transportador de Carga Própria, 3-Prestador de serviço de transporte que emitirá CT-e Globalizado
    tipo_emissao = models.IntegerField(default=1, help_text="1-Normal, 2-Contingência, 3-Regime Especial NFF")  # OBRIGATÓRIO MOC v3.00b
    tipo_transporte = models.IntegerField(default=1)  # 1-ETC, 2-TAC, 3-CTC
    modal = models.CharField(max_length=2, default='01')  # 01-Rodoviário, 02-Aéreo, 03-Aquaviário, 04-Ferroviário
    uf_inicio = models.CharField(max_length=2, blank=True, null=True)
    uf_fim = models.CharField(max_length=2, blank=True, null=True)
    
    # RNTRC e Contratação
    rntrc_prestador = models.CharField(max_length=8, blank=True, null=True, help_text="RNTRC ANTT do Prestador do Serviço")
    contratante_rntrc = models.CharField(max_length=8, blank=True, null=True, help_text="RNTRC ANTT do Contratante")
    contratante_cnpj = models.CharField(max_length=14, blank=True, null=True, help_text="CNPJ do Contratante do Serviço")
    
    # Tomador do Serviço (obrigatório quando tipo_emitente=1 - prestação de serviço)
    tomador_servico = models.IntegerField(
        blank=True, 
        null=True,
        help_text="0-Remetente, 1-Expedidor, 2-Recebedor, 3-Destinatário, 4-Outros. Obrigatório para tipo_emitente=1"
    )
    tomador_ind_ie = models.IntegerField(
        blank=True,
        null=True,
        help_text="1-Contribuinte ICMS, 2-Isento, 9-Não Contribuinte. OBRIGATÓRIO quando tipo_emitente=1"
    )  # OBRIGATÓRIO MOC v3.00b quando tipo_emitente=1
    # Dados do Tomador (quando tomador_servico = 4 - Outros)
    tomador_cliente = models.ForeignKey(
        Cliente, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='mdfes_como_tomador',
        help_text="Cliente tomador do serviço (quando tipo_emitente=1 e tomador_servico=4)"
    )
    tomador_cpf_cnpj = models.CharField(max_length=18, blank=True, null=True, help_text="CPF/CNPJ do tomador (alternativa ao tomador_cliente)")
    tomador_nome = models.CharField(max_length=60, blank=True, null=True, help_text="Nome/Razão Social do tomador")
    
    # Totalizadores de Carga
    quantidade_cte = models.IntegerField(default=0)
    quantidade_nfe = models.IntegerField(default=0)
    valor_total_carga = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    peso_total_kg = models.DecimalField(max_digits=12, decimal_places=4, default=0.0000)
    
    # Informações do Produto Predominante
    produto_predominante = models.CharField(max_length=120, default="Diversos", blank=True, null=True)
    produto_ncm = models.CharField(max_length=8, blank=True, null=True, help_text="NCM do Produto Predominante")
    tipo_carga = models.CharField(max_length=2, blank=True, null=True, help_text="01-Granel sólido, 02-Granel líquido, 03-Frigorificada, 04-Conteinerizada, 05-Carga Geral, 06-Neogranel, 07-Perigosa (IMO)")
    cep_carregamento = models.CharField(max_length=8, blank=True, null=True)
    cep_descarregamento = models.CharField(max_length=8, blank=True, null=True)
    
    # Seguro da Carga
    responsavel_seguro = models.CharField(max_length=1, default='2')  # 1-Emitente, 2-Responsável pela contratação, 4-Emitente do CT-e
    responsavel_seguro_cpf_cnpj = models.CharField(max_length=14, blank=True, null=True, help_text="CPF/CNPJ do Responsável pela contratação do seguro")
    nome_seguradora = models.CharField(max_length=60, blank=True, null=True)
    numero_apolice = models.CharField(max_length=20, blank=True, null=True)
    averbacao = models.CharField(max_length=40, blank=True, null=True, help_text="Número de Averbação do Seguro")
    cnpj_seguradora = models.CharField(max_length=14, blank=True, null=True)
    
    # Condutor
    condutor_nome = models.CharField(max_length=60, blank=True, null=True)
    condutor_cpf = models.CharField(max_length=11, blank=True, null=True)
    
    # Veículo de Tração
    placa_veiculo = models.CharField(max_length=7, blank=True, null=True)
    uf_veiculo = models.CharField(max_length=2, blank=True, null=True)
    rntrc_veiculo = models.CharField(max_length=8, blank=True, null=True, help_text="RNTRC do Veículo")
    veiculo_tipo_rodado = models.CharField(
        max_length=2, 
        blank=True, 
        null=True, 
        help_text="01-Truck, 02-Toco, 03-Cavalo, 04-VAN, 05-Utilitário, 06-Outros. OBRIGATÓRIO"
    )  # OBRIGATÓRIO MOC v3.00b
    veiculo_tipo_carroceria = models.CharField(
        max_length=2, 
        blank=True, 
        null=True, 
        help_text="00-Não aplicável, 01-Aberta, 02-Fechada/Baú, 03-Graneleira, 04-Porta Container, 05-Sider. OBRIGATÓRIO"
    )  # OBRIGATÓRIO MOC v3.00b
    veiculo_tara_kg = models.IntegerField(default=0, help_text="Tara do veículo em KG. OBRIGATÓRIO")  # OBRIGATÓRIO MOC v3.00b
    veiculo_capacidade_kg = models.IntegerField(default=0, help_text="Capacidade de carga do veículo em KG. OBRIGATÓRIO")  # OBRIGATÓRIO MOC v3.00b
    
    # Proprietário do Veículo
    proprietario_veiculo_cpf_cnpj = models.CharField(max_length=14, blank=True, null=True)
    proprietario_veiculo_tipo = models.IntegerField(default=1)  # 0-TAC Agregado, 1-TAC Independente, 2-Outros
    proprietario_veiculo_nome = models.CharField(max_length=60, blank=True, null=True)
    
    # Controle
    observacoes = models.TextField(blank=True, null=True)
    criado_por = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mdfe_manifestos'
        ordering = ['-id_mdfe']
        verbose_name = 'MDF-e'
        verbose_name_plural = 'MDF-e'
    
    def __str__(self):
        return f"MDF-e {self.numero_mdfe} - {self.status_mdfe}"


class MDFeDocumentoVinculado(models.Model):
    """Documentos fiscais vinculados ao MDF-e (CT-e e NF-e)"""
    
    TIPO_DOC_CHOICES = [
        ('CTE', 'CT-e - Conhecimento de Transporte Eletrônico'),
        ('NFE', 'NF-e - Nota Fiscal Eletrônica'),
    ]
    
    id_doc = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='documentos_vinculados')
    tipo_documento = models.CharField(max_length=3, choices=TIPO_DOC_CHOICES, default='NFE')
    chave_acesso = models.CharField(max_length=44, help_text="Chave de Acesso do documento (44 dígitos)")
    
    # Informações opcionais do MDF-e para o documento
    uf_percurso = models.CharField(max_length=2, blank=True, null=True)
    municipio_carregamento = models.CharField(max_length=60, blank=True, null=True)
    municipio_descarregamento = models.CharField(max_length=60, blank=True, null=True)
    
    class Meta:
        db_table = 'mdfe_documentos_vinculados'
        verbose_name = 'Documento Vinculado'
        verbose_name_plural = 'Documentos Vinculados'
    
    def __str__(self):
        return f"{self.tipo_documento}: {self.chave_acesso[:10]}..."


class MDFePercurso(models.Model):
    """UFs de percurso do MDF-e"""
    
    id_percurso = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='percursos')
    uf = models.CharField(max_length=2, help_text="Sigla da UF")
    ordem = models.IntegerField(default=1, help_text="Ordem de percurso")
    
    class Meta:
        db_table = 'mdfe_percursos'
        ordering = ['ordem']
        verbose_name = 'Percurso'
        verbose_name_plural = 'Percursos'
    
    def __str__(self):
        return f"{self.uf} (Ordem: {self.ordem})"


class MDFeCarregamento(models.Model):
    """Municípios de carregamento do MDF-e"""
    
    id_carregamento = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='carregamentos')
    municipio_cep = models.CharField(max_length=9, null=True, blank=True)
    municipio_nome = models.CharField(max_length=60)
    municipio_codigo_ibge = models.CharField(max_length=7)
    uf = models.CharField(max_length=2)
    
    class Meta:
        db_table = 'mdfe_carregamentos'
        verbose_name = 'Carregamento'
        verbose_name_plural = 'Carregamentos'
    
    def __str__(self):
        return f"{self.municipio_nome}/{self.uf}"


class MDFeDescarregamento(models.Model):
    """Municípios de descarregamento do MDF-e"""
    
    id_descarregamento = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='descarregamentos')
    municipio_cep = models.CharField(max_length=9, null=True, blank=True)
    municipio_nome = models.CharField(max_length=60)
    municipio_codigo_ibge = models.CharField(max_length=7)
    uf = models.CharField(max_length=2)
    
    class Meta:
        db_table = 'mdfe_descarregamentos'
        verbose_name = 'Descarregamento'
        verbose_name_plural = 'Descarregamentos'
    
    def __str__(self):
        return f"{self.municipio_nome}/{self.uf}"


class MDFeCondutor(models.Model):
    """Condutores adicionais do MDF-e (além do principal)"""
    
    id_condutor = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='condutores_adicionais')
    nome = models.CharField(max_length=60)
    cpf = models.CharField(max_length=11)
    
    class Meta:
        db_table = 'mdfe_condutores'
        verbose_name = 'Condutor Adicional'
        verbose_name_plural = 'Condutores Adicionais'
    
    def __str__(self):
        return self.nome


class MDFeReboque(models.Model):
    """Veículos rebocados (carretas, etc)"""
    
    id_reboque = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='reboques')
    placa = models.CharField(max_length=7)
    uf = models.CharField(max_length=2)
    rntrc = models.CharField(max_length=8, blank=True, null=True)
    tara_kg = models.IntegerField(default=0, help_text="Tara em KG")
    capacidade_kg = models.IntegerField(default=0, help_text="Capacidade em KG")
    tipo_carroceria = models.CharField(max_length=2, default='00', help_text="00-não aplicável, 01-Aberta, 02-Fechada/Baú, etc")
    
    class Meta:
        db_table = 'mdfe_reboques'
        verbose_name = 'Reboque'
        verbose_name_plural = 'Reboques'
    
    def __str__(self):
        return f"{self.placa}/{self.uf}"


class MDFeLacre(models.Model):
    """Lacres aplicados no MDF-e"""
    
    id_lacre = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='lacres')
    numero_lacre = models.CharField(max_length=60)
    
    class Meta:
        db_table = 'mdfe_lacres'
        verbose_name = 'Lacre'
        verbose_name_plural = 'Lacres'
    
    def __str__(self):
        return self.numero_lacre


class MDFeValePedagio(models.Model):
    """Vale Pedágio do MDF-e"""
    
    CATEGORIA_VEICULO_CHOICES = [
        ('01', '01 - Eixo simples/Rodado simples'),
        ('02', '02 - Eixo simples/Rodado duplo'),
        ('03', '03 - Eixo duplo'),
        ('04', '04 - Eixo triplo'),
    ]
    
    TIPO_VALE_CHOICES = [
        ('01', '01 - TAG/OBU'),
        ('02', '02 - Cupom papel'),
        ('03', '03 - Vale eletrônico'),
    ]
    
    id_vale_pedagio = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='vales_pedagio')
    categoria_veiculo = models.CharField(max_length=2, choices=CATEGORIA_VEICULO_CHOICES, blank=True, null=True)
    tipo_vale = models.CharField(max_length=2, choices=TIPO_VALE_CHOICES, default='01')
    cnpj_fornecedor = models.CharField(max_length=14, blank=True, null=True)
    cpf_cnpj_portador = models.CharField(max_length=14, blank=True, null=True)
    numero_comprovante = models.CharField(max_length=20, blank=True, null=True)
    valor_pedagio = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    class Meta:
        db_table = 'mdfe_vale_pedagio'
        verbose_name = 'Vale Pedágio'
        verbose_name_plural = 'Vales Pedágio'
    
    def __str__(self):
        return f"Vale Pedágio R$ {self.valor_pedagio} - {self.get_tipo_vale_display()}"


class MDFePagamento(models.Model):
    """Pagamentos do MDF-e (frete, impostos, taxas, etc)"""
    
    TIPO_PAGAMENTO_CHOICES = [
        ('01', '01 - Dinheiro'),
        ('02', '02 - Vale Pedágio'),
        ('03', '03 - Cartão de Crédito'),
        ('04', '04 - Cartão de Débito'),
        ('05', '05 - Cheque'),
        ('10', '10 - Boleto Bancário'),
        ('11', '11 - Depósito Bancário'),
        ('12', '12 - PIX'),
        ('99', '99 - Outros'),
    ]
    
    RESPONSAVEL_PAGAMENTO_CHOICES = [
        ('1', '1 - Emitente'),
        ('2', '2 - Destinatário'),
        ('3', '3 - Expedidor'),
        ('4', '4 - Recebedor'),
        ('5', '5 - Remetente'),
    ]
    
    id_pagamento = models.AutoField(primary_key=True)
    mdfe = models.ForeignKey(ManifestoEletronico, on_delete=models.CASCADE, related_name='pagamentos')
    tipo_pagamento = models.CharField(max_length=2, choices=TIPO_PAGAMENTO_CHOICES, default='01')
    responsavel_pagamento = models.CharField(max_length=1, choices=RESPONSAVEL_PAGAMENTO_CHOICES, default='1')
    componente = models.CharField(max_length=50, blank=True, null=True, help_text="Vale Pedágio, Impostos, Taxas, Contribuições")
    valor = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    descricao = models.CharField(max_length=255, blank=True, null=True)
    conta_bancaria = models.CharField(max_length=30, blank=True, null=True)
    chave_pix = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'mdfe_pagamento'
        verbose_name = 'Pagamento'
        verbose_name_plural = 'Pagamentos'
    
    def __str__(self):
        return f"{self.get_tipo_pagamento_display()} - R$ {self.valor}"
