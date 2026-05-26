import os
import sys
import django
from django.utils import timezone

# Add current directory to python path
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection

def corrigir():
    print("=== Corrigindo Banco de Dados ===")
    
    # 1. Adicionar colunas na tabela saas_cliente se não existirem
    columns = {
        'schema_name': "VARCHAR(50) NOT NULL DEFAULT 'central'",
        'db_host': "VARCHAR(100) NOT NULL DEFAULT 'localhost'",
        'db_port': "VARCHAR(5) NOT NULL DEFAULT '8005'",
        'is_test_environment': "TINYINT(1) NOT NULL DEFAULT 0",
        'bairro': "VARCHAR(100) NULL",
        'cep': "VARCHAR(10) NULL",
        'cidade': "VARCHAR(100) NULL",
        'complemento': "VARCHAR(100) NULL",
        'email': "VARCHAR(100) NULL",
        'endereco': "VARCHAR(255) NULL",
        'estado': "VARCHAR(2) NULL",
        'inscricao_estadual': "VARCHAR(20) NULL",
        'nome_fantasia': "VARCHAR(255) NULL",
        'numero': "VARCHAR(20) NULL",
        'proprietario': "VARCHAR(255) NULL",
        'telefone': "VARCHAR(20) NULL",
        'vendedor': "VARCHAR(100) NULL"
    }
    
    with connection.cursor() as cursor:
        print("Verificando colunas da tabela saas_cliente...")
        for col, defn in columns.items():
            cursor.execute(f"SHOW COLUMNS FROM saas_cliente LIKE '{col}'")
            if not cursor.fetchone():
                print(f"  -> Adicionando coluna: {col}...")
                cursor.execute(f"ALTER TABLE saas_cliente ADD COLUMN {col} {defn}")
        try:
            cursor.execute("ALTER TABLE saas_cliente ADD UNIQUE (schema_name)")
        except Exception:
            pass

    # 2. Corrigir historico de migracoes da pasta 'api'
    migrations_dir = 'api/migrations'
    migration_files = []
    if os.path.exists(migrations_dir):
        for f in os.listdir(migrations_dir):
            if f.endswith('.py') and f != '__init__.py':
                migration_files.append(f[:-3])

    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM django_migrations WHERE app = 'api'")
        applied = {row[0] for row in cursor.fetchall()}
        
        missing_count = 0
        for m in sorted(migration_files):
            if m not in applied:
                print(f"  -> Marcando migração api.{m} como aplicada...")
                cursor.execute(
                    "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s)",
                    ['api', m, timezone.now()]
                )
                missing_count += 1
        
        if missing_count > 0:
            connection.commit()
            print(f"Registradas {missing_count} migrações da app 'api' pendentes no banco.")
        else:
            print("Nenhuma migração da app 'api' pendente no histórico.")

    print("\n=== Correção concluída! ===")

if __name__ == '__main__':
    corrigir()
