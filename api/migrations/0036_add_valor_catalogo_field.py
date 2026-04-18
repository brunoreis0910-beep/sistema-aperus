from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0035_catalogo_alter_catalogoitem_produto_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='catalogoitem',
            name='valor_catalogo',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Valor no Catálogo'),
        ),
    ]
