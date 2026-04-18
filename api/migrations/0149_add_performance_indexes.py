"""
Migration 0149 - Índices de performance nos modelos mais consultados.

Adiciona índices nos campos mais filtrados em relatórios e listagens:
- Venda: data_documento, status_nfe (filtros mais usados nos relatórios)
- FinanceiroConta: data_vencimento, status_conta, tipo_conta (filtros da tela financeira)
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0148_pcp_modelos'),
    ]

    operations = [
        # Índices em Venda
        migrations.AddIndex(
            model_name='venda',
            index=models.Index(fields=['data_documento'], name='venda_data_doc_idx'),
        ),
        migrations.AddIndex(
            model_name='venda',
            index=models.Index(fields=['status_nfe'], name='venda_status_nfe_idx'),
        ),
        migrations.AddIndex(
            model_name='venda',
            index=models.Index(fields=['data_documento', 'status_nfe'], name='venda_data_status_idx'),
        ),
        # Índices em FinanceiroConta
        migrations.AddIndex(
            model_name='financeiroconta',
            index=models.Index(fields=['data_vencimento'], name='fin_data_venc_idx'),
        ),
        migrations.AddIndex(
            model_name='financeiroconta',
            index=models.Index(fields=['status_conta'], name='fin_status_conta_idx'),
        ),
        migrations.AddIndex(
            model_name='financeiroconta',
            index=models.Index(fields=['tipo_conta'], name='fin_tipo_conta_idx'),
        ),
        migrations.AddIndex(
            model_name='financeiroconta',
            index=models.Index(fields=['data_vencimento', 'status_conta', 'tipo_conta'], name='fin_venc_status_tipo_idx'),
        ),
    ]
