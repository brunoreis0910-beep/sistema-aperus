from django.db import models
from api.models import Cliente
from django.contrib.auth.models import User

class ConhecimentoTransporte(models.Model):
    id_cte = models.AutoField(primary_key=True)
    
    # Status e Info Fiscal
    chave_cte = models.CharField(max_length=44, blank=True, null=True)
    protocolo_cte = models.CharField(max_length=50, blank=True, null=True)
    numero_cte = models.IntegerField(blank=True, null=True)
    serie_cte = models.IntegerField(default=1)
    status_cte = models.CharField(max_length=20, default='PENDENTE') # PENDENTE, EMITIDO, CANCELADO, ENVIADO, ERRO
    xml_cte = models.TextField(blank=True, null=True)
    qrcode_url = models.CharField(max_length=500, blank=True, null=True)
    cstat = models.IntegerField(blank=True, null=True)
    xmotivo = models.CharField(max_length=255, blank=True, null=True)
    
    # Dados da Emissão
    data_emissao = models.DateTimeField(auto_now_add=True)
    cfop = models.CharField(max_length=4, default='5353')
    natureza_operacao = models.CharField(max_length=60, default='Transporte Rodoviário de Carga')
    modelo = models.CharField(max_length=2, default='57')
    tipo_cte = models.IntegerField(default=0) # 0-Normal, 1-Complemento, 2-Anulação, 3-Substituto
    tipo_servico = models.IntegerField(default=0) # 0-Normal, 1-Subcontratação, 2-Redespacho, 3-Redespacho Intermediário, 4-Multimodal
    modal = models.CharField(max_length=2, default='01') # 01-Rodoviário
    
    # Atores
    remetente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, related_name='cte_remetente', null=True, blank=True)
    destinatario = models.ForeignKey(Cliente, on_delete=models.SET_NULL, related_name='cte_destinatario', null=True, blank=True)
    expedidor = models.ForeignKey(Cliente, on_delete=models.SET_NULL, related_name='cte_expedidor', null=True, blank=True)
    recebedor = models.ForeignKey(Cliente, on_delete=models.SET_NULL, related_name='cte_recebedor', null=True, blank=True)
    
    tomador_servico = models.IntegerField(default=0) # 0-Remetente, 3-Destinatario, 4-Outros
    tomador_outros = models.ForeignKey(Cliente, on_delete=models.SET_NULL, related_name='cte_tomador', null=True, blank=True)
    
    # Carga
    produto_predominante = models.CharField(max_length=60, default="Diversos")
    valor_carga = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    peso_bruto = models.DecimalField(max_digits=12, decimal_places=4, default=0.0000)
    peso_liquido = models.DecimalField(max_digits=12, decimal_places=4, default=0.0000)
    volumes = models.IntegerField(default=0)
    
    # Valores do Serviço (Frete)
    valor_total_servico = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    valor_receber = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Componentes do Valor (Simplificado para Form)
    componente_frete_valor = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Frete Valor")
    componente_frete_peso = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Frete Peso")
    componente_sec_cat = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Sec/Cat")
    componente_pedagio = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Pedágio")
    componente_outros = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Outros")
    
    # Impostos (ICMS)
    cst_icms = models.CharField(max_length=3, default='00', help_text="00, 20, 40, 60, 90, SN")
    p_icms = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    v_bc_icms = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    v_icms = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Seguro
    resp_seguro = models.IntegerField(default=0, help_text="0-Remetente, 4-Emitente, 5-Tomador")
    nome_seguradora = models.CharField(max_length=60, blank=True, null=True)
    numero_apolice = models.CharField(max_length=20, blank=True, null=True)
    
    # Rodoviário
    rntrc = models.CharField(max_length=20, blank=True, null=True)
    placa_veiculo = models.CharField(max_length=8, blank=True, null=True)
    veiculo_uf = models.CharField(max_length=2, blank=True, null=True)
    veiculo_renavam = models.CharField(max_length=20, blank=True, null=True)
    
    # Condutor
    condutor_nome = models.CharField(max_length=60, blank=True, null=True)
    condutor_cpf = models.CharField(max_length=14, blank=True, null=True)

    # Local de Coleta/Origem
    cidade_origem_nome = models.CharField(max_length=60, blank=True, null=True)
    cidade_origem_uf = models.CharField(max_length=2, blank=True, null=True)
    cidade_origem_ibge = models.CharField(max_length=7, blank=True, null=True)

    # Local de Entrega/Destino
    cidade_destino_nome = models.CharField(max_length=60, blank=True, null=True)
    cidade_destino_uf = models.CharField(max_length=2, blank=True, null=True)
    cidade_destino_ibge = models.CharField(max_length=7, blank=True, null=True)

    # Info Adicional
    observacoes = models.TextField(blank=True, null=True)
    
    criado_por = models.ForeignKey(User, models.SET_NULL, blank=True, null=True)

    class Meta:
        db_table = 'cte_conhecimentos'
        ordering = ['-id_cte']
        
    def __str__(self):
        return f"CTe {self.numero_cte} - {self.status_cte}"

class CTeDocumento(models.Model):
    CTE_TIPO_DOC_CHOICES = [
        ('NFE', 'Nota Fiscal Eletrônica'),
        ('NF', 'Nota Fiscal (Papel)'),
        ('OUTROS', 'Outros'),
    ]
    cte = models.ForeignKey(ConhecimentoTransporte, on_delete=models.CASCADE, related_name='documentos')
    tipo_documento = models.CharField(max_length=10, choices=CTE_TIPO_DOC_CHOICES, default='NFE')
    chave_nfe = models.CharField(max_length=44, blank=True, null=True, help_text="Chave de Acesso da NFe (44 digitos)")
    
    def __str__(self):
        return self.chave_nfe or "Documento sem chave"

class CTeComponenteValor(models.Model):
    id_componente = models.AutoField(primary_key=True)
    cte = models.ForeignKey(ConhecimentoTransporte, on_delete=models.CASCADE, related_name='componentes_valor')
    nome = models.CharField(max_length=30) # Ex: Frete Peso, Sec/Cat
    valor = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'cte_componentes_valor'

class CTeDocumentoOriginario(models.Model):
    id_doc = models.AutoField(primary_key=True)
    cte = models.ForeignKey(ConhecimentoTransporte, on_delete=models.CASCADE, related_name='documentos_originarios')
    tipo = models.CharField(max_length=10, default='NFE') # NFE, OUTROS
    chave_nfe = models.CharField(max_length=44, blank=True, null=True)
    
    class Meta:
        db_table = 'cte_documentos_orig'
