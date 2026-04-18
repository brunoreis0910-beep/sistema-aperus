from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_merge'),
    ]

    operations = [
        migrations.AddField(
            model_name='operacao',
            name='id_deposito_baixa',
            field=models.IntegerField(blank=True, null=True, db_column='id_deposito_baixa'),
        ),
    ]
