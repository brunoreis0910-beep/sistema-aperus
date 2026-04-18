"""
Migration 0136: Adiciona campo tipo_faturamento ao modelo Operacao.

Permite diferenciar os 3 tipos de operação de faturamento:
- pedido_para_nota: Pedido → NF-e (modelo 55)
- pedido_para_cupom: Pedido → Cupom Fiscal NFC-e (modelo 65)
- cupom_para_nota: Cupom Fiscal → NF-e (modelo 55)
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0135_faturamento_avancado'),
    ]

    operations = [
        migrations.AddField(
            model_name='operacao',
            name='tipo_faturamento',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=20,
                choices=[
                    ('pedido_para_nota', 'Pedido → NF-e'),
                    ('pedido_para_cupom', 'Pedido → Cupom Fiscal (NFC-e)'),
                    ('cupom_para_nota', 'Cupom Fiscal → NF-e'),
                ],
                db_column='tipo_faturamento',
                help_text='Tipo de faturamento: pedido_para_nota, pedido_para_cupom, cupom_para_nota',
            ),
        ),
    ]
