from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0013_merge"),
    ]
    # Esta migração foi substituída por uma versão SQL condicional
    # em 0014_create_vendas_tables.py que cria as tabelas com
    # CREATE TABLE IF NOT EXISTS. Para evitar duplicação de DDL,
    # deixamos esta migration como no-op para marcar o passo no
    # histórico de migrações sem executar operações.
    operations = []
