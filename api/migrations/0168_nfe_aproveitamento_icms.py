from django.db import migrations


def add_columns_if_not_exists(apps, schema_editor):
    """Adiciona as colunas de Aproveitamento ICMS ao MySQL de forma segura."""
    connection = schema_editor.connection
    cursor = connection.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = 'empresa_config' "
        "AND COLUMN_NAME = 'nfe_aproveitamento_icms_ativo'"
    )
    exists = cursor.fetchone()[0]
    if not exists:
        cursor.execute(
            "ALTER TABLE empresa_config "
            "ADD COLUMN nfe_aproveitamento_icms_ativo TINYINT(1) NOT NULL DEFAULT 0, "
            "ADD COLUMN nfe_aproveitamento_icms_aliquota DECIMAL(7, 4) NULL DEFAULT 0, "
            "ADD COLUMN nfe_aproveitamento_icms_mensagem LONGTEXT NULL, "
            "ADD COLUMN nfe_aproveitamento_icms_csosns VARCHAR(100) NULL"
        )


def remove_columns(apps, schema_editor):
    schema_editor.execute(
        "ALTER TABLE empresa_config "
        "DROP COLUMN IF EXISTS nfe_aproveitamento_icms_ativo, "
        "DROP COLUMN IF EXISTS nfe_aproveitamento_icms_aliquota, "
        "DROP COLUMN IF EXISTS nfe_aproveitamento_icms_mensagem, "
        "DROP COLUMN IF EXISTS nfe_aproveitamento_icms_csosns"
    )


class Migration(migrations.Migration):

    atomic = False  # DDL no MySQL não pode rodar dentro de transação

    dependencies = [
        ('api', '0167_add_a4_fotos_impressora'),
    ]

    operations = [
        migrations.RunPython(add_columns_if_not_exists, remove_columns),
    ]
