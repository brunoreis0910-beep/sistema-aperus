from django.db import migrations, connection


def create_fornecedores_table(apps, schema_editor):
    is_sqlite = connection.vendor == 'sqlite'
    
    if is_sqlite:
        sql = '''
        CREATE TABLE IF NOT EXISTS fornecedores (
            id_fornecedor INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_razao_social VARCHAR(255) NOT NULL,
            nome_fantasia VARCHAR(255) DEFAULT NULL,
            cpf_cnpj VARCHAR(18) NOT NULL UNIQUE,
            inscricao_estadual VARCHAR(20) DEFAULT NULL,
            endereco VARCHAR(255) DEFAULT NULL,
            numero VARCHAR(20) DEFAULT NULL,
            bairro VARCHAR(100) DEFAULT NULL,
            cidade VARCHAR(100) DEFAULT NULL,
            estado VARCHAR(2) DEFAULT NULL,
            cep VARCHAR(10) DEFAULT NULL,
            telefone VARCHAR(20) DEFAULT NULL,
            email VARCHAR(100) DEFAULT NULL,
            limite_credito REAL DEFAULT 0.00,
            logo_url VARCHAR(500) DEFAULT NULL,
            data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        '''
    else:
        sql = '''
        CREATE TABLE IF NOT EXISTS fornecedores (
            id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
            nome_razao_social VARCHAR(255) NOT NULL,
            nome_fantasia VARCHAR(255) DEFAULT NULL,
            cpf_cnpj VARCHAR(18) NOT NULL UNIQUE,
            inscricao_estadual VARCHAR(20) DEFAULT NULL,
            endereco VARCHAR(255) DEFAULT NULL,
            numero VARCHAR(20) DEFAULT NULL,
            bairro VARCHAR(100) DEFAULT NULL,
            cidade VARCHAR(100) DEFAULT NULL,
            estado VARCHAR(2) DEFAULT NULL,
            cep VARCHAR(10) DEFAULT NULL,
            telefone VARCHAR(20) DEFAULT NULL,
            email VARCHAR(100) DEFAULT NULL,
            limite_credito DECIMAL(10,2) DEFAULT 0.00,
            logo_url VARCHAR(500) DEFAULT NULL,
            data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        '''
    
    with connection.cursor() as cursor:
        cursor.execute(sql)


def drop_fornecedores_table(apps, schema_editor):
    with connection.cursor() as cursor:
        cursor.execute("DROP TABLE IF EXISTS fornecedores")


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_merge_20251028_1116'),
    ]

    operations = [
        migrations.RunPython(
            code=create_fornecedores_table,
            reverse_code=drop_fornecedores_table,
        ),
    ]
