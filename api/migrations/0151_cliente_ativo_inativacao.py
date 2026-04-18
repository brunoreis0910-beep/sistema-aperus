from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0150_add_produto_search_indexes'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "ALTER TABLE clientes ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;",
                "ALTER TABLE clientes ADD COLUMN data_inativacao DATETIME NULL DEFAULT NULL;",
                "ALTER TABLE clientes ADD COLUMN motivo_inativacao TEXT NULL DEFAULT NULL;",
            ],
            reverse_sql=[
                "ALTER TABLE clientes DROP COLUMN motivo_inativacao;",
                "ALTER TABLE clientes DROP COLUMN data_inativacao;",
                "ALTER TABLE clientes DROP COLUMN ativo;",
            ],
        ),
    ]
