from django.db import migrations, connection


def add_tipo_estoque_incremento(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    with connection.cursor() as cursor:
        if is_sqlite:
            # SQLite: Verificar se coluna já existe
            cursor.execute("PRAGMA table_info(operacoes)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'tipo_estoque_incremento' not in columns:
                cursor.execute("""
                    ALTER TABLE operacoes 
                    ADD COLUMN tipo_estoque_incremento VARCHAR(9) DEFAULT 'Nenhum'
                """)
        else:
            # MySQL: Usar prepared statement
            cursor.execute("""
                SET @stmt = (
                    SELECT CASE WHEN COUNT(*) = 0
                        THEN CONCAT('ALTER TABLE `operacoes` ADD COLUMN `tipo_estoque_incremento` varchar(9) NULL DEFAULT ', QUOTE('Nenhum'), ';')
                        ELSE 'SELECT 1;'
                    END
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'operacoes'
                      AND COLUMN_NAME = 'tipo_estoque_incremento'
                )
            """)
            cursor.execute("PREPARE s FROM @stmt")
            cursor.execute("EXECUTE s")
            cursor.execute("DEALLOCATE PREPARE s")


def remove_tipo_estoque_incremento(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    with connection.cursor() as cursor:
        if is_sqlite:
            # SQLite não suporta DROP COLUMN facilmente
            # Vamos apenas deixar a coluna (não causa problema)
            pass
        else:
            cursor.execute("ALTER TABLE `operacoes` DROP COLUMN IF EXISTS `tipo_estoque_incremento`")


class Migration(migrations.Migration):
    dependencies = []

    operations = [
        migrations.RunPython(
            code=add_tipo_estoque_incremento,
            reverse_code=remove_tipo_estoque_incremento,
        )
    ]
