from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0089_tributacaoproduto_add_csosn'),
    ]

    operations = [
        # IPI Simples Nacional
        migrations.AddField(
            model_name='tributacaoproduto',
            name='cst_ipi_sn',
            field=models.CharField(blank=True, default='99', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='tributacaoproduto',
            name='ipi_aliquota_sn',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=5),
        ),
        # PIS Simples Nacional
        migrations.AddField(
            model_name='tributacaoproduto',
            name='cst_pis_sn',
            field=models.CharField(blank=True, default='07', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='tributacaoproduto',
            name='pis_aliquota_sn',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=5),
        ),
        # COFINS Simples Nacional
        migrations.AddField(
            model_name='tributacaoproduto',
            name='cst_cofins_sn',
            field=models.CharField(blank=True, default='07', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='tributacaoproduto',
            name='cofins_aliquota_sn',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=5),
        ),
    ]
