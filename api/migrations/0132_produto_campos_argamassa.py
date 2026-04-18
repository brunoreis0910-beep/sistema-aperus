# Generated migration for argamassa calculation fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0131_venda_veiculo_novo_e_veiculonovo'),
    ]

    operations = [
        migrations.AddField(
            model_name='produto',
            name='consumo_argamassa_m2',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Consumo de argamassa em kg/m² (ex: 5.0 para piso simples, 8.5 para colagem dupla)',
                max_digits=5,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='produto',
            name='peso_saco_argamassa',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text='Peso do saco de argamassa em kg (padrão: 20kg)',
                max_digits=5,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='produto',
            name='tipo_aplicacao_argamassa',
            field=models.CharField(
                blank=True,
                help_text='Tipo: simples, dupla, pastilha',
                max_length=30,
                null=True,
            ),
        ),
    ]
