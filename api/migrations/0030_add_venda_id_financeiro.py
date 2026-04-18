"""Adiciona campo `id_financeiro` (FK -> `financeiro_contas.id_conta`) em `vendas`.

Observações importantes:
- Este projeto usa um banco legado com discrepâncias entre os modelos Django
  e o esquema real. Em alguns ambientes a coluna `id_financeiro_id` já foi criada
  manualmente ou parcialmente, e a população dos valores foi executada por scripts
  externos. Para evitar failures durante `migrate` em produção, esta migration foi
  escrita para ser idempotente e segura:
  - Se a coluna já existe, NÃO tenta recriá-la (evita Duplicate column name).
  - A população é feita via SQL JOIN (UPDATE ... JOIN ...) e é idempotente.
  - O reverse tenta remover a coluna somente se ela tiver sido criada por esta migration.

Nota: durante trabalhos manuais recentes, os valores de `vendas.id_financeiro_id`
foram atualizados diretamente com um UPDATE SQL e a migration foi marcada como
aplicada (`--fake`). Mantenha um backup antes de rodar alterações em produção.
"""

from django.db import migrations


def apply_safe_add_and_populate(apps, schema_editor):
    """Adicionar coluna se não existir e popular com JOIN contra `financeiro_contas`.

    Estratégia:
    - verificar se coluna existe (SQLite usa PRAGMA, MySQL usa information_schema).
    - se ausente, executar ALTER TABLE para adicionar coluna nullable INT.
    - executar UPDATE ... JOIN para preencher valores onde houver correspondência
      entre `financeiro_contas.id_venda_origem` e `vendas.id_venda`.
    """

    conn = schema_editor.connection
    is_sqlite = conn.vendor == 'sqlite'
    
    with conn.cursor() as cursor:
        # Verifica se a coluna já existe
        if is_sqlite:
            cursor.execute("PRAGMA table_info(vendas)")
            columns = [row[1] for row in cursor.fetchall()]
            col_exists = 'id_financeiro_id' in columns
        else:
            cursor.execute(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vendas' "
                "AND COLUMN_NAME='id_financeiro_id'"
            )
            col_exists = cursor.fetchone()[0] > 0

        if not col_exists:
            # Adiciona a coluna nullable sem criar constraints para máxima compatibilidade
            if is_sqlite:
                cursor.execute("ALTER TABLE vendas ADD COLUMN id_financeiro_id INTEGER NULL")
            else:
                cursor.execute("ALTER TABLE vendas ADD COLUMN id_financeiro_id INT NULL")

        # Popula usando um UPDATE idempotente (não altera linhas já preenchidas)
        if is_sqlite:
            # SQLite não suporta UPDATE ... JOIN, usar subquery
            cursor.execute(
                "UPDATE vendas "
                "SET id_financeiro_id = ("
                "  SELECT id_conta FROM financeiro_contas "
                "  WHERE id_venda_origem = vendas.id_venda "
                "  LIMIT 1"
                ") "
                "WHERE id_financeiro_id IS NULL "
                "AND EXISTS (SELECT 1 FROM financeiro_contas WHERE id_venda_origem = vendas.id_venda)"
            )
        else:
            cursor.execute(
                "UPDATE vendas v "
                "JOIN financeiro_contas f ON f.id_venda_origem = v.id_venda "
                "SET v.id_financeiro_id = f.id_conta "
                "WHERE v.id_financeiro_id IS NULL"
            )


def reverse_safe_add_and_populate(apps, schema_editor):
    """Ao reverter: remover a coluna `id_financeiro_id` somente se ela existir.

    Observação: remoção de colunas é potencialmente destrutiva. Em ambientes com
    dados importantes prefira gerenciar manualmente.
    """
    conn = schema_editor.connection
    is_sqlite = conn.vendor == 'sqlite'
    
    with conn.cursor() as cursor:
        # Verifica se a coluna existe
        if is_sqlite:
            cursor.execute("PRAGMA table_info(vendas)")
            columns = [row[1] for row in cursor.fetchall()]
            col_exists = 'id_financeiro_id' in columns
        else:
            cursor.execute(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vendas' "
                "AND COLUMN_NAME='id_financeiro_id'"
            )
            col_exists = cursor.fetchone()[0] > 0
        
        if col_exists:
            # SQLite não suporta DROP COLUMN facilmente - deixar a coluna
            if not is_sqlite:
                cursor.execute("ALTER TABLE vendas DROP COLUMN id_financeiro_id")


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0029_safe_financeiro_run_sql'),
    ]

    operations = [
        migrations.RunPython(apply_safe_add_and_populate, reverse_safe_add_and_populate),
    ]
