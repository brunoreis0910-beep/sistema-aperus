import os

migrations_dir = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\migrations"

files_to_modify = [
    "0001_add_tipo_estoque_incremento.py",
    "0012_formapagamento.py",
    "0014_create_vendas_tables.py",
    "0015_saldo_movimentos_financeiro.py",
    "0018_create_unmanaged_produtos.py",
    "0020_add_operacoes_missing_columns.py",
    "0021_add_vendas_columns.py",
    "0022_add_operacao_incremento.py",
    "0023_create_fornecedores.py",
    "0024_create_compras.py",
    "0029_safe_financeiro_run_sql.py",
    "0030_add_venda_id_financeiro.py",
    "0109_sequencial_nfe_e_chave_devolucao.py",
    "0171_cliente_novos_campos_desconto.py",
    "0177_add_hotelaria_parametros.py"
]

def apply():
    print("Applying atomic = False to selected migrations...")
    for filename in files_to_modify:
        filepath = os.path.join(migrations_dir, filename)
        if not os.path.exists(filepath):
            print(f"Skipping (not found): {filename}")
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "atomic = False" not in content and "atomic=False" not in content:
            target = "class Migration(migrations.Migration):"
            replacement = "class Migration(migrations.Migration):\n    atomic = False"
            if target in content:
                new_content = content.replace(target, replacement)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Successfully modified: {filename}")
            else:
                print(f"Warning: class Migration line not found in: {filename}")
        else:
            print(f"Already configured: {filename}")

if __name__ == "__main__":
    apply()
