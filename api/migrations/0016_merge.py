# Generated merge migration to resolve multiple leaf nodes
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_create_vendas'),
        ('api', '0015_saldo_movimentos_financeiro'),
    ]

    operations = [
        # merge migration - no operations, just unifies the graph
    ]
