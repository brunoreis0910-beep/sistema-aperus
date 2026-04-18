from django.db import migrations, connection


def add_vendas_columns(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    columns_to_add = [
        ('criado_por', 'INT', 'INTEGER'),
        ('gerou_financeiro', 'TINYINT(1) DEFAULT 0', 'INTEGER DEFAULT 0'),
        ('vista', 'TINYINT(1) DEFAULT 0', 'INTEGER DEFAULT 0'),
    ]
    
    with connection.cursor() as cursor:
        if is_sqlite:
            # SQLite: Verificar colunas existentes
            cursor.execute("PRAGMA table_info(vendas)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            
            for col_name, _, sqlite_type in columns_to_add:
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE vendas ADD COLUMN {col_name} {sqlite_type}")
        else:
            # MySQL: Usar prepared statements
            for col_name, mysql_type, _ in columns_to_add:
                cursor.execute(f"""
                    SET @stmt = (
                        SELECT CASE WHEN COUNT(*) = 0
                            THEN 'ALTER TABLE `vendas` ADD COLUMN `{col_name}` {mysql_type};'
                            ELSE 'SELECT 1;'
                        END
                        FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'vendas'
                          AND COLUMN_NAME = '{col_name}'
                    )
                """)
                cursor.execute("PREPARE s FROM @stmt")
                cursor.execute("EXECUTE s")
                cursor.execute("DEALLOCATE PREPARE s")


def remove_vendas_columns(apps, schema_editor):
    # SQLite não suporta DROP COLUMN facilmente
    is_sqlite = connection.vendor == 'sqlite'
    
    if not is_sqlite:
        with connection.cursor() as cursor:
            columns = ['vista', 'gerou_financeiro', 'criado_por']
            for col in columns:
                cursor.execute(f"ALTER TABLE `vendas` DROP COLUMN IF EXISTS `{col}`")


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0020_add_operacoes_missing_columns"),
    ]

    operations = [
        migrations.RunPython(
            code=add_vendas_columns,
            reverse_code=remove_vendas_columns,
        )
    ]
