# Migration manual - adiciona campos de tributação padrão à ConfiguracaoProduto
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0121_update_mapa_carga_schema'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_cfop',
            field=models.CharField(blank=True, default='5102', help_text='CFOP padrão para novos produtos', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_cst_icms',
            field=models.CharField(blank=True, default='', help_text='CST ICMS padrão', max_length=5, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_csosn',
            field=models.CharField(blank=True, default='400', help_text='CSOSN padrão (Simples Nacional)', max_length=5, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_icms_aliquota',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, help_text='Alíquota ICMS padrão (%)', max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_cst_ipi',
            field=models.CharField(blank=True, default='99', help_text='CST IPI padrão', max_length=5, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_ipi_aliquota',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, help_text='Alíquota IPI padrão (%)', max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_cst_pis_cofins',
            field=models.CharField(blank=True, default='07', help_text='CST PIS/COFINS padrão', max_length=5, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_pis_aliquota',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, help_text='Alíquota PIS padrão (%)', max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_cofins_aliquota',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, help_text='Alíquota COFINS padrão (%)', max_digits=6, null=True),
        ),
        migrations.AddField(
            model_name='configuracaoproduto',
            name='trib_classificacao_fiscal',
            field=models.CharField(blank=True, default='', help_text='Classificação fiscal padrão', max_length=100, null=True),
        ),
    ]
