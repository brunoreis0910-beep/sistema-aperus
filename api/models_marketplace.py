from django.db import models
from .models import Produto

class MarketplaceConfig(models.Model):
    PLATAFORMAS = [
        ('MERCADOLIVRE', 'Mercado Livre'),
        ('SHOPEE', 'Shopee'),
        ('AMAZON', 'Amazon'),
        ('MAGALU', 'Magalu'),
        ('WOOCOMMERCE', 'WooCommerce'),
        ('SHOPIFY', 'Shopify'),
    ]

    nome = models.CharField(max_length=100, help_text="Nome da integração (ex: Minha Loja ML)")
    plataforma = models.CharField(max_length=20, choices=PLATAFORMAS)
    ativo = models.BooleanField(default=True)
    
    # Credenciais
    client_id = models.CharField(max_length=255, blank=True, null=True)
    client_secret = models.CharField(max_length=255, blank=True, null=True)
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    expires_in = models.DateTimeField(blank=True, null=True)
    
    # Configurações Adicionais (JSON)
    config_json = models.TextField(default='{}', help_text="Configurações extras em JSON")
    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nome} ({self.get_plataforma_display()})"

    class Meta:
        verbose_name = "Configuração de Marketplace"
        verbose_name_plural = "Configurações de Marketplaces"


class MarketplaceProduto(models.Model):
    """
    Tabela de ligação entre o Produto local e o Produto no Marketplace.
    """
    marketplace = models.ForeignKey(MarketplaceConfig, on_delete=models.CASCADE, related_name='produtos_vinculados')
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='vinculos_marketplace')
    
    # ID do produto na plataforma (ex: MLB12345678)
    codigo_externo = models.CharField(max_length=100)
    
    # Link direto para o anúncio
    link_anuncio = models.CharField(max_length=500, blank=True, null=True)
    
    preco_plataforma = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    estoque_plataforma = models.DecimalField(max_digits=12, decimal_places=3, blank=True, null=True)
    
    status_sincronizacao = models.CharField(max_length=20, default='SINCRONIZADO', 
                                          choices=[('PENDENTE', 'Pendente'), ('SINCRONIZADO', 'Sincronizado'), ('ERRO', 'Erro')])
    ultimo_erro = models.TextField(blank=True, null=True)
    ultima_sincronizacao = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('marketplace', 'produto')
        verbose_name = "Produto no Marketplace"
        verbose_name_plural = "Produtos nos Marketplaces"
