# Em: C:\Projetos\SistemaGerencial\api\models.py
# (Código completo com os novos campos em FormaPagamento)

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone 

# --- Modelo de Cliente ---
class Cliente(models.Model):
    id_cliente = models.AutoField(primary_key=True)
    nome_razao_social = models.CharField(max_length=255)
    nome_fantasia = models.CharField(max_length=255, blank=True, null=True)
    cpf_cnpj = models.CharField(unique=True, max_length=18)
    inscricao_estadual = models.CharField(max_length=20, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    cep = models.CharField(max_length=10, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    limite_credito = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.00)
    logo_url = models.CharField(max_length=500, blank=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True) 
    ativo = models.BooleanField(default=True, help_text="Cliente ativo ou inativo")
    data_inativacao = models.DateTimeField(blank=True, null=True, help_text="Data em que o cliente foi inativado")
    motivo_inativacao = models.TextField(blank=True, null=True, help_text="Motivo da inativação")
    
    # SPED / Fiscal
    codigo_municipio_ibge = models.CharField(max_length=7, blank=True, null=True, help_text="Código IBGE do Município (7 dígitos)")

    SEXO_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Feminino'),
    ]
    sexo = models.CharField(max_length=1, blank=True, null=True, choices=SEXO_CHOICES)

    class Meta:
        managed = False 
        db_table = 'clientes'
        ordering = ['nome_razao_social']
    
    def __str__(self):
        return self.nome_razao_social

    def save(self, *args, **kwargs):
        # Converter campos de texto para maiúsculo
        _campos_upper_excluidos = {'email', 'logo_url', 'imagem_url', 'slug'}
        for field in self._meta.fields:
            if field.name in _campos_upper_excluidos:
                continue
            if isinstance(field, (models.CharField, models.TextField)):
                valor = getattr(self, field.name)
                if isinstance(valor, str):
                    setattr(self, field.name, valor.upper())
        super().save(*args, **kwargs)

    @property
    def cpf_cnpj_limpo(self):
        import re
        if not self.cpf_cnpj: return ""
        return re.sub(r'[^0-9]', '', self.cpf_cnpj)
        
    @property
    def codigo_municipio_limpo(self):
        import re
        if not self.codigo_municipio_ibge: return ""
        return re.sub(r'[^0-9]', '', self.codigo_municipio_ibge)



# --- Modelo Fornecedor (mesmos campos que Cliente) ---
class Fornecedor(models.Model):
    id_fornecedor = models.AutoField(primary_key=True)
    nome_razao_social = models.CharField(max_length=255)
    nome_fantasia = models.CharField(max_length=255, blank=True, null=True)
    cpf_cnpj = models.CharField(unique=True, max_length=18)
    inscricao_estadual = models.CharField(max_length=20, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    cep = models.CharField(max_length=10, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    limite_credito = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.00)
    logo_url = models.CharField(max_length=500, blank=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)

    # SPED / Fiscal
    codigo_municipio_ibge = models.CharField(max_length=7, blank=True, null=True, help_text="Código IBGE do Município (7 dígitos)")

    class Meta:
        managed = False
        db_table = 'fornecedores'
        ordering = ['nome_razao_social']

    def __str__(self):
        return self.nome_razao_social

    def save(self, *args, **kwargs):
        # Converter campos de texto para maiúsculo
        _campos_upper_excluidos = {'email', 'logo_url', 'imagem_url', 'slug'}
        for field in self._meta.fields:
            if field.name in _campos_upper_excluidos:
                continue
            if isinstance(field, (models.CharField, models.TextField)):
                valor = getattr(self, field.name)
                if isinstance(valor, str):
                    setattr(self, field.name, valor.upper())
        super().save(*args, **kwargs)

    @property
    def cpf_cnpj_limpo(self):
        import re
        if not self.cpf_cnpj: return ""
        return re.sub(r'[^0-9]', '', self.cpf_cnpj)
        
    @property
    def codigo_municipio_limpo(self):
        import re
        if not self.codigo_municipio_ibge: return ""
        return re.sub(r'[^0-9]', '', self.codigo_municipio_ibge)


# --- Modelo GrupoProduto ---
class GrupoProduto(models.Model):
    id_grupo = models.AutoField(primary_key=True)
    nome_grupo = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True, db_column='descricao', help_text="Descrição do grupo de produtos")

    class Meta:
        managed = True
        db_table = 'grupos_produto'
        ordering = ['nome_grupo']

    def __str__(self):
        return self.nome_grupo

    def save(self, *args, **kwargs):
        # Converter campos de texto para maiúsculo
        for field in self._meta.fields:
            if isinstance(field, (models.CharField, models.TextField)):
                valor = getattr(self, field.name)
                if isinstance(valor, str):
                    setattr(self, field.name, valor.upper())
        super().save(*args, **kwargs)

# --- Modelo Produto ---
class Produto(models.Model):
    id_produto = models.AutoField(primary_key=True)
    codigo_produto = models.CharField(unique=True, max_length=50)
    nome_produto = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    unidade_medida = models.CharField(max_length=10, blank=True, null=True)
    id_grupo = models.ForeignKey(GrupoProduto, models.DO_NOTHING, db_column='id_grupo', blank=True, null=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    categoria = models.CharField(max_length=100, blank=True, null=True, help_text='Categoria do produto (ex: Construção, Ferramentas)')
    classificacao = models.CharField(max_length=255, blank=True, null=True)
    ncm = models.CharField(max_length=10, blank=True, null=True)
    cest = models.CharField(max_length=9, blank=True, null=True, help_text='Código Especificador da Substituição Tributária — 7 dígitos')
    observacoes = models.TextField(blank=True, null=True)
    imagem_url = models.TextField(blank=True, null=True)  # Alterado para TextField para suportar base64
    
    # Campos E-commerce Headless
    disponivel_web = models.BooleanField(default=False, help_text="Produto disponível no e-commerce")
    preco_web = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, help_text="Preço diferenciado para o site (se vazio, usa o preço normal)")
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True, help_text="URL amigável para SEO")

    # Campos para materiais de construção e código de barras
    gtin = models.CharField(max_length=14, blank=True, null=True, help_text='Código de barras EAN/GTIN')
    metragem_caixa = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text='Metragem em m² que cada caixa cobre (pisos/revestimentos)')
    rendimento_m2 = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text='Rendimento em m² por unidade (tintas)')
    peso_unitario = models.DecimalField(max_digits=10, decimal_places=3, blank=True, null=True, help_text='Peso unitário em kg para controle de carga')
    consumo_argamassa_m2 = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text='Consumo de argamassa em kg/m² (ex: 5.0 para piso simples, 8.5 para colagem dupla)')
    peso_saco_argamassa = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text='Peso do saco de argamassa em kg (padrão: 20kg)')
    tipo_aplicacao_argamassa = models.CharField(max_length=30, blank=True, null=True, help_text='Tipo: simples, dupla, pastilha')
    produto_pai = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, db_column='id_produto_pai', related_name='variacoes_simples', help_text='Produto Pai para variações (ex: Cano PVC)')
    variacao = models.CharField(max_length=100, blank=True, null=True, help_text='Descrição da variação (ex: 20mm, 25mm, Branco)')
    controla_lote = models.BooleanField(default=False, help_text='Exige seleção de lote na venda quando True')
    GENERO_CHOICES = [
        ('FEMININO', 'Feminino'),
        ('MASCULINO', 'Masculino'),
        ('UNISSEX', 'Unissex'),
    ]
    genero = models.CharField(max_length=20, blank=True, null=True, choices=GENERO_CHOICES, help_text='Gênero do produto: feminino, masculino ou unissex')

    class Meta:
        managed = True
        db_table = 'produtos'
        ordering = ['nome_produto']

    def __str__(self):
        return self.nome_produto
    
    def save(self, *args, **kwargs):
        # Converter campos de texto para maiúsculo
        _campos_upper_excluidos = {'email', 'logo_url', 'imagem_url', 'slug'}
        for field in self._meta.fields:
            if field.name in _campos_upper_excluidos:
                continue
            if isinstance(field, (models.CharField, models.TextField)):
                valor = getattr(self, field.name)
                if isinstance(valor, str):
                    setattr(self, field.name, valor.upper())
        super().save(*args, **kwargs)
        # Automacao Reforma Tributaria - Atualizar Tributacao baseada no NCM
        if self.ncm:
            try:
                # Importaca local para evitar erros de carga
                from api.services.reforma_tax_service import ReformaTaxService
                # Evitar circular imports se houver (mas aqui eh safe)
                
                svc = ReformaTaxService()
                # Calcula baseando no NCM
                # Se NCM vazio ou invalido, o servico retorna padroes (001, 17.7, 8.8) ou tenta achar
                res = svc.calcular_aliquotas(self.ncm)
                
                # Importar modelo dentro do metodo
                from api.models import TributacaoProduto
                
                # Update create
                trib, created = TributacaoProduto.objects.get_or_create(produto=self)
                
                # Atualiza campos
                if res.get('cst_ibs_cbs'):
                    trib.cst_ibs_cbs = res['cst_ibs_cbs']
                
                if res.get('ibs_aliquota') is not None:
                    trib.ibs_aliquota = res['ibs_aliquota']
                    
                if res.get('cbs_aliquota') is not None:
                    trib.cbs_aliquota = res['cbs_aliquota']
                    
                if res.get('cClassTrib'):
                    trib.classificacao_fiscal = res['cClassTrib']
                    
                trib.fonte_info = "Automacao NCM Local"
                trib.save()
                
            except Exception as e:
                # Log silencioso para não quebrar o save do produto se a calc falhar
                print(f"Warning: Falha na automacao tributaria do produto {self.codigo_produto}: {e}")

class ProdutoComplementar(models.Model):
    """
    Relacionamento N:N entre produtos para sugestões de produtos complementares.
    Ex: Porcelanato → Argamassa, Rejunte, Espaçador
    """
    id = models.AutoField(primary_key=True)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='complementares', db_column='id_produto')
    produto_complementar = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='complementar_de', db_column='id_produto_complementar')
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição na sugestão')

    class Meta:
        managed = True
        db_table = 'produtos_complementares'
        ordering = ['ordem']
        unique_together = [('produto', 'produto_complementar')]
        verbose_name = 'Produto Complementar'
        verbose_name_plural = 'Produtos Complementares'

    def __str__(self):
        return f"{self.produto.nome_produto} → {self.produto_complementar.nome_produto}"


class ProdutoSimilar(models.Model):
    """
    Relacionamento N:N entre produtos para sugestões de produtos similares.
    Ex: Porcelanato 60x60 → Porcelanato 60x60 de outra marca
    """
    id = models.AutoField(primary_key=True)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='similares', db_column='id_produto')
    produto_similar = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='similar_de', db_column='id_produto_similar')
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição na sugestão')

    class Meta:
        managed = True
        db_table = 'produtos_similares'
        ordering = ['ordem']
        unique_together = [('produto', 'produto_similar')]
        verbose_name = 'Produto Similar'
        verbose_name_plural = 'Produtos Similares'

    def __str__(self):
        return f"{self.produto.nome_produto} ~ {self.produto_similar.nome_produto}"


class LoteProduto(models.Model):
    """
    Controle de lotes e datas de validade para produtos
    """
    id_lote = models.AutoField(primary_key=True)
    id_produto = models.ForeignKey(Produto, models.CASCADE, related_name='lotes', db_column='id_produto')
    numero_lote = models.CharField(max_length=50, help_text="Número identificador do lote")
    data_fabricacao = models.DateField(null=True, blank=True)
    data_validade = models.DateField(help_text="Data de validade do lote")
    quantidade = models.DecimalField(max_digits=12, decimal_places=3, default=0.000)
    observacoes = models.TextField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_modificacao = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'lotes_produto'
        ordering = ['data_validade']
        verbose_name = 'Lote de Produto'
        verbose_name_plural = 'Lotes de Produtos'

    def __str__(self):
        return f"Lote {self.numero_lote} ({self.id_produto})"


# --- Modelo de Tributação Automática ---
class TributacaoProduto(models.Model):
    id_tributacao = models.AutoField(primary_key=True)
    produto = models.OneToOneField(Produto, on_delete=models.CASCADE, related_name='tributacao_detalhada')
    
    # Classificação
    classificacao_fiscal = models.CharField(max_length=50, blank=True, null=True) # Ex: Revenda, Consumo
    
    # CST / CSOSN
    cst_pis_cofins = models.CharField(max_length=10, blank=True, null=True, default='000')
    cst_icms = models.CharField(max_length=10, blank=True, null=True, default='000')
    cst_ipi = models.CharField(max_length=10, blank=True, null=True, default='000')
    csosn = models.CharField(max_length=10, blank=True, null=True, default='400')  # Simples Nacional

    # CFOP padrão do produto (ex: 5102, 6102, 5405...)
    cfop = models.CharField(max_length=10, blank=True, null=True, default='5102')
    
    # Alíquotas
    icms_aliquota = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    marketing_icms = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) # Ex: FCP
    
    pis_aliquota = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    cofins_aliquota = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    ipi_aliquota = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Simples Nacional - campos SN
    cst_ipi_sn = models.CharField(max_length=10, blank=True, null=True, default='99')
    ipi_aliquota_sn = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    cst_pis_sn = models.CharField(max_length=10, blank=True, null=True, default='07')
    pis_aliquota_sn = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    cst_cofins_sn = models.CharField(max_length=10, blank=True, null=True, default='07')
    cofins_aliquota_sn = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Novos Tributos - Reforma Tributária
    ibs_aliquota = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    cbs_aliquota = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    imposto_seletivo_aliquota = models.DecimalField(max_digits=5, decimal_places=2, default=0.00) # IS
    cst_ibs_cbs = models.CharField(max_length=10, blank=True, null=True, default='410') # Default Tributado

    
    # Metadados
    fonte_info = models.CharField(max_length=100, blank=True, null=True) # Ex: IBPT, Gov
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'tributacao_produto'



    def __str__(self):
        return f'{self.produto.codigo_produto} - {self.produto.nome_produto}'

# --- Modelos de Grade / Variação ---

class AtributoVariacao(models.Model):
    """Ex: Cor, Tamanho"""
    id_atributo = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)
    class Meta:
        managed = True
        db_table = 'atributos_variacao'
    def __str__(self): return self.nome

class ValorAtributoVariacao(models.Model):
    """Ex: Azul, G"""
    id_valor = models.AutoField(primary_key=True)
    id_atributo = models.ForeignKey(AtributoVariacao, on_delete=models.CASCADE, related_name='valores')
    valor = models.CharField(max_length=50)
    class Meta:
        managed = True
        db_table = 'valores_atributo_variacao'
    def __str__(self): return f"{self.id_atributo.nome}: {self.valor}"

class ProdutoVariacao(models.Model):
    """Tabela Associativa de Grade (SKU Específico)"""
    id_variacao = models.AutoField(primary_key=True)
    id_produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='variacoes')
    codigo_barras = models.CharField(max_length=50, blank=True, null=True)
    referencia_variacao = models.CharField(max_length=50, blank=True, null=True)
    preco_venda = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    ativo = models.BooleanField(default=True)
    imagem_url = models.TextField(blank=True, null=True)
    
    valores = models.ManyToManyField(ValorAtributoVariacao, through='ProdutoVariacaoCombinacao')
    
    class Meta:
        managed = True
        db_table = 'produtos_variacoes'
    def __str__(self): return f"Variação {self.id_variacao} de Produto {self.id_produto_id}"

class ProdutoVariacaoCombinacao(models.Model):
    id_combinacao = models.AutoField(primary_key=True)
    id_variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.CASCADE)
    id_valor = models.ForeignKey(ValorAtributoVariacao, on_delete=models.CASCADE)
    class Meta:
        managed = True
        db_table = 'produtos_variacoes_combinacao'

# --- Modelos de Configuração (Operacao, Depto, CC, ContaBancaria) ---
class Operacao(models.Model):
    id_operacao = models.AutoField(primary_key=True)
    nome_operacao = models.CharField(max_length=100)
    abreviacao = models.CharField(max_length=4, blank=True, null=True, default='')
    empresa = models.CharField(max_length=100, blank=True, null=True)
    transacao = models.CharField(max_length=15, blank=True, null=True)  # Aumentado para suportar "Devolucao"
    modelo_documento = models.CharField(max_length=10, blank=True, null=True)
    emitente = models.CharField(max_length=20, blank=True, null=True)  # Aumentado para "Terceiros"
    usa_auto_numeracao = models.IntegerField(blank=True, null=True, default=0)
    serie_nf = models.IntegerField(blank=True, null=True, default=1)
    proximo_numero_nf = models.IntegerField(blank=True, null=True, default=1)
    tipo_estoque_baixa = models.CharField(max_length=9, blank=True, null=True, default='Nenhum')
    gera_financeiro = models.IntegerField(blank=True, null=True, default=0)
    # Novo campo: incremento do estoque (opcional)
    tipo_estoque_incremento = models.CharField(max_length=9, blank=True, null=True, default='Nenhum')
    # Flag numérica (0/1) para indicar que esta operação também deve incrementar estoque
    incrementar_estoque = models.IntegerField(blank=True, null=True, default=0, db_column='incrementar_estoque')
    # Se preenchido, indica o id_deposito (inteiro) que deve ser usado ao incrementar estoque
    # (armazenamos como inteiro porque o modelo `Deposito` né£o existe no ORM neste projeto)
    id_deposito_incremento = models.IntegerField(blank=True, null=True, db_column='id_deposito_incremento')
    # Se preenchido, indica o id_deposito (inteiro) que deve ser usado ao dar baixa no estoque
    id_deposito_baixa = models.IntegerField(blank=True, null=True, db_column='id_deposito_baixa')
    # Controle de limite de crédito do cliente
    # Opções: 'nao_validar', 'alertar', 'bloquear', 'solicitar_senha'
    validacao_limite_credito = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        default='nao_validar',
        db_column='validacao_limite_credito',
        help_text="Define como validar o limite de crédito: nao_validar, alertar, bloquear, solicitar_senha"
    )
    # Controle de cashback - percentual gerado em vendas
    cashback_percentual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        default=0.00,
        db_column='cashback_percentual',
        help_text="Percentual de cashback gerado nas vendas (ex: 5.00 para 5%)"
    )
    # Validade do cashback em dias
    cashback_validade_dias = models.IntegerField(
        blank=True,
        null=True,
        default=30,
        db_column='cashback_validade_dias',
        help_text="Quantidade de dias de validade do cashback gerado"
    )
    # Baixa automática no financeiro
    baixa_automatica = models.BooleanField(
        default=False,
        db_column='baixa_automatica',
        help_text="Se marcado, faz baixa automática quando data_documento = data_vencimento"
    )
    # Validação de cliente em atraso
    validar_atraso = models.BooleanField(
        default=False,
        db_column='validar_atraso',
        help_text="Se TRUE, valida se cliente tem títulos em atraso"
    )
    dias_atraso_tolerancia = models.IntegerField(
        blank=True,
        null=True,
        default=0,
        db_column='dias_atraso_tolerancia',
        help_text="Quantidade de dias de tolerância para atraso (0 = não tolera nenhum atraso)"
    )
    acao_atraso = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        default='alertar',
        db_column='acao_atraso',
        help_text="Ação quando cliente em atraso: alertar, bloquear, solicitar_senha"
    )
    # Validação de estoque
    validar_estoque = models.BooleanField(
        default=False,
        db_column='validar_estoque',
        help_text="Se TRUE, valida se há estoque disponível antes de permitir a venda"
    )
    acao_estoque = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        default='nao_validar',
        db_column='acao_estoque',
        help_text="Ação quando não há estoque: nao_validar, alertar, bloquear, solicitar_senha"
    )
    # Entrega futura
    entrega_futura = models.BooleanField(
        default=False,
        db_column='entrega_futura',
        help_text="Se TRUE, esta operação é para vendas com entrega futura"
    )
    # Tipo de entrega futura: 'origem' (pedido) ou 'destino' (entrega)
    tipo_entrega_futura = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        default='origem',
        db_column='tipo_entrega_futura',
        help_text="Define se é operação de origem (pedido) ou destino (entrega): origem, destino"
    )
    # Limite de desconto permitido (percentual)
    limite_desconto_percentual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        default=0.00,
        db_column='limite_desconto_percentual',
        help_text="Limite de desconto permitido em percentual (ex: 10.00 para 10%). Acima disso, requer aprovação de supervisor."
    )
    # Numeração vinculada a esta operação
    id_numeracao = models.ForeignKey(
        'Numeracao',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_numeracao',
        related_name='operacoes',
        help_text="Numeração padrão utilizada por esta operação"
    )
    # Venda de veículo novo (exige campos específicos da NFe)
    venda_veiculo_novo = models.BooleanField(
        default=False,
        db_column='venda_veiculo_novo',
        help_text="Se TRUE, esta operação é para venda de veículos novos e exige dados do veículo"
    )
    # Faturamento: transforma documento de origem (Pedido/Cupom) em documento de destino (NF-e/NFC-e)
    ind_faturamento = models.BooleanField(
        default=False,
        db_column='ind_faturamento',
        help_text="Se TRUE, esta operação é de faturamento (transforma pedidos/cupons em NF-e/NFC-e)"
    )
    TIPO_FATURAMENTO_CHOICES = [
        ('pedido_para_nota', 'Pedido → NF-e'),
        ('pedido_para_cupom', 'Pedido → Cupom Fiscal (NFC-e)'),
        ('cupom_para_nota', 'Cupom Fiscal → NF-e'),
    ]
    tipo_faturamento = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        choices=TIPO_FATURAMENTO_CHOICES,
        db_column='tipo_faturamento',
        help_text='Tipo de faturamento: pedido_para_nota, pedido_para_cupom, cupom_para_nota'
    )
    # Validação de estoque fiscal específico (além do estoque gerencial)
    validar_estoque_fiscal = models.BooleanField(
        default=False,
        db_column='validar_estoque_fiscal',
        help_text="Se TRUE, valida o estoque fiscal antes de autorizar a emissão (diferente do estoque gerencial)"
    )

    class Meta:
        managed = True
        db_table = 'operacoes'
        ordering = ['nome_operacao']

    def __str__(self):
        return self.nome_operacao


class SugestaoCFOP(models.Model):
    """
    Modelo para configurar sugestões de CFOP baseadas na operação e no destino.
    Permite definir CFOPs automáticos conforme regras fiscais.
    """
    TIPO_DESTINO_CHOICES = [
        ('dentro_estado', 'Dentro do Estado'),
        ('fora_estado', 'Fora do Estado'),
        ('cupom_para_nota', 'Cupom → Nota (CFOP 5929)'),
    ]
    
    id_sugestao_cfop = models.AutoField(primary_key=True, db_column='id_sugestao_cfop')
    id_operacao = models.ForeignKey(
        'Operacao',
        on_delete=models.CASCADE,
        db_column='id_operacao',
        related_name='sugestoes_cfop',
        help_text="Operação à qual esta sugestão de CFOP está vinculada"
    )
    tipo_destino = models.CharField(
        max_length=20,
        choices=TIPO_DESTINO_CHOICES,
        db_column='tipo_destino',
        help_text="Tipo de destino: dentro_estado, fora_estado, cupom_para_nota"
    )
    cfop_sugerido = models.CharField(
        max_length=4,
        db_column='cfop_sugerido',
        help_text="CFOP sugerido para este tipo de destino (ex: 5102, 6102, 5929)"
    )
    descricao = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        db_column='descricao',
        help_text="Descrição da natureza da operação (ex: Venda de mercadoria adquirida de terceiros)"
    )
    ativo = models.BooleanField(
        default=True,
        db_column='ativo',
        help_text="Se FALSE, esta sugestão não será aplicada"
    )
    
    class Meta:
        managed = True
        db_table = 'sugestao_cfop'
        unique_together = [['id_operacao', 'tipo_destino']]
        ordering = ['id_operacao', 'tipo_destino']
    
    def __str__(self):
        return f"{self.get_tipo_destino_display()} → CFOP {self.cfop_sugerido}"


class ConjuntoOperacao(models.Model):
    """
    Modelo para agrupar múltiplas operações em um conjunto.
    Permite amarrar várias operações para facilitar a gestão.
    """
    id_conjunto = models.AutoField(primary_key=True)
    nome_conjunto = models.CharField(
        max_length=100,
        help_text="Nome do conjunto de operações"
    )
    descricao = models.TextField(
        blank=True,
        null=True,
        help_text="Descrição detalhada do conjunto"
    )
    operacoes = models.ManyToManyField(
        Operacao,
        related_name='conjuntos',
        help_text="Operações que fazem parte deste conjunto"
    )
    ativo = models.BooleanField(
        default=True,
        help_text="Se o conjunto está ativo"
    )
    data_criacao = models.DateTimeField(
        auto_now_add=True,
        help_text="Data de criação do conjunto"
    )
    data_modificacao = models.DateTimeField(
        auto_now=True,
        help_text="Data da última modificação"
    )

    class Meta:
        managed = True
        db_table = 'conjunto_operacoes'
        ordering = ['nome_conjunto']
        verbose_name = 'Conjunto de Operação'
        verbose_name_plural = 'Conjuntos de Operações'

    def __str__(self):
        return self.nome_conjunto

class ConfiguracaoProduto(models.Model):
    """
    Configurações para geração de código de produto.
    Tipos: automatica, semi-automatica, manual
    """
    TIPO_CODIGO_CHOICES = [
        ('automatica', 'Automática'),
        ('semi-automatica', 'Semi-Automática'),
        ('manual', 'Manual'),
    ]
    
    id_config = models.AutoField(primary_key=True)
    tipo_geracao_codigo = models.CharField(
        max_length=20,
        choices=TIPO_CODIGO_CHOICES,
        default='manual',
        help_text="Tipo de geração do código do produto"
    )
    proximo_codigo = models.IntegerField(
        default=1,
        help_text="Próximo código a ser gerado (usado em automática e semi-automática)"
    )
    prefixo_codigo = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Prefixo opcional para o código (ex: PROD, P, etc.)"
    )
    tamanho_codigo = models.IntegerField(
        default=6,
        help_text="Tamanho do código numérico (será preenchido com zeros à esquerda)"
    )
    controlar_lote_validade = models.BooleanField(
        default=False,
        help_text="Habilita o controle de lote e validade nos produtos"
    )
    produto_em_grade = models.BooleanField(
        default=False,
        help_text="Habilita a opção de marcar produto em grade no cadastro de produtos"
    )
    material_construcao = models.BooleanField(
        default=False,
        help_text="Habilita campos específicos para materiais de construção (metragem, rendimento, peso, etc.)"
    )
    # Tributação padrão para novos produtos
    trib_cfop = models.CharField(max_length=10, blank=True, null=True, default='5102', help_text='CFOP padrão para novos produtos')
    trib_cst_icms = models.CharField(max_length=5, blank=True, null=True, default='', help_text='CST ICMS padrão')
    trib_csosn = models.CharField(max_length=5, blank=True, null=True, default='400', help_text='CSOSN padrão (Simples Nacional)')
    trib_icms_aliquota = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True, default=0, help_text='Alíquota ICMS padrão (%)')
    trib_cst_ipi = models.CharField(max_length=5, blank=True, null=True, default='99', help_text='CST IPI padrão')
    trib_ipi_aliquota = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True, default=0, help_text='Alíquota IPI padrão (%)')
    trib_cst_pis_cofins = models.CharField(max_length=5, blank=True, null=True, default='07', help_text='CST PIS/COFINS padrão')
    trib_pis_aliquota = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True, default=0, help_text='Alíquota PIS padrão (%)')
    trib_cofins_aliquota = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True, default=0, help_text='Alíquota COFINS padrão (%)')
    trib_classificacao_fiscal = models.CharField(max_length=100, blank=True, null=True, default='', help_text='Classificação fiscal padrão')
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_modificacao = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'configuracao_produto'
        verbose_name = 'Configuração de Produto'
        verbose_name_plural = 'Configurações de Produto'

    def __str__(self):
        return f"Config Produto ({self.get_tipo_geracao_codigo_display()})"
    
    def gerar_proximo_codigo(self):
        """Gera o próximo código baseado na configuração"""
        prefixo = self.prefixo_codigo or ''
        codigo_num = str(self.proximo_codigo).zfill(self.tamanho_codigo)
        return f"{prefixo}{codigo_num}"
    
    def incrementar_codigo(self):
        """Incrementa o próximo código"""
        self.proximo_codigo += 1
        self.save()

class Departamento(models.Model):
    id_departamento = models.AutoField(primary_key=True)
    nome_departamento = models.CharField(max_length=100)

    class Meta:
        managed = True
        db_table = 'departamentos'
        ordering = ['nome_departamento']

    def __str__(self):
        return self.nome_departamento
            
class CentroCusto(models.Model):
    id_centro_custo = models.AutoField(primary_key=True)
    nome_centro_custo = models.CharField(max_length=100)

    class Meta:
        managed = True
        db_table = 'centro_custo'
        ordering = ['nome_centro_custo']

    def __str__(self):
        return self.nome_centro_custo

class ContaBancaria(models.Model):
    id_conta_bancaria = models.AutoField(primary_key=True)
    nome_conta = models.CharField(max_length=100, help_text="Nome identificador da conta")
    codigo_banco = models.CharField(max_length=10, blank=True, null=True, help_text="Código do banco (ex: 001, 033, 104)")
    nome_banco = models.CharField(max_length=100, blank=True, null=True, help_text="Nome do banco")
    agencia = models.CharField(max_length=20, blank=True, null=True, help_text="Número da agência")
    conta = models.CharField(max_length=20, blank=True, null=True, help_text="Número da conta")
    digito = models.CharField(max_length=5, blank=True, null=True, help_text="Dígito verificador")
    tipo_conta = models.CharField(
        max_length=1, 
        choices=[('C', 'Conta Corrente'), ('P', 'Poupança')], 
        default='C',
        help_text="Tipo da conta bancária"
    )
    # valor_ultima_compra = models.DecimalField(
    #     max_digits=15,
    #     decimal_places=2,
    #     default=0.00,
    #     help_text="Valor da última compra do produto neste depósito"
    # )
    saldo_inicial = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0.00,
        help_text="Saldo inicial da conta"
    )
    obs = models.TextField(blank=True, null=True, help_text="Observações gerais")
    data_criacao = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    data_modificacao = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'contas_bancarias'
        ordering = ['nome_conta']
        verbose_name = 'Conta Bancária'
        verbose_name_plural = 'Contas Bancárias'

    def __str__(self):
        if self.codigo_banco and self.agencia and self.conta:
            return f"{self.nome_conta} ({self.codigo_banco}-{self.agencia}-{self.conta})"
        return self.nome_conta

    def conta_completa(self):
        """Retorna a conta formatada completa"""
        if self.agencia and self.conta:
            if self.digito:
                return f"{self.agencia}-{self.conta}-{self.digito}"
            return f"{self.agencia}-{self.conta}"
        return "N/A"

# --- Modelo FinanceiroBancario (Movimentações Bancárias) ---
class FinanceiroBancario(models.Model):
    id_movimento = models.AutoField(primary_key=True)
    id_conta_bancaria = models.ForeignKey(ContaBancaria, on_delete=models.PROTECT, db_column='id_conta_bancaria')
    tipo_movimento = models.CharField(max_length=1, choices=[('C', 'Crédito'), ('D', 'Débito')], help_text="Tipo do movimento bancário")
    data_pagamento = models.DateField(help_text="Data do movimento")
    valor_movimento = models.DecimalField(max_digits=15, decimal_places=2, help_text="Valor do movimento")
    descricao = models.CharField(max_length=255, help_text="Descrição do movimento")
    documento_numero = models.CharField(max_length=50, blank=True, null=True, help_text="Número do documento")
    id_cliente_fornecedor = models.ForeignKey('Cliente', on_delete=models.SET_NULL, null=True, blank=True, db_column='id_cliente_fornecedor')
    forma_pagamento = models.CharField(max_length=50, blank=True, null=True, help_text="Forma de pagamento")
    conciliado = models.BooleanField(default=False, help_text="Indica se o lançamento foi conciliado manualmente")
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'financeiro_bancario'
        ordering = ['-data_pagamento', '-id_movimento']
        verbose_name = 'Movimento Bancário'
        verbose_name_plural = 'Movimentos Bancários'

    def __str__(self):
        tipo = 'Crédito' if self.tipo_movimento == 'C' else 'Débito'
        return f"{tipo} - {self.descricao} - R$ {self.valor_movimento}"

# --- Modelo FinanceiroConta ---
class FinanceiroConta(models.Model):
    id_conta = models.AutoField(primary_key=True)
    tipo_conta = models.CharField(max_length=7)
    id_cliente_fornecedor = models.ForeignKey(Cliente, models.SET_NULL, db_column='id_cliente_fornecedor', blank=True, null=True)
    descricao = models.CharField(max_length=255)
    valor_parcela = models.DecimalField(max_digits=10, decimal_places=2)
    valor_liquidado = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.00)
    valor_juros = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.00)
    valor_multa = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.00)
    valor_desconto = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, default=0.00)
    data_emissao = models.DateField(auto_now_add=True)
    data_vencimento = models.DateField()
    data_pagamento = models.DateField(blank=True, null=True)
    status_conta = models.CharField(max_length=50, default='Pendente')
    forma_pagamento = models.CharField(max_length=50, blank=True, null=True)
    id_venda_origem = models.IntegerField(blank=True, null=True)
    id_compra_origem = models.IntegerField(blank=True, null=True)
    id_os_origem = models.IntegerField(blank=True, null=True)
    id_operacao = models.ForeignKey(Operacao, models.SET_NULL, db_column='id_operacao', blank=True, null=True)
    id_departamento = models.ForeignKey(Departamento, models.SET_NULL, db_column='id_departamento', blank=True, null=True)
    id_centro_custo = models.ForeignKey(CentroCusto, models.SET_NULL, db_column='id_centro_custo', blank=True, null=True)
    id_conta_cobranca = models.ForeignKey(ContaBancaria, models.SET_NULL, db_column='id_conta_cobranca', related_name='contas_cobranca', blank=True, null=True)
    id_conta_baixa = models.ForeignKey(ContaBancaria, models.SET_NULL, db_column='id_conta_baixa', related_name='contas_baixa', blank=True, null=True)
    documento_numero = models.CharField(max_length=50, blank=True, null=True)
    parcela_numero = models.IntegerField(blank=True, null=True, default=1)
    parcela_total = models.IntegerField(blank=True, null=True, default=1)
    id_aluguel_origem = models.IntegerField(blank=True, null=True)
    gerencial = models.IntegerField(blank=True, null=True, default=0) 
    
    # Agro / Barter
    id_safra = models.ForeignKey('Safra', on_delete=models.SET_NULL, db_column='id_safra', blank=True, null=True, help_text="Vínculo com Safra (Agro)")
    id_contrato_agricola = models.ForeignKey('ContratoAgricola', on_delete=models.SET_NULL, db_column='id_contrato_agricola', blank=True, null=True, help_text="Vínculo com Contrato de Barter")

    class Meta:
        managed = True
        db_table = 'financeiro_contas'
        ordering = ['data_vencimento', 'descricao']

    def __str__(self):
        return f'[{self.tipo_conta}] - {self.descricao} (Venc: {self.data_vencimento})'


class RecebimentoCartao(models.Model):
    id_recebimento = models.AutoField(primary_key=True)
    id_venda = models.ForeignKey('Venda', on_delete=models.CASCADE, db_column='id_venda', blank=True, null=True, related_name='recebimentos_cartao')
    id_financeiro = models.ForeignKey(FinanceiroConta, on_delete=models.SET_NULL, db_column='id_financeiro', blank=True, null=True, related_name='recebimentos_cartao')
    data_venda = models.DateField()
    valor_bruto = models.DecimalField(max_digits=12, decimal_places=2)
    taxa_percentual = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    valor_taxa = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    valor_liquido = models.DecimalField(max_digits=12, decimal_places=2)
    data_previsao = models.DateField(help_text='Data prevista para o crédito em conta')
    data_pagamento = models.DateField(blank=True, null=True, help_text='Data real da liquidação/conciliação')
    status = models.CharField(max_length=20, choices=[('PENDENTE', 'Pendente'), ('CONCILIADO', 'Conciliado'), ('LIQUIDADO', 'Liquidado'), ('CANCELADO', 'Cancelado')], default='PENDENTE')
    bandeira = models.CharField(max_length=50, blank=True, null=True)
    tipo_cartao = models.CharField(max_length=20, default='CREDITO')
    nsu = models.CharField(max_length=50, blank=True, null=True)
    codigo_autorizacao = models.CharField(max_length=50, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'financeiro_cartoes'
        ordering = ['data_previsao', 'status']
        verbose_name = 'Recebimento de Cartão'
        verbose_name_plural = 'Recebimentos de Cartões'

    def __str__(self):
        return f'Cartão {self.bandeira} - R${self.valor_bruto} ({self.status})'


# --- Modelo ContaServico ---
class ContaServico(models.Model):
    TIPO_CHOICES = [
        ('telefone', 'Conta de Telefone'),
        ('energia', 'Conta de Energia Elétrica'),
        ('agua', 'Conta de Água'),
        ('gas', 'Conta de Gás'),
        ('servico_terceiro', 'Nota de Serviço de Terceiro'),
    ]
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('pago', 'Pago'),
        ('cancelado', 'Cancelado'),
        ('vencido', 'Vencido'),
    ]

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descricao = models.CharField(max_length=255, blank=True)
    fornecedor_nome = models.CharField(max_length=150)
    cnpj_fornecedor = models.CharField(max_length=18, blank=True, null=True)
    numero_documento = models.CharField(max_length=50, blank=True)
    serie = models.CharField(max_length=5, blank=True)
    chave_acesso = models.CharField(max_length=44, blank=True, null=True)
    data_emissao = models.DateField()
    data_vencimento = models.DateField(blank=True, null=True)
    data_pagamento = models.DateField(blank=True, null=True)
    mes_competencia = models.IntegerField()
    ano_competencia = models.IntegerField()
    valor_total = models.DecimalField(max_digits=15, decimal_places=2)
    valor_pis = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    aliq_pis = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    valor_cofins = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    aliq_cofins = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    valor_icms = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    aliq_icms = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    cfop = models.CharField(max_length=5, default='1949')
    cst_pis = models.CharField(max_length=3, default='50')
    cst_cofins = models.CharField(max_length=3, default='50')
    cst_icms = models.CharField(max_length=3, blank=True)
    observacao = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pendente')
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contas_servicos'
        ordering = ['-data_emissao']

    def __str__(self):
        return f'[{self.get_tipo_display()}] {self.fornecedor_nome} - R$ {self.valor_total}'

# --- Modelo EmpresaConfig ---
class EmpresaConfig(models.Model):
    id_empresa = models.AutoField(primary_key=True)
    nome_razao_social = models.CharField(max_length=255)
    nome_fantasia = models.CharField(max_length=255, blank=True, null=True)
    cpf_cnpj = models.CharField(max_length=18, blank=True, null=True)
    inscricao_estadual = models.CharField(max_length=20, blank=True, null=True)
    inscricao_municipal = models.CharField(max_length=20, blank=True, null=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    cep = models.CharField(max_length=10, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    
    # Geolocalização para pesquisa de preços regionais
    latitude = models.DecimalField(max_digits=10, decimal_places=8, blank=True, null=True, help_text="Latitude da loja")
    longitude = models.DecimalField(max_digits=11, decimal_places=8, blank=True, null=True, help_text="Longitude da loja")

    # SPED / Fiscal
    cpf_responsavel = models.CharField(max_length=11, blank=True, null=True, help_text="CPF do Responsável (somente números)")

    logo_url = models.CharField(max_length=500, blank=True, null=True)
    
    # Novo Campo: Regime Tributário
    REGIME_CHOICES = [
        ('SIMPLES', 'Simples Nacional'),
        ('MEI', 'MEI'),
        ('NORMAL', 'Regime Normal'),
        ('LUCRO_PRESUMIDO', 'Lucro Presumido'),
    ]
    regime_tributario = models.CharField(
        max_length=20, 
        choices=REGIME_CHOICES, 
        default='SIMPLES',
        blank=True, 
        null=True
    )

    # Documentos Fiscais (NFC-e)
    # Certificado Digital (caminho ou base64)
    certificado_digital = models.TextField(
        blank=True, 
        null=True, 
        help_text=(
            "Caminho do arquivo PFX (ex: C:\\Certificados\\certificado.pfx) "
            "OU conteúdo em Base64 do certificado"
        ),
        verbose_name="Certificado Digital (.pfx)"
    )
    senha_certificado = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Senha do certificado digital",
        verbose_name="Senha do Certificado"
    )
    
    # CSC
    csc_token_id = models.CharField(max_length=10, blank=True, null=True, help_text="ID do Token CSC (ex: 000001)")
    csc_token_codigo = models.CharField(max_length=100, blank=True, null=True, help_text="Código CSC (ex: XXXXX...)")
    
    # Ambiente
    AMBIENTE_CHOICES = [
        ('1', 'Produção'),
        ('2', 'Homologação'),
    ]
    ambiente_nfce = models.CharField(max_length=1, choices=AMBIENTE_CHOICES, default='2', help_text="Ambiente de emissão")

    # --- Configurações SPED Fiscal (EFD ICMS/IPI) ---
    sped_versao = models.CharField(max_length=3, default='020', help_text="Versão do Layout (ex: 020)")
    sped_finalidade = models.CharField(max_length=1, default='0', help_text="0-Remessa Original, 1-Retificadora")
    sped_gerar_bloco_c_vazio = models.BooleanField(default=False)
    sped_verifica_contingencia = models.BooleanField(default=False)
    sped_aproveita_credito_icms = models.BooleanField(default=True, verbose_name="Aproveita ICMS ST e IPI")
    
    # Blocos a Gerar
    sped_gerar_bloco_c = models.BooleanField(default=True)
    sped_gerar_bloco_d = models.BooleanField(default=False)
    sped_gerar_bloco_e = models.BooleanField(default=True)
    sped_gerar_bloco_g = models.BooleanField(default=False)
    sped_gerar_bloco_h = models.BooleanField(default=False)
    sped_gerar_bloco_k = models.BooleanField(default=False)
    
    # Operações (Conjuntos) - Armazena o ID do ConjuntoOperacao ou Similar
    # Usando CharField para simplificar se o frontend mandar ID em string ou nome
    sped_operacao_entrada_bloco_0 = models.CharField(max_length=100, blank=True, null=True)
    sped_operacao_entrada_bloco_c = models.CharField(max_length=100, blank=True, null=True)
    sped_operacao_entrada_bloco_d = models.CharField(max_length=100, blank=True, null=True)
    
    sped_operacao_saida_bloco_0 = models.CharField(max_length=100, blank=True, null=True)
    sped_operacao_saida_bloco_c = models.CharField(max_length=100, blank=True, null=True)
    sped_operacao_saida_bloco_d = models.CharField(max_length=100, blank=True, null=True)
    
    # Bloco 1 Data (Centro de Custo)
    sped_centro_custo_credito = models.CharField(max_length=100, blank=True, null=True)
    sped_centro_custo_debito = models.CharField(max_length=100, blank=True, null=True)
    sped_operacao_bloco_1 = models.CharField(max_length=100, blank=True, null=True)
    
    # Bloco K Data
    sped_bloco_k_deposito = models.CharField(max_length=100, blank=True, null=True)
    sped_bloco_k_grupo = models.CharField(max_length=100, blank=True, null=True)
    sped_bloco_k_preco = models.CharField(max_length=100, blank=True, null=True)
    sped_bloco_k_leiaute = models.CharField(max_length=100, blank=True, null=True)
    ambiente_nfe = models.CharField(max_length=1, choices=AMBIENTE_CHOICES, default='2', help_text="Ambiente de emissão NFe (Modelo 55)")
    ambiente_cte = models.CharField(max_length=1, choices=AMBIENTE_CHOICES, default='2', help_text="Ambiente de emissão CTe (Modelo 57)")
    ambiente_nfse = models.CharField(max_length=1, choices=AMBIENTE_CHOICES, default='2', help_text="Ambiente de emissão NFSe (Nacional)")
    
    # --- Configurações SPED Contribuições (EFD-Contribuições - PIS/COFINS) ---
    sped_contrib_conjuntos = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="IDs dos conjuntos de operação para SPED Contribuições (ex: 1,2,3)"
    )
    sped_contrib_diretorio = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        default='C:\\SPED\\CONTRIBUICOES\\',
        help_text="Diretório para salvar arquivos SPED Contribuições"
    )
    sped_contrib_blocos = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        default='C,F,M',
        help_text="Blocos a gerar no SPED Contribuições (ex: C,F,M)"
    )
    sped_contrib_versao = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        default='135',
        help_text="Versão do layout SPED Contribuições"
    )
    sped_icms_versao = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        default='020',
        help_text="Versão do layout SPED ICMS"
    )
    
    # Opções Adicionais SPED
    sped_icms_exportar_xml = models.BooleanField(
        default=False,
        help_text="Exportar XMLs das notas no SPED ICMS"
    )
    sped_icms_gerar_relatorio = models.BooleanField(
        default=False,
        help_text="Gerar relatório PDF no SPED ICMS"
    )
    
    sped_gerar_contribuicoes_junto = models.BooleanField(
        default=False,
        help_text="Gerar SPED Contribuições junto com ICMS/IPI"
    )
    sped_contrib_exportar_xml = models.BooleanField(
        default=False,
        help_text="Exportar XMLs das notas no SPED Contribuições"
    )
    sped_contrib_gerar_relatorio = models.BooleanField(
        default=False,
        help_text="Gerar relatório PDF no SPED Contribuições"
    )
    
    # Regime de Apuração - PIS/COFINS
    REGIME_APURACAO_CHOICES = [
        ('1', 'Regime Cumulativo'),
        ('2', 'Regime Não-Cumulativo'),
        ('3', 'Ambos os Regimes'),
    ]
    regime_apuracao_pis_cofins = models.CharField(
        max_length=1,
        choices=REGIME_APURACAO_CHOICES,
        default='2',
        blank=True,
        null=True,
        help_text="Regime de Apuração da Contribuição (COD_INC_TRIB no registro 0110)"
    ) 
    
    # Regime de Crédito - PIS/COFINS
    REGIME_CRED_CHOICES = [
        ('1', 'Apuração com base nos registros de consolidação'),
        ('2', 'Apuração com base no registro individualizado'),
    ]
    regime_cred_pis_cofins = models.CharField(
        max_length=1,
        choices=REGIME_CRED_CHOICES,
        default='1',
        blank=True,
        null=True,
        help_text="Regime de Crédito (COD_TIPO_CONT no registro 0110)"
    )
    
    # Alíquotas PIS/COFINS
    aliquota_pis_padrao = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.65,
        blank=True,
        null=True,
        help_text="Alíquota padrão do PIS (%) para regime não-cumulativo"
    )
    aliquota_cofins_padrao = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=7.60,
        blank=True,
        null=True,
        help_text="Alíquota padrão do COFINS (%) para regime não-cumulativo"
    )
    
    # Numeração NFS-e
    ultimo_numero_dps = models.IntegerField(default=0, blank=True, null=True, help_text="Último número de DPS emitido")
    serie_dps = models.CharField(max_length=5, default='1', blank=True, null=True, help_text="Série do DPS")
    codigo_municipio_ibge = models.CharField(max_length=7, default='3550308', blank=True, null=True, help_text="Código IBGE do Município (7 dígitos)")
    
    # SPED / Fiscal
    cpf_responsavel = models.CharField(max_length=14, blank=True, null=True, help_text="CPF do Responsável (somente números)")
    codigo_receita_icms = models.CharField(max_length=10, blank=True, null=True, help_text="Código de Receita para ICMS a Recolher (E116)")
    codigo_receita_pis = models.CharField(max_length=10, blank=True, null=True, help_text="Código de Receita para PIS a Recolher (M205)")
    codigo_receita_cofins = models.CharField(max_length=10, blank=True, null=True, help_text="Código de Receita para COFINS a Recolher (M605)")

    # Contador (Bloco 0100)
    contador_nome = models.CharField(max_length=255, blank=True, null=True)
    contador_cpf = models.CharField(max_length=14, blank=True, null=True)
    contador_crc = models.CharField(max_length=15, blank=True, null=True)
    contador_cnpj = models.CharField(max_length=18, blank=True, null=True)
    contador_cep = models.CharField(max_length=10, blank=True, null=True)
    contador_endereco = models.CharField(max_length=255, blank=True, null=True)
    contador_numero = models.CharField(max_length=10, blank=True, null=True)
    contador_complemento = models.CharField(max_length=60, blank=True, null=True)
    contador_bairro = models.CharField(max_length=60, blank=True, null=True)
    contador_fone = models.CharField(max_length=15, blank=True, null=True)
    contador_fax = models.CharField(max_length=15, blank=True, null=True)
    contador_email = models.CharField(max_length=255, blank=True, null=True)
    contador_cod_mun = models.CharField(max_length=7, blank=True, null=True)

    # Valor Máximo sem Identificação
    valor_maximo_nfce = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=10000.00, 
        blank=True, 
        null=True,
        help_text="Valor máximo para venda sem identificação do cliente"
    )

    # Controle de Caixa
    controle_de_caixa = models.BooleanField(
        default=False,
        db_column='controle_de_caixa',
        help_text="Se marcado, ativa o controle de abertura e fechamento de caixa no PDV NFCe"
    )
    
    # Configurações SPED - Conjuntos e Diretório
    sped_conjuntos_selecionados = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="IDs dos conjuntos de operação separados por vírgula (ex: 1,2,3)"
    )
    sped_diretorio_saida = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Caminho completo do diretório para salvar arquivos SPED"
    )

    # SPED / Fiscal - Perfil e Atividade
    IND_PERFIL_CHOICES = [
        ('A', 'Perfil A'),
        ('B', 'Perfil B'),
        ('C', 'Perfil C'),
    ]
    ind_perfil = models.CharField(max_length=1, choices=IND_PERFIL_CHOICES, default='A', blank=True, null=True, help_text="Perfil de Apresentação do Arquivo Fiscal")
    
    IND_ATIVIDADE_CHOICES = [
        ('0', '0 - Industrial ou equiparado a industrial'),
        ('1', '1 - Outros'),
    ]
    ind_atividade = models.CharField(max_length=1, choices=IND_ATIVIDADE_CHOICES, default='1', blank=True, null=True, help_text="Indicador de tipo de atividade")
    
    # Natureza da Pessoa Jurídica (IND_NAT_PJ) - SPED Registro 0000
    IND_NAT_PJ_CHOICES = [
        ('00', 'Não informado'),
        ('01', '1 - Atividade Imobiliária'),
        ('02', '2 - Entidade Sujeita a PIS/PASEP exclusivamente'),
        ('03', '3 - Sociedade Cooperativa'),
        ('04', '4 - Sociedade Empresarial em Geral'),
        ('05', '5 - Outros'),
    ]
    ind_nat_pj = models.CharField(max_length=2, choices=IND_NAT_PJ_CHOICES, default='05', blank=True, null=True, help_text="Indicador de Natureza da Pessoa Jurídica")
    
    suframa = models.CharField(max_length=9, blank=True, null=True, help_text="Inscrição na SUFRAMA")
    
    # CRT - Código de Regime Tributário (usado em NF-e/NFC-e)
    CRT_CHOICES = [
        ('1', '1 - Simples Nacional'),
        ('2', '2 - Simples Nacional - excesso sublimite'),
        ('3', '3 - Regime Normal'),
    ]
    crt = models.CharField(max_length=1, choices=CRT_CHOICES, default='1', blank=True, null=True, help_text="Código de Regime Tributário")
    
    natureza_juridica = models.CharField(max_length=4, blank=True, null=True, help_text="Código da Natureza Jurídica (Tabela IBGE)")
    
    cnae = models.CharField(max_length=10, blank=True, null=True, help_text="Código CNAE Fiscal")

    class Meta:
        managed = False
        db_table = 'empresa_config'

    def __str__(self):
        return self.nome_razao_social

    @property
    def cpf_cnpj_limpo(self):
        import re
        if not self.cpf_cnpj: return ""
        return re.sub(r'[^0-9]', '', self.cpf_cnpj)

    @property
    def cpf_responsavel_limpo(self):
        import re
        if not self.cpf_responsavel: return ""
        return re.sub(r'[^0-9]', '', self.cpf_responsavel)

    @property
    def contador_cpf_limpo(self):
        import re
        if not self.contador_cpf: return ""
        return re.sub(r'[^0-9]', '', self.contador_cpf)

    @property
    def codigo_municipio_limpo(self):
        import re
        if not self.codigo_municipio_ibge: return ""
        return re.sub(r'[^0-9]', '', self.codigo_municipio_ibge)

    @classmethod
    def get_ativa(cls):
        """Retorna a EmpresaConfig com CNPJ configurado. Fallback para a primeira existente."""
        return (
            cls.objects.exclude(cpf_cnpj__isnull=True).exclude(cpf_cnpj='').first()
            or cls.objects.first()
        )


# --- Modelos de Vendedor/Funcao ---

class Funcao(models.Model):
    id_funcao = models.AutoField(primary_key=True)
    nome_funcao = models.CharField(unique=True, max_length=100)

    class Meta:
        managed = False
        db_table = 'funcoes'
        ordering = ['nome_funcao']

    def __str__(self):
        return self.nome_funcao

class Vendedor(models.Model):
    id_vendedor = models.AutoField(primary_key=True)
    cpf = models.CharField(unique=True, max_length=14)
    nome = models.CharField(max_length=255)
    nome_reduzido = models.CharField(max_length=100, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cep = models.CharField(max_length=10, blank=True, null=True)
    logradouro = models.CharField(max_length=255, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True)
    percentual_comissao = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, default=0.00)
    id_user = models.OneToOneField(User, models.SET_NULL, db_column='id_user', blank=True, null=True, related_name='vendedor')
    funcoes = models.ManyToManyField(Funcao, through='VendedorFuncoes')

    class Meta:
        managed = False
        db_table = 'vendedores'
        ordering = ['nome']

    def __str__(self):
        return self.nome

class VendedorFuncoes(models.Model):
    id_vendedor_funcao = models.AutoField(primary_key=True)
    id_vendedor = models.ForeignKey(Vendedor, models.DO_NOTHING, db_column='id_vendedor')
    id_funcao = models.ForeignKey(Funcao, models.DO_NOTHING, db_column='id_funcao')

    class Meta:
        managed = False
        db_table = 'vendedor_funcoes'
        unique_together = (('id_vendedor', 'id_funcao'),) 


# --- Modelo UserParametros ---
class UserParametros(models.Model):
    id_parametro = models.AutoField(primary_key=True)
    id_user = models.OneToOneField(User, models.CASCADE, db_column='id_user', unique=True, related_name='parametros')
    id_cliente_padrao = models.ForeignKey(Cliente, models.SET_NULL, db_column='id_cliente_padrao', blank=True, null=True)
    id_operacao_padrao = models.ForeignKey(Operacao, models.SET_NULL, db_column='id_operacao_padrao', blank=True, null=True)
    id_vendedor_padrao = models.ForeignKey(Vendedor, models.SET_NULL, db_column='id_vendedor_padrao', blank=True, null=True)
    id_grupo_padrao = models.ForeignKey(GrupoProduto, models.SET_NULL, db_column='id_grupo_padrao', blank=True, null=True)
    id_tabela_comercial = models.IntegerField(db_column='id_tabela_comercial', blank=True, null=True)
    
    # Novos campos para Vendas e OS
    id_vendedor_venda = models.ForeignKey(Vendedor, models.SET_NULL, db_column='id_vendedor_venda', blank=True, null=True, related_name='parametros_venda')
    id_operacao_venda = models.ForeignKey(Operacao, models.SET_NULL, db_column='id_operacao_venda', blank=True, null=True, related_name='parametros_venda')
    id_vendedor_os = models.ForeignKey(Vendedor, models.SET_NULL, db_column='id_vendedor_os', blank=True, null=True, related_name='parametros_os')
    id_operacao_os = models.ForeignKey(Operacao, models.SET_NULL, db_column='id_operacao_os', blank=True, null=True, related_name='parametros_os')
    
    # Novos campos para NFC-e
    id_vendedor_nfce = models.ForeignKey(Vendedor, models.SET_NULL, db_column='id_vendedor_nfce', blank=True, null=True, related_name='parametros_nfce')
    id_operacao_nfce = models.ForeignKey(Operacao, models.SET_NULL, db_column='id_operacao_nfce', blank=True, null=True, related_name='parametros_nfce')
    id_cliente_nfce = models.ForeignKey(Cliente, models.SET_NULL, db_column='id_cliente_nfce', blank=True, null=True, related_name='parametros_nfce')
    
    # Controle de Caixa por Usuário
    controle_de_caixa = models.IntegerField(default=0, db_column='controle_de_caixa', blank=True, null=True)

    # WhatsApp do supervisor para aprovação de desconto
    whatsapp_supervisor = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'user_parametros'

    def __str__(self):
        return f"Parmetros de {self.id_user.username}"


# --- Modelo UserPermissoes ---
class UserPermissoes(models.Model):
    id_permissao = models.AutoField(primary_key=True)
    id_user = models.OneToOneField(User, models.CASCADE, db_column='id_user', unique=True, related_name='permissoes')
    
    # Módulos
    clientes_acessar = models.IntegerField(blank=True, null=True, default=0)
    clientes_criar = models.IntegerField(blank=True, null=True, default=0)
    clientes_editar = models.IntegerField(blank=True, null=True, default=0)
    clientes_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    produtos_acessar = models.IntegerField(blank=True, null=True, default=0)
    produtos_criar = models.IntegerField(blank=True, null=True, default=0)
    produtos_editar = models.IntegerField(blank=True, null=True, default=0)
    produtos_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    financeiro_acessar = models.IntegerField(blank=True, null=True, default=0)
    financeiro_criar = models.IntegerField(blank=True, null=True, default=0)
    financeiro_editar = models.IntegerField(blank=True, null=True, default=0)
    financeiro_excluir = models.IntegerField(blank=True, null=True, default=0)
    financeiro_baixar = models.IntegerField(blank=True, null=True, default=0)
    
    config_acessar = models.IntegerField(blank=True, null=True, default=0)
    config_empresa_editar = models.IntegerField(blank=True, null=True, default=0)
    config_usuarios_acessar = models.IntegerField(blank=True, null=True, default=0)
    config_usuarios_criar = models.IntegerField(blank=True, null=True, default=0)
    config_usuarios_editar = models.IntegerField(blank=True, null=True, default=0)
    config_usuarios_excluir = models.IntegerField(blank=True, null=True, default=0)
    config_vendedores_acessar = models.IntegerField(blank=True, null=True, default=0)
    config_vendedores_criar = models.IntegerField(blank=True, null=True, default=0)
    config_vendedores_editar = models.IntegerField(blank=True, null=True, default=0)
    config_vendedores_excluir = models.IntegerField(blank=True, null=True, default=0)
    config_operacoes_acessar = models.IntegerField(blank=True, null=True, default=0)
    config_operacoes_criar = models.IntegerField(blank=True, null=True, default=0)
    config_operacoes_editar = models.IntegerField(blank=True, null=True, default=0)
    config_operacoes_excluir = models.IntegerField(blank=True, null=True, default=0)
    config_apoio_acessar = models.IntegerField(blank=True, null=True, default=0)
    config_apoio_criar = models.IntegerField(blank=True, null=True, default=0)
    config_apoio_editar = models.IntegerField(blank=True, null=True, default=0)
    config_apoio_excluir = models.IntegerField(blank=True, null=True, default=0)

    vendas_acessar = models.IntegerField(blank=True, null=True, default=0)
    vendas_criar = models.IntegerField(blank=True, null=True, default=0)
    vendas_editar = models.IntegerField(blank=True, null=True, default=0)
    vendas_excluir = models.IntegerField(blank=True, null=True, default=0)
    vendas_cancelar = models.IntegerField(blank=True, null=True, default=0)
    
    # Compras
    compras_acessar = models.IntegerField(blank=True, null=True, default=0)
    compras_criar = models.IntegerField(blank=True, null=True, default=0)
    compras_editar = models.IntegerField(blank=True, null=True, default=0)
    compras_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Trocas
    trocas_acessar = models.IntegerField(blank=True, null=True, default=0)
    trocas_criar = models.IntegerField(blank=True, null=True, default=0)
    trocas_editar = models.IntegerField(blank=True, null=True, default=0)
    trocas_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Ordens de Serviço
    ordens_acessar = models.IntegerField(blank=True, null=True, default=0)
    ordens_criar = models.IntegerField(blank=True, null=True, default=0)
    ordens_editar = models.IntegerField(blank=True, null=True, default=0)
    ordens_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Cotações
    cotacoes_acessar = models.IntegerField(blank=True, null=True, default=0)
    cotacoes_criar = models.IntegerField(blank=True, null=True, default=0)
    cotacoes_editar = models.IntegerField(blank=True, null=True, default=0)
    cotacoes_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Devoluções
    devolucoes_acessar = models.IntegerField(blank=True, null=True, default=0)
    devolucoes_criar = models.IntegerField(blank=True, null=True, default=0)
    devolucoes_editar = models.IntegerField(blank=True, null=True, default=0)
    devolucoes_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Faturamento
    faturamento_acessar = models.IntegerField(blank=True, null=True, default=0)
    faturamento_multi_cliente = models.IntegerField(blank=True, null=True, default=0, help_text="Permite faturar pedidos de clientes diferentes em uma única nota")
    
    # Comandas
    comandas_acessar = models.IntegerField(blank=True, null=True, default=0)
    comandas_criar = models.IntegerField(blank=True, null=True, default=0)
    comandas_editar = models.IntegerField(blank=True, null=True, default=0)
    comandas_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Pet Shop
    petshop_acessar = models.IntegerField(blank=True, null=True, default=0)
    petshop_criar = models.IntegerField(blank=True, null=True, default=0)
    petshop_editar = models.IntegerField(blank=True, null=True, default=0)
    petshop_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Catálogo
    catalogo_acessar = models.IntegerField(blank=True, null=True, default=0)
    catalogo_editar = models.IntegerField(blank=True, null=True, default=0)
    
    # Etiquetas
    etiquetas_acessar = models.IntegerField(blank=True, null=True, default=0)
    etiquetas_criar = models.IntegerField(blank=True, null=True, default=0)
    etiquetas_editar = models.IntegerField(blank=True, null=True, default=0)
    etiquetas_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Relatórios
    relatorios_acessar = models.IntegerField(blank=True, null=True, default=0)
    relatorios_exportar = models.IntegerField(blank=True, null=True, default=0)
    
    # Gráficos
    graficos_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # Mapa de Promoção
    mapa_promocao_acessar = models.IntegerField(blank=True, null=True, default=0)
    mapa_promocao_criar = models.IntegerField(blank=True, null=True, default=0)
    mapa_promocao_editar = models.IntegerField(blank=True, null=True, default=0)
    mapa_promocao_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Venda Rápida
    venda_rapida_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # NFC-e
    nfce_acessar = models.IntegerField(blank=True, null=True, default=0)
    nfce_criar = models.IntegerField(blank=True, null=True, default=0)
    nfce_editar = models.IntegerField(blank=True, null=True, default=0)
    nfce_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # NF-e
    nfe_acessar = models.IntegerField(blank=True, null=True, default=0)
    nfe_criar = models.IntegerField(blank=True, null=True, default=0)
    nfe_editar = models.IntegerField(blank=True, null=True, default=0)
    nfe_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # CT-e
    cte_acessar = models.IntegerField(blank=True, null=True, default=0)
    cte_criar = models.IntegerField(blank=True, null=True, default=0)
    cte_editar = models.IntegerField(blank=True, null=True, default=0)
    cte_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # MDF-e
    mdfe_acessar = models.IntegerField(blank=True, null=True, default=0)
    mdfe_criar = models.IntegerField(blank=True, null=True, default=0)
    mdfe_editar = models.IntegerField(blank=True, null=True, default=0)
    mdfe_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Fornecedores
    fornecedores_acessar = models.IntegerField(blank=True, null=True, default=0)
    fornecedores_criar = models.IntegerField(blank=True, null=True, default=0)
    fornecedores_editar = models.IntegerField(blank=True, null=True, default=0)
    fornecedores_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # Gestão Agro
    agro_acessar = models.IntegerField(blank=True, null=True, default=0)
    agro_criar = models.IntegerField(blank=True, null=True, default=0)
    agro_editar = models.IntegerField(blank=True, null=True, default=0)
    agro_excluir = models.IntegerField(blank=True, null=True, default=0)
    
    # SPED
    sped_acessar = models.IntegerField(blank=True, null=True, default=0)
    sped_contribuicoes_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # WhatsApp
    whatsapp_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # Boletos
    boletos_acessar = models.IntegerField(blank=True, null=True, default=0)
    boletos_criar = models.IntegerField(blank=True, null=True, default=0)
    boletos_editar = models.IntegerField(blank=True, null=True, default=0)
    
    # Mapa de Carga
    mapa_carga_acessar = models.IntegerField(blank=True, null=True, default=0)
    mapa_carga_criar = models.IntegerField(blank=True, null=True, default=0)
    mapa_carga_editar = models.IntegerField(blank=True, null=True, default=0)
    
    # Produção
    producao_acessar = models.IntegerField(blank=True, null=True, default=0)
    producao_criar = models.IntegerField(blank=True, null=True, default=0)
    producao_editar = models.IntegerField(blank=True, null=True, default=0)
    
    # Comissões
    comissoes_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # Conciliação
    conciliacao_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # Cartões
    cartoes_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # Agenda
    agenda_acessar = models.IntegerField(blank=True, null=True, default=0)
    agenda_criar = models.IntegerField(blank=True, null=True, default=0)
    agenda_editar = models.IntegerField(blank=True, null=True, default=0)
    
    # Balanças
    balancas_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # Bancário
    bancario_acessar = models.IntegerField(blank=True, null=True, default=0)
    bancario_criar = models.IntegerField(blank=True, null=True, default=0)
    bancario_editar = models.IntegerField(blank=True, null=True, default=0)
    
    # Contas e Serviços
    contas_servicos_acessar = models.IntegerField(blank=True, null=True, default=0)
    
    # Autorizações
    aut_desconto = models.IntegerField(blank=True, null=True, default=0)
    aut_cancelar_venda = models.IntegerField(blank=True, null=True, default=0)
    
    class Meta:
        managed = False
        db_table = 'user_permissoes'

    def __str__(self):
        return f"Permissões de {self.id_user.username}"


# --- Modelo de Solicitações (Fase 3) ---
class SolicitacaoAprovacao(models.Model):
    id_solicitacao = models.AutoField(primary_key=True)
    id_usuario_solicitante = models.ForeignKey(User, models.DO_NOTHING, db_column='id_usuario_solicitante', related_name='solicitacoes_feitas')
    id_usuario_supervisor = models.ForeignKey(User, models.DO_NOTHING, db_column='id_usuario_supervisor', related_name='solicitacoes_recebidas')
    tipo_solicitacao = models.CharField(max_length=100)
    id_registro = models.IntegerField(blank=True, null=True)
    dados_solicitacao = models.TextField(blank=True, null=True)
    observacao_solicitante = models.TextField(blank=True, null=True)
    observacao_supervisor = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=9, default='Pendente') # Pendente, Aprovada, Rejeitada
    data_solicitacao = models.DateTimeField(auto_now_add=True)
    data_aprovacao = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'solicitacoes'
        ordering = ['-data_solicitacao']

    def __str__(self):
        return f"Solicitação de {self.id_usuario_solicitante.username} para {self.tipo_solicitacao}"


# --- 1. MODELO ATUALIZADO: FormaPagamento ---
class FormaPagamento(models.Model):
    id_forma_pagamento = models.AutoField(primary_key=True)
    nome_forma = models.CharField(max_length=100, unique=True, blank=False, null=False)
    
    # --- NOVOS CAMPOS ---
    # Conta padréo para baixa (Ex: PIX cai no "Banco X", Dinheiro cai no "Caixa Interno")
    id_conta_padrao = models.ForeignKey(
        ContaBancaria, 
        models.SET_NULL, 
        db_column='id_conta_padrao', 
        blank=True, 
        null=True
    )
    # Centro de custo padréo para esta forma (opcional)
    id_centro_custo = models.ForeignKey(
        CentroCusto,
        models.SET_NULL,
        db_column='id_centro_custo',
        blank=True,
        null=True
    )
    # Departamento padréo para esta forma (opcional)
    id_departamento = models.ForeignKey(
        Departamento,
        models.SET_NULL,
        db_column='id_departamento',
        blank=True,
        null=True
    )
    # Dias de vencimento (0 = Hoje, 30 = 30 dias)
    dias_vencimento = models.IntegerField(default=0, blank=True, null=True)
    
    # Código TPag (NFC-e / NF-e)
    # 01=Dinheiro, 03=Crédito, 04=Débito, 99=Outros etc.
    codigo_t_pag = models.CharField(max_length=2, default='99', blank=True, null=True, help_text="Código SEFAZ (01=Dinheiro, 03=Crédito, 04=Débito, etc)")

    # Integração de pagamento externo (ex: terminal físico Mercado Pago)
    TIPO_INTEGRACAO_CHOICES = [
        ('', 'Nenhuma'),
        ('MERCADOPAGO', 'Mercado Pago Point'),
    ]
    tipo_integracao = models.CharField(
        max_length=20,
        choices=TIPO_INTEGRACAO_CHOICES,
        default='',
        blank=True,
        null=False,
        help_text="Integração de pagamento externo vinculada a esta forma"
    )

    # Taxa da operadora (%) e prazo de repasse (dias)
    taxa_operadora = models.DecimalField(max_digits=5, decimal_places=2, default=0, blank=True, null=True)
    dias_repasse = models.IntegerField(default=0, blank=True, null=True)

    # Trigger Reload
    # --- FIM DOS NOVOS CAMPOS ---
    
    def __str__(self):
        return self.nome_forma

    class Meta:
        # managed = False # Deixamos comentado para o Django criar/alterar
        db_table = 'formas_pagamento' # Nome da tabela
        verbose_name = "Forma de Pagamento"
        verbose_name_plural = "Formas de Pagamento"
        ordering = ['nome_forma']


# --- MODELOS DE VENDAS ---
class Venda(models.Model):
    id_venda = models.AutoField(primary_key=True)
    id_operacao = models.ForeignKey(Operacao, models.SET_NULL, db_column='id_operacao', blank=True, null=True)
    id_cliente = models.ForeignKey(Cliente, models.SET_NULL, db_column='id_cliente', blank=True, null=True)
    id_vendedor1 = models.ForeignKey('Vendedor', models.SET_NULL, db_column='id_vendedor1', related_name='vendas_vendedor1', blank=True, null=True)
    id_vendedor2 = models.ForeignKey('Vendedor', models.SET_NULL, db_column='id_vendedor2', related_name='vendas_vendedor2', blank=True, null=True)
    numero_documento = models.CharField(max_length=50, blank=True, null=True)
    data_documento = models.DateTimeField(auto_now_add=True)
    valor_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    taxa_entrega = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, blank=True, null=True)
    criado_por = models.ForeignKey(User, models.SET_NULL, db_column='criado_por', blank=True, null=True)
    gerou_financeiro = models.IntegerField(blank=True, null=True, default=0)
    vista = models.IntegerField(blank=True, null=True, default=0)  # 1 = é  vista, 0 = a prazo
    # Campos para entrega futura
    venda_futura_origem = models.ForeignKey('self', models.SET_NULL, db_column='venda_futura_origem', blank=True, null=True, related_name='vendas_futuras_destino', help_text="Venda de origem que gerou esta entrega futura")
    venda_futura_destino = models.ForeignKey('self', models.SET_NULL, db_column='venda_futura_destino', blank=True, null=True, related_name='vendas_origem_futuras', help_text="Venda de entrega futura gerada a partir desta venda")
    
    # Campos E-commerce Headless
    ORIGEM_CHOICES = [
        ('PDV', 'Ponto de Venda'),
        ('ECOM', 'E-commerce'),
        ('WHATSAPP', 'WhatsApp'),
    ]
    STATUS_PAGAMENTO_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('APROVADO', 'Aprovado'),
        ('ESTORNADO', 'Estornado'),
        ('RECUSADO', 'Recusado'),
    ]
    STATUS_LOGISTICA_CHOICES = [
        ('PREPARANDO', 'Preparando'),
        ('AGUARDANDO_RETIRADA', 'Aguardando Retirada'),
        ('DESPACHADO', 'Despachado'),
        ('ENTREGUE', 'Entregue'),
    ]
    
    origem = models.CharField(max_length=20, choices=ORIGEM_CHOICES, default='PDV', db_column='origem_venda')
    status_pagamento = models.CharField(max_length=20, choices=STATUS_PAGAMENTO_CHOICES, default='PENDENTE', db_column='status_pagamento')
    status_logistica = models.CharField(max_length=20, choices=STATUS_LOGISTICA_CHOICES, default='PREPARANDO', db_column='status_logistica')
    payment_id = models.CharField(max_length=100, blank=True, null=True, help_text="ID do pagamento no Gateway (Pix/Stripe/MP)")

    # Campos NFC-e
    chave_nfe = models.CharField(max_length=50, blank=True, null=True, db_column='chave_nfe')
    chave_nfe_referenciada = models.CharField(max_length=50, blank=True, null=True, db_column='chave_nfe_referenciada', help_text="Chave da NF-e referenciada (ex: devolução/complemento)")
    protocolo_nfe = models.CharField(max_length=50, blank=True, null=True, db_column='protocolo_nfe')
    xml_nfe = models.TextField(blank=True, null=True, db_column='xml_nfe')
    status_nfe = models.CharField(max_length=20, default='PENDENTE', db_column='status_nfe') # PENDENTE, EMITIDA, CANCELADA, ERRO
    numero_nfe = models.IntegerField(blank=True, null=True, db_column='numero_nfe')
    serie_nfe = models.IntegerField(default=1, db_column='serie_nfe')
    qrcode_nfe = models.TextField(blank=True, null=True, db_column='qrcode_nfe')
    mensagem_nfe = models.TextField(blank=True, null=True, db_column='mensagem_nfe', help_text="Ultima mensagem de erro ou status da NFe/NFCe")

    # Campos NFe (Modelo 55) - Adicionados
    tipo_frete = models.IntegerField(default=9, help_text="0=Rem, 1=Dest, 9=Sem Frete") 
    transportadora = models.ForeignKey(Cliente, models.SET_NULL, db_column='id_transportadora', blank=True, null=True, related_name='vendas_transportadas')
    placa_veiculo = models.CharField(max_length=8, blank=True, null=True)
    uf_veiculo = models.CharField(max_length=2, blank=True, null=True)
    rntrc = models.CharField(max_length=20, blank=True, null=True)
    
    quantidade_volumes = models.IntegerField(default=0)
    especie_volumes = models.CharField(max_length=60, blank=True, null=True)
    marca_volumes = models.CharField(max_length=60, blank=True, null=True)
    peso_liquido = models.DecimalField(max_digits=12, decimal_places=3, default=0.000)
    peso_bruto = models.DecimalField(max_digits=12, decimal_places=3, default=0.000)
    
    observacao_fisco = models.TextField(blank=True, null=True)
    observacao_contribuinte = models.TextField(blank=True, null=True)
    
    # Faturamento - referência à venda NF-e/NFC-e gerada pelo faturamento
    id_venda_faturamento = models.ForeignKey(
        'self', models.SET_NULL, db_column='id_venda_faturamento',
        blank=True, null=True, related_name='vendas_faturadas',
        help_text="Venda NF-e/NFC-e gerada ao faturar esta venda"
    )

    # Campos de controle de entrega
    endereco_entrega = models.TextField(blank=True, null=True, help_text='Endereço de entrega')
    data_prevista_entrega = models.DateField(blank=True, null=True, help_text='Data prevista para entrega')
    responsavel_entrega = models.CharField(max_length=150, blank=True, null=True, help_text='Entregador / motorista responsável')
    observacao_entrega = models.TextField(blank=True, null=True, help_text='Observações sobre a entrega')

    class Meta:
        db_table = 'vendas'

    def __str__(self):
        return f'Venda {self.numero_documento or self.id_venda}'

    @property
    def e_cupom_fiscal(self):
        """Retorna True se a venda é um cupom fiscal (NFC-e modelo 65 ou SAT modelo 59)"""
        if self.id_operacao and self.id_operacao.modelo_documento:
            return self.id_operacao.modelo_documento in ['65', '59']
        return False

    @property
    def e_nota_fiscal(self):
        """Retorna True se a venda é uma nota fiscal (NF-e modelo 55)"""
        if self.id_operacao and self.id_operacao.modelo_documento:
            return self.id_operacao.modelo_documento == '55'
        return False

    @property
    def e_pedido(self):
        """Retorna True se a venda é um pedido (não é cupom fiscal nem NF-e)"""
        return not self.e_cupom_fiscal and not self.e_nota_fiscal

    @property
    def tipo_documento_legivel(self):
        """Retorna descrição legível do tipo de documento"""
        if self.e_cupom_fiscal:
            if self.id_operacao.modelo_documento == '65':
                return 'NFC-e (Cupom Fiscal)'
            elif self.id_operacao.modelo_documento == '59':
                return 'SAT (Cupom Fiscal)'
        elif self.e_nota_fiscal:
            return 'NF-e (Nota Fiscal)'
        return 'Pedido'


class VendaItem(models.Model):
    # Mapeamento para a tabela legacy `venda_itens`:
    # Colunas reais no banco: id_venda_item, id_venda, id_produto, quantidade, valor_unitario, valor_desconto, valor_total
    id_item = models.AutoField(primary_key=True, db_column='id_venda_item')
    id_venda = models.ForeignKey(Venda, models.CASCADE, db_column='id_venda', related_name='itens')
    id_produto = models.ForeignKey(Produto, models.SET_NULL, db_column='id_produto', blank=True, null=True)
    id_variacao = models.ForeignKey('ProdutoVariacao', models.SET_NULL, db_column='id_variacao', blank=True, null=True)
    quantidade = models.DecimalField(max_digits=12, decimal_places=3, default=0.000, db_column='quantidade')
    valor_unitario = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, db_column='valor_unitario')
    # O nome legacy da coluna que guarda o desconto é `valor_desconto` no banco
    desconto_valor = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, default=0.00, db_column='valor_desconto')
    valor_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, db_column='valor_total')
    # Quantidade já entregue (para entregas parciais)
    quantidade_entregue = models.DecimalField(
        max_digits=12, 
        decimal_places=3, 
        default=0.000, 
        db_column='quantidade_entregue',
        help_text='Quantidade já entregue deste item (para entregas parciais)'
    )
    split_payment = models.BooleanField(default=False, db_column='split_payment')

    # Campos fiscais / tributação
    ncm_codigo = models.CharField(max_length=10, blank=True, null=True)
    cest_codigo = models.CharField(max_length=9, blank=True, null=True)
    cfop = models.CharField(max_length=4, blank=True, null=True)
    c_benef = models.CharField(max_length=10, blank=True, null=True)
    c_class_trib = models.CharField(max_length=10, blank=True, null=True)
    nivel_tributacao = models.SmallIntegerField(blank=True, null=True)

    # ICMS
    icms_cst_csosn = models.CharField(max_length=3, blank=True, null=True)
    icms_modalidade_bc = models.CharField(max_length=1, blank=True, null=True)
    icms_reducao_bc_perc = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    icms_bc = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    icms_aliq = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    valor_icms = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    icmsst_bc = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    icmsst_aliq = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    valor_icms_st = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)

    # PIS / COFINS
    pis_cst = models.CharField(max_length=2, blank=True, null=True)
    pis_aliq = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    pis_bc = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    valor_pis = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    cofins_cst = models.CharField(max_length=2, blank=True, null=True)
    cofins_aliq = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    cofins_bc = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    valor_cofins = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)

    # IPI
    ipi_cst = models.CharField(max_length=2, blank=True, null=True)
    ipi_aliq = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    ipi_bc = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    valor_ipi = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)

    # Reforma tributária (IBS / CBS / IS)
    ibs_cst = models.CharField(max_length=3, blank=True, null=True)
    ibs_aliq = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    ibs_bc = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    valor_ibs = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    cbs_cst = models.CharField(max_length=3, blank=True, null=True)
    cbs_aliq = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    cbs_bc = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    valor_cbs = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    is_aliq = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    valor_is = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    tipo_produto_reform = models.CharField(max_length=12, blank=True, null=True)
    ibs_aliq_estadual = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    ibs_aliq_municipal = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)
    ibs_valor_estadual = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    ibs_valor_municipal = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    reducao_bc_cbs_perc = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    reducao_bc_ibs_perc = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    id_regra_reforma_aplicada = models.IntegerField(blank=True, null=True)

    # Totais de tributos
    valor_total_tributos = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    carga_tributaria_perc = models.DecimalField(max_digits=7, decimal_places=4, blank=True, null=True)

    # Controle de lote
    id_lote = models.ForeignKey(
        'LoteProduto',
        models.SET_NULL,
        db_column='id_lote',
        blank=True,
        null=True,
        related_name='venda_itens',
        help_text='Lote utilizado nesta venda'
    )

    class Meta:
        db_table = 'venda_itens'

    def __str__(self):
        codigo = getattr(self.id_produto, 'codigo_produto', None) or getattr(self.id_produto, 'id_produto', None)
        return f'Item {codigo or "?"} x {self.quantidade}'


class VendaEntregaLog(models.Model):
    """Histórico de atualizações de status logístico de uma venda."""
    STATUS_CHOICES = [
        ('PREPARANDO', 'Preparando'),
        ('AGUARDANDO_RETIRADA', 'Aguardando Retirada'),
        ('DESPACHADO', 'Despachado'),
        ('ENTREGUE', 'Entregue'),
    ]
    id_entrega_log = models.AutoField(primary_key=True)
    id_venda = models.ForeignKey(Venda, models.CASCADE, db_column='id_venda', related_name='logs_entrega')
    status_anterior = models.CharField(max_length=30, choices=STATUS_CHOICES, blank=True, null=True)
    status_novo = models.CharField(max_length=30, choices=STATUS_CHOICES)
    observacao = models.TextField(blank=True, null=True)
    usuario = models.ForeignKey(User, models.SET_NULL, db_column='id_usuario', blank=True, null=True)
    data_log = models.DateTimeField(auto_now_add=True)
    recebedor_nome = models.CharField(max_length=150, blank=True, null=True, help_text='Nome de quem recebeu a mercadoria')
    recebedor_documento = models.CharField(max_length=20, blank=True, null=True, help_text='CPF/RG de quem recebeu')

    class Meta:
        db_table = 'venda_entrega_logs'
        ordering = ['data_log']

    def __str__(self):
        return f'Log Entrega Venda #{self.id_venda_id} - {self.status_novo}'


# --- MODELO DE VEÍCULO NOVO (Dados específicos para NFe) ---

class VeiculoNovo(models.Model):
    """
    Dados específicos de veículos novos para emissão de NFe.
    Obrigatório quando a operação tem venda_veiculo_novo=True.
    Baseado no grupo <veicProd> da NFe 4.0.
    """
    id_veiculo_novo = models.AutoField(primary_key=True)
    id_venda_item = models.OneToOneField(
        VendaItem, 
        on_delete=models.CASCADE, 
        db_column='id_venda_item',
        related_name='veiculo_novo',
        help_text='Item da venda que contém este veículo'
    )
    
    # Campos obrigatórios conforme NFe 4.0
    tp_op = models.CharField(
        max_length=1,
        help_text='Tipo Operação: 1=Venda concessionária, 2=Faturamento direto, 3=Venda direta, 0=Outros'
    )
    chassi = models.CharField(max_length=17, help_text='Chassi do veículo (17 caracteres)')
    c_cor = models.CharField(max_length=4, help_text='Código da cor (Tabela DENATRAN)')
    x_cor = models.CharField(max_length=40, help_text='Descrição da cor')
    pot = models.CharField(max_length=4, help_text='Potência do motor (CV)')
    cilin = models.CharField(max_length=4, help_text='Cilindrada (cc)')
    peso_l = models.CharField(max_length=9, help_text='Peso líquido (kg)')
    peso_b = models.CharField(max_length=9, help_text='Peso bruto (kg)')
    n_serie = models.CharField(max_length=9, help_text='Número de série')
    tp_comb = models.CharField(max_length=2, help_text='Tipo de combustível: 01=Álcool, 02=Gasolina, 03=Diesel...')
    n_motor = models.CharField(max_length=21, help_text='Número do motor')
    cmt = models.CharField(max_length=9, help_text='Capacidade Máxima de Tração (kg)')
    dist = models.CharField(max_length=4, help_text='Distância entre eixos (mm)')
    ano_mod = models.IntegerField(help_text='Ano modelo')
    ano_fab = models.IntegerField(help_text='Ano de fabricação')
    tp_pint = models.CharField(max_length=1, help_text='Tipo de pintura: S=Sólida, M=Metálica, P=Perolizada')
    tp_veic = models.CharField(max_length=2, help_text='Tipo de veículo: 02=Ciclomotor, 03=Motoneta, 04=Motocicleta...')
    esp_veic = models.CharField(max_length=1, help_text='Espécie: 1=Passageiro, 2=Carga, 3=Misto...')
    vin = models.CharField(max_length=1, help_text='VIN (chassi remarcado): R=Remarcado, N=Normal')
    cond_veic = models.CharField(max_length=1, help_text='Condição: 1=Acabado, 2=Inacabado, 3=Semi-acabado')
    c_mod = models.CharField(max_length=6, help_text='Código Marca/Modelo (Tabela RENAVAM)')
    c_cor_denatran = models.CharField(max_length=2, help_text='Código da cor DENATRAN')
    lota = models.IntegerField(help_text='Lotação máxima')
    tp_rest = models.CharField(max_length=1, help_text='Tipo de restrição: 0=Não há, 1=Alienação, 2=Arrendamento...')
    
    # Metadados
    data_cadastro = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = True
        db_table = 'veiculos_novos'
        verbose_name = 'Veículo Novo'
        verbose_name_plural = 'Veículos Novos'
    
    def __str__(self):
        return f'Veículo {self.chassi} - {self.x_cor} ({self.ano_mod}/{self.ano_fab})'


# --- MODELO DE CASHBACK ---

class Cashback(models.Model):
    """
    Modelo para controle de cashback gerado em vendas.
    Registra cashback gerado, utilizado e saldo disponível por cliente.
    """
    id_cashback = models.AutoField(primary_key=True, db_column='id_cashback')
    id_cliente = models.ForeignKey(Cliente, models.CASCADE, db_column='id_cliente', related_name='cashbacks')
    id_venda_origem = models.ForeignKey(Venda, models.SET_NULL, db_column='id_venda_origem', blank=True, null=True, related_name='cashback_gerado')
    id_venda_utilizado = models.ForeignKey(Venda, models.SET_NULL, db_column='id_venda_utilizado', blank=True, null=True, related_name='cashback_utilizado')
    
    # Valores
    valor_gerado = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        db_column='valor_gerado',
        help_text="Valor original de cashback gerado"
    )
    valor_utilizado = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        db_column='valor_utilizado',
        help_text="Valor já utilizado deste cashback"
    )
    saldo = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        db_column='saldo',
        help_text="Saldo disponível (gerado - utilizado)"
    )
    
    # Datas
    data_geracao = models.DateTimeField(auto_now_add=True, db_column='data_geracao')
    data_validade = models.DateTimeField(db_column='data_validade', help_text="Data de expiração do cashback")
    data_utilizacao = models.DateTimeField(blank=True, null=True, db_column='data_utilizacao', help_text="Data da última utilização")
    
    # Controle
    ativo = models.BooleanField(
        default=True,
        db_column='ativo',
        help_text="False se expirado ou totalmente utilizado"
    )
    
    # Metadados
    percentual_origem = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        db_column='percentual_origem',
        help_text="Percentual que gerou este cashback (para histórico)"
    )
    observacoes = models.TextField(blank=True, null=True, db_column='observacoes')
    
    class Meta:
        db_table = 'cashbacks'
        ordering = ['-data_geracao']
        indexes = [
            models.Index(fields=['id_cliente', 'ativo']),
            models.Index(fields=['data_validade']),
        ]

    def __str__(self):
        return f'Cashback {self.id_cashback} - Cliente {self.id_cliente} - R$ {self.saldo}'
    
    @property
    def esta_vencido(self):
        """Verifica se o cashback está vencido"""
        from django.utils import timezone
        return timezone.now() > self.data_validade
    
    def atualizar_saldo(self):
        """Atualiza o saldo e status do cashback"""
        self.saldo = self.valor_gerado - self.valor_utilizado
        if self.saldo <= 0 or self.esta_vencido:
            self.ativo = False
        self.save()


class NotaFiscalReferenciada(models.Model):
    """
    Modelo para armazenar referências a documentos fiscais anteriores.
    Usado principalmente para conversão Cupom → NF-e (CFOP 5929).
    Gera a tag <NFref> no XML da NF-e.
    """
    TIPO_DOCUMENTO_CHOICES = [
        ('NFE', 'NF-e (Nota Fiscal Eletrônica)'),
        ('NFCE', 'NFC-e (Nota Fiscal Consumidor Eletrônica)'),
        ('SAT', 'SAT (CF-e-SAT)'),
        ('NFP', 'NF Produtor'),
        ('CTE', 'CT-e (Conhecimento de Transporte Eletrônico)'),
    ]
    
    id_nota_referenciada = models.AutoField(primary_key=True, db_column='id_nota_referenciada')
    id_venda = models.ForeignKey(
        'Venda',
        on_delete=models.CASCADE,
        db_column='id_venda',
        related_name='notas_referenciadas',
        help_text="Venda (NF-e/NFC-e) que referencia documentos anteriores"
    )
    tipo_documento = models.CharField(
        max_length=10,
        choices=TIPO_DOCUMENTO_CHOICES,
        db_column='tipo_documento',
        help_text="Tipo do documento referenciado"
    )
    chave_acesso = models.CharField(
        max_length=44,
        db_column='chave_acesso',
        help_text="Chave de acesso do documento referenciado (44 caracteres)"
    )
    numero_documento = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        db_column='numero_documento',
        help_text="Número do documento (apenas para visualização)"
    )
    serie_documento = models.CharField(
        max_length=3,
        blank=True,
        null=True,
        db_column='serie_documento',
        help_text="Série do documento (apenas para visualização)"
    )
    data_emissao = models.DateTimeField(
        blank=True,
        null=True,
        db_column='data_emissao',
        help_text="Data de emissão do documento referenciado"
    )
    valor_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        db_column='valor_total',
        help_text="Valor total do documento referenciado (informativo)"
    )
    observacoes = models.TextField(
        blank=True,
        null=True,
        db_column='observacoes',
        help_text="Observações sobre a referência"
    )
    data_cadastro = models.DateTimeField(
        auto_now_add=True,
        db_column='data_cadastro'
    )
    
    class Meta:
        managed = True
        db_table = 'notas_fiscais_referenciadas'
        ordering = ['id_venda', 'data_cadastro']
        indexes = [
            models.Index(fields=['id_venda']),
            models.Index(fields=['chave_acesso']),
        ]
    
    def __str__(self):
        return f"{self.tipo_documento} - {self.chave_acesso[:20]}..."


# --- MODELOS DE COMPRAS ---

class Compra(models.Model):
    """
    Mapeamento para a tabela legacy `compras` já existente no banco.
    Alguns nomes de coluna no banco séo diferentes do nosso modelo, portanto
    fazemos o mapeamento via db_column para evitar alterar a tabela.
    """
    id_compra = models.AutoField(primary_key=True, db_column='id_compra')
    id_operacao = models.ForeignKey(Operacao, models.SET_NULL, db_column='id_operacao', blank=True, null=True)
    id_fornecedor = models.ForeignKey('Fornecedor', models.SET_NULL, db_column='id_fornecedor', blank=True, null=True)
    numero_documento = models.CharField(max_length=50, blank=True, null=True, db_column='numero_nota')
    serie_nota = models.CharField(max_length=5, blank=True, null=True, db_column='serie_nota')
    data_emissao_nfe = models.DateField(blank=True, null=True, db_column='data_emissao_nfe')
    data_documento = models.DateTimeField(blank=True, null=True, db_column='data_movimento_entrada')
    data_entrada = models.DateField(blank=True, null=True, db_column='data_entrada')
    dados_entrada = models.CharField(max_length=255, blank=True, null=True, db_column='chave_nfe')
    xml_conteudo = models.TextField(blank=True, null=True, db_column='xml_conteudo')
    
    # Valores
    valor_total_produtos = models.DecimalField(max_digits=15, decimal_places=6, default=0.00, db_column='valor_total_produtos')
    valor_frete = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_frete')
    valor_desconto = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_desconto')
    valor_impostos = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_impostos')
    valor_total = models.DecimalField(max_digits=15, decimal_places=6, default=0.00, db_column='valor_total_nota')
    
    # Flag se foi lançamento manual ou via XML
    manual = models.BooleanField(default=False, db_column='manual')
    
    # Vinculo com CT-e ou MDF-e
    id_cte = models.CharField(max_length=44, blank=True, null=True, db_column='id_cte', help_text='Chave CT-e ou MDF-e vinculado')
    
    gerou_financeiro = models.IntegerField(blank=True, null=True, default=0, db_column='gerou_financeiro')

    class Meta:
        db_table = 'compras'
        managed = False

    def __str__(self):
        return f'Compra {self.numero_documento or self.id_compra}'


class CompraItem(models.Model):
    """Mapeamento para a tabela legacy `compra_itens`.
    Ajusta nomes de colunas para corresponder ao esquema existente.
    """
    id_item = models.AutoField(primary_key=True, db_column='id_compra_item')
    id_compra = models.ForeignKey(Compra, models.CASCADE, db_column='id_compra', related_name='itens')
    id_produto = models.ForeignKey(Produto, models.SET_NULL, db_column='id_produto', blank=True, null=True)
    quantidade = models.DecimalField(max_digits=15, decimal_places=6, default=0.000000, db_column='quantidade')
    quantidade_fracionada = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, db_column='quantidade_fracionada')
    fracao_aplicada = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, db_column='fracao_aplicada', help_text='Fração aplicada (ex: 12.0 para caixa com 12 unidades)')
    unidade = models.CharField(max_length=10, default='UN', db_column='unidade')
    valor_compra = models.DecimalField(max_digits=15, decimal_places=6, default=0.00, db_column='valor_unitario')
    valor_total = models.DecimalField(max_digits=15, decimal_places=6, default=0.00, db_column='valor_total')
    
    # Valores de tributos e encargos
    desconto = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_desconto')
    valor_frete_item = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_frete_item')
    valor_ipi = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_ipi')
    valor_icms = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_icms')
    valor_pis = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_pis')
    valor_cofins = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True, default=0.00, db_column='valor_cofins')

    class Meta:
        db_table = 'compra_itens'
        managed = False

    def __str__(self):
        return f'CompraItem {self.id_item} (Prod: {getattr(self.id_produto, "codigo_produto", None)})'


class FornecedorProdutoFracao(models.Model):
    """
    Armazena frações customizadas por fornecedor para produtos.
    Permite memorizar como cada fornecedor vende um produto (ex: caixa com 10 unidades).
    """
    id = models.AutoField(primary_key=True)
    fornecedor = models.ForeignKey(
        'Fornecedor',
        on_delete=models.CASCADE,
        db_column='id_fornecedor',
        related_name='fracoes_produto',
        help_text='Fornecedor que utiliza esta fração'
    )
    produto = models.ForeignKey(
        'Produto',
        on_delete=models.CASCADE,
        db_column='id_produto',
        related_name='fracoes_fornecedor',
        help_text='Produto ao qual a fração se aplica'
    )
    gtin = models.CharField(
        max_length=14,
        help_text='GTIN/EAN do produto no XML do fornecedor',
        db_index=True
    )
    fracao = models.DecimalField(
        max_digits=15,
        decimal_places=6,
        help_text='Fator de conversão (ex: 10.0 para caixa com 10 unidades)'
    )
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fornecedor_produto_fracao'
        managed = True
        unique_together = [('fornecedor', 'produto', 'gtin')]
        verbose_name = 'Fração de Produto por Fornecedor'
        verbose_name_plural = 'Frações de Produtos por Fornecedor'
        ordering = ['-data_atualizacao']
    
    def __str__(self):
        return f'{self.fornecedor.nome_razao_social} - {self.produto.nome_produto} (GTIN: {self.gtin}) = {self.fracao}x'


# Adicione estes modelos ao final do arquivo api/models.py

class Deposito(models.Model):
    """Depósitos/Locais de armazenamento"""

    id_deposito = models.AutoField(primary_key=True, db_column='id')
    nome_deposito = models.CharField(
        max_length=100,
        db_column='nome',
        help_text="Nome do depósito"
    )
    descricao = models.TextField(
        null=True,
        blank=True,
        db_column='descricao',
        help_text="Descrição do depósito"
    )
    estoque_baixo = models.IntegerField(
        default=0,
        help_text="Estoque mínimo para alerta"
    )
    estoque_incremento = models.IntegerField(
        default=0,
        help_text="Incremento de estoque"
    )
    data_criacao = models.DateTimeField(auto_now_add=True, db_column='criado_em')
    data_modificacao = models.DateTimeField(auto_now=True, db_column='atualizado_em')

    class Meta:
        managed = False
        db_table = 'deposito'
        ordering = ['nome_deposito']
        verbose_name = 'Depósito'
        verbose_name_plural = 'Depósitos'

    def __str__(self):
        return self.nome_deposito

class Estoque(models.Model):
    """Controle de estoque por produto e depósito"""
    
    id_estoque = models.AutoField(primary_key=True)
    id_produto = models.ForeignKey(
        'Produto', 
        on_delete=models.CASCADE,
        db_column='id_produto',
        help_text="Produto relacionado ao estoque"
    )
    id_variacao = models.ForeignKey(
        'ProdutoVariacao',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='id_variacao',
        help_text="Variação específica (Grade)"
    )
    id_deposito = models.ForeignKey(
        'Deposito', 
        on_delete=models.CASCADE,
        db_column='id_deposito', 
        help_text="Depósito onde o produto está armazenado"
    )
    quantidade = models.DecimalField(
        max_digits=15, 
        decimal_places=3, 
        default=0.000,
        help_text="Quantidade atual em estoque"
    )
    quantidade_minima = models.DecimalField(
        max_digits=15, 
        decimal_places=3, 
        default=0.000,
        help_text="Quantidade mé­nima de estoque"
    )
    quantidade_maxima = models.DecimalField(
        max_digits=15, 
        decimal_places=3, 
        null=True, 
        blank=True,
        help_text="Quantidade mé¡xima de estoque"
    )
    custo_medio = models.DecimalField(
        max_digits=15, 
        decimal_places=4, 
        default=0.0000,
        help_text="Custo médio do produto"
    )
    valor_total = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0.00,
        help_text="Valor total do estoque (quantidade × custo médio)"
    )
    valor_venda = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        help_text="Valor de venda do produto neste depósito"
    )
    valor_ultima_compra = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        help_text="Valor da última compra do produto neste depósito"
    )
    data_ultima_entrada = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Data da éºltima entrada no estoque"
    )
    data_ultima_saida = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Data da éºltima saé­da do estoque"
    )
    data_criacao = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    data_modificacao = models.DateTimeField(auto_now=True)
    ativo = models.BooleanField(default=True, help_text="Registro ativo")

    class Meta:
        managed = True
        db_table = 'estoque'
        ordering = ['id_produto', 'id_deposito']
        unique_together = [['id_produto', 'id_deposito']]
        verbose_name = 'Estoque'
        verbose_name_plural = 'Estoques'

    def __str__(self):
        return f"{self.id_produto.nome_produto} - {self.id_deposito.nome_deposito} ({self.quantidade})"

    def save(self, *args, **kwargs):
        """Recalcula o valor total ao salvar"""
        from decimal import Decimal
        try:
            q = Decimal(str(self.quantidade or 0))
            cm = Decimal(str(self.custo_medio or 0))
            self.valor_total = q * cm
        except Exception:
            # fallback: try naive multiplication and let exception propagate if it fails
            self.valor_total = self.quantidade * self.custo_medio
        super().save(*args, **kwargs)

    @property
    def status_estoque(self):
        """Retorna o status do estoque baseado nas quantidades mé­nima e mé¡xima"""
        if self.quantidade <= self.quantidade_minima:
            return 'BAIXO'
        elif self.quantidade_maxima and self.quantidade >= self.quantidade_maxima:
            return 'ALTO'
        else:
            return 'NORMAL'

class EstoqueMovimentacao(models.Model):
    """Histé³rico de movimentaé§éµes de estoque"""
    
    TIPO_MOVIMENTACAO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SAIDA', 'Saé­da'),
        ('AJUSTE', 'Ajuste'),
        ('TRANSFERENCIA', 'Transferéªncia'),
    ]
    
    DOCUMENTO_TIPO_CHOICES = [
        ('VENDA', 'Venda'),
        ('COMPRA', 'Compra'),
        ('AJUSTE', 'Ajuste'),
        ('TRANSFERENCIA', 'Transferéªncia'),
        ('INVENTARIO', 'Inventário'),
    ]
    
    id_movimentacao = models.AutoField(primary_key=True)
    id_estoque = models.ForeignKey(
        'Estoque', 
        on_delete=models.CASCADE,
        db_column='id_estoque',
        help_text="Estoque relacionado é  movimentaé§é£o"
    )
    id_produto = models.ForeignKey(
        'Produto', 
        on_delete=models.CASCADE,
        db_column='id_produto',
        help_text="Produto movimentado"
    )
    id_deposito = models.ForeignKey(
        'Deposito', 
        on_delete=models.CASCADE,
        db_column='id_deposito',
        help_text="Depé³sito da movimentaé§é£o"
    )
    tipo_movimentacao = models.CharField(
        max_length=15,
        choices=TIPO_MOVIMENTACAO_CHOICES,
        help_text="Tipo da movimentaé§é£o"
    )
    quantidade_anterior = models.DecimalField(
        max_digits=15, 
        decimal_places=3,
        help_text="Quantidade antes da movimentaé§é£o"
    )
    quantidade_movimentada = models.DecimalField(
        max_digits=15, 
        decimal_places=3,
        help_text="Quantidade movimentada"
    )
    quantidade_atual = models.DecimalField(
        max_digits=15, 
        decimal_places=3,
        help_text="Quantidade apé³s a movimentaé§é£o"
    )
    custo_unitario = models.DecimalField(
        max_digits=15, 
        decimal_places=4, 
        default=0.0000,
        help_text="Custo unité¡rio da movimentaé§é£o"
    )
    valor_total = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0.00,
        help_text="Valor total da movimentaé§é£o"
    )
    documento_numero = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        help_text="Néºmero do documento de origem"
    )
    documento_tipo = models.CharField(
        max_length=15,
        choices=DOCUMENTO_TIPO_CHOICES,
        null=True, 
        blank=True,
        help_text="Tipo do documento de origem"
    )
    id_documento_origem = models.IntegerField(
        null=True, 
        blank=True,
        help_text="ID do documento de origem"
    )
    observacoes = models.TextField(
        null=True, 
        blank=True,
        help_text="Observaé§éµes sobre a movimentaé§é£o"
    )
    usuario_responsavel = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text="Usué¡rio responsé¡vel pela movimentaé§é£o"
    )
    data_movimentacao = models.DateTimeField(
        auto_now_add=True,
        help_text="Data e hora da movimentaé§é£o"
    )

    class Meta:
        managed = True
        db_table = 'estoque_movimentacoes'
        ordering = ['-data_movimentacao']
        verbose_name = 'Movimentação de Estoque'
        verbose_name_plural = 'Movimentações de Estoque'

    def __str__(self):
        return f"{self.tipo_movimentacao} - {self.id_produto.nome_produto} ({self.quantidade_movimentada})"

    def save(self, *args, **kwargs):
        """Calcula o valor total ao salvar"""
        from decimal import Decimal
        try:
            qm = Decimal(str(self.quantidade_movimentada or 0))
            cu = Decimal(str(self.custo_unitario or 0))
            self.valor_total = qm * cu
        except Exception:
            self.valor_total = self.quantidade_movimentada * self.custo_unitario
        super().save(*args, **kwargs)




# Modelos para Catálogo de Produtos (WhatsApp)

class Catalogo(models.Model):
    """Catálogo de produtos para compartilhamento via WhatsApp"""
    nome_catalogo = models.CharField(
        max_length=200,
        verbose_name='Nome do Catálogo',
        help_text='Nome identificador do catálogo (ex: Catálogo Veréo 2025)'
    )
    descricao = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descrição',
        help_text='Descrição opcional do catálogo'
    )
    ativo = models.BooleanField(
        default=True,
        verbose_name='Ativo',
        help_text='Catálogo ativo para compartilhamento'
    )
    data_cadastro = models.DateTimeField(auto_now_add=True, verbose_name='Data de Cadastro')
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name='Última Atualização')

    class Meta:
        managed = True
        db_table = 'api_catalogo'
        ordering = ['-data_cadastro']
        verbose_name = 'Catálogo'
        verbose_name_plural = 'Catálogos'

    def __str__(self):
        return f"{self.nome_catalogo} - {'Ativo' if self.ativo else 'Inativo'}"


class CatalogoItem(models.Model):
    """Item de um catálogo (produto específico dentro de um catálogo)"""
    catalogo = models.ForeignKey(
        Catalogo,
        on_delete=models.CASCADE,
        related_name='itens',
        verbose_name='Catálogo',
        help_text='Catálogo ao qual este item pertence',
        null=True,
        blank=True
    )
    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name='catalogo_items',
        verbose_name='Produto'
    )
    valor_catalogo = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Valor no Catálogo')
    ativo = models.BooleanField(default=True)
    ordem = models.IntegerField(default=0)
    destaque = models.BooleanField(default=False)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    whatsapp = models.CharField(max_length=20, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_catalogoitem'
        ordering = ['ordem', 'produto__nome_produto']
        verbose_name = 'Item do Catálogo'
        verbose_name_plural = 'Itens do Catálogo'
    
    def __str__(self):
        return f'{self.produto.nome_produto} - Ordem: {self.ordem}'


# Importar models de devolução
from .models_devolucao import Devolucao, DevolucaoItem, CreditoCliente, CreditoUtilizacao




# === MODELOS DE TROCA ===
class Troca(models.Model):
    """
    Modelo para registrar trocas de produtos de vendas
    """
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('concluida', 'Concluída'),
        ('cancelada', 'Cancelada'),
    ]
    
    id_troca = models.AutoField(primary_key=True)
    id_venda_original = models.BigIntegerField(
        help_text="ID da venda original que está sendo trocada"
    )
    id_cliente = models.BigIntegerField(
        null=True, blank=True,
        help_text="ID do cliente (opcional)"
    )
    data_troca = models.DateTimeField(
        default=timezone.now,
        help_text="Data e hora da troca"
    )
    valor_total_retorno = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Valor total dos produtos devolvidos"
    )
    valor_total_substituicao = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Valor total dos produtos substitutos"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pendente',
        help_text="Status da troca"
    )
    observacao = models.TextField(
        null=True, blank=True,
        help_text="Observações sobre a troca"
    )
    criado_por = models.BigIntegerField(
        null=True, blank=True,
        help_text="ID do usuário que criou a troca"
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    id_financeiro = models.BigIntegerField(
        null=True, blank=True,
        help_text="ID do registro financeiro gerado (se houver)"
    )

    class Meta:
        db_table = 'trocas'
        ordering = ['-data_troca']
        verbose_name = 'Troca'
        verbose_name_plural = 'Trocas'

    def __str__(self):
        return f"Troca #{self.id_troca} - Venda #{self.id_venda_original}"

    @property
    def diferenca_valor(self):
        """Calcula a diferença entre substituição e retorno"""
        return self.valor_total_substituicao - self.valor_total_retorno

    @property
    def tipo_Ajuste_financeiro(self):
        """Retorna o tipo de Ajuste financeiro necessário"""
        diff = self.diferenca_valor
        if diff > 0:
            return 'cobranca'
        elif diff < 0:
            return 'credito'
        else:
            return 'neutro'


class TrocaItem(models.Model):
    """
    Modelo para itens individuais de uma troca
    """
    id_troca_item = models.AutoField(primary_key=True)
    troca = models.ForeignKey(
        Troca, on_delete=models.CASCADE, 
        related_name='itens',
        db_column='id_troca'
    )
    
    # Dados do item devolvido (da venda original)
    id_venda_item_original = models.BigIntegerField(
        null=True, blank=True,
        help_text="ID do item da venda original sendo devolvido"
    )
    id_produto_retorno = models.BigIntegerField(
        null=True, blank=True,
        help_text="ID do produto sendo devolvido"
    )
    quantidade_retorno = models.DecimalField(
        max_digits=12, decimal_places=3, default=0,
        help_text="Quantidade do produto devolvido"
    )
    valor_unit_retorno = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Valor unitário do produto devolvido"
    )
    valor_total_retorno = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Valor total do produto devolvido"
    )
    
    # Dados do item substituto (novo produto)
    id_produto_substituicao = models.BigIntegerField(
        null=True, blank=True,
        help_text="ID do produto substituto"
    )
    quantidade_substituicao = models.DecimalField(
        max_digits=12, decimal_places=3, default=0,
        help_text="Quantidade do produto substituto"
    )
    valor_unit_substituicao = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Valor unitário do produto substituto"
    )
    valor_total_substituicao = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Valor total do produto substituto"
    )

    class Meta:
        db_table = 'troca_itens'
        verbose_name = 'Item de Troca'
        verbose_name_plural = 'Itens de Troca'

    def __str__(self):
        retorno = f"Produto {self.id_produto_retorno}" if self.id_produto_retorno else "Sem retorno"
        substituicao = f"Produto {self.id_produto_substituicao}" if self.id_produto_substituicao else "Sem substituto"
        return f"Item Troca #{self.troca.id_troca}: {retorno} → {substituicao}"

    def save(self, *args, **kwargs):
        """Calcula valores totais automaticamente"""
        if self.quantidade_retorno and self.valor_unit_retorno:
            self.valor_total_retorno = self.quantidade_retorno * self.valor_unit_retorno
        
        if self.quantidade_substituicao and self.valor_unit_substituicao:
            self.valor_total_substituicao = self.quantidade_substituicao * self.valor_unit_substituicao
        
        super().save(*args, **kwargs)


# --- MODELO DE PROMOÇÃO (Mapa de Promoção) ---

class Promocao(models.Model):
    """
    Modelo para gerenciar promoções de produtos.
    Controla desconto, período válido e critérios de seleção.
    """
    TIPO_DESCONTO_CHOICES = [
        ('percentual', 'Percentual (%)'),
        ('unidade', 'Valor por Unidade (R$)'),
        ('valor', 'Valor Total (R$)'),
    ]
    
    TIPO_CRITERIO_CHOICES = [
        ('quantidade', 'Por Quantidade Vendida'),
        ('valor', 'Por Valor de Venda'),
    ]
    
    STATUS_CHOICES = [
        ('ativa', 'Ativa'),
        ('inativa', 'Inativa'),
        ('expirada', 'Expirada'),
    ]

    id_promocao = models.AutoField(primary_key=True)
    nome_promocao = models.CharField(
        max_length=255,
        help_text="Nome da promoção (ex: 'Liquidação Verão 2025')"
    )
    descricao = models.TextField(
        blank=True,
        null=True,
        help_text="Descrição detalhada da promoção"
    )
    
    # Datas
    data_inicio = models.DateTimeField(
        help_text="Data e hora de início da promoção"
    )
    data_fim = models.DateTimeField(
        help_text="Data e hora de término da promoção"
    )
    
    # Tipo de desconto
    tipo_desconto = models.CharField(
        max_length=20,
        choices=TIPO_DESCONTO_CHOICES,
        default='percentual',
        help_text="Tipo de desconto a aplicar"
    )
    valor_desconto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Valor ou percentual de desconto"
    )
    
    # Critério de seleção
    tipo_criterio = models.CharField(
        max_length=20,
        choices=TIPO_CRITERIO_CHOICES,
        default='quantidade',
        help_text="Critério para selecionar produtos em promoção"
    )
    
    # Produtos selecionados
    produtos = models.ManyToManyField(
        Produto,
        through='PromocaoProduto',
        help_text="Produtos em promoção"
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ativa',
        help_text="Status atual da promoção"
    )
    
    # Auditoria
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    criado_por = models.ForeignKey(
        User,
        models.SET_NULL,
        blank=True,
        null=True,
        related_name='promocoes_criadas',
        db_column='criado_por'
    )
    
    class Meta:
        db_table = 'promocoes'
        ordering = ['-data_inicio']
        verbose_name = 'Promoção'
        verbose_name_plural = 'Promoções'
    
    def __str__(self):
        return f'{self.nome_promocao} ({self.data_inicio.strftime("%d/%m/%Y")} a {self.data_fim.strftime("%d/%m/%Y")})'
    
    @property
    def esta_ativa(self):
        """Verifica se a promoção está dentro do período válido"""
        from django.utils import timezone
        agora = timezone.now()
        return self.data_inicio <= agora <= self.data_fim and self.status == 'ativa'
    
    @property
    def dias_restantes(self):
        """Calcula dias restantes até o fim da promoção"""
        from django.utils import timezone
        agora = timezone.now()
        if agora > self.data_fim:
            return 0
        return (self.data_fim - agora).days
    
    def aplicar_desconto(self, valor_original, quantidade=1):
        """
        Calcula o desconto a ser aplicado
        
        Args:
            valor_original: Valor original do item
            quantidade: Quantidade do item (para cálculos)
        
        Returns:
            dict com valores: valor_desconto, valor_final, percentual_aplicado
        """
        valor_original = float(valor_original)
        quantidade = float(quantidade)
        valor_desc = float(self.valor_desconto)

        if self.tipo_desconto == 'percentual':
            desc = (valor_original * valor_desc) / 100
            percentual = valor_desc
        elif self.tipo_desconto == 'unidade':
            desc = valor_desc * quantidade
            percentual = (desc / valor_original * 100) if valor_original > 0 else 0
        else:  # valor
            desc = valor_desc
            percentual = (desc / valor_original * 100) if valor_original > 0 else 0
        
        return {
            'valor_desconto': float(desc),
            'valor_final': float(valor_original - desc),
            'percentual_aplicado': float(percentual)
        }


class PromocaoProduto(models.Model):
    """
    Tabela de relacionamento entre Promoção e Produto.
    Permite rastrear quais produtos estão em qual promoção.
    """
    id_promocao_produto = models.AutoField(primary_key=True)
    id_promocao = models.ForeignKey(
        Promocao,
        models.CASCADE,
        db_column='id_promocao',
        related_name='promocao_produtos'
    )
    id_produto = models.ForeignKey(
        Produto,
        models.CASCADE,
        db_column='id_produto'
    )
    
    # Limite de desconto por produto (opcional)
    valor_minimo_venda = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Valor mínimo para aplicar desconto (opcional)"
    )
    quantidade_minima = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        blank=True,
        null=True,
        help_text="Quantidade mínima para aplicar desconto (opcional)"
    )
    
    # Desconto individual por produto
    valor_desconto_produto = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Desconto individual para este produto (sobrescreve o desconto geral)"
    )
    
    criado_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'promocao_produtos'
        unique_together = ('id_promocao', 'id_produto')
        verbose_name = 'Produto em Promoção'
        verbose_name_plural = 'Produtos em Promoção'
    
    def __str__(self):
        return f'{self.id_promocao.nome_promocao} - {self.id_produto.nome_produto}'


# --- MODELOS DE PET SHOP ---

class Pet(models.Model):
    """Modelo para armazenar informações de pets"""
    SEXO_CHOICES = [
        ('M', 'Macho'),
        ('F', 'Fêmea'),
    ]
    
    id_pet = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column='id_cliente', related_name='pets')
    nome_pet = models.CharField(max_length=100)
    raca = models.CharField(max_length=100, blank=True, null=True)
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES, default='M')
    data_nascimento = models.DateField(blank=True, null=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Peso em kg")
    cor = models.CharField(max_length=100, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'petshop_pets'
        ordering = ['nome_pet']
    
    def __str__(self):
        return f'{self.nome_pet} ({self.raca})'


class TipoServico(models.Model):
    """Tipos de serviços oferecidos (banho, tosa, hidratação, etc)"""
    id_tipo_servico = models.AutoField(primary_key=True)
    nome_servico = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True, null=True)
    duracao_minutos = models.IntegerField(default=30, help_text="Duração estimada em minutos")
    preco_base = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'petshop_tipo_servicos'
        ordering = ['nome_servico']
    
    def __str__(self):
        return f'{self.nome_servico} (R$ {self.preco_base})'


class Agendamento(models.Model):
    """Agendamentos de serviços para pets"""
    STATUS_CHOICES = [
        ('Agendado', 'Agendado'),
        ('Em Andamento', 'Em Andamento'),
        ('Concluído', 'Concluído'),
        ('Cancelado', 'Cancelado'),
        ('Não Compareceu', 'Não Compareceu'),
    ]
    
    TIPO_AGENDAMENTO_CHOICES = [
        ('Único', 'Serviço Único'),
        ('Pacote', 'Pacote de Serviços'),
    ]
    
    id_agendamento = models.AutoField(primary_key=True)
    id_pet = models.ForeignKey(Pet, on_delete=models.CASCADE, db_column='id_pet', related_name='agendamentos')
    id_cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column='id_cliente', related_name='agendamentos_petshop')
    id_tipo_servico = models.ForeignKey(TipoServico, on_delete=models.SET_NULL, db_column='id_tipo_servico', null=True, blank=True)
    
    # Campos para tipo de agendamento
    tipo_agendamento = models.CharField(max_length=10, choices=TIPO_AGENDAMENTO_CHOICES, default='Único')
    quantidade_sessoes = models.IntegerField(default=1, help_text="Número de sessões no pacote")
    
    # Data do agendamento principal (primeira sessão)
    data_agendamento = models.DateTimeField()
    data_conclusao = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Agendado')
    preco_servico = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    preco_total_pacote = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Preço total do pacote")
    
    observacoes = models.TextField(blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_modificacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'petshop_agendamentos'
        ordering = ['-data_agendamento']
        indexes = [
            models.Index(fields=['id_cliente', 'data_agendamento']),
            models.Index(fields=['id_pet', 'status']),
        ]
    
    def __str__(self):
        tipo = f"Pacote ({self.quantidade_sessoes}x)" if self.tipo_agendamento == 'Pacote' else 'Único'
        return f'{self.id_pet.nome_pet} - {self.id_tipo_servico.nome_servico} ({tipo})'


class SessaoAgendamento(models.Model):
    """Sessões individuais de um pacote de agendamento"""
    STATUS_SESSAO = [
        ('Agendada', 'Agendada'),
        ('Concluída', 'Concluída'),
        ('Cancelada', 'Cancelada'),
    ]
    
    id_sessao = models.AutoField(primary_key=True)
    id_agendamento = models.ForeignKey(Agendamento, on_delete=models.CASCADE, db_column='id_agendamento', related_name='sessoes')
    numero_sessao = models.IntegerField(help_text="Número sequencial da sessão (1, 2, 3...)")
    data_sessao = models.DateTimeField()
    data_realizacao = models.DateTimeField(blank=True, null=True, help_text="Data/hora que foi realizada")
    status = models.CharField(max_length=20, choices=STATUS_SESSAO, default='Agendada')
    observacoes = models.TextField(blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'petshop_sessoes_agendamento'
        ordering = ['numero_sessao']
        unique_together = ('id_agendamento', 'numero_sessao')
    
    def __str__(self):
        return f'Sessão {self.numero_sessao} - {self.id_agendamento.id_pet.nome_pet}'


class Avaliacao(models.Model):
    """Avaliações e feedback dos clientes sobre os serviços"""
    NOTA_CHOICES = [
        (1, '⭐ Muito Ruim'),
        (2, '⭐⭐ Ruim'),
        (3, '⭐⭐⭐ Bom'),
        (4, '⭐⭐⭐⭐ Muito Bom'),
        (5, '⭐⭐⭐⭐⭐ Excelente'),
    ]
    
    id_avaliacao = models.AutoField(primary_key=True)
    id_agendamento = models.ForeignKey(Agendamento, on_delete=models.CASCADE, db_column='id_agendamento', related_name='avaliacoes')
    id_cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, db_column='id_cliente')
    nota = models.IntegerField(choices=NOTA_CHOICES, default=5)
    comentario = models.TextField(blank=True, null=True)
    data_avaliacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'petshop_avaliacoes'
        ordering = ['-data_avaliacao']
    
    def __str__(self):
        return f'Avaliação {self.nota}⭐ - {self.id_agendamento}'


class LogAuditoria(models.Model):
    """Registra todas as ações dos usuários no sistema"""
    TIPO_ACAO_CHOICES = [
        ('CREATE', 'Criação'),
        ('UPDATE', 'Edição'),
        ('DELETE', 'Exclusão'),
        ('VIEW', 'Visualização'),
        ('ESTORNO', 'Estorno'),
        ('CANCELAMENTO', 'Cancelamento'),
        ('APROVACAO', 'Aprovação'),
        ('BAIXA', 'Baixa'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Exportação'),
        ('IMPORT', 'Importação'),
        ('PRINT', 'Impressão'),
    ]
    
    id_log = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='id_user', related_name='logs_auditoria')
    usuario_nome = models.CharField(max_length=150)  # Guardar nome caso usuário seja deletado
    tipo_acao = models.CharField(max_length=20, choices=TIPO_ACAO_CHOICES)
    modulo = models.CharField(max_length=100)  # Ex: Vendas, Produtos, Clientes, Financeiro
    descricao = models.TextField()  # Descrição detalhada da ação
    tabela = models.CharField(max_length=100, blank=True, null=True)  # Nome da tabela afetada
    registro_id = models.CharField(max_length=100, blank=True, null=True)  # ID do registro afetado
    dados_anteriores = models.TextField(blank=True, null=True)  # JSON com dados antes da alteração
    dados_novos = models.TextField(blank=True, null=True)  # JSON com dados após a alteração
    ip_address = models.CharField(max_length=45, blank=True, null=True)  # IPv4 ou IPv6
    user_agent = models.TextField(blank=True, null=True)  # Navegador/dispositivo usado
    data_hora = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'log_auditoria'
        ordering = ['-data_hora']
        indexes = [
            models.Index(fields=['-data_hora']),
            models.Index(fields=['usuario', '-data_hora']),
            models.Index(fields=['modulo', '-data_hora']),
            models.Index(fields=['tipo_acao', '-data_hora']),
        ]
    
    def __str__(self):
        return f'{self.usuario_nome} - {self.get_tipo_acao_display()} - {self.modulo} - {self.data_hora.strftime("%d/%m/%Y %H:%M")}'


# --- Modelos para Ordem de Serviço ---
class Tecnico(models.Model):
    id_tecnico = models.AutoField(primary_key=True, db_column='id_tecnico')
    nome_tecnico = models.CharField(max_length=255, db_column='nome_tecnico')
    cpf = models.CharField(max_length=14, db_column='cpf', blank=True, null=True)
    telefone = models.CharField(max_length=20, db_column='telefone', blank=True, null=True)
    percentual_comissao = models.DecimalField(max_digits=5, decimal_places=2, db_column='percentual_comissao', blank=True, null=True)
    ativo = models.BooleanField(default=True, db_column='ativo')
    
    class Meta:
        managed = False
        db_table = 'tecnicos'
    
    def __str__(self):
        return self.nome_tecnico


class OrdemServico(models.Model):
    STATUS_CHOICES = [
        ('Aberta', 'Aberta'),
        ('Em Andamento', 'Em Andamento'),
        ('Aguardando Peça', 'Aguardando Peça'),
        ('Finalizada', 'Finalizada'),
        ('Cancelada', 'Cancelada'),
    ]
    
    id_os = models.AutoField(primary_key=True, db_column='id_os')
    id_cliente = models.ForeignKey(Cliente, models.DO_NOTHING, db_column='id_cliente')
    id_tecnico = models.ForeignKey(Tecnico, models.DO_NOTHING, db_column='id_tecnico', blank=True, null=True, related_name='ordens_servico')
    id_veiculo = models.IntegerField(blank=True, null=True, db_column='id_veiculo')
    id_equipamento = models.IntegerField(blank=True, null=True, db_column='id_equipamento')
    id_animal = models.IntegerField(blank=True, null=True, db_column='id_animal')
    id_operacao = models.ForeignKey('Operacao', models.DO_NOTHING, db_column='id_operacao', blank=True, null=True)
    status_os = models.CharField(max_length=20, db_column='status_os', choices=STATUS_CHOICES, default='Aberta')  # Campo legado, manter para compatibilidade
    id_status = models.ForeignKey('StatusOrdemServico', models.PROTECT, db_column='id_status', blank=True, null=True, related_name='ordens_servico')
    data_abertura = models.DateTimeField(db_column='data_abertura', auto_now_add=True)
    data_finalizacao = models.DateField(db_column='data_finalizacao', blank=True, null=True)
    descricao_problema = models.TextField(db_column='descricao_problema', blank=True, null=True)
    laudo_tecnico = models.TextField(db_column='laudo_tecnico', blank=True, null=True)
    solicitante = models.CharField(max_length=255, db_column='solicitante', blank=True, null=True)
    valor_total_produtos = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_total_produtos', default=0.00)
    valor_total_servicos = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_total_servicos', default=0.00)
    valor_desconto = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_desconto', default=0.00)
    valor_total_os = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_total_os', default=0.00)
    desconto_produtos = models.DecimalField(max_digits=10, decimal_places=2, db_column='desconto_produtos', default=0.00, blank=True, null=True)
    tipo_desconto_produtos = models.CharField(max_length=20, db_column='tipo_desconto_produtos', default='valor', blank=True, null=True)
    desconto_servicos = models.DecimalField(max_digits=10, decimal_places=2, db_column='desconto_servicos', default=0.00, blank=True, null=True)
    tipo_desconto_servicos = models.CharField(max_length=20, db_column='tipo_desconto_servicos', default='valor', blank=True, null=True)
    gera_financeiro = models.BooleanField(default=False, db_column='gera_financeiro')
    
    # Campos NFS-e
    numero_nfse = models.CharField(max_length=50, db_column='numero_nfse', blank=True, null=True)
    chave_nfse = models.CharField(max_length=100, db_column='chave_nfse', blank=True, null=True)
    status_nfse = models.CharField(max_length=20, db_column='status_nfse', blank=True, null=True)
    data_emissao_nfse = models.DateTimeField(db_column='data_emissao_nfse', blank=True, null=True)
    xml_url = models.TextField(db_column='xml_url', blank=True, null=True)
    
    # Campos DPS (Controle Interno/Provisório)
    numero_dps = models.IntegerField(db_column='numero_dps', blank=True, null=True)
    serie_dps = models.CharField(max_length=5, db_column='serie_dps', blank=True, null=True)
    tipo_emissao_dps = models.CharField(max_length=20, db_column='tipo_emissao_dps', default='normal', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'ordem_servico'
        ordering = ['-data_abertura']
    
    def __str__(self):
        return f'OS {self.id_os} - {self.id_cliente.nome_razao_social if self.id_cliente else "Sem cliente"}'


class OsItensProduto(models.Model):
    id_os_item_produto = models.AutoField(primary_key=True, db_column='id_os_item_produto')
    id_os = models.ForeignKey(OrdemServico, models.CASCADE, db_column='id_os', related_name='itens_produtos')
    id_produto = models.ForeignKey(Produto, models.DO_NOTHING, db_column='id_produto')
    quantidade = models.DecimalField(max_digits=10, decimal_places=3, db_column='quantidade')
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_unitario')
    desconto = models.DecimalField(max_digits=10, decimal_places=2, db_column='desconto', default=0.00, blank=True, null=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_total')
    
    class Meta:
        managed = False
        db_table = 'os_itens_produtos'
    
    def save(self, *args, **kwargs):
        self.valor_total = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f'Produto {self.id_produto.nome_produto} - OS {self.id_os.id_os}'


class OsItensServico(models.Model):
    id_os_item_servico = models.AutoField(primary_key=True, db_column='id_os_item_servico')
    id_os = models.ForeignKey(OrdemServico, models.CASCADE, db_column='id_os', related_name='itens_servicos')
    id_tecnico_executante = models.ForeignKey(Tecnico, models.DO_NOTHING, db_column='id_tecnico_executante', blank=True, null=True)
    descricao_servico = models.CharField(max_length=255, db_column='descricao_servico')
    quantidade = models.DecimalField(max_digits=10, decimal_places=2, db_column='quantidade')
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_unitario')
    desconto = models.DecimalField(max_digits=10, decimal_places=2, db_column='desconto', default=0.00, blank=True, null=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, db_column='valor_total')
    
    class Meta:
        managed = False
        db_table = 'os_itens_servicos'
    
    def save(self, *args, **kwargs):
        self.valor_total = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f'Serviço: {self.descricao_servico} - OS {self.id_os.id_os}'


# --- Modelo TabelaComercial ---
class TabelaComercial(models.Model):
    id_tabela_comercial = models.AutoField(primary_key=True)
    nome = models.CharField(max_length=100, verbose_name='Nome da Tabela')
    percentual = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        verbose_name='Percentual de Ajuste',
        help_text='Ex: 10.00 = +10%, -15.00 = -15%'
    )
    ativo = models.BooleanField(default=True, verbose_name='Ativo')
    padrao = models.BooleanField(default=False, verbose_name='Padrão')
    perguntar_ao_vender = models.BooleanField(
        default=False, 
        verbose_name='Perguntar ao Vender',
        db_column='perguntar_ao_vender',
        help_text='Se marcado, pergunta ao adicionar produto e ao gerar financeiro na venda rápida'
    )
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'tabelas_comerciais'
        ordering = ['nome']
        indexes = [
            models.Index(fields=['ativo']),
            models.Index(fields=['padrao']),
        ]

    def __str__(self):
        sinal = '+' if self.percentual > 0 else ''
        return f"{self.nome} ({sinal}{self.percentual}%)"

    def save(self, *args, **kwargs):
        # Se esta tabela for marcada como padrão, desmarcar todas as outras
        if self.padrao:
            TabelaComercial.objects.filter(padrao=True).update(padrao=False)
        super().save(*args, **kwargs)


# --- Modelo Status Ordem de Serviço ---
class StatusOrdemServico(models.Model):
    """Status disponíveis para Ordem de Serviço"""
    id_status = models.AutoField(primary_key=True)
    nome_status = models.CharField(max_length=50, unique=True)
    descricao = models.CharField(max_length=200, blank=True, null=True)
    cor = models.CharField(max_length=20, default='blue', help_text='primary, success, warning, error, info')
    ordem = models.IntegerField(default=0, help_text='Ordem de exibição')
    ativo = models.BooleanField(default=True)
    padrao = models.BooleanField(default=False, help_text='Status padrão para novas OS')
    gera_financeiro = models.BooleanField(default=False, db_column='gera_financeiro', help_text='Gera financeiro ao definir este status')
    permite_editar = models.BooleanField(default=True)
    permite_excluir = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = False
        db_table = 'status_ordem_servico'
        ordering = ['ordem', 'nome_status']
        verbose_name = 'Status de Ordem de Serviço'
        verbose_name_plural = 'Status de Ordens de Serviço'
    
    def __str__(self):
        return self.nome_status
    
    def save(self, *args, **kwargs):
        # Se marcar como padrão, desmarcar outros
        if self.padrao:
            StatusOrdemServico.objects.filter(padrao=True).exclude(pk=self.pk).update(padrao=False)
        super().save(*args, **kwargs)


# --- Fotos e Assinatura de OS ---
class OsFoto(models.Model):
    """Fotos anexadas a uma Ordem de Serviço"""
    id_os_foto = models.AutoField(primary_key=True)
    id_os = models.ForeignKey(OrdemServico, models.CASCADE, db_column='id_os', related_name='fotos', db_constraint=False)
    nome_arquivo = models.CharField(max_length=255)
    imagem_base64 = models.TextField()
    data_criacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'os_fotos'
        ordering = ['data_criacao']

    def __str__(self):
        return f'Foto {self.id_os_foto} — OS {self.id_os_id}'


class OsAssinatura(models.Model):
    """Assinatura digital do cliente na Ordem de Serviço"""
    id_os_assinatura = models.AutoField(primary_key=True)
    id_os = models.OneToOneField(OrdemServico, models.CASCADE, db_column='id_os', related_name='assinatura', db_constraint=False)
    nome_assinante = models.CharField(max_length=255, blank=True, null=True)
    assinatura_base64 = models.TextField()
    data_assinatura = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'os_assinaturas'

    def __str__(self):
        return f'Assinatura — OS {self.id_os_id}'


# --- Modelo de Cheque ---
class Cheque(models.Model):
    TIPO_CHOICES = [
        ('receber', 'A Receber'),
        ('pagar', 'A Pagar'),
    ]
    
    STATUS_CHOICES = [
        ('custodia', 'Em Custódia'),
        ('depositado', 'Depositado'),
        ('compensado', 'Compensado'),
        ('devolvido', 'Devolvido'),
        ('repassado', 'Repassado'),
        ('cancelado', 'Cancelado'),
    ]
    
    id_cheque = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='receber')
    numero_cheque = models.CharField(max_length=50)
    banco = models.CharField(max_length=100)
    agencia = models.CharField(max_length=20)
    conta = models.CharField(max_length=30)
    emitente = models.CharField(max_length=255, help_text='Nome de quem emitiu o cheque')
    cpf_cnpj_emitente = models.CharField(max_length=18, blank=True, null=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_emissao = models.DateField()
    data_vencimento = models.DateField(help_text='Data do bom para')
    data_deposito = models.DateField(blank=True, null=True)
    data_compensacao = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='custodia')
    
    # Relacionamentos
    id_cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, blank=True, null=True, 
                                   related_name='cheques', db_column='id_cliente')
    id_fornecedor = models.ForeignKey(Fornecedor, on_delete=models.SET_NULL, blank=True, null=True,
                                      related_name='cheques', db_column='id_fornecedor')
    id_conta_bancaria = models.ForeignKey(ContaBancaria, on_delete=models.SET_NULL, blank=True, null=True,
                                          related_name='cheques', db_column='id_conta_bancaria',
                                          help_text='Conta onde será depositado')
    id_venda = models.ForeignKey('Venda', on_delete=models.SET_NULL, blank=True, null=True,
                                 related_name='cheques', db_column='id_venda')
    id_compra = models.ForeignKey('Compra', on_delete=models.SET_NULL, blank=True, null=True,
                                  related_name='cheques', db_column='id_compra')
    
    observacoes = models.TextField(blank=True, null=True)
    imagem_cheque = models.CharField(max_length=500, blank=True, null=True, help_text='URL da foto do cheque')
    
    # Campos de auditoria
    data_cadastro = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    usuario_cadastro = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True,
                                         related_name='cheques_cadastrados')
    
    class Meta:
        managed = False
        db_table = 'cheques'
        ordering = ['-data_vencimento']
        verbose_name = 'Cheque'
        verbose_name_plural = 'Cheques'
        indexes = [
            models.Index(fields=['status', 'data_vencimento']),
            models.Index(fields=['tipo', 'status']),
        ]
    
    def __str__(self):
        return f"Cheque {self.numero_cheque} - {self.banco} - R$ {self.valor}"
    
    @property
    def dias_vencimento(self):
        """Retorna quantos dias faltam para o vencimento (negativo se vencido)"""
        from datetime import date
        delta = self.data_vencimento - date.today()
        return delta.days
    
    @property
    def esta_vencido(self):
        """Retorna True se o cheque está vencido"""
        return self.dias_vencimento < 0
    
    @property
    def nome_pessoa(self):
        """Retorna nome do cliente ou fornecedor"""
        if self.id_cliente:
            return self.id_cliente.nome_razao_social
        elif self.id_fornecedor:
            return self.id_fornecedor.nome_razao_social
        return self.emitente


# =====================================================
# SISTEMA DE ALUGUEL DE EQUIPAMENTOS
# =====================================================

class ConfiguracaoContrato(models.Model):
    """Modelo para templates de contratos"""
    
    id_configuracao = models.AutoField(primary_key=True)
    tipo_contrato = models.CharField(max_length=50, unique=True, help_text='Tipo de contrato (ex: aluguel)')
    titulo = models.CharField(max_length=200, help_text='Título do contrato')
    template_html = models.TextField(help_text='Template HTML do contrato. Use variáveis como {{numero_aluguel}}, {{cliente_nome}}, etc.')
    ativo = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = True
        db_table = 'configuracao_contratos'
        verbose_name = 'Configuração de Contrato'
        verbose_name_plural = 'Configurações de Contratos'
    
    def __str__(self):
        return f"{self.titulo} ({self.tipo_contrato})"


class Equipamento(models.Model):
    """Modelo para cadastro de equipamentos disponíveis para aluguel"""
    
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('alugado', 'Alugado'),
        ('manutencao', 'Manutenção'),
        ('inativo', 'Inativo'),
    ]
    
    id_equipamento = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=50, unique=True, help_text='Código único do equipamento')
    nome = models.CharField(max_length=255, help_text='Nome/descrição do equipamento')
    descricao = models.TextField(blank=True, null=True, help_text='Descrição detalhada')
    categoria = models.CharField(max_length=100, blank=True, null=True, help_text='Categoria do equipamento')
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    numero_serie = models.CharField(max_length=100, blank=True, null=True, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disponivel')
    valor_diaria = models.DecimalField(max_digits=10, decimal_places=2, help_text='Valor da diária de aluguel')
    valor_semanal = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text='Valor para 7 dias')
    valor_mensal = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text='Valor para 30 dias')
    imagem_url = models.TextField(blank=True, null=True, help_text='URL ou base64 da imagem')
    observacoes = models.TextField(blank=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = True
        db_table = 'equipamentos_aluguel'
        ordering = ['nome']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['status']),
            models.Index(fields=['categoria']),
        ]
    
    def __str__(self):
        return f"{self.codigo} - {self.nome}"


class Aluguel(models.Model):
    """Modelo para controle de aluguéis de equipamentos (cabeçalho)"""
    
    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]
    
    id_aluguel = models.AutoField(primary_key=True)
    numero_aluguel = models.CharField(max_length=50, unique=True, help_text='Número único do aluguel')
    id_cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, db_column='id_cliente')
    
    # Datas
    data_inicio = models.DateField(help_text='Data de início do aluguel')
    data_fim_prevista = models.DateField(help_text='Data prevista para devolução')
    
    # Valores (calculados a partir dos itens)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Valor total do aluguel')
    valor_multa = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Multa por atraso')
    valor_desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Desconto aplicado')
    valor_final = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Valor final')
    
    # Controle
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ativo')
    id_usuario = models.ForeignKey(User, on_delete=models.PROTECT, db_column='id_usuario', help_text='Usuário que registrou')
    observacoes = models.TextField(blank=True, null=True)
    data_cadastro = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        managed = True
        db_table = 'alugueis'
        ordering = ['-data_cadastro']
        indexes = [
            models.Index(fields=['numero_aluguel']),
            models.Index(fields=['id_cliente', 'status']),
            models.Index(fields=['data_inicio']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Aluguel {self.numero_aluguel} - {self.id_cliente.nome_razao_social}"
    
    def calcular_totais(self):
        """Calcula valores totais baseado nos itens"""
        from django.db.models import Sum
        itens = self.itens.all()
        self.valor_total = itens.aggregate(Sum('valor_total'))['valor_total__sum'] or 0
        self.calcular_valor_final()
    
    def calcular_valor_final(self):
        """Calcula valor final com multas e descontos"""
        self.valor_final = self.valor_total + self.valor_multa - self.valor_desconto
        return self.valor_final


class AluguelItem(models.Model):
    """Modelo para itens de aluguel (cada equipamento)"""
    
    STATUS_CHOICES = [
        ('ativo', 'Ativo'),
        ('devolvido', 'Devolvido'),
        ('cancelado', 'Cancelado'),
    ]
    
    id_item = models.AutoField(primary_key=True)
    id_aluguel = models.ForeignKey(Aluguel, on_delete=models.CASCADE, db_column='id_aluguel', related_name='itens')
    id_equipamento = models.ForeignKey(Equipamento, on_delete=models.PROTECT, db_column='id_equipamento')
    
    # Datas específicas do item
    data_devolucao_prevista = models.DateField(help_text='Data prevista para devolução deste item')
    data_devolucao_real = models.DateField(blank=True, null=True, help_text='Data real da devolução')
    quantidade_dias = models.IntegerField(help_text='Quantidade de dias')
    
    # Valores específicos do item
    valor_diaria = models.DecimalField(max_digits=10, decimal_places=2, help_text='Valor da diária')
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, help_text='Valor total do item')
    valor_multa = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='Multa por atraso')
    
    # Status do item
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ativo')
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        managed = True
        db_table = 'alugueis_itens'
        ordering = ['id_aluguel', 'id_item']
        indexes = [
            models.Index(fields=['id_aluguel']),
            models.Index(fields=['id_equipamento', 'status']),
            models.Index(fields=['data_devolucao_prevista']),
        ]
    
    def __str__(self):
        return f"Item {self.id_item} - {self.id_equipamento.nome}"
    
    def calcular_valor_total(self):
        """Calcula valor total do item"""
        self.valor_total = self.valor_diaria * self.quantidade_dias
        return self.valor_total
    
    @property
    def dias_atraso(self):
        """Retorna dias de atraso se houver"""
        from datetime import date
        if self.status == 'ativo':
            hoje = date.today()
            if hoje > self.data_devolucao_prevista:
                return (hoje - self.data_devolucao_prevista).days
        return 0
    
    def save(self, *args, **kwargs):
        """Override save para calcular valores"""
        if not self.valor_total:
            self.calcular_valor_total()
        super().save(*args, **kwargs)


class Veiculo(models.Model):
    id_veiculo = models.AutoField(primary_key=True)
    id_cliente = models.ForeignKey('Cliente', models.DO_NOTHING, db_column='id_cliente', blank=True, null=True)
    placa = models.CharField(unique=True, max_length=10)
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    ano = models.IntegerField(blank=True, null=True)
    cor = models.CharField(max_length=50, blank=True, null=True)
    chassi = models.CharField(max_length=50, blank=True, null=True)
    uf = models.CharField(max_length=2, blank=True, null=True)
    rntrc = models.CharField(max_length=20, blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'veiculos'

# ==========================================
# MÓDULO AGRO / BARTER
# ==========================================

class Safra(models.Model):
    """Ex: Safra de Soja 2024/2025"""
    id_safra = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=100, help_text="Ex: Soja 24/25, Milho Safrinha 24")
    data_inicio = models.DateField()
    data_fim = models.DateField()
    ativo = models.BooleanField(default=True)
    
    class Meta:
        managed = True
        db_table = 'safras'
        ordering = ['-data_inicio']
    
    def __str__(self): 
        return self.descricao

class ConversaoUnidade(models.Model):
    """
    Tabela para conversão de unidades (Ex: Saca 60kg -> kg).
    Pode ser global ou por produto.
    """
    id_conversao = models.AutoField(primary_key=True)
    id_produto = models.ForeignKey('Produto', on_delete=models.CASCADE, null=True, blank=True, help_text="Se vazio, regra aplica a todos")
    unidade_origem = models.CharField(max_length=20, help_text="Unidade que o usuário digita (Ex: 'sc', 'ton')")
    unidade_destino = models.CharField(max_length=20, help_text="Unidade base do sistema (Ex: 'kg', 'lt')")
    fator_conversao = models.DecimalField(max_digits=12, decimal_places=4, help_text="Fator multiplicador para converter Origem -> Destino")
    operacao = models.CharField(max_length=1, default='M', choices=[('M', 'Multiplicar'), ('D', 'Dividir')])
    
    class Meta:
        managed = True
        db_table = 'conversoes_unidades'
    
    def __str__(self):
        prod = f" ({self.id_produto.nome_produto})" if self.id_produto else " (Global)"
        return f"{self.unidade_origem} -> {self.unidade_destino} * {self.fator_conversao}{prod}"

class ContratoAgricola(models.Model):
    """
    Contrato de Barter / Compra de Safra Futura.
    Vincula o produtor (Cliente) e a Safra.
    """
    id_contrato = models.AutoField(primary_key=True)
    numero_contrato = models.CharField(max_length=50, unique=True)
    id_safra = models.ForeignKey(Safra, on_delete=models.PROTECT)
    id_cliente = models.ForeignKey('Cliente', on_delete=models.PROTECT, help_text="Produtor Rural") 
    
    # Produto de troca (Ex: Soja)
    id_produto_destino = models.ForeignKey('Produto', on_delete=models.PROTECT, related_name='contratos_barter')
    
    quantidade_negociada = models.DecimalField(max_digits=15, decimal_places=3, help_text="Quantidade a entregar (na unidade do contrato)")
    unidade_medida = models.CharField(max_length=20, help_text="Unidade (Ex: 'sc', 'ton')")
    
    # Valores
    valor_unitario = models.DecimalField(max_digits=12, decimal_places=2, help_text="Preço travado por unidade")
    valor_total_contrato = models.DecimalField(max_digits=15, decimal_places=2, help_text="Valor total estimado")
    
    # Datas
    data_emissao = models.DateField()
    data_entrega = models.DateField(help_text="Previsão de entrega da colheita")
    
    # Status
    status = models.CharField(max_length=20, default='Aberto', choices=[('Aberto', 'Aberto'), ('Liquidado', 'Liquidado'), ('Cancelado', 'Cancelado')])
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        managed = True
        db_table = 'contratos_agricolas'
    
    def __str__(self):
        return f"Contrato {self.numero_contrato} - {self.id_cliente.nome_razao_social}"

# --- Modelo Controle de Caixa (PDV) ---
class ControleCaixa(models.Model):
    id_caixa = models.AutoField(primary_key=True)
    operador = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True, related_name='caixas')
    data_abertura = models.DateTimeField(auto_now_add=True)
    valor_abertura = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    data_fechamento = models.DateTimeField(null=True, blank=True)
    valor_fechamento = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, default='ABERTO') # ABERTO, FECHADO
    observacoes = models.TextField(blank=True, null=True)

    class Meta:
        managed = True
        db_table = 'controle_caixa'
        ordering = ['-data_abertura']

    def __str__(self):
        return f"Caixa #{self.id_caixa} ({self.status}) - {self.operador.username if self.operador else 'Sistema'}"


# ==========================================
# MÓDULO MAPA DE CARGA / LOGÍSTICA
# ==========================================

class MapaCarga(models.Model):
    """
    Cabeçalho do Mapa de Carga - Agrupamento de vendas para uma viagem.
    Facilita a emissão do MDF-e e controle de entregas.
    """
    STATUS_CHOICES = [
        ('EM_MONTAGEM', 'Em Montagem'),
        ('EM_ROTA', 'Em Rota'),
        ('ENTREGUE', 'Entregue'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    id_mapa = models.AutoField(primary_key=True)
    numero_mapa = models.CharField(max_length=50, unique=True, help_text="Número sequencial do mapa")
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_saida = models.DateTimeField(null=True, blank=True, help_text="Data/hora prevista de saída")
    data_retorno = models.DateTimeField(null=True, blank=True, help_text="Data/hora de retorno")
    
    # Veículo e Motorista
    id_veiculo = models.ForeignKey('Veiculo', on_delete=models.PROTECT, related_name='mapas_carga',
                                    db_column='id_veiculo', null=True, blank=True)
    id_motorista = models.ForeignKey('Vendedor', on_delete=models.PROTECT, related_name='mapas_motorista',
                                     db_column='id_motorista_id', null=True, blank=True,
                                     help_text="Vendedor que atua como motorista")
    
    # Totalizadores
    peso_total_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Peso total da carga em KG")
    valor_total_carga = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Valor total das vendas")
    quantidade_entregas = models.IntegerField(default=0, help_text="Número de entregas no mapa")
    distancia_total_km = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Distância total estimada")
    
    # Status e Controle
    status = models.CharField(max_length=20, default='EM_MONTAGEM', choices=STATUS_CHOICES)
    observacoes = models.TextField(blank=True, null=True)
    
    # MDF-e vinculado
    id_mdfe = models.ForeignKey('mdfe.ManifestoEletronico', on_delete=models.SET_NULL, null=True, blank=True,
                                db_column='id_mdfe',
                                related_name='mapas_carga', help_text="MDF-e gerado a partir deste mapa")
    
    class Meta:
        managed = True
        db_table = 'mapa_carga'
        ordering = ['-data_criacao']
        verbose_name = 'Mapa de Carga'
        verbose_name_plural = 'Mapas de Carga'
    
    def __str__(self):
        return f"Mapa {self.numero_mapa} - {self.get_status_display()}"
    
    def recalcular_totais(self):
        """Recalcula os totalizadores do mapa baseado nos itens"""
        from django.db.models import Sum, Count, DecimalField
        from django.db.models.functions import Coalesce
        
        qtd = self.itens.count()
        valor = self.itens.aggregate(
            total=Coalesce(Sum('id_venda__valor_total'), 0, output_field=DecimalField())
        )['total']
        dist = self.itens.aggregate(
            total=Coalesce(Sum('distancia_km'), 0, output_field=DecimalField())
        )['total']
        
        # Calcula peso total (soma de peso dos produtos * quantidade)
        peso_total = 0
        for item in self.itens.all():
            venda = item.id_venda
            if hasattr(venda, 'vendaitens_set'):
                for venda_item in venda.vendaitens_set.all():
                    if venda_item.id_produto and venda_item.id_produto.peso:
                        peso_total += float(venda_item.id_produto.peso) * float(venda_item.quantidade)
        
        self.peso_total_kg = peso_total
        self.valor_total_carga = valor
        self.distancia_total_km = dist
        self.quantidade_entregas = qtd
        self.save()
    
    def reordenar_entregas(self):
        """Reordena as entregas pela ordem_entrega"""
        itens = self.itens.order_by('ordem_entrega')
        for idx, item in enumerate(itens, start=1):
            if item.ordem_entrega != idx:
                item.ordem_entrega = idx
                item.save()


class MapaCargaItem(models.Model):
    """
    Itens do Mapa de Carga - Vínculo com as vendas/NF-e.
    Define a ordem de entrega e controle logístico.
    """
    id_item_mapa = models.AutoField(primary_key=True)
    id_mapa = models.ForeignKey(MapaCarga, on_delete=models.CASCADE, related_name='itens',
                                db_column='id_mapa')
    id_venda = models.ForeignKey('Venda', on_delete=models.PROTECT, related_name='mapas_carga',
                                 db_column='id_venda')
    
    # Ordem e Distância
    ordem_entrega = models.IntegerField(help_text="Ordem de entrega (1ª, 2ª, 3ª...)")
    distancia_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                       help_text="Distância até este ponto")
    
    # Controle de Entrega
    data_entrega_prevista = models.DateTimeField(null=True, blank=True)
    data_entrega_realizada = models.DateTimeField(null=True, blank=True)
    status_entrega = models.CharField(max_length=20, default='PENDENTE',
                                     choices=[('PENDENTE', 'Pendente'), ('ENTREGUE', 'Entregue'), 
                                            ('RECUSADA', 'Recusada'), ('REAGENDADA', 'Reagendada')])
    observacoes_entrega = models.TextField(blank=True, null=True)
    
    class Meta:
        managed = True
        db_table = 'mapa_carga_itens'
        ordering = ['id_mapa', 'ordem_entrega']
        unique_together = [['id_mapa', 'id_venda']]  # Uma venda não pode aparecer 2x no mesmo mapa
        verbose_name = 'Item do Mapa de Carga'
        verbose_name_plural = 'Itens do Mapa de Carga'
    
    def __str__(self):
        return f"Item {self.ordem_entrega} - Venda #{self.id_venda.numero_documento}"


# ==========================================
# MÓDULO INTEGRAÇÃO BANCÁRIA / BOLETOS
# ==========================================

class ConfiguracaoBancaria(models.Model):
    """
    Configurações de integração com bancos para emissão de boletos via API.
    Armazena credenciais OAuth2 e configurações específicas de cada banco.
    """
    BANCO_CHOICES = [
        ('BB', 'Banco do Brasil'),
        ('ITAU', 'Itaú'),
        ('BRADESCO', 'Bradesco'),
        ('SICOOB', 'Sicoob'),
        ('SANTANDER', 'Santander'),
        ('CAIXA', 'Caixa Econômica'),
        ('OUTROS', 'Outros'),
    ]
    
    id_config = models.AutoField(primary_key=True)
    banco = models.CharField(max_length=20, choices=BANCO_CHOICES)
    nome_configuracao = models.CharField(max_length=100, help_text="Nome para identificação")
    
    # Credenciais OAuth2
    client_id = models.CharField(max_length=255, help_text="Client ID fornecido pelo banco")
    client_secret = models.CharField(max_length=255, help_text="Client Secret fornecido pelo banco")
    
    # URLs da API
    url_autenticacao = models.URLField(max_length=500, help_text="URL para obter o token OAuth2")
    url_api_boletos = models.URLField(max_length=500, help_text="URL base da API de boletos")
    
    # Vínculo com Conta Bancária do Sistema
    id_conta_bancaria = models.ForeignKey('ContaBancaria', on_delete=models.PROTECT, 
                                          related_name='configuracoes_boleto',
                                          help_text="Conta bancária vinculada do sistema")
    
    # Dados da Conta Bancária
    codigo_banco = models.CharField(max_length=10, help_text="Código COMPE do banco (ex: 001, 237)")
    agencia = models.CharField(max_length=10)
    conta = models.CharField(max_length=20)
    digito_conta = models.CharField(max_length=2, blank=True, null=True)
    convenio = models.CharField(max_length=50, blank=True, null=True, help_text="Número do convênio/carteira")
    
    # Configurações Adicionais
    dias_protesto = models.IntegerField(default=0, help_text="Dias para protesto automático (0 = sem protesto)")
    dias_baixa = models.IntegerField(default=30, help_text="Dias para baixa automática após vencimento")
    percentual_multa = models.DecimalField(max_digits=5, decimal_places=2, default=2.00, 
                                           help_text="Percentual de multa por atraso")
    percentual_juros_dia = models.DecimalField(max_digits=5, decimal_places=4, default=0.0333,
                                               help_text="Percentual de juros ao dia (1% ao mês = 0.0333)")
    
    # Baixa Automática
    baixa_automatica_api = models.BooleanField(default=True, 
                                               help_text="Consultar API e dar baixa automática quando pago")
    gerar_boleto_automatico = models.BooleanField(default=True,
                                                  help_text="Gerar boleto automaticamente para condição de pagamento 'Boleto'")
    
    # Controle
    ativo = models.BooleanField(default=True)
    ambiente = models.CharField(max_length=20, default='PRODUCAO', 
                               choices=[('PRODUCAO', 'Produção'), ('HOMOLOGACAO', 'Homologação')])
    data_cadastro = models.DateTimeField(auto_now_add=True)
    
    # Tokens (armazenados após autenticação)
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    token_expira_em = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        managed = True
        db_table = 'configuracoes_bancarias'
        verbose_name = 'Configuração Bancária'
        verbose_name_plural = 'Configurações Bancárias'
    
    def __str__(self):
        return f"{self.get_banco_display()} - {self.nome_configuracao}"


class Boleto(models.Model):
    """
    Registro de boletos emitidos via API bancária.
    Vincula-se a uma conta a receber (FinanceiroConta).
    """
    STATUS_CHOICES = [
        ('REGISTRADO', 'Registrado'),
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('CANCELADO', 'Cancelado'),
        ('VENCIDO', 'Vencido'),
        ('BAIXADO', 'Baixado'),
    ]
    
    id_boleto = models.AutoField(primary_key=True)
    id_conta = models.ForeignKey('FinanceiroConta', on_delete=models.PROTECT, related_name='boletos')
    id_config_bancaria = models.ForeignKey(ConfiguracaoBancaria, on_delete=models.PROTECT, related_name='boletos')
    
    # Identificação
    nosso_numero = models.CharField(max_length=50, unique=True, help_text="Nosso número gerado pelo banco")
    numero_documento = models.CharField(max_length=50, help_text="Número do documento/título")
    codigo_barras = models.CharField(max_length=100, blank=True, null=True)
    linha_digitavel = models.CharField(max_length=100, blank=True, null=True)
    
    # Dados do Pagador
    pagador_nome = models.CharField(max_length=200)
    pagador_cpf_cnpj = models.CharField(max_length=20)
    pagador_endereco = models.CharField(max_length=255, blank=True, null=True)
    pagador_cidade = models.CharField(max_length=100, blank=True, null=True)
    pagador_uf = models.CharField(max_length=2, blank=True, null=True)
    pagador_cep = models.CharField(max_length=10, blank=True, null=True)
    pagador_codigo_ibge = models.CharField(max_length=10, blank=True, null=True, 
                                           help_text="Código IBGE da cidade (importante!)")
    
    # Valores
    valor_nominal = models.DecimalField(max_digits=15, decimal_places=2)
    valor_multa = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    valor_juros = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    valor_desconto = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    valor_pago = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Datas
    data_emissao = models.DateField()
    data_vencimento = models.DateField()
    data_pagamento = models.DateField(null=True, blank=True)
    data_registro_banco = models.DateTimeField(null=True, blank=True)
    
    # Status e Controle
    status = models.CharField(max_length=20, default='PENDENTE', choices=STATUS_CHOICES)
    url_boleto = models.URLField(max_length=500, blank=True, null=True, help_text="URL para download do PDF")
    
    # Baixa Automática
    baixado_via_api = models.BooleanField(default=False, help_text="Foi baixado automaticamente via API")
    data_baixa_api = models.DateTimeField(null=True, blank=True, help_text="Data/hora da baixa via API")
    usuario_baixa = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='boletos_baixados', help_text="Usuário que executou a baixa (ou sistema)")
    
    # QR Code PIX (se disponível)
    pix_qr_code = models.TextField(blank=True, null=True, help_text="Código QR Code PIX")
    pix_emv = models.TextField(blank=True, null=True, help_text="String EMV do PIX")
    pix_txid = models.CharField(max_length=100, blank=True, null=True, help_text="TXID da transação PIX")
    
    # Retorno do Banco
    mensagem_banco = models.TextField(blank=True, null=True, help_text="Mensagens/erros retornados pelo banco")
    dados_retorno_json = models.JSONField(null=True, blank=True, help_text="JSON completo do retorno do banco")
    
    class Meta:
        managed = True
        db_table = 'boletos'
        ordering = ['-data_emissao']
        verbose_name = 'Boleto Bancário'
        verbose_name_plural = 'Boletos Bancários'
    
    def __str__(self):
        return f"Boleto {self.nosso_numero} - {self.pagador_nome}"

class MovimentacaoCaixa(models.Model):
    TIPO_CHOICES = [
        ('SUPRIMENTO', 'Suprimento'),
        ('SANGRIA', 'Sangria'),
    ]
    id_movimentacao = models.AutoField(primary_key=True)
    caixa = models.ForeignKey(ControleCaixa, on_delete=models.CASCADE, related_name='movimentacoes', db_column='id_caixa')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data_movimentacao = models.DateTimeField(auto_now_add=True)
    observacao = models.TextField(blank=True, null=True)
    usuario = models.ForeignKey(User, on_delete=models.PROTECT, blank=True, null=True, db_column='usuario_id')

    class Meta:
        managed = False
        db_table = 'movimentacao_caixa'
        ordering = ['-data_movimentacao']

    def __str__(self):
        return f"{self.tipo} - R$ {self.valor}"




# ==================== WHATSAPP INTEGRATION ====================

class ConfiguracaoWhatsApp(models.Model):
    """Configurações globais do sistema WhatsApp"""
    delay_entre_mensagens = models.IntegerField(
        default=15, 
        help_text="Delay em segundos entre cada mensagem enviada (anti-ban)"
    )
    limite_envios_por_vez = models.IntegerField(
        default=50,
        help_text="Máximo de mensagens para processar em cada execução"
    )
    telefone_conectado = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Número do WhatsApp conectado atualmente"
    )
    status_conexao = models.CharField(
        max_length=20,
        default='DESCONECTADO',
        choices=[
            ('CONECTADO', 'Conectado'),
            ('DESCONECTADO', 'Desconectado'),
            ('ERRO', 'Erro'),
        ]
    )
    qr_code = models.TextField(blank=True, null=True, help_text="QR Code em base64")
    data_ultima_conexao = models.DateTimeField(blank=True, null=True)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = 'whatsapp_configuracao'
        verbose_name = 'Configuração WhatsApp'
        verbose_name_plural = 'Configurações WhatsApp'

    def __str__(self):
        return f"Config WhatsApp - {self.status_conexao}"


class FilaWhatsApp(models.Model):
    """Fila de mensagens a serem enviadas"""
    TIPO_ENVIO_CHOICES = [
        ('individual', 'Individual'),
        ('lote', 'Lote'),
        ('marketing', 'Marketing'),
        ('notificacao', 'Notificação'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('processando', 'Processando'),
        ('enviado', 'Enviado'),
        ('falha', 'Falha'),
        ('cancelado', 'Cancelado'),
    ]
    
    PRIORIDADE_CHOICES = [
        (1, 'Alta'),
        (2, 'Normal'),
        (3, 'Baixa'),
    ]
    
    # Campos principais
    telefone = models.CharField(max_length=20, help_text="Número com DDI (ex: 5534999999999)")
    nome_destinatario = models.CharField(max_length=200, blank=True, null=True)
    mensagem = models.TextField(help_text="Texto da mensagem. Use [NOME] para personalização")
    tipo_envio = models.CharField(max_length=20, choices=TIPO_ENVIO_CHOICES, default='individual')
    prioridade = models.IntegerField(choices=PRIORIDADE_CHOICES, default=2)
    
    # Status e controle
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    tentativas = models.IntegerField(default=0)
    erro_mensagem = models.TextField(blank=True, null=True)
    
    # Datas
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_envio = models.DateTimeField(blank=True, null=True)
    
    # Relacionamentos opcionais
    cliente = models.ForeignKey(
        'Cliente', 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='mensagens_whatsapp'
    )
    criado_por = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='mensagens_criadas'
    )
    
    # Agendamento
    agendar_para = models.DateTimeField(
        blank=True, 
        null=True,
        help_text="Se preenchido, mensagem só será enviada nesta data/hora"
    )

    class Meta:
        db_table = 'whatsapp_fila'
        ordering = ['prioridade', 'data_criacao']
        verbose_name = 'Mensagem na Fila'
        verbose_name_plural = 'Fila de Mensagens WhatsApp'
        indexes = [
            models.Index(fields=['status', 'prioridade']),
            models.Index(fields=['data_criacao']),
        ]

    def __str__(self):
        return f"{self.telefone} - {self.get_status_display()}"


class LogWhatsApp(models.Model):
    """Log de todas as ações do sistema WhatsApp"""
    TIPO_LOG_CHOICES = [
        ('CONEXAO', 'Conexão'),
        ('ENVIO', 'Envio de Mensagem'),
        ('ERRO', 'Erro'),
        ('SISTEMA', 'Sistema'),
    ]
    
    tipo = models.CharField(max_length=20, choices=TIPO_LOG_CHOICES)
    mensagem = models.TextField()
    detalhes = models.JSONField(blank=True, null=True)
    fila_mensagem = models.ForeignKey(
        FilaWhatsApp, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='logs'
    )
    usuario = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True
    )
    data_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'whatsapp_logs'
        ordering = ['-data_hora']
        verbose_name = 'Log WhatsApp'
        verbose_name_plural = 'Logs WhatsApp'

    def __str__(self):
        return f"[{self.get_tipo_display()}] {self.mensagem[:50]}"


class OperacaoNumeracao(models.Model):
    AMBIENTE_CHOICES = [
        (1, 'Produção'),
        (2, 'Homologação'),
    ]

    id_numeracao = models.AutoField(primary_key=True)
    id_operacao = models.ForeignKey(
        'Operacao',
        on_delete=models.CASCADE,
        related_name='numeracoes',
        db_column='id_operacao'
    )
    serie = models.CharField(max_length=10, default='001')
    ambiente = models.IntegerField(choices=AMBIENTE_CHOICES, default=1)
    numero_inicial = models.IntegerField(default=1)
    numero_atual = models.IntegerField(default=1)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'operacao_numeracoes'
        verbose_name = 'Numeração de Operação'
        verbose_name_plural = 'Numerações de Operações'
        ordering = ['id_operacao', 'serie', 'ambiente']

    def __str__(self):
        return f"{self.id_operacao.nome_operacao} - Série {self.serie} - Nº {self.numero_atual}"


class UserAtalho(models.Model):
    id_atalho = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='atalhos',
        db_column='id_user'
    )
    tecla = models.CharField(max_length=5, help_text='Tecla de atalho (ex: F1, F2)')
    caminho = models.CharField(max_length=255, help_text='Rota do sistema (ex: /vendas)')
    descricao = models.CharField(max_length=100, blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_atalhos'
        managed = True
        verbose_name = 'Atalho de Usuário'
        verbose_name_plural = 'Atalhos de Usuários'
        unique_together = [('user', 'tecla')]

    def __str__(self):
        return f"{self.user.username} - {self.tecla}: {self.caminho}"


class UserPreferencia(models.Model):
    """Armazena preferências de interface por usuário (chave → valor)."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='preferencias',
        db_column='id_user'
    )
    chave = models.CharField(max_length=100, help_text='Nome da preferência')
    valor = models.TextField(blank=True, null=True, help_text='Valor da preferência')
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_preferencias'
        managed = True
        unique_together = [('user', 'chave')]

    def __str__(self):
        return f"{self.user.username} - {self.chave}"


class Numeracao(models.Model):
    id_numeracao = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=20)
    numeracao = models.CharField(max_length=8)

    class Meta:
        db_table = 'numeracao'
        managed = True
        verbose_name = 'Numeração'
        verbose_name_plural = 'Numerações'

    def __str__(self):
        return f"{self.descricao} - {self.numeracao}"


# ===================================
# REFORMA TRIBUTÁRIA 2026: IBS/CBS + SPLIT PAYMENT
# ===================================

class RegraFiscalReforma(models.Model):
    """
    Regras fiscais da Reforma Tributária 2026
    Substitui ICMS/PIS/COFINS por IBS (estadual/municipal) + CBS (federal)
    """
    id_regra = models.AutoField(primary_key=True)
    produto = models.ForeignKey(
        'Produto', 
        on_delete=models.CASCADE, 
        related_name='regras_reforma',
        help_text="Produto vinculado à regra fiscal"
    )
    ncm = models.CharField(
        max_length=8, 
        help_text="NCM do produto (8 dígitos)"
    )
    
    # Alíquotas IBS/CBS 2026
    aliquota_ibs_uf = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="Alíquota IBS Estadual (ex: 18.00)"
    )
    aliquota_ibs_mun = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="Alíquota IBS Municipal (ex: 1.00)"
    )
    aliquota_cbs = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="Alíquota CBS Federal (ex: 12.00)"
    )
    
    # Configuração de Split Payment
    is_split_active = models.BooleanField(
        default=True,
        help_text="Se True, o imposto será retido via Split Payment"
    )
    agente_retentor = models.CharField(
        max_length=20,
        choices=[
            ('BANCO', 'Banco/Adquirente'),
            ('EMPRESA', 'Empresa via API'),
            ('SEFAZ', 'SEFAZ Direta')
        ],
        default='BANCO',
        help_text="Quem fará a retenção do imposto"
    )
    
    # Reduções e Benefícios Fiscais
    aliquota_reduzida = models.BooleanField(
        default=False,
        help_text="Produto tem alíquota reduzida por lei?"
    )
    percentual_reducao = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="Percentual de redução da base de cálculo (ex: 40.00)"
    )
    descricao_beneficio = models.TextField(
        blank=True, 
        null=True,
        help_text="Descrição do benefício fiscal (Lei nº, Convênio, etc.)"
    )
    
    # Vigência da Regra
    vigencia_inicio = models.DateField(
        help_text="Data de início da vigência da alíquota"
    )
    vigencia_fim = models.DateField(
        blank=True, 
        null=True,
        help_text="Data fim da vigência (null = vigente indefinidamente)"
    )
    
    # UF de Aplicação (opcional - para alíquotas específicas por estado)
    uf_aplicacao = models.CharField(
        max_length=2,
        blank=True,
        null=True,
        help_text="UF específica (null = aplica para todas)"
    )
    
    # Controle
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    usuario_cadastro = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='regras_reforma_criadas'
    )
    
    class Meta:
        db_table = 'regras_fiscais_reforma_2026'
        managed = True
        verbose_name = 'Regra Fiscal Reforma 2026'
        verbose_name_plural = 'Regras Fiscais Reforma 2026'
        ordering = ['-vigencia_inicio', 'ncm']
        indexes = [
            models.Index(fields=['ncm', 'vigencia_inicio']),
            models.Index(fields=['produto', 'uf_aplicacao']),
        ]
    
    def __str__(self):
        return f"NCM {self.ncm} - IBS: {self.aliquota_ibs_total}% + CBS: {self.aliquota_cbs}%"
    
    @property
    def aliquota_ibs_total(self):
        """Retorna IBS total (UF + Município)"""
        return self.aliquota_ibs_uf + self.aliquota_ibs_mun
    
    @property
    def aliquota_total(self):
        """Retorna carga tributária total (IBS + CBS)"""
        return self.aliquota_ibs_total + self.aliquota_cbs
    
    def calcular_impostos(self, valor_base):
        """
        Calcula os valores de IBS e CBS sobre o valor base
        Retorna dict com valores calculados
        """
        # Aplica redução se houver
        base_calculo = valor_base
        if self.aliquota_reduzida:
            base_calculo = valor_base * (1 - (self.percentual_reducao / 100))
        
        # Calcula impostos
        valor_ibs_uf = base_calculo * (self.aliquota_ibs_uf / 100)
        valor_ibs_mun = base_calculo * (self.aliquota_ibs_mun / 100)
        valor_cbs = base_calculo * (self.aliquota_cbs / 100)
        
        return {
            'base_calculo': base_calculo,
            'valor_ibs_uf': round(valor_ibs_uf, 2),
            'valor_ibs_mun': round(valor_ibs_mun, 2),
            'valor_cbs': round(valor_cbs, 2),
            'total_retido': round(valor_ibs_uf + valor_ibs_mun + valor_cbs, 2),
            'percentual_retencao': round(((valor_ibs_uf + valor_ibs_mun + valor_cbs) / valor_base * 100), 2)
        }


class SplitPaymentConfig(models.Model):
    """
    Configuração de Split Payment por empresa
    Define integração com adquirentes (Stone, Cielo, etc.)
    """
    id_config = models.AutoField(primary_key=True)
    empresa = models.OneToOneField(
        'EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='split_payment_config',
        help_text="Empresa vinculada à configuração"
    )
    
    # Integração com Adquirente
    adquirente = models.CharField(
        max_length=20,
        choices=[
            ('STONE', 'Stone Pagamentos'),
            ('CIELO', 'Cielo'),
            ('REDE', 'Rede'),
            ('PAGSEGURO', 'PagSeguro'),
            ('GETNET', 'Getnet'),
            ('MERCADOPAGO', 'Mercado Pago'),
            ('OUTRO', 'Outro')
        ],
        help_text="Adquirente/gateway de pagamento"
    )
    api_url = models.URLField(
        max_length=500,
        help_text="URL base da API do adquirente"
    )
    api_key = models.CharField(
        max_length=255,
        help_text="Chave de API (criptografada)"
    )
    api_secret = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Secret da API (criptografado)"
    )
    
    # Configuração de Split
    split_automatico = models.BooleanField(
        default=True,
        help_text="Processar split automaticamente no pagamento?"
    )
    percentual_alerta = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=30.00,
        help_text="Acima deste percentual, exige aprovação do supervisor"
    )
    
    # Contas de Destino (dados do adquirente)
    conta_ibs_uf = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="ID da conta/wallet para IBS Estadual"
    )
    conta_ibs_mun = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="ID da conta/wallet para IBS Municipal"
    )
    conta_cbs = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="ID da conta/wallet para CBS Federal"
    )
    
    # Ambiente
    ambiente = models.CharField(
        max_length=10,
        choices=[
            ('SANDBOX', 'Sandbox/Homologação'),
            ('PRODUCAO', 'Produção')
        ],
        default='SANDBOX'
    )
    
    # Controle
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'split_payment_config'
        managed = True
        verbose_name = 'Configuração Split Payment'
        verbose_name_plural = 'Configurações Split Payment'
    
    def __str__(self):
        return f"{self.empresa.razao_social} - {self.adquirente} ({self.ambiente})"


class VendaSplitPayment(models.Model):
    """
    Registro de Split Payment por venda
    Armazena valores calculados e status da retenção fiscal
    """
    id_split = models.AutoField(primary_key=True)
    venda = models.OneToOneField(
        'Venda',
        on_delete=models.CASCADE,
        related_name='split_payment',
        help_text="Venda vinculada ao split"
    )
    
    # Valores Calculados
    valor_liquido_empresa = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Valor que efetivamente entra na conta da empresa"
    )
    valor_ibs_uf = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        help_text="Valor retido para IBS Estadual"
    )
    valor_ibs_mun = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        help_text="Valor retido para IBS Municipal"
    )
    valor_cbs = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        help_text="Valor retido para CBS Federal"
    )
    valor_total_retido = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        help_text="Soma de todos os impostos retidos"
    )
    percentual_retencao = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Percentual de retenção sobre o valor total"
    )
    
    # Controle de Split
    split_realizado = models.BooleanField(
        default=False,
        help_text="Split foi processado com sucesso?"
    )
    split_data_hora = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Data/hora que o split foi processado"
    )
    split_transaction_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="ID da transação retornado pelo adquirente"
    )
    split_response = models.JSONField(
        blank=True,
        null=True,
        help_text="Response completo da API do adquirente (para debug)"
    )
    
    # Exceções e Aprovações
    requer_aprovacao_supervisor = models.BooleanField(
        default=False,
        help_text="Retenção excede limite e precisa de aprovação?"
    )
    aprovacao = models.ForeignKey(
        'SolicitacaoAprovacao',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='splits_aprovados',
        help_text="Solicitação de aprovação via WhatsApp"
    )
    motivo_excecao = models.TextField(
        blank=True,
        null=True,
        help_text="Motivo da retenção excepcional (NCM majorado, etc.)"
    )
    
    # Detalhamento por Item (JSON)
    detalhamento_itens = models.JSONField(
        blank=True,
        null=True,
        help_text="Array com split calculado por item da venda"
    )
    
    # Controle
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendas_split_payment'
        managed = True
        verbose_name = 'Split Payment de Venda'
        verbose_name_plural = 'Splits Payment de Vendas'
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['venda', 'split_realizado']),
            models.Index(fields=['split_data_hora']),
        ]
    
    def __str__(self):
        status = "✅ Realizado" if self.split_realizado else "⏳ Pendente"
        return f"Venda #{self.venda.id_venda} - Split {status} - Retenção: R$ {self.valor_total_retido}"
    
    @property
    def valor_ibs_total(self):
        """Retorna IBS total (UF + Município)"""
        return self.valor_ibs_uf + self.valor_ibs_mun
    
    def marcar_como_realizado(self, transaction_id, response_data=None):
        """
        Marca o split como realizado com sucesso
        """
        self.split_realizado = True
        self.split_data_hora = timezone.now()
        self.split_transaction_id = transaction_id
        if response_data:
            self.split_response = response_data
        self.save()


# ===================================
# SISTEMA DE E-MAIL MARKETING E TRANSACIONAL
# ===================================

class EmailConfig(models.Model):
    """
    Configuração de provedores de e-mail por empresa
    Suporta SMTP, SendGrid, AWS SES, Mailgun
    """
    PROVIDER_CHOICES = [
        ('SMTP', 'SMTP Padrão'),
        ('SENDGRID', 'SendGrid'),
        ('SES', 'Amazon SES'),
        ('MAILGUN', 'Mailgun'),
        ('GMAIL', 'Gmail API'),
        ('OUTLOOK', 'Microsoft Outlook')
    ]
    
    id_config = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        'EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='email_configs',
        help_text="Empresa vinculada"
    )
    
    # Provedor
    provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default='SMTP',
        help_text="Provedor de e-mail"
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Configuração padrão da empresa?"
    )
    ativo = models.BooleanField(default=True)
    
    # Configurações SMTP
    smtp_host = models.CharField(max_length=255, blank=True, null=True)
    smtp_port = models.IntegerField(blank=True, null=True)
    smtp_username = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    smtp_use_tls = models.BooleanField(default=True)
    smtp_use_ssl = models.BooleanField(default=False)
    
    # API Keys (SendGrid, SES, Mailgun)
    api_key = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="API Key do provedor"
    )
    api_secret = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="API Secret (AWS SES)"
    )
    api_region = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Região (AWS SES: us-east-1, etc.)"
    )
    api_domain = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Domínio (Mailgun)"
    )
    
    # Remetente Padrão
    from_email = models.EmailField(help_text="E-mail remetente padrão")
    from_name = models.CharField(
        max_length=255,
        help_text="Nome do remetente"
    )
    reply_to_email = models.EmailField(
        blank=True,
        null=True,
        help_text="E-mail para resposta"
    )
    
    # Limites e Controle
    daily_limit = models.IntegerField(
        default=1000,
        help_text="Limite diário de envios"
    )
    daily_sent_count = models.IntegerField(
        default=0,
        help_text="Enviados hoje"
    )
    last_reset_date = models.DateField(
        auto_now_add=True,
        help_text="Última vez que resetou o contador"
    )
    
    # Controle
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'email_config'
        managed = True
        verbose_name = 'Configuração de E-mail'
        verbose_name_plural = 'Configurações de E-mail'
        unique_together = [('empresa', 'provider', 'from_email')]
    
    def __str__(self):
        return f"{self.empresa.razao_social} - {self.provider} ({self.from_email})"
    
    def reset_daily_limit_if_needed(self):
        """Reseta contador diário se mudou de dia"""
        from datetime import date
        if self.last_reset_date < date.today():
            self.daily_sent_count = 0
            self.last_reset_date = date.today()
            self.save()
    
    def can_send(self):
        """Verifica se ainda pode enviar e-mails hoje"""
        self.reset_daily_limit_if_needed()
        return self.ativo and self.daily_sent_count < self.daily_limit
    
    def increment_sent_count(self):
        """Incrementa contador de enviados"""
        self.daily_sent_count += 1
        self.save()


class EmailTemplate(models.Model):
    """
    Templates de e-mail HTML com variáveis dinâmicas
    """
    CATEGORY_CHOICES = [
        ('TRANSACIONAL', 'Transacional'),
        ('MARKETING', 'Marketing'),
        ('NOTIFICACAO', 'Notificação'),
        ('BOLETIM', 'Boletim/Newsletter'),
    ]
    
    id_template = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        'EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='email_templates'
    )
    
    # Identificação
    nome = models.CharField(
        max_length=255,
        help_text="Nome interno do template"
    )
    slug = models.SlugField(
        max_length=255,
        help_text="Identificador único (ex: nfe-enviada, boleto-vencendo)"
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='TRANSACIONAL'
    )
    descricao = models.TextField(
        blank=True,
        null=True,
        help_text="Descrição do propósito do template"
    )
    
    # Conteúdo
    assunto = models.CharField(
        max_length=255,
        help_text="Assunto do e-mail (pode ter variáveis: {{cliente_nome}})"
    )
    html_body = models.TextField(
        help_text="HTML do e-mail (variáveis: {{variavel}})"
    )
    text_body = models.TextField(
        blank=True,
        null=True,
        help_text="Versão texto puro (fallback)"
    )
    
    # Variáveis Disponíveis (JSON)
    variaveis_disponiveis = models.JSONField(
        blank=True,
        null=True,
        help_text="Lista de variáveis que este template aceita"
    )
    
    # Preview
    preview_text = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Texto de preview (aparece antes de abrir o e-mail)"
    )
    
    # Design
    design_json = models.JSONField(
        blank=True,
        null=True,
        help_text="JSON do design (se usar editor drag-and-drop como Unlayer)"
    )
    
    # Controle
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    usuario_criador = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_templates_criados'
    )
    
    class Meta:
        db_table = 'email_templates'
        managed = True
        verbose_name = 'Template de E-mail'
        verbose_name_plural = 'Templates de E-mail'
        unique_together = [('empresa', 'slug')]
        ordering = ['-criado_em']
    
    def __str__(self):
        return f"{self.nome} ({self.categoria})"
    
    def render(self, context):
        """
        Renderiza o template com as variáveis do contexto
        Retorna dict com 'subject' e 'html_body' renderizados
        """
        from django.template import Template, Context
        
        # Renderiza assunto
        subject_template = Template(self.assunto)
        rendered_subject = subject_template.render(Context(context))
        
        # Renderiza corpo HTML
        html_template = Template(self.html_body)
        rendered_html = html_template.render(Context(context))
        
        # Renderiza corpo texto (se existir)
        rendered_text = None
        if self.text_body:
            text_template = Template(self.text_body)
            rendered_text = text_template.render(Context(context))
        
        return {
            'subject': rendered_subject,
            'html_body': rendered_html,
            'text_body': rendered_text
        }


class EmailCampaign(models.Model):
    """
    Campanhas de e-mail marketing
    """
    STATUS_CHOICES = [
        ('RASCUNHO', 'Rascunho'),
        ('AGENDADA', 'Agendada'),
        ('ENVIANDO', 'Enviando'),
        ('ENVIADA', 'Enviada'),
        ('PAUSADA', 'Pausada'),
        ('CANCELADA', 'Cancelada')
    ]
    
    id_campanha = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        'EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='email_campaigns'
    )
    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.PROTECT,
        related_name='campanhas'
    )
    
    # Identificação
    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)
    
    # Destinatários
    destinatarios_query = models.TextField(
        help_text="Query SQL ou filtro JSON para selecionar destinatários",
        blank=True,
        null=True
    )
    lista_emails = models.TextField(
        help_text="Lista manual de e-mails (um por linha)",
        blank=True,
        null=True
    )
    segmento = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Segmento: clientes-vip, inativos-30dias, etc."
    )
    
    # Agendamento
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='RASCUNHO'
    )
    data_agendamento = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Quando enviar (null = envio imediato)"
    )
    data_inicio_envio = models.DateTimeField(blank=True, null=True)
    data_fim_envio = models.DateTimeField(blank=True, null=True)
    
    # Estatísticas
    total_destinatarios = models.IntegerField(default=0)
    total_enviados = models.IntegerField(default=0)
    total_abertos = models.IntegerField(default=0)
    total_cliques = models.IntegerField(default=0)
    total_bounces = models.IntegerField(default=0)
    total_cancelados = models.IntegerField(default=0)
    
    # Teste A/B
    is_ab_test = models.BooleanField(default=False)
    ab_test_percentage = models.IntegerField(
        default=50,
        help_text="Porcentagem para versão A (resto vai para B)"
    )
    
    # Controle
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    usuario_criador = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_campaigns_criadas'
    )
    
    class Meta:
        db_table = 'email_campaigns'
        managed = True
        verbose_name = 'Campanha de E-mail'
        verbose_name_plural = 'Campanhas de E-mail'
        ordering = ['-criado_em']
    
    def __str__(self):
        return f"{self.nome} - {self.status}"
    
    @property
    def taxa_abertura(self):
        """Retorna taxa de abertura em %"""
        if self.total_enviados == 0:
            return 0
        return (self.total_abertos / self.total_enviados) * 100
    
    @property
    def taxa_cliques(self):
        """Retorna taxa de cliques em %"""
        if self.total_enviados == 0:
            return 0
        return (self.total_cliques / self.total_enviados) * 100


class EmailLog(models.Model):
    """
    Log de todos os e-mails enviados (transacionais e campanhas)
    """
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('ENVIANDO', 'Enviando'),
        ('ENVIADO', 'Enviado'),
        ('ABERTO', 'Aberto'),
        ('CLICADO', 'Clicado'),
        ('BOUNCE', 'Bounce'),
        ('SPAM', 'Marcado como Spam'),
        ('CANCELADO', 'Cancelado'),
        ('ERRO', 'Erro')
    ]
    
    id_log = models.AutoField(primary_key=True)
    empresa = models.ForeignKey(
        'EmpresaConfig',
        on_delete=models.CASCADE,
        related_name='email_logs'
    )
    config = models.ForeignKey(
        EmailConfig,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs'
    )
    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs'
    )
    campanha = models.ForeignKey(
        EmailCampaign,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs'
    )
    
    # Destinatário
    destinatario_email = models.EmailField()
    destinatario_nome = models.CharField(max_length=255, blank=True, null=True)
    cliente = models.ForeignKey(
        'Cliente',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='emails_recebidos'
    )
    
    # Conteúdo
    assunto = models.CharField(max_length=500)
    html_body = models.TextField()
    text_body = models.TextField(blank=True, null=True)
    
    # Anexos
    anexos = models.JSONField(
        blank=True,
        null=True,
        help_text="Lista de anexos: [{nome, url, tamanho}]"
    )
    
    # Status e Controle
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDENTE'
    )
    provider_message_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="ID retornado pelo provedor (SendGrid, SES, etc.)"
    )
    erro_mensagem = models.TextField(blank=True, null=True)
    
    # Rastreamento
    tentativas_envio = models.IntegerField(default=0)
    data_envio = models.DateTimeField(blank=True, null=True)
    data_abertura = models.DateTimeField(blank=True, null=True)
    total_aberturas = models.IntegerField(default=0)
    data_primeiro_clique = models.DateTimeField(blank=True, null=True)
    total_cliques = models.IntegerField(default=0)
    
    # Dados adicionais
    user_agent = models.CharField(max_length=500, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    # Controle
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'email_logs'
        managed = True
        verbose_name = 'Log de E-mail'
        verbose_name_plural = 'Logs de E-mail'
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['destinatario_email', 'status']),
            models.Index(fields=['campanha', 'status']),
            models.Index(fields=['provider_message_id']),
        ]
    
    def __str__(self):
        return f"{self.destinatario_email} - {self.assunto[:50]} ({self.status})"
    
    def marcar_como_enviado(self, provider_message_id):
        """Marca e-mail como enviado com sucesso"""
        self.status = 'ENVIADO'
        self.provider_message_id = provider_message_id
        self.data_envio = timezone.now()
        self.save()
    
    def marcar_como_aberto(self):
        """Marca e-mail como aberto"""
        if self.status == 'ENVIADO':
            self.status = 'ABERTO'
            self.data_abertura = timezone.now()
        self.total_aberturas += 1
        self.save()
        
        # Atualiza estatísticas da campanha
        if self.campanha:
            self.campanha.total_abertos += 1
            self.campanha.save()
    
    def marcar_como_clicado(self):
        """Marca e-mail com cliques"""
        if not self.data_primeiro_clique:
            self.data_primeiro_clique = timezone.now()
            self.status = 'CLICADO'
        self.total_cliques += 1
        self.save()
        
        # Atualiza estatísticas da campanha
        if self.campanha:
            self.campanha.total_cliques += 1
            self.campanha.save()


class ConfiguracaoImpressao(models.Model):
    """
    Configurações de impressão por módulo do sistema.
    Determina se o módulo imprime em impressora térmica (cupom) ou A4 (folha).
    """
    MODULO_CHOICES = [
        ('venda', 'Venda'),
        ('venda_rapida', 'Venda Rápida (PDV)'),
        ('ordem_servico', 'Ordem de Serviço'),
    ]
    TIPO_IMPRESSORA_CHOICES = [
        ('termica', 'Térmica (Cupom)'),
        ('a4', 'A4 (Folha)'),
        ('a4_fotos', 'A4 com Fotos e Assinatura'),
    ]
    LARGURA_TERMICA_CHOICES = [
        ('58mm', '58mm'),
        ('72mm', '72mm'),
        ('80mm', '80mm'),
    ]

    modulo = models.CharField(
        max_length=20,
        choices=MODULO_CHOICES,
        unique=True,
        help_text='Módulo do sistema ao qual esta configuração se aplica',
    )
    tipo_impressora = models.CharField(
        max_length=10,
        choices=TIPO_IMPRESSORA_CHOICES,
        default='termica',
        help_text='Tipo de impressora a utilizar',
    )
    largura_termica = models.CharField(
        max_length=5,
        choices=LARGURA_TERMICA_CHOICES,
        default='80mm',
        help_text='Largura do papel térmico (usado somente quando tipo=térmica)',
    )
    imprimir_automatico = models.BooleanField(
        default=False,
        help_text='Abre o diálogo de impressão automaticamente ao finalizar',
    )
    mostrar_logo = models.BooleanField(
        default=True,
        help_text='Exibe o logotipo da empresa no cabeçalho',
    )
    copias = models.PositiveSmallIntegerField(
        default=1,
        help_text='Número de vias a imprimir',
    )
    observacao_rodape = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text='Texto livre exibido no rodapé da impressão',
    )
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'configuracoes_impressao'
        verbose_name = 'Configuração de Impressão'
        verbose_name_plural = 'Configurações de Impressão'

    def __str__(self):
        return f'{self.get_modulo_display()} — {self.get_tipo_impressora_display()}'


from .models_marketplace import *
from .models_crm import *
from .models_rh import *
from .models_pix import *
from .models_recorrencia import *


# ─── Manifestação do Destinatário NF-e ────────────────────────────────────────

class ManifestacaoNFe(models.Model):
    TIPO_EVENTO_CHOICES = [
        ('210200', 'Confirmação da Operação'),
        ('210210', 'Ciência da Operação'),
        ('210220', 'Operação não Realizada'),
        ('210240', 'Desconhecimento da Operação'),
    ]
    STATUS_CHOICES = [
        ('PENDENTE', 'Pendente'),
        ('ENVIADO', 'Enviado'),
        ('REGISTRADO', 'Registrado'),
        ('REJEITADO', 'Rejeitado'),
        ('ERRO', 'Erro'),
    ]

    id_manifestacao = models.AutoField(primary_key=True)
    chave_nfe = models.CharField(max_length=44, help_text='Chave de acesso da NFe (44 dígitos)')
    numero_nfe = models.IntegerField(blank=True, null=True)
    serie = models.IntegerField(blank=True, null=True)
    emitente_nome = models.CharField(max_length=255, blank=True, null=True)
    emitente_cnpj = models.CharField(max_length=14, blank=True, null=True)
    valor_nfe = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    data_emissao = models.DateField(blank=True, null=True)
    tipo_evento = models.CharField(
        max_length=6, choices=TIPO_EVENTO_CHOICES,
        help_text='Código do tipo de evento (210200, 210210, 210220, 210240)',
    )
    n_seq_evento = models.IntegerField(default=1, help_text='Número sequencial do evento')
    justificativa = models.TextField(
        blank=True, null=True,
        help_text='Justificativa (obrigatória para Operação não Realizada ou Desconhecimento)',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    c_stat = models.CharField(max_length=3, blank=True, null=True, help_text='Código de status do retorno SEFAZ')
    x_motivo = models.TextField(blank=True, null=True, help_text='Descrição do motivo retornado pela SEFAZ')
    protocolo = models.CharField(max_length=50, blank=True, null=True, help_text='Número do protocolo de autorização')
    dh_reg_evento = models.DateTimeField(blank=True, null=True, help_text='Data/hora de registro do evento na SEFAZ')
    xml_evento = models.TextField(blank=True, null=True, help_text='XML completo do evento de manifestação')
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    usuario = models.ForeignKey(
        User,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        help_text='Usuário que criou a manifestação',
    )

    class Meta:
        db_table = 'manifestacao_nfe'
        managed = True
        ordering = ['-criado_em']
        indexes = [
            models.Index(fields=['chave_nfe'], name='manifestaca_chave_n_542ad5_idx'),
            models.Index(fields=['status'], name='manifestaca_status_f83233_idx'),
            models.Index(fields=['tipo_evento'], name='manifestaca_tipo_ev_30694d_idx'),
        ]

    def __str__(self):
        return f'Manifestação {self.tipo_evento} - NF-e {self.chave_nfe[:10]}...'


# ===================================
# TABELA DE REGRAS FISCAIS (ICMS / ST / PIS / COFINS / IPI / Reforma)
# Configurável por NCM, UF e tipo de operação — independente do cadastro de produto
# ===================================

class RegraFiscal(models.Model):
    TIPO_OPERACAO_CHOICES = [
        ('INTERNA', 'Interna (dentro do estado)'),
        ('INTERESTADUAL', 'Interestadual'),
        ('EXPORTACAO', 'Exportação'),
        ('TODOS', 'Todos os tipos'),
    ]

    REGIME_CHOICES = [
        ('SIMPLES', 'Simples Nacional'),
        ('MEI', 'MEI'),
        ('LUCRO_PRESUMIDO', 'Lucro Presumido'),
        ('LUCRO_REAL', 'Lucro Real'),
        ('TODOS', 'Todos os regimes'),
    ]

    TIPO_CLIENTE_CHOICES = [
        ('TODOS', 'Todos os clientes'),
        ('CONSUMIDOR_FINAL', 'Consumidor Final (não contribuinte)'),
        ('REVENDEDOR', 'Revendedor / Contribuinte ICMS'),
    ]

    TIPO_PRODUTO_REFORM_CHOICES = [
        ('PADRAO', 'Padrão (alíquota cheia)'),
        ('REDUZIDA_50', 'Redução 50%'),
        ('REDUZIDA_60', 'Redução 60%'),
        ('ISENTO', 'Isento'),
        ('MONOFASICO', 'Monofásico'),
    ]

    UF_CHOICES = [
        ('AC', 'Acre'), ('AL', 'Alagoas'), ('AP', 'Amapá'), ('AM', 'Amazonas'),
        ('BA', 'Bahia'), ('CE', 'Ceará'), ('DF', 'Distrito Federal'),
        ('ES', 'Espírito Santo'), ('GO', 'Goiás'), ('MA', 'Maranhão'),
        ('MT', 'Mato Grosso'), ('MS', 'Mato Grosso do Sul'), ('MG', 'Minas Gerais'),
        ('PA', 'Pará'), ('PB', 'Paraíba'), ('PR', 'Paraná'), ('PE', 'Pernambuco'),
        ('PI', 'Piauí'), ('RJ', 'Rio de Janeiro'), ('RN', 'Rio Grande do Norte'),
        ('RS', 'Rio Grande do Sul'), ('RO', 'Rondônia'), ('RR', 'Roraima'),
        ('SC', 'Santa Catarina'), ('SP', 'São Paulo'), ('SE', 'Sergipe'),
        ('TO', 'Tocantins'),
    ]

    # Empresa (null = regra global para todos)
    empresa = models.ForeignKey(
        'EmpresaConfig',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='regras_fiscais',
        help_text="Empresa à qual a regra pertence. Vazio = regra global."
    )

    # Classificação fiscal
    regime_tributario = models.CharField(
        max_length=20, choices=REGIME_CHOICES, default='TODOS',
        help_text="Regime tributário ao qual a regra se aplica"
    )
    ncm_codigo = models.CharField(
        max_length=8,
        help_text="NCM do produto (8 dígitos, sem pontos)"
    )
    cest_codigo = models.CharField(
        max_length=7, blank=True, null=True,
        help_text="Código CEST (7 dígitos) — obrigatório para ICMS-ST"
    )
    tipo_operacao = models.CharField(
        max_length=20, choices=TIPO_OPERACAO_CHOICES, default='TODOS'
    )
    uf_destino = models.CharField(
        max_length=2, choices=UF_CHOICES, blank=True, null=True,
        help_text="UF de destino (vazio = todas)"
    )
    uf_origem = models.CharField(
        max_length=2, choices=UF_CHOICES, blank=True, null=True,
        help_text="UF de origem/emitente (vazio = qualquer)"
    )
    tipo_cliente = models.CharField(
        max_length=20, choices=TIPO_CLIENTE_CHOICES, default='TODOS',
        help_text="Tipo de cliente ao qual a regra se aplica"
    )

    # CFOP / Benefício
    cfop = models.CharField(max_length=5, blank=True, null=True, help_text="CFOP (ex: 5102)")
    c_benef = models.CharField(max_length=10, blank=True, null=True, help_text="Código do Benefício Fiscal (cBenef)")
    c_class_trib = models.CharField(max_length=10, blank=True, null=True, help_text="Classificação Tributária cClassTrib (IBS/CBS)")

    # ICMS
    icms_cst_csosn = models.CharField(max_length=3, blank=True, null=True, help_text="CST (regime normal) ou CSOSN (Simples Nacional)")
    icms_modalidade_bc = models.CharField(
        max_length=1, blank=True, null=True,
        help_text="Modalidade BC ICMS: 0=Margem Valor Agregado, 1=Pauta, 2=Preço Tabelado, 3=Valor Operação"
    )
    icms_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota ICMS (%)")
    icms_reducao_bc_perc = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Redução da BC ICMS (%)")
    icms_desonerado = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, help_text="Valor do ICMS desonerado (vICMSDeson) em R$")

    # ICMS-ST
    icmsst_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota ICMS-ST (%)")
    icmsst_mva_perc = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="MVA / IVA original (%)")
    icmsst_reducao_bc_perc = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Redução da BC ST (%)")

    # FCP (Fundo Combate à Pobreza / FEM)
    fcp_aliq = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text="Alíquota FCP/FEM (%) — calculado sobre BC ICMS"
    )

    # PIS / COFINS
    pis_cst = models.CharField(max_length=2, blank=True, null=True, help_text="CST PIS")
    pis_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota PIS (%)")
    cofins_cst = models.CharField(max_length=2, blank=True, null=True, help_text="CST COFINS")
    cofins_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota COFINS (%)")

    # IPI
    ipi_cst = models.CharField(max_length=2, blank=True, null=True, help_text="CST IPI")
    ipi_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota IPI (%)")
    ipi_classe_enquadramento = models.CharField(max_length=5, blank=True, null=True, help_text="Classe de Enquadramento IPI")

    # Reforma Tributária (IBS / CBS / IS)
    ibs_cst = models.CharField(max_length=3, blank=True, null=True, help_text="CST IBS")
    ibs_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota IBS total (%)")
    cbs_cst = models.CharField(max_length=3, blank=True, null=True, help_text="CST CBS")
    cbs_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota CBS (%)")
    is_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota Imposto Seletivo (%)")

    # Demais tributos / benefícios
    diferimento_icms_perc = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Diferimento ICMS (%)")
    funrural_aliq = models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text="Alíquota FUNRURAL (%)")
    senar_aliq = models.DecimalField(max_digits=5, decimal_places=4, default=0.0, help_text="Alíquota SENAR (%)")

    # Split Payment (Reforma Tributária)
    split_payment = models.BooleanField(default=False, help_text="Aplica Split Payment desta regra?")
    tipo_produto_reform = models.CharField(
        max_length=12, choices=TIPO_PRODUTO_REFORM_CHOICES, default='PADRAO',
        help_text="Classificação na Reforma Tributária"
    )

    # Controle
    descricao = models.CharField(max_length=255, blank=True, null=True, help_text="Descrição / observação da regra")
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'regras_fiscais'
        verbose_name = 'Regra Fiscal ICMS'
        verbose_name_plural = 'Regras Fiscais ICMS'
        unique_together = [
            ('empresa', 'ncm_codigo', 'tipo_operacao', 'uf_destino', 'uf_origem', 'tipo_cliente'),
        ]
        indexes = [
            models.Index(fields=['empresa', 'ncm_codigo', 'tipo_operacao'], name='regras_fisc_empresa_6ea746_idx'),
            models.Index(fields=['tipo_produto_reform'], name='regras_fisc_tipo_pr_981237_idx'),
        ]
        ordering = ['ncm_codigo', 'tipo_operacao', 'uf_destino']

    def __str__(self):
        uf = f" → {self.uf_destino}" if self.uf_destino else ""
        empresa = f" [{self.empresa.nome_fantasia}]" if self.empresa else " [Global]"
        return f"NCM {self.ncm_codigo}{uf} | {self.tipo_operacao}{empresa}"


# ===================================
# TRIBUTAÇÃO POR TIPO / UF  (tela "Manutenção Tributação ICMS")
# Perfil de tributação com cabeçalho geral + grid de alíquotas por estado
# ===================================

class TipoTributacao(models.Model):
    """
    Perfil de tributação ICMS (ex: "CONSUMIDOR", "REVENDEDOR", "INDUSTRIAL").
    Agrupa configuração geral (cabeçalho) + alíquotas por UF de destino.
    """

    MODALIDADE_BC_ICMS_CHOICES = [
        ('0', '0 - Margem Valor Agregado (%)'),
        ('1', '1 - Pauta (valor)'),
        ('2', '2 - Preço Tabelado Máx. Sugerido'),
        ('3', '3 - Valor da Operação'),
    ]

    MODALIDADE_BC_ST_CHOICES = [
        ('0', '0 - Preço Tabelado ou Máximo Sugerido'),
        ('1', '1 - Lista Negativa (valor)'),
        ('2', '2 - Lista Positiva (valor)'),
        ('3', '3 - Lista Neutra (valor)'),
        ('4', '4 - Margem Valor Agregado (%)'),
        ('5', '5 - Pauta (valor)'),
        ('6', '6 - Valor da Operação'),
    ]

    empresa = models.ForeignKey(
        'EmpresaConfig', on_delete=models.CASCADE, null=True, blank=True,
        related_name='tipos_tributacao',
        help_text='Empresa vinculada (vazio = perfil global)',
    )
    nome = models.CharField(
        max_length=100,
        help_text='Nome do perfil (ex: CONSUMIDOR, REVENDEDOR, INDUSTRIAL)',
    )

    # ICMS — configuração geral
    icms_cst_csosn = models.CharField(
        max_length=3, null=True, blank=True,
        help_text='CST (00-99) ou CSOSN (101, 102, 400, 500, 900…)',
    )
    icms_modalidade_bc = models.CharField(
        max_length=1, choices=MODALIDADE_BC_ICMS_CHOICES, default='3',
        help_text='Modalidade de determinação da BC do ICMS',
    )

    # CFOP
    cfop_padrao = models.CharField(
        max_length=5, null=True, blank=True,
        help_text='CFOP padrão (pode ser sobreposto por linha de UF)',
    )
    cfop_devolucao = models.CharField(
        max_length=5, null=True, blank=True,
        help_text='CFOP utilizado em devoluções (ex: 1411)',
    )

    # ICMS ST
    icmsst_modalidade_bc = models.CharField(
        max_length=1, choices=MODALIDADE_BC_ST_CHOICES, null=True, blank=True,
        help_text='Modalidade de determinação da BC do ICMS ST',
    )
    antecipacao_tributaria = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Percentual de antecipação tributária (%)',
    )

    # Opções fiscais
    considera_sintegra = models.BooleanField(
        default=False,
        help_text='Considera apuração do ICMS no SINTEGRA',
    )
    observacao_nfe = models.TextField(
        null=True, blank=True,
        help_text='Observação a ser impressa na NF-e',
    )

    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        managed = True
        db_table = 'tributacao_tipos'
        verbose_name = 'Tipo de Tributação ICMS'
        verbose_name_plural = 'Tipos de Tributação ICMS'
        unique_together = [('empresa', 'nome')]
        ordering = ['nome']

    def __str__(self):
        empresa = f' [{self.empresa.nome_fantasia}]' if self.empresa else ' [Global]'
        return f'{self.nome}{empresa}'


class TributacaoUF(models.Model):
    """
    Linha de alíquotas por UF de destino — corresponde ao grid da tela
    "Manutenção Tributação ICMS" (colunas: UF, CFOP Saída, Alíq. ICMS, ST, MVA…).
    """

    UF_CHOICES = [
        ('AC', 'AC - Acre'), ('AL', 'AL - Alagoas'), ('AM', 'AM - Amazonas'),
        ('AP', 'AP - Amapá'), ('BA', 'BA - Bahia'), ('CE', 'CE - Ceará'),
        ('DF', 'DF - Distrito Federal'), ('ES', 'ES - Espírito Santo'),
        ('EX', 'EX - Exterior'), ('GO', 'GO - Goiás'), ('MA', 'MA - Maranhão'),
        ('MG', 'MG - Minas Gerais'), ('MS', 'MS - Mato Grosso do Sul'),
        ('MT', 'MT - Mato Grosso'), ('PA', 'PA - Pará'), ('PB', 'PB - Paraíba'),
        ('PE', 'PE - Pernambuco'), ('PI', 'PI - Piauí'), ('PR', 'PR - Paraná'),
        ('RJ', 'RJ - Rio de Janeiro'), ('RN', 'RN - Rio G. Norte'),
        ('RO', 'RO - Rondônia'), ('RR', 'RR - Roraima'),
        ('RS', 'RS - Rio G. do Sul'), ('SC', 'SC - Santa Catarina'),
        ('SE', 'SE - Sergipe'), ('SP', 'SP - São Paulo'), ('TO', 'TO - Tocantins'),
    ]

    tipo_tributacao = models.ForeignKey(
        TipoTributacao, on_delete=models.CASCADE,
        related_name='aliquotas_uf',
    )
    uf_destino = models.CharField(
        max_length=2, choices=UF_CHOICES,
        help_text='UF de destino das mercadorias',
    )

    # CFOP específico desta UF (sobrepõe o cfop_padrao do cabeçalho)
    cfop_saida = models.CharField(
        max_length=5, null=True, blank=True,
        help_text='CFOP de saída para esta UF (ex: 6102)',
    )

    # ICMS
    icms_aliq = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Alíquota ICMS (%)',
    )
    reducao_bc_perc = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Redução da BC do ICMS (%)',
    )

    # ICMS ST
    icmsst_aliq = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Alíquota ICMS ST (%)',
    )
    icmsst_mva_perc = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='MVA / IVA original (%)',
    )
    reducao_bc_st_perc = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Redução da BC do ICMS ST (%)',
    )

    # Composição da BC ST (frete, seguro, outras despesas)
    frete_perc = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Percentual de frete incluído na BC ST (%)',
    )
    seguro_perc = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Percentual de seguro incluído na BC ST (%)',
    )
    outras_despesas_perc = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Outras despesas incluídas na BC ST (%)',
    )

    # FCP
    fcp_aliq = models.DecimalField(
        max_digits=7, decimal_places=4, default=0.0,
        help_text='Alíquota FCP (%)',
    )

    class Meta:
        managed = True
        db_table = 'tributacao_uf'
        verbose_name = 'Alíquota por UF'
        verbose_name_plural = 'Alíquotas por UF'
        unique_together = [('tipo_tributacao', 'uf_destino')]
        ordering = ['uf_destino']

    def __str__(self):
        return f'{self.tipo_tributacao.nome} → {self.uf_destino} | ICMS {self.icms_aliq}%'

