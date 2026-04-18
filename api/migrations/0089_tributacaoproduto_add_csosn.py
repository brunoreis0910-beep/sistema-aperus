from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0088_add_fiscal_fields_venda_item'),
    ]

    operations = [
        migrations.AddField(
            model_name='tributacaoproduto',
            name='csosn',
            field=models.CharField(
                blank=True,
                default='400',
                help_text='CSOSN para Simples Nacional (ex: 400, 102). '
                          'O sistema usa este campo quando CRT=1.',
                max_length=10,
                null=True,
            ),
        ),
    ]
