from django.contrib import admin
from .models import (
    ManifestoEletronico, MDFeDocumentoVinculado, MDFePercurso,
    MDFeCarregamento, MDFeDescarregamento, MDFeCondutor,
    MDFeReboque, MDFeLacre
)


class MDFeDocumentoInline(admin.TabularInline):
    model = MDFeDocumentoVinculado
    extra = 1


class MDFePercursoInline(admin.TabularInline):
    model = MDFePercurso
    extra = 1


@admin.register(ManifestoEletronico)
class ManifestoEletronicoAdmin(admin.ModelAdmin):
    list_display = ['numero_mdfe', 'serie_mdfe', 'status_mdfe', 'data_emissao', 'placa_veiculo', 'condutor_nome']
    list_filter = ['status_mdfe', 'data_emissao', 'modal']
    search_fields = ['numero_mdfe', 'chave_mdfe', 'placa_veiculo', 'condutor_nome']
    readonly_fields = ['chave_mdfe', 'protocolo_mdfe', 'numero_mdfe', 'criado_em', 'atualizado_em']
    inlines = [MDFeDocumentoInline, MDFePercursoInline]
    
    fieldsets = (
        ('Identificação', {
            'fields': ('numero_mdfe', 'serie_mdfe', 'chave_mdfe', 'status_mdfe')
        }),
        ('Dados da Viagem', {
            'fields': ('data_inicio_viagem', 'uf_inicio', 'uf_fim', 'modal')
        }),
        ('Veículo e Condutor', {
            'fields': ('placa_veiculo', 'uf_veiculo', 'condutor_nome', 'condutor_cpf')
        }),
        ('Totalizadores', {
            'fields': ('quantidade_cte', 'quantidade_nfe', 'valor_total_carga', 'peso_total_kg')
        }),
        ('SEFAZ', {
            'fields': ('protocolo_mdfe', 'cstat', 'xmotivo', 'qrcode_url')
        }),
        ('Controle', {
            'fields': ('observacoes', 'criado_por', 'criado_em', 'atualizado_em')
        }),
    )


@admin.register(MDFeDocumentoVinculado)
class MDFeDocumentoVinculadoAdmin(admin.ModelAdmin):
    list_display = ['mdfe', 'tipo_documento', 'chave_acesso']
    list_filter = ['tipo_documento']
    search_fields = ['chave_acesso']
