from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0169_operacao_finalidade_emissao'),
    ]

    operations = [
        migrations.AddField(
            model_name='operacao',
            name='tipo_desconto',
            field=models.CharField(
                blank=True,
                choices=[
                    ('item', 'Por Item — desconto aplicado em cada item individualmente'),
                    ('venda', 'Por Venda — desconto geral rateado proporcionalmente nos itens'),
                ],
                db_column='tipo_desconto',
                default='venda',
                help_text="Define como o desconto é aplicado: 'item' = mesmo % em cada item; 'venda' = desconto total rateado pelos itens",
                max_length=5,
                null=True,
            ),
        ),
    ]
