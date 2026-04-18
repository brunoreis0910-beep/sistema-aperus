from django.contrib import admin
from .models import Mesa, Comanda, ItemComanda, TransferenciaMesa


@admin.register(Mesa)
class MesaAdmin(admin.ModelAdmin):
    list_display = ['numero', 'capacidade', 'localizacao', 'status', 'ativa']
    list_filter = ['status', 'ativa', 'localizacao']
    search_fields = ['numero', 'localizacao']


@admin.register(Comanda)
class ComandaAdmin(admin.ModelAdmin):
    list_display = ['numero', 'mesa', 'cliente', 'status', 'total', 'data_abertura']
    list_filter = ['status', 'data_abertura']
    search_fields = ['numero', 'cliente__nome']


@admin.register(ItemComanda)
class ItemComandaAdmin(admin.ModelAdmin):
    list_display = ['comanda', 'produto', 'quantidade', 'valor_unitario', 'subtotal', 'status']
    list_filter = ['status', 'criado_em']


@admin.register(TransferenciaMesa)
class TransferenciaMesaAdmin(admin.ModelAdmin):
    list_display = ['comanda', 'mesa_origem', 'mesa_destino', 'usuario', 'data_transferencia']
    list_filter = ['data_transferencia']
