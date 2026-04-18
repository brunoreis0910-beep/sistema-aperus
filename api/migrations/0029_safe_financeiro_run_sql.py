from django.db import migrations


def forwards(apps, schema_editor):
    """Executa alterações condicionais no schema usando information_schema quando necessário.

    Isso evita SQL não suportado por versões antigas do MySQL (ex: ADD COLUMN IF NOT EXISTS).
    """
    conn = schema_editor.connection
    with conn.cursor() as cur:
        def column_exists(table, column):
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = %s AND column_name = %s",
                (table, column),
            )
            return cur.fetchone()[0] > 0

        def table_exists(table):
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name = %s",
                (table,),
            )
            return cur.fetchone()[0] > 0

        # 1) coluna gerou_financeiro em vendas
        try:
            if not column_exists('vendas', 'gerou_financeiro'):
                cur.execute("ALTER TABLE `vendas` ADD COLUMN `gerou_financeiro` TINYINT(1) NULL DEFAULT 0")
        except Exception:
            # não interromper a migration se falhar; registrar no output
            print('Aviso: falha ao adicionar coluna gerou_financeiro em vendas (pode já existir ou não ser compatível)')

        # 2) colunas em formas_pagamento
        try:
            for col_def in [
                ( 'dias_vencimento', 'INT DEFAULT 0' ),
                ( 'id_conta_padrao', 'INT NULL' ),
                ( 'id_centro_custo', 'INT NULL' ),
                ( 'id_departamento', 'INT NULL' ),
            ]:
                col, defn = col_def
                if not column_exists('formas_pagamento', col):
                    cur.execute(f"ALTER TABLE `formas_pagamento` ADD COLUMN `{col}` {defn}")
        except Exception:
            print('Aviso: falha ao garantir colunas em formas_pagamento')

        # 3) criar tabela financeiro_contas se não existir
        try:
            if not table_exists('financeiro_contas'):
                cur.execute('''
                    CREATE TABLE `financeiro_contas` (
                      `id_conta` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                      `tipo_conta` VARCHAR(7) NOT NULL,
                      `id_cliente_fornecedor` INT NULL,
                      `descricao` VARCHAR(255) NOT NULL,
                      `valor_parcela` DECIMAL(10,2) NOT NULL,
                      `valor_liquidado` DECIMAL(10,2) NULL DEFAULT 0.00,
                      `valor_juros` DECIMAL(10,2) NULL DEFAULT 0.00,
                      `valor_multa` DECIMAL(10,2) NULL DEFAULT 0.00,
                      `valor_desconto` DECIMAL(10,2) NULL DEFAULT 0.00,
                      `data_emissao` DATE,
                      `data_vencimento` DATE NOT NULL,
                      `data_pagamento` DATE NULL,
                      `status_conta` VARCHAR(9) DEFAULT 'Pendente',
                      `forma_pagamento` VARCHAR(50) NULL,
                      `id_venda_origem` INT NULL,
                      `id_compra_origem` INT NULL,
                      `id_os_origem` INT NULL,
                      `id_operacao` INT NULL,
                      `id_departamento` INT NULL,
                      `id_centro_custo` INT NULL,
                      `id_conta_cobranca` INT NULL,
                      `id_conta_baixa` INT NULL,
                      `documento_numero` VARCHAR(50) NULL,
                      `parcela_numero` INT DEFAULT 1,
                      `parcela_total` INT DEFAULT 1,
                      `gerencial` TINYINT DEFAULT 0
                    ) ENGINE=InnoDB;
                ''')
        except Exception:
            print('Aviso: falha ao criar tabela financeiro_contas')

        # 4) índices (criar apenas se tabela existir)
        try:
            if table_exists('financeiro_contas'):
                # CREATE INDEX IF NOT EXISTS não é suportado em versões antigas, então fazemos um check simples
                cur.execute("SHOW INDEX FROM financeiro_contas WHERE Key_name = 'idx_financeiro_data_vencimento'")
                if not cur.fetchone():
                    # index on date (first 10 chars) may not be necessary; create simple index on column
                    cur.execute("CREATE INDEX idx_financeiro_data_vencimento ON financeiro_contas (data_vencimento)")
                cur.execute("SHOW INDEX FROM financeiro_contas WHERE Key_name = 'idx_financeiro_cliente'")
                if not cur.fetchone():
                    cur.execute("CREATE INDEX idx_financeiro_cliente ON financeiro_contas (id_cliente_fornecedor)")
        except Exception:
            print('Aviso: falha ao criar índices em financeiro_contas')

        # 5) colunas em venda_itens
        try:
            for col_def in [
                ( 'valor_unitario', 'DECIMAL(12,2) NULL' ),
                ( 'valor_total', 'DECIMAL(12,2) NULL' ),
                ( 'valor_desconto', 'DECIMAL(12,2) NULL' ),
            ]:
                col, defn = col_def
                if not column_exists('venda_itens', col):
                    cur.execute(f"ALTER TABLE `venda_itens` ADD COLUMN `{col}` {defn}")
        except Exception:
            print('Aviso: falha ao garantir colunas em venda_itens')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0028_fornecedor_alter_centrocusto_options_and_more'),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=migrations.RunPython.noop),
    ]
