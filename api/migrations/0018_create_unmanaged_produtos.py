from django.db import migrations, connection


def create_produtos_table(apps, schema_editor):
    """Create produtos table with database-specific SQL"""
    is_sqlite = connection.vendor == 'sqlite'
    
    if is_sqlite:
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS produtos (
                id_produto INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_produto VARCHAR(50) UNIQUE,
                nome_produto VARCHAR(255),
                descricao TEXT,
                unidade_medida VARCHAR(10),
                id_grupo INTEGER NULL,
                marca VARCHAR(100),
                classificacao VARCHAR(15),
                ncm VARCHAR(10),
                tributacao_info TEXT,
                estoque_atual REAL DEFAULT 0.000,
                valor_custo REAL DEFAULT 0.00,
                valor_compra REAL DEFAULT 0.00,
                valor_venda REAL DEFAULT 0.00,
                observacoes TEXT,
                imagem_url VARCHAR(500)
            )
        """)
    else:
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS `produtos` (
                `id_produto` INT AUTO_INCREMENT PRIMARY KEY,
                `codigo_produto` VARCHAR(50) UNIQUE,
                `nome_produto` VARCHAR(255),
                `descricao` TEXT,
                `unidade_medida` VARCHAR(10),
                `id_grupo` INT NULL,
                `marca` VARCHAR(100),
                `classificacao` VARCHAR(15),
                `ncm` VARCHAR(10),
                `tributacao_info` TEXT,
                `estoque_atual` DECIMAL(10,3) DEFAULT 0.000,
                `valor_custo` DECIMAL(10,2) DEFAULT 0.00,
                `valor_compra` DECIMAL(10,2) DEFAULT 0.00,
                `valor_venda` DECIMAL(10,2) DEFAULT 0.00,
                `observacoes` TEXT,
                `imagem_url` VARCHAR(500)
            ) ENGINE=InnoDB
        """)


def drop_produtos_table(apps, schema_editor):
    """Drop produtos table"""
    schema_editor.execute("DROP TABLE IF EXISTS produtos")


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0017_create_unmanaged_tables'),
    ]

    operations = [
        migrations.RunPython(create_produtos_table, reverse_code=drop_produtos_table),
    ]
