from django.db import migrations, connection


def add_incremento_columns(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    columns_to_add = [
        ('incrementar_estoque', 'TINYINT DEFAULT 0', 'INTEGER DEFAULT 0'),
        ('id_deposito_incremento', 'INT', 'INTEGER'),
    ]
    
    with connection.cursor() as cursor:
        if is_sqlite:
            cursor.execute("PRAGMA table_info(operacoes)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            
            for col_name, _, sqlite_type in columns_to_add:
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE operacoes ADD COLUMN {col_name} {sqlite_type}")
        else:
            # MySQL
            for col_name, mysql_type, _ in columns_to_add:
                cursor.execute(f"""
                    SET @sql = (
                        SELECT CASE WHEN NOT EXISTS(
                            SELECT * FROM information_schema.COLUMNS
                            WHERE table_name='operacoes' AND column_name='{col_name}'
                        ) THEN CONCAT('ALTER TABLE `operacoes` ADD COLUMN `{col_name}` {mysql_type};')
                        ELSE 'SELECT 1;' END
                    )
                """)
                cursor.execute("PREPARE stmt FROM @sql")
                cursor.execute("EXECUTE stmt")
                cursor.execute("DEALLOCATE PREPARE stmt")


def remove_incremento_columns(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    if not is_sqlite:
        with connection.cursor() as cursor:
            cursor.execute("ALTER TABLE `operacoes` DROP COLUMN IF EXISTS `id_deposito_incremento`")
            cursor.execute("ALTER TABLE `operacoes` DROP COLUMN IF EXISTS `incrementar_estoque`")


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0021_add_vendas_columns"),
    ]

    operations = [
        migrations.RunPython(
            code=add_incremento_columns,
            reverse_code=remove_incremento_columns,
        )
    ]
