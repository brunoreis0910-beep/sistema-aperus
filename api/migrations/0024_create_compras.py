from django.db import migrations, connection


def create_compras_tables(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    if is_sqlite:
        compras_sql = '''
        CREATE TABLE IF NOT EXISTS compras (
            id_compra INTEGER PRIMARY KEY AUTOINCREMENT,
            id_operacao INTEGER DEFAULT NULL,
            id_fornecedor INTEGER DEFAULT NULL,
            numero_documento VARCHAR(50) DEFAULT NULL,
            data_documento DATETIME DEFAULT CURRENT_TIMESTAMP,
            dados_entrada TEXT DEFAULT NULL,
            valor_total REAL DEFAULT 0.00,
            valor_desconto REAL DEFAULT 0.00,
            criado_por INTEGER DEFAULT NULL,
            data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        '''
        
        compra_itens_sql = '''
        CREATE TABLE IF NOT EXISTS compra_itens (
            id_item INTEGER PRIMARY KEY AUTOINCREMENT,
            id_compra INTEGER NOT NULL,
            id_produto INTEGER DEFAULT NULL,
            quantidade REAL DEFAULT 0.000,
            valor_compra REAL DEFAULT 0.00,
            valor_total REAL DEFAULT 0.00,
            desconto REAL DEFAULT 0.00,
            FOREIGN KEY (id_compra) REFERENCES compras(id_compra) ON DELETE CASCADE
        )
        '''
    else:
        compras_sql = '''
        CREATE TABLE IF NOT EXISTS compras (
            id_compra INT AUTO_INCREMENT PRIMARY KEY,
            id_operacao INT DEFAULT NULL,
            id_fornecedor INT DEFAULT NULL,
            numero_documento VARCHAR(50) DEFAULT NULL,
            data_documento DATETIME DEFAULT CURRENT_TIMESTAMP,
            dados_entrada TEXT DEFAULT NULL,
            valor_total DECIMAL(12,2) DEFAULT 0.00,
            valor_desconto DECIMAL(12,2) DEFAULT 0.00,
            criado_por INT DEFAULT NULL,
            data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        '''
        
        compra_itens_sql = '''
        CREATE TABLE IF NOT EXISTS compra_itens (
            id_item INT AUTO_INCREMENT PRIMARY KEY,
            id_compra INT NOT NULL,
            id_produto INT DEFAULT NULL,
            quantidade DECIMAL(12,3) DEFAULT 0.000,
            valor_compra DECIMAL(12,2) DEFAULT 0.00,
            valor_total DECIMAL(12,2) DEFAULT 0.00,
            desconto DECIMAL(12,2) DEFAULT 0.00,
            CONSTRAINT fk_compra_itens_compra FOREIGN KEY (id_compra) REFERENCES compras(id_compra) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        '''
    
    with connection.cursor() as cursor:
        cursor.execute(compras_sql)
        cursor.execute(compra_itens_sql)


def drop_compras_tables(apps, schema_editor):
    with connection.cursor() as cursor:
        cursor.execute("DROP TABLE IF EXISTS compra_itens")
        cursor.execute("DROP TABLE IF EXISTS compras")


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0023_create_fornecedores'),
    ]

    operations = [
        migrations.RunPython(
            code=create_compras_tables,
            reverse_code=drop_compras_tables,
        ),
    ]
