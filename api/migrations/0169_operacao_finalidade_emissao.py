from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0168_nfe_aproveitamento_icms'),
    ]

    operations = [
        migrations.AddField(
            model_name='operacao',
            name='finalidade_emissao',
            field=models.CharField(
                max_length=1,
                blank=True,
                null=True,
                default='1',
                db_column='finalidade_emissao',
                choices=[
                    ('1', '1 - Normal'),
                    ('2', '2 - Complementar'),
                    ('3', '3 - Ajuste'),
                    ('4', '4 - Devolução de Mercadoria'),
                    ('5', '5 - Nota de Crédito (Reforma Tributária NT 2025.002)'),
                    ('6', '6 - Nota de Débito - Pagamento Antecipado (NT 2025.002)'),
                    ('7', '7 - Nota de Débito - Perda em Estoque (NT 2025.002)'),
                ],
                help_text="Finalidade de emissão da NF-e (finNFe): 1-Normal, 2-Complementar, 3-Ajuste, 4-Devolução, 5-Crédito, 6-Débito Pgto Antecipado, 7-Débito Perda Estoque"
            ),
        ),
    ]
