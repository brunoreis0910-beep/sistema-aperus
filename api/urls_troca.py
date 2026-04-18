"""
URLs para funcionalidade de Troca
"""
from django.urls import path
from . import views_troca

urlpatterns = [
    # Buscar vendas para troca
    path('trocas/search-sales/', views_troca.search_sales_for_exchange, name='search-sales-for-exchange'),
    
    # Buscar itens de uma venda específica
    path('trocas/sales/<int:id_venda>/items/', views_troca.get_sale_items_for_exchange, name='get-sale-items-for-exchange'),
    
    # Buscar produtos para substituição
    path('trocas/search-products/', views_troca.search_products_for_substitution, name='search-products-for-substitution'),
    
    # Buscar opções de pagamento
    path('trocas/payment-options/', views_troca.get_payment_options, name='get-payment-options'),
    
    # CRUD de trocas
    path('trocas/', views_troca.list_exchanges, name='list-exchanges'),
    path('trocas/create/', views_troca.create_exchange, name='create-exchange'),
    path('trocas/<int:id_troca>/', views_troca.get_exchange_detail, name='get-exchange-detail'),
]