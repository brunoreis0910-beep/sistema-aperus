from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0155_produto_similar'),
    ]

    operations = [
        migrations.AddField(
            model_name='produto',
            name='cest',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=9,
                help_text='Código Especificador da Substituição Tributária — 7 dígitos',
            ),
        ),
    ]
