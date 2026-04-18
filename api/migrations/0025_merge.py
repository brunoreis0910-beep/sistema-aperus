from django.db import migrations


class Migration(migrations.Migration):
    # Merge migration to resolve multiple leaf nodes (created during iterative edits)
    dependencies = [
        ('api', '0022_add_operacao_incremento'),
        ('api', '0024_create_compras'),
    ]

    operations = [
        # no-op merge; apenas une as duas ramificações do grafo de migrações
    ]
