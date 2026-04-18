from django.db import migrations, connection


def create_vendas_tables(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    if is_sqlite:
        vendas_sql = """
        CREATE TABLE IF NOT EXISTS vendas (
            id_venda INTEGER PRIMARY KEY AUTOINCREMENT,
            id_operacao INTEGER NOT NULL,
            id_cliente INTEGER NOT NULL,
            id_vendedor1 INTEGER NOT NULL,
            id_vendedor2 INTEGER DEFAULT NULL,
            numero_documento VARCHAR(100) DEFAULT NULL,
            data_documento DATETIME NOT NULL,
            valor_total REAL NOT NULL DEFAULT 0.00,
            is_vista INTEGER NOT NULL DEFAULT 0,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        itens_sql = """
        CREATE TABLE IF NOT EXISTS venda_itens (
            id_item INTEGER PRIMARY KEY AUTOINCREMENT,
            id_venda INTEGER NOT NULL,
            id_produto INTEGER NOT NULL,
            codigo_produto VARCHAR(100),
            nome_produto VARCHAR(255),
            quantidade REAL NOT NULL DEFAULT 0.000,
            valor_unitario REAL NOT NULL DEFAULT 0.00,
            desconto_pct REAL NOT NULL DEFAULT 0.00,
            desconto_valor REAL NOT NULL DEFAULT 0.00,
            valor_total REAL NOT NULL DEFAULT 0.00,
            FOREIGN KEY (id_venda) REFERENCES vendas(id_venda) ON DELETE CASCADE
        )
        """
    else:
        vendas_sql = """
        CREATE TABLE IF NOT EXISTS `vendas` (
            `id_venda` INT AUTO_INCREMENT PRIMARY KEY,
            `id_operacao` INT NOT NULL,
            `id_cliente` INT NOT NULL,
            `id_vendedor1` INT NOT NULL,
            `id_vendedor2` INT DEFAULT NULL,
            `numero_documento` VARCHAR(100) DEFAULT NULL,
            `data_documento` DATETIME NOT NULL,
            `valor_total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
            `is_vista` TINYINT(1) NOT NULL DEFAULT 0,
            `criado_em` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
        """
        
        itens_sql = """
        CREATE TABLE IF NOT EXISTS `venda_itens` (
            `id_item` INT AUTO_INCREMENT PRIMARY KEY,
            `id_venda` INT NOT NULL,
            `id_produto` INT NOT NULL,
            `codigo_produto` VARCHAR(100),
            `nome_produto` VARCHAR(255),
            `quantidade` DECIMAL(14,3) NOT NULL DEFAULT 0.000,
            `valor_unitario` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
            `desconto_pct` DECIMAL(7,2) NOT NULL DEFAULT 0.00,
            `desconto_valor` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
            `valor_total` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
            FOREIGN KEY (id_venda) REFERENCES vendas(id_venda) ON DELETE CASCADE
        ) ENGINE=InnoDB
        """
    
    with connection.cursor() as cursor:
        cursor.execute(vendas_sql)
        cursor.execute(itens_sql)


def drop_vendas_tables(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    if is_sqlite:
        drop_itens = "DROP TABLE IF EXISTS venda_itens"
        drop_vendas = "DROP TABLE IF EXISTS vendas"
    else:
        drop_itens = "DROP TABLE IF EXISTS `venda_itens`"
        drop_vendas = "DROP TABLE IF EXISTS `vendas`"
    
    with connection.cursor() as cursor:
        cursor.execute(drop_itens)
        cursor.execute(drop_vendas)


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0013_merge"),
    ]

    operations = [
        migrations.RunPython(
            code=create_vendas_tables,
            reverse_code=drop_vendas_tables,
        )
    ]
