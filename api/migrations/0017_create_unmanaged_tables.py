from django.db import migrations, connection


def create_tables(apps, schema_editor):
    """Create unmanaged tables with database-specific SQL"""
    is_sqlite = connection.vendor == 'sqlite'
    
    if is_sqlite:
        # SQLite syntax
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS contas_bancarias (
                id_conta_bancaria INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_conta VARCHAR(255)
            )
        """)
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS centro_custo (
                id_centro_custo INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_centro_custo VARCHAR(255)
            )
        """)
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS departamentos (
                id_departamento INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_departamento VARCHAR(255)
            )
        """)
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS operacoes (
                id_operacao INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_operacao VARCHAR(255),
                empresa VARCHAR(100),
                transacao VARCHAR(6),
                modelo_documento VARCHAR(10),
                emitente VARCHAR(8),
                usa_auto_numeracao INTEGER DEFAULT 0,
                serie_nf INTEGER DEFAULT 1,
                proximo_numero_nf INTEGER DEFAULT 1,
                tipo_estoque_baixa VARCHAR(50),
                tipo_estoque_incremento VARCHAR(50),
                gera_financeiro INTEGER DEFAULT 0
            )
        """)
    else:
        # MySQL syntax
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS `contas_bancarias` (
                `id_conta_bancaria` INT AUTO_INCREMENT PRIMARY KEY,
                `nome_conta` VARCHAR(255)
            ) ENGINE=InnoDB
        """)
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS `centro_custo` (
                `id_centro_custo` INT AUTO_INCREMENT PRIMARY KEY,
                `nome_centro_custo` VARCHAR(255)
            ) ENGINE=InnoDB
        """)
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS `departamentos` (
                `id_departamento` INT AUTO_INCREMENT PRIMARY KEY,
                `nome_departamento` VARCHAR(255)
            ) ENGINE=InnoDB
        """)
        schema_editor.execute("""
            CREATE TABLE IF NOT EXISTS `operacoes` (
                `id_operacao` INT AUTO_INCREMENT PRIMARY KEY,
                `nome_operacao` VARCHAR(255),
                `empresa` VARCHAR(100),
                `transacao` VARCHAR(6),
                `modelo_documento` VARCHAR(10),
                `emitente` VARCHAR(8),
                `usa_auto_numeracao` TINYINT(1) DEFAULT 0,
                `serie_nf` INT DEFAULT 1,
                `proximo_numero_nf` INT DEFAULT 1,
                `tipo_estoque_baixa` VARCHAR(50),
                `tipo_estoque_incremento` VARCHAR(50),
                `gera_financeiro` TINYINT(1) DEFAULT 0
            ) ENGINE=InnoDB
        """)


def drop_tables(apps, schema_editor):
    """Drop unmanaged tables"""
    schema_editor.execute("DROP TABLE IF EXISTS operacoes")
    schema_editor.execute("DROP TABLE IF EXISTS departamentos")
    schema_editor.execute("DROP TABLE IF EXISTS centro_custo")
    schema_editor.execute("DROP TABLE IF EXISTS contas_bancarias")


class Migration(migrations.Migration):
    # Make this migration depend on an earlier, stable migration so
    # unmanaged tables are created before migrations that reference them
    # (avoids circular dependency with later merge migrations).
    dependencies = [
        ('api', '0011_delete_formapagamento'),
    ]

    operations = [
        migrations.RunPython(create_tables, reverse_code=drop_tables),
    ]
