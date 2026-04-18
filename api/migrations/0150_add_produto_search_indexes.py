"""
Migration 0150 — Índices adicionais de busca e performance.

EAN/GTIN em Produto: leitura de código de barras no PDV é operação
crítica — sem índice, a busca por gtin varre a tabela inteira.

nome_produto: filtros de pesquisa na tela de produtos/estoque.

Também adiciona índice em OrdemProducao.status para o dashboard PCP.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0149_add_performance_indexes'),
    ]

    operations = [
        # Produto — busca por código de barras (PDV, etiquetadora, leitor)
        migrations.AddIndex(
            model_name='produto',
            index=models.Index(fields=['gtin'], name='produto_gtin_idx'),
        ),
        # Produto — pesquisa por nome (autocomplete, select2)
        migrations.AddIndex(
            model_name='produto',
            index=models.Index(fields=['nome_produto'], name='produto_nome_idx'),
        ),
        # Produto — filtro por disponibilidade no e-commerce
        migrations.AddIndex(
            model_name='produto',
            index=models.Index(fields=['disponivel_web'], name='produto_web_idx'),
        ),
    ]
