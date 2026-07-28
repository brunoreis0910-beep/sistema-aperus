# alter_permite_venda_prazo.py
import os
import sys

def run_alterations(sys_path, settings_mod):
    print(f"\n--- Alterando {settings_mod} em {sys_path} ---")
    
    # Save original sys.path and env
    orig_path = list(sys.path)
    orig_env = os.environ.get("DJANGO_SETTINGS_MODULE")
    
    try:
        # Set paths
        if sys_path not in sys.path:
            sys.path.insert(0, sys_path)
        os.environ["DJANGO_SETTINGS_MODULE"] = settings_mod
        
        # Initialize django
        import django
        # Unload django-related modules if already imported
        for mod in list(sys.modules.keys()):
            if mod.startswith("django.") or mod == "django" or mod.startswith("api."):
                del sys.modules[mod]
                
        import django
        django.setup()
        
        from django.db import connections
        
        for db_alias in connections:
            conn = connections[db_alias]
            print(f"Verificando banco de dados '{db_alias}'...")
            try:
                with conn.cursor() as cursor:
                    # Verifica se a tabela clientes existe
                    cursor.execute("SHOW TABLES LIKE 'clientes'")
                    if not cursor.fetchone():
                        print(f"  Tabela 'clientes' não existe em '{db_alias}'. Pulando.")
                        continue
                    
                    # 1. Adiciona coluna se não existir
                    try:
                        cursor.execute("SHOW COLUMNS FROM clientes LIKE 'permite_venda_prazo'")
                        if cursor.fetchone():
                            print(f"  Coluna 'permite_venda_prazo' já existe em '{db_alias}'.")
                        else:
                            cursor.execute("ALTER TABLE clientes ADD COLUMN permite_venda_prazo TINYINT(1) DEFAULT 1;")
                            print(f"  [OK] Adicionada coluna 'permite_venda_prazo' em '{db_alias}'.")
                    except Exception as col_err:
                        print(f"  Erro ao adicionar coluna permite_venda_prazo em '{db_alias}': {col_err}")
                    
                    # 2. Atualiza os clientes 'CONSUMIDOR' para permite_venda_prazo = 0
                    try:
                        cursor.execute("UPDATE clientes SET permite_venda_prazo = 0 WHERE UPPER(nome_razao_social) = 'CONSUMIDOR' OR cpf_cnpj = '00000000000';")
                        rowcount = cursor.rowcount
                        print(f"  [OK] Clientes atualizados: {rowcount} em '{db_alias}'.")
                    except Exception as upd_err:
                        print(f"  Erro ao atualizar clientes CONSUMIDOR em '{db_alias}': {upd_err}")
                        
            except Exception as db_err:
                print(f"  Erro ao acessar o banco de dados '{db_alias}': {db_err}")
                
    finally:
        # Restore path and env
        sys.path = orig_path
        if orig_env is not None:
            os.environ["DJANGO_SETTINGS_MODULE"] = orig_env
        else:
            os.environ.pop("DJANGO_SETTINGS_MODULE", None)

def main():
    # 1. SistemaAperus
    run_alterations(r"C:\APERUS\SistemaAperus", "projeto_gerencial.settings")
    
    # 2. aperus_mae
    run_alterations(r"C:\APERUS\aperus_mae", "projeto_gerencial.settings")
    
    # 3. aperus_amerpusinformatica
    run_alterations(r"C:\APERUS\arquivos_clientes\aperus_amerpusinformatica", "projeto_gerencial.settings")

if __name__ == "__main__":
    main()
