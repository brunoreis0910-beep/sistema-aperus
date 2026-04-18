from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0026_add_id_deposito_baixa'),
    ]

    operations = [
        migrations.AlterField(
            model_name='operacao',
            name='transacao',
            field=models.CharField(max_length=10, blank=True, null=True),
        ),
    ]
