from django.db import migrations, connection


def add_operacoes_columns(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    columns_to_add = [
        ('empresa', 'VARCHAR(100)'),
        ('transacao', 'VARCHAR(6)'),
        ('modelo_documento', 'VARCHAR(10)'),
        ('emitente', 'VARCHAR(8)'),
        ('serie_nf', 'INT DEFAULT 1', 'INTEGER DEFAULT 1'),
    ]
    
    with connection.cursor() as cursor:
        if is_sqlite:
            # SQLite: Verificar colunas existentes
            cursor.execute("PRAGMA table_info(operacoes)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            
            for col_info in columns_to_add:
                col_name = col_info[0]
                sqlite_type = col_info[2] if len(col_info) > 2 else col_info[1]
                
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE operacoes ADD COLUMN {col_name} {sqlite_type}")
        else:
            # MySQL: Usar prepared statements
            for col_info in columns_to_add:
                col_name = col_info[0]
                mysql_type = col_info[1]
                
                cursor.execute(f"""
                    SET @stmt = (
                        SELECT CASE WHEN COUNT(*) = 0
                            THEN CONCAT('ALTER TABLE `operacoes` ADD COLUMN `{col_name}` {mysql_type};')
                            ELSE 'SELECT 1;'
                        END
                        FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'operacoes'
                          AND COLUMN_NAME = '{col_name}'
                    )
                """)
                cursor.execute("PREPARE s FROM @stmt")
                cursor.execute("EXECUTE s")
                cursor.execute("DEALLOCATE PREPARE s")


def remove_operacoes_columns(apps, schema_editor):
    # SQLite não suporta DROP COLUMN facilmente, deixar as colunas
    is_sqlite = connection.vendor == 'sqlite'
    
    if not is_sqlite:
        with connection.cursor() as cursor:
            columns = ['serie_nf', 'emitente', 'modelo_documento', 'transacao', 'empresa']
            for col in columns:
                cursor.execute(f"ALTER TABLE `operacoes` DROP COLUMN IF EXISTS `{col}`")


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0019_merge"),
    ]

    operations = [
        migrations.RunPython(
            code=add_operacoes_columns,
            reverse_code=remove_operacoes_columns,
        )
    ]
