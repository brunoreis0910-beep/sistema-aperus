# Generated manually - 2026-03-07
# Adiciona:
#   - ultimo_numero_nfe e serie_nfe_padrao em empresa_config (raw SQL, managed=False)
#   - chave_nfe_referenciada em devolucoes (Django migration)

from django.db import migrations, models


def add_empresa_config_columns(apps, schema_editor):
    """Adiciona colunas em empresa_config verificando existência antes (compatível MySQL 5.7+)."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'empresa_config'
              AND COLUMN_NAME IN ('ultimo_numero_nfe', 'serie_nfe_padrao')
        """)
        existing = {row[0] for row in cursor.fetchall()}

        if 'ultimo_numero_nfe' not in existing:
            cursor.execute(
                "ALTER TABLE empresa_config "
                "ADD COLUMN ultimo_numero_nfe INT NOT NULL DEFAULT 0 "
                "COMMENT 'Último número de NF-e emitido (contador global por CNPJ/Série)'"
            )
        if 'serie_nfe_padrao' not in existing:
            cursor.execute(
                "ALTER TABLE empresa_config "
                "ADD COLUMN serie_nfe_padrao VARCHAR(3) NOT NULL DEFAULT '1' "
                "COMMENT 'Série padrão para emissão de NF-e'"
            )


def remove_empresa_config_columns(apps, schema_editor):
    """Reverte as colunas adicionadas."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'empresa_config'
              AND COLUMN_NAME IN ('ultimo_numero_nfe', 'serie_nfe_padrao')
        """)
        existing = {row[0] for row in cursor.fetchall()}

        if 'ultimo_numero_nfe' in existing:
            cursor.execute("ALTER TABLE empresa_config DROP COLUMN ultimo_numero_nfe")
        if 'serie_nfe_padrao' in existing:
            cursor.execute("ALTER TABLE empresa_config DROP COLUMN serie_nfe_padrao")


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0108_venda_chave_nfe_referenciada'),
    ]

    operations = [
        # ── empresa_config (managed=False → RunPython com verificação) ─────────
        migrations.RunPython(
            code=add_empresa_config_columns,
            reverse_code=remove_empresa_config_columns,
        ),

        # ── devolucoes (managed=True → field migration) ────────────────────────
        migrations.AddField(
            model_name='devolucao',
            name='chave_nfe_referenciada',
            field=models.CharField(
                max_length=44,
                blank=True,
                null=True,
                help_text='Chave de Acesso da NF-e/NFC-e de origem (campo refNFe na devolução)',
            ),
        ),
    ]
