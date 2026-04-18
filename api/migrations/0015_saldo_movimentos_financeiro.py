from django.db import migrations, connection


def create_estoque_tables(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    if is_sqlite:
        saldo_sql = """
        CREATE TABLE IF NOT EXISTS saldo_deposito (
            id_saldo INTEGER PRIMARY KEY AUTOINCREMENT,
            id_deposito INTEGER NOT NULL,
            id_produto INTEGER NOT NULL,
            quantidade REAL NOT NULL DEFAULT 0.000,
            UNIQUE (id_deposito, id_produto)
        )
        """
        
        movimentos_sql = """
        CREATE TABLE IF NOT EXISTS movimentos_estoque (
            id_mov INTEGER PRIMARY KEY AUTOINCREMENT,
            id_produto INTEGER NOT NULL,
            id_deposito INTEGER DEFAULT NULL,
            tipo VARCHAR(20) NOT NULL,
            quantidade REAL NOT NULL DEFAULT 0.000,
            antes REAL DEFAULT NULL,
            depois REAL DEFAULT NULL,
            referencia VARCHAR(100) DEFAULT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    else:
        saldo_sql = """
        CREATE TABLE IF NOT EXISTS `saldo_deposito` (
            `id_saldo` INT AUTO_INCREMENT PRIMARY KEY,
            `id_deposito` INT NOT NULL,
            `id_produto` INT NOT NULL,
            `quantidade` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
            UNIQUE KEY `uniq_dep_prod` (`id_deposito`, `id_produto`)
        ) ENGINE=InnoDB
        """
        
        movimentos_sql = """
        CREATE TABLE IF NOT EXISTS `movimentos_estoque` (
            `id_mov` INT AUTO_INCREMENT PRIMARY KEY,
            `id_produto` INT NOT NULL,
            `id_deposito` INT DEFAULT NULL,
            `tipo` VARCHAR(20) NOT NULL,
            `quantidade` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
            `antes` DECIMAL(14,3) DEFAULT NULL,
            `depois` DECIMAL(14,3) DEFAULT NULL,
            `referencia` VARCHAR(100) DEFAULT NULL,
            `criado_em` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        """
    
    with connection.cursor() as cursor:
        cursor.execute(saldo_sql)
        cursor.execute(movimentos_sql)


def drop_estoque_tables(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    if is_sqlite:
        drop_movimentos = "DROP TABLE IF EXISTS movimentos_estoque"
        drop_saldo = "DROP TABLE IF EXISTS saldo_deposito"
    else:
        drop_movimentos = "DROP TABLE IF EXISTS `movimentos_estoque`"
        drop_saldo = "DROP TABLE IF EXISTS `saldo_deposito`"
    
    with connection.cursor() as cursor:
        cursor.execute(drop_movimentos)
        cursor.execute(drop_saldo)


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0014_create_vendas_tables"),
    ]

    operations = [
        migrations.RunPython(
            code=create_estoque_tables,
            reverse_code=drop_estoque_tables,
        )
    ]
