from django.contrib import admin
from .models import Cliente, EscritorioContabilidade


@admin.register(EscritorioContabilidade)
class EscritorioContabilidadeAdmin(admin.ModelAdmin):
    """Admin para Escritório de Contabilidade"""
    
    list_display = [
        'razao_social',
        'cnpj',
        'contador',
        'telefone',
        'email',
        'ativo',
        'criado_em'
    ]
    
    list_filter = [
        'ativo',
        'criado_em',
        'atualizado_em'
    ]
    
    search_fields = [
        'razao_social',
        'cnpj',
        'contador',
        'email'
    ]
    
    readonly_fields = ['criado_em', 'atualizado_em']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': (
                'razao_social',
                'cnpj',
            )
        }),
        ('Dados de Contato', {
            'fields': (
                'contador',
                'telefone',
                'email',
            )
        }),
        ('Status', {
            'fields': (
                'ativo',
            )
        }),
        ('Informações do Sistema', {
            'fields': (
                'criado_em',
                'atualizado_em',
            ),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Adiciona contagem de clientes"""
        qs = super().get_queryset(request)
        return qs.prefetch_related('clientes')


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    """Admin para Cliente"""
    
    list_display = [
        'razao_social',
        'nome_fantasia',
        'cnpj',
        'cidade',
        'estado',
        'regime_tributario',
        'escritorio',
        'ativo',
        'criado_em'
    ]
    
    list_filter = [
        'regime_tributario',
        'estado',
        'cidade',
        'ativo',
        'escritorio',
        'criado_em',
        'atualizado_em'
    ]
    
    search_fields = [
        'razao_social',
        'nome_fantasia',
        'cnpj',
        'proprietario',
        'cpf',
        'email',
        'telefone'
    ]
    
    readonly_fields = ['criado_em', 'atualizado_em', 'endereco_completo']
    
    autocomplete_fields = ['escritorio']
    
    fieldsets = (
        ('Dados da Empresa', {
            'fields': (
                'razao_social',
                'nome_fantasia',
                'cnpj',
                'inscricao_estadual',
                'regime_tributario',
            )
        }),
        ('Endereço', {
            'fields': (
                'endereco',
                'numero',
                'complemento',
                'bairro',
                'cidade',
                'estado',
                'cep',
                'endereco_completo',
            )
        }),
        ('Dados do Proprietário', {
            'fields': (
                'proprietario',
                'data_nascimento',
                'cpf',
                'telefone',
                'email',
            )
        }),
        ('Escritório de Contabilidade', {
            'fields': (
                'escritorio',
            )
        }),
        ('Informações Adicionais', {
            'fields': (
                'observacoes',
                'ativo',
            )
        }),
        ('Informações do Sistema', {
            'fields': (
                'criado_em',
                'atualizado_em',
            ),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Otimiza queries"""
        qs = super().get_queryset(request)
        return qs.select_related('escritorio')
