from django.contrib import admin
from .models import LayoutEtiqueta, ImpressaoEtiqueta


@admin.register(LayoutEtiqueta)
class LayoutEtiquetaAdmin(admin.ModelAdmin):
    list_display = ['nome_layout', 'tamanho_papel', 'colunas', 'linhas', 'ativo', 'criado_em']
    list_filter = ['ativo', 'tamanho_papel']
    search_fields = ['nome_layout', 'descricao']


@admin.register(ImpressaoEtiqueta)
class ImpressaoEtiquetaAdmin(admin.ModelAdmin):
    list_display = ['id', 'layout', 'quantidade_total', 'usuario', 'data_impressao']
    list_filter = ['data_impressao']
    readonly_fields = ['data_impressao']
