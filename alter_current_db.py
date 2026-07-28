# alter_current_db.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "projeto_gerencial.settings")
django.setup()

from django.db import connections

for db_alias in connections:
    conn = connections[db_alias]
    print(f"Verificando banco de dados '{db_alias}'...")
    with conn.cursor() as cursor:
        cursor.execute("SHOW TABLES LIKE 'clientes'")
        if cursor.fetchone():
            cursor.execute("SHOW COLUMNS FROM clientes LIKE 'permite_venda_prazo'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE clientes ADD COLUMN permite_venda_prazo TINYINT(1) DEFAULT 1;")
                print(f"  [OK] Coluna permite_venda_prazo adicionada em '{db_alias}'.")
            else:
                print(f"  Coluna permite_venda_prazo já existe em '{db_alias}'.")
            
            cursor.execute("UPDATE clientes SET permite_venda_prazo = 0 WHERE UPPER(nome_razao_social) = 'CONSUMIDOR' OR cpf_cnpj = '00000000000';")
            print(f"  [OK] Clientes CONSUMIDOR desativados: {cursor.rowcount} em '{db_alias}'.")
