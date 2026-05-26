# Generated manually - 2026-05-26
# Sincroniza colunas de saas_cliente que foram omitidas em 0181 (SeparateDatabaseAndState sem database_operations)

from django.db import migrations

def add_columns_if_not_exists(apps, schema_editor):
    cursor = schema_editor.connection.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = 'saas_cliente' "
        "AND COLUMN_NAME = 'schema_name'"
    )
    exists = cursor.fetchone()[0]
    if not exists:
        cursor.execute(
            "ALTER TABLE saas_cliente "
            "ADD COLUMN schema_name VARCHAR(50) NOT NULL DEFAULT 'central', "
            "ADD COLUMN db_host VARCHAR(100) NOT NULL DEFAULT 'localhost', "
            "ADD COLUMN db_port VARCHAR(5) NOT NULL DEFAULT '8005', "
            "ADD COLUMN is_test_environment TINYINT(1) NOT NULL DEFAULT 0;"
        )
        cursor.execute(
            "ALTER TABLE saas_cliente ADD UNIQUE (schema_name);"
        )

def remove_columns(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('api', '0182_saascliente_bairro_saascliente_cep_and_more'),
    ]

    operations = [
        migrations.RunPython(add_columns_if_not_exists, remove_columns),
    ]
