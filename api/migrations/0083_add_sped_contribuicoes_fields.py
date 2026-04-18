# Generated migration for SPED Contribuições fields

from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0082_add_sped_config_fields'),
    ]

    operations = [
        # Conjuntos de Operações SPED Contribuições
        migrations.AddField(
            model_name='empresaconfig',
            name='sped_contrib_conjuntos',
            field=models.CharField(
                blank=True,
                help_text='IDs dos conjuntos de operação para SPED Contribuições (ex: 1,2,3)',
                max_length=500,
                null=True
            ),
        ),
        
        # Diretório de Saída SPED Contribuições
        migrations.AddField(
            model_name='empresaconfig',
            name='sped_contrib_diretorio',
            field=models.CharField(
                blank=True,
                default='C:\\SPED\\CONTRIBUICOES\\',
                help_text='Diretório para salvar arquivos SPED Contribuições',
                max_length=500,
                null=True
            ),
        ),
        
        # Blocos a Gerar SPED Contribuições
        migrations.AddField(
            model_name='empresaconfig',
            name='sped_contrib_blocos',
            field=models.CharField(
                blank=True,
                default='C,F,M',
                help_text='Blocos a gerar no SPED Contribuições (ex: C,F,M)',
                max_length=50,
                null=True
            ),
        ),
        
        # Regime de Apuração PIS/COFINS
        migrations.AddField(
            model_name='empresaconfig',
            name='regime_apuracao_pis_cofins',
            field=models.CharField(
                blank=True,
                choices=[
                    ('1', 'Regime Cumulativo'),
                    ('2', 'Regime Não-Cumulativo'),
                    ('3', 'Ambos os Regimes')
                ],
                default='2',
                help_text='Regime de Apuração da Contribuição (COD_INC_TRIB no registro 0110)',
                max_length=1,
                null=True
            ),
        ),
        
        # Regime de Crédito PIS/COFINS
        migrations.AddField(
            model_name='empresaconfig',
            name='regime_cred_pis_cofins',
            field=models.CharField(
                blank=True,
                choices=[
                    ('1', 'Apuração com base nos registros de consolidação'),
                    ('2', 'Apuração com base no registro individualizado')
                ],
                default='1',
                help_text='Regime de Crédito (COD_TIPO_CONT no registro 0110)',
                max_length=1,
                null=True
            ),
        ),
        
        # Alíquota PIS Padrão
        migrations.AddField(
            model_name='empresaconfig',
            name='aliquota_pis_padrao',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                default=Decimal('1.65'),
                help_text='Alíquota padrão do PIS (%) para regime não-cumulativo',
                max_digits=5,
                null=True
            ),
        ),
        
        # Alíquota COFINS Padrão
        migrations.AddField(
            model_name='empresaconfig',
            name='aliquota_cofins_padrao',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                default=Decimal('7.60'),
                help_text='Alíquota padrão do COFINS (%) para regime não-cumulativo',
                max_digits=5,
                null=True
            ),
        ),
    ]
