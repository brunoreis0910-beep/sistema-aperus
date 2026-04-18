from django.contrib import admin
from .models import (
    Cliente, Fornecedor, GrupoProduto, Produto, Operacao, Departamento,
    CentroCusto, ContaBancaria, FinanceiroBancario, FinanceiroConta,
    EmpresaConfig, Funcao, Vendedor, VendedorFuncoes, UserParametros,
    UserPermissoes, SolicitacaoAprovacao, FormaPagamento, Venda, VendaItem,
    Compra, CompraItem, Deposito, Estoque, EstoqueMovimentacao, Catalogo,
    CatalogoItem, Troca, TrocaItem, EmailConfig, EmailTemplate, EmailCampaign, EmailLog,
    RegraFiscal,
    TipoTributacao,
    TributacaoUF,
)

# Configuração básica dos modelos
@admin.register(ContaBancaria)
class ContaBancariaAdmin(admin.ModelAdmin):
    list_display = ('nome_conta', 'codigo_banco', 'agencia', 'conta', 'tipo_conta')
    list_filter = ('tipo_conta', 'data_criacao')
    search_fields = ('nome_conta', 'codigo_banco', 'nome_banco')
    ordering = ['nome_conta']

@admin.register(FormaPagamento)
class FormaPagamentoAdmin(admin.ModelAdmin):
    list_display = ('nome_forma', 'id_conta_padrao', 'id_centro_custo', 'id_departamento')
    list_filter = ('nome_forma',)
    search_fields = ('nome_forma',)

@admin.register(Deposito)
class DepositoAdmin(admin.ModelAdmin):
    list_display = ('nome_deposito', 'descricao', 'estoque_baixo', 'estoque_incremento')
    list_filter = ('data_criacao',)
    search_fields = ('nome_deposito', 'descricao')

@admin.register(Estoque)
class EstoqueAdmin(admin.ModelAdmin):
    list_display = ('id_produto', 'id_deposito', 'quantidade', 'status_estoque')
    list_filter = ('id_deposito', 'data_modificacao')
    search_fields = ('id_produto__nome_produto',)

@admin.register(EstoqueMovimentacao)
class EstoqueMovimentacaoAdmin(admin.ModelAdmin):
    list_display = ('id_estoque', 'tipo_movimentacao', 'quantidade_movimentada', 'data_movimentacao')
    list_filter = ('tipo_movimentacao', 'documento_tipo', 'data_movimentacao')
    search_fields = ('documento_numero',)
    readonly_fields = ('data_movimentacao',)

@admin.register(Operacao)
class OperacaoAdmin(admin.ModelAdmin):
    list_display = ('nome_operacao', 'empresa', 'transacao', 'usa_auto_numeracao')
    list_filter = ('empresa', 'transacao')
    search_fields = ('nome_operacao',)

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('nome_departamento',)
    search_fields = ('nome_departamento',)

@admin.register(CentroCusto)
class CentroCustoAdmin(admin.ModelAdmin):
    list_display = ('nome_centro_custo',)
    search_fields = ('nome_centro_custo',)

@admin.register(Vendedor)
class VendedorAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cpf', 'telefone', 'percentual_comissao')
    list_filter = ('percentual_comissao',)
    search_fields = ('nome', 'cpf')

@admin.register(Venda)
class VendaAdmin(admin.ModelAdmin):
    list_display = ('numero_documento', 'id_cliente', 'id_vendedor1', 'valor_total', 'data_documento')
    list_filter = ('data_documento', 'vista')
    search_fields = ('numero_documento',)

@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ('numero_documento', 'id_fornecedor', 'valor_total', 'data_documento')
    list_filter = ('data_documento',)
    search_fields = ('numero_documento',)

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nome_razao_social', 'cpf_cnpj', 'email', 'telefone')
    list_filter = ('data_cadastro',)
    search_fields = ('nome_razao_social', 'cpf_cnpj', 'email')

@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ('nome_razao_social', 'cpf_cnpj', 'email', 'telefone')
    list_filter = ('data_cadastro',)
    search_fields = ('nome_razao_social', 'cpf_cnpj', 'email')

@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ('codigo_produto', 'nome_produto', 'id_grupo', 'marca')
    list_filter = ('id_grupo', 'marca')
    search_fields = ('codigo_produto', 'nome_produto')

@admin.register(GrupoProduto)
class GrupoProdutoAdmin(admin.ModelAdmin):
    list_display = ('nome_grupo', 'descricao')
    search_fields = ('nome_grupo', 'descricao')

@admin.register(FinanceiroBancario)
class FinanceiroBancarioAdmin(admin.ModelAdmin):
    list_display = ('id_conta_bancaria', 'tipo_movimento', 'valor_movimento', 'data_pagamento')
    list_filter = ('tipo_movimento', 'data_pagamento')
    search_fields = ('descricao', 'documento_numero')

@admin.register(FinanceiroConta)
class FinanceiroContaAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'tipo_conta', 'status_conta', 'data_vencimento', 'valor_parcela')
    list_filter = ('status_conta', 'data_vencimento')
    search_fields = ('descricao', 'documento_numero')

# Registrar outros modelos de forma simples
admin.site.register(Catalogo)
admin.site.register(CatalogoItem)
admin.site.register(Troca)
admin.site.register(TrocaItem)
admin.site.register(EmpresaConfig)
admin.site.register(Funcao)
admin.site.register(VendedorFuncoes)
admin.site.register(UserParametros)
admin.site.register(UserPermissoes)
admin.site.register(SolicitacaoAprovacao)

# Sistema de E-mail
@admin.register(EmailConfig)
class EmailConfigAdmin(admin.ModelAdmin):
    list_display = ('empresa', 'provider', 'from_email', 'is_default', 'ativo', 'daily_sent_count', 'daily_limit')
    list_filter = ('provider', 'is_default', 'ativo', 'empresa')
    search_fields = ('from_email', 'from_name')
    fieldsets = (
        ('Identificação', {
            'fields': ('empresa', 'provider', 'is_default', 'ativo')
        }),
        ('Configuração SMTP', {
            'fields': ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_use_tls', 'smtp_use_ssl'),
            'classes': ('collapse',)
        }),
        ('API Keys', {
            'fields': ('api_key', 'api_secret', 'api_region', 'api_domain'),
            'classes': ('collapse',)
        }),
        ('Remetente', {
            'fields': ('from_email', 'from_name', 'reply_to_email')
        }),
        ('Limites', {
            'fields': ('daily_limit', 'daily_sent_count', 'last_reset_date')
        })
    )
    readonly_fields = ('daily_sent_count', 'last_reset_date', 'criado_em', 'atualizado_em')

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('nome', 'slug', 'categoria', 'empresa', 'ativo', 'criado_em')
    list_filter = ('categoria', 'ativo', 'empresa', 'criado_em')
    search_fields = ('nome', 'slug', 'assunto')
    prepopulated_fields = {'slug': ('nome',)}
    fieldsets = (
        ('Identificação', {
            'fields': ('empresa', 'nome', 'slug', 'categoria', 'descricao', 'ativo')
        }),
        ('Conteúdo', {
            'fields': ('assunto', 'preview_text', 'html_body', 'text_body')
        }),
        ('Variáveis', {
            'fields': ('variaveis_disponiveis',),
            'classes': ('collapse',)
        }),
        ('Design', {
            'fields': ('design_json',),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ('criado_em', 'atualizado_em', 'usuario_criador')

@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    list_display = ('nome', 'status', 'template', 'total_enviados', 'total_abertos', 'taxa_abertura', 'criado_em')
    list_filter = ('status', 'empresa', 'criado_em')
    search_fields = ('nome', 'descricao')
    readonly_fields = ('total_destinatarios', 'total_enviados', 'total_abertos', 'total_cliques', 
                      'total_bounces', 'total_cancelados', 'data_inicio_envio', 'data_fim_envio',
                      'criado_em', 'atualizado_em', 'usuario_criador')
    fieldsets = (
        ('Identificação', {
            'fields': ('empresa', 'nome', 'descricao', 'template', 'status')
        }),
        ('Destinatários', {
            'fields': ('segmento', 'lista_emails', 'destinatarios_query')
        }),
        ('Agendamento', {
            'fields': ('data_agendamento', 'data_inicio_envio', 'data_fim_envio')
        }),
        ('Estatísticas', {
            'fields': ('total_destinatarios', 'total_enviados', 'total_abertos', 'total_cliques', 
                      'total_bounces', 'total_cancelados')
        }),
        ('Teste A/B', {
            'fields': ('is_ab_test', 'ab_test_percentage'),
            'classes': ('collapse',)
        })
    )

@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ('destinatario_email', 'assunto', 'status', 'campanha', 'data_envio', 'total_aberturas', 'total_cliques')
    list_filter = ('status', 'empresa', 'campanha', 'criado_em')
    search_fields = ('destinatario_email', 'destinatario_nome', 'assunto')
    readonly_fields = ('status', 'provider_message_id', 'erro_mensagem', 'tentativas_envio', 
                      'data_envio', 'data_abertura', 'total_aberturas', 'data_primeiro_clique',
                      'total_cliques', 'user_agent', 'ip_address', 'criado_em', 'atualizado_em')
    fieldsets = (
        ('Destinatário', {
            'fields': ('empresa', 'destinatario_email', 'destinatario_nome', 'cliente')
        }),
        ('Conteúdo', {
            'fields': ('assunto', 'html_body', 'text_body', 'anexos')
        }),
        ('Configuração', {
            'fields': ('config', 'template', 'campanha')
        }),
        ('Status', {
            'fields': ('status', 'provider_message_id', 'erro_mensagem', 'tentativas_envio')
        }),
        ('Rastreamento', {
            'fields': ('data_envio', 'data_abertura', 'total_aberturas', 'data_primeiro_clique', 
                      'total_cliques', 'user_agent', 'ip_address')
        })
    )


@admin.register(RegraFiscal)
class RegraFiscalAdmin(admin.ModelAdmin):
    list_display = (
        'ncm_codigo', 'tipo_operacao', 'uf_destino', 'uf_origem',
        'regime_tributario', 'tipo_cliente', 'icms_cst_csosn',
        'icms_aliq', 'icmsst_mva_perc', 'fcp_aliq',
        'pis_cst', 'pis_aliq', 'cofins_aliq',
        'empresa', 'ativo',
    )
    list_filter = (
        'ativo', 'tipo_operacao', 'regime_tributario', 'tipo_cliente',
        'uf_destino', 'empresa',
    )
    search_fields = ('ncm_codigo', 'cest_codigo', 'cfop', 'descricao')
    ordering = ('ncm_codigo', 'tipo_operacao', 'uf_destino')
    list_per_page = 50
    fieldsets = (
        ('Classificação', {
            'fields': (
                'empresa', 'regime_tributario', 'ncm_codigo', 'cest_codigo',
                'tipo_operacao', 'uf_destino', 'uf_origem', 'tipo_cliente',
                'cfop', 'c_benef', 'c_class_trib',
            )
        }),
        ('ICMS', {
            'fields': (
                'icms_cst_csosn', 'icms_modalidade_bc', 'icms_aliq',
                'icms_reducao_bc_perc', 'icms_desonerado', 'diferimento_icms_perc',
            )
        }),
        ('ICMS-ST / FCP', {
            'fields': (
                'icmsst_aliq', 'icmsst_mva_perc', 'icmsst_reducao_bc_perc', 'fcp_aliq',
            )
        }),
        ('PIS / COFINS', {
            'fields': ('pis_cst', 'pis_aliq', 'cofins_cst', 'cofins_aliq')
        }),
        ('IPI', {
            'fields': ('ipi_cst', 'ipi_aliq', 'ipi_classe_enquadramento')
        }),
        ('Reforma Tributária (IBS/CBS)', {
            'classes': ('collapse',),
            'fields': (
                'ibs_cst', 'ibs_aliq', 'cbs_cst', 'cbs_aliq', 'is_aliq',
                'split_payment', 'tipo_produto_reform',
            )
        }),
        ('Outros', {
            'classes': ('collapse',),
            'fields': ('funrural_aliq', 'senar_aliq', 'descricao', 'ativo')
        }),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Tributação por Tipo / UF
# ─────────────────────────────────────────────────────────────────────────────

class TributacaoUFInline(admin.TabularInline):
    """Grid de alíquotas por UF — corresponde à tabela da tela legada."""
    model  = TributacaoUF
    extra  = 0
    ordering = ('uf_destino',)
    fields = (
        'uf_destino', 'cfop_saida',
        'icms_aliq', 'reducao_bc_perc',
        'icmsst_aliq', 'icmsst_mva_perc', 'reducao_bc_st_perc',
        'frete_perc', 'seguro_perc', 'outras_despesas_perc',
        'fcp_aliq',
    )


@admin.register(TipoTributacao)
class TipoTributacaoAdmin(admin.ModelAdmin):
    list_display  = ('nome', 'empresa', 'icms_cst_csosn', 'icms_modalidade_bc', 'cfop_padrao', 'ativo')
    list_filter   = ('ativo', 'icms_modalidade_bc', 'icmsst_modalidade_bc', 'empresa')
    search_fields = ('nome', 'icms_cst_csosn', 'cfop_padrao', 'cfop_devolucao')
    ordering      = ('nome',)
    inlines       = [TributacaoUFInline]
    fieldsets = (
        ('Identificação', {
            'fields': ('empresa', 'nome', 'ativo'),
        }),
        ('ICMS — Configuração Geral', {
            'fields': (
                'icms_cst_csosn', 'icms_modalidade_bc',
                'cfop_padrao', 'cfop_devolucao',
            ),
        }),
        ('ICMS-ST', {
            'fields': ('icmsst_modalidade_bc', 'antecipacao_tributaria'),
        }),
        ('Opções Fiscais', {
            'fields': ('considera_sintegra', 'observacao_nfe'),
            'classes': ('collapse',),
        }),
    )
