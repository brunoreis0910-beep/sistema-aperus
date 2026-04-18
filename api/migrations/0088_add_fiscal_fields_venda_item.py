"""
Migration 0088 — Campos Fiscais em VendaItem
============================================
Adiciona todos os campos fiscais à tabela venda_itens:
  - Classificação: ncm_codigo, cest_codigo, cfop, c_benef, c_class_trib, nivel_tributacao
  - ICMS: cst_csosn, modalidade_bc, reducao_bc, bc, aliq, valor
  - ICMS-ST: bc, aliq, valor
  - PIS: cst, aliq, bc, valor
  - COFINS: cst, aliq, bc, valor
  - IPI: cst, aliq, bc, valor
  - IBS/CBS/IS (Reforma 2026): cst, aliq, bc, valor
  - Reforma: tipo_produto_reform, split_payment
  - Totais: valor_total_tributos, carga_tributaria_perc
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0087_add_regra_fiscal_split_tipocliente'),
    ]

    operations = [
        # ── Classificação Fiscal ─────────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='ncm_codigo',
            field=models.CharField(blank=True, db_column='ncm_codigo', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='cest_codigo',
            field=models.CharField(blank=True, db_column='cest_codigo', max_length=9, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='cfop',
            field=models.CharField(blank=True, db_column='cfop', max_length=4, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='c_benef',
            field=models.CharField(blank=True, db_column='c_benef', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='c_class_trib',
            field=models.CharField(blank=True, db_column='c_class_trib', max_length=10, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='nivel_tributacao',
            field=models.SmallIntegerField(
                blank=True, db_column='nivel_tributacao', null=True,
                help_text='Nível hierárquico da regra fiscal usada (1=mais específica … 8=default)'
            ),
        ),
        # ── Bloco ICMS ───────────────────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='icms_cst_csosn',
            field=models.CharField(blank=True, db_column='icms_cst_csosn', max_length=3, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='icms_modalidade_bc',
            field=models.CharField(blank=True, db_column='icms_modalidade_bc', max_length=1, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='icms_reducao_bc_perc',
            field=models.DecimalField(blank=True, db_column='icms_reducao_bc_perc', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='icms_bc',
            field=models.DecimalField(blank=True, db_column='icms_bc', decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='icms_aliq',
            field=models.DecimalField(blank=True, db_column='icms_aliq', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='valor_icms',
            field=models.DecimalField(blank=True, db_column='valor_icms', decimal_places=2, max_digits=14, null=True),
        ),
        # ── Bloco ICMS-ST ────────────────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='icmsst_bc',
            field=models.DecimalField(blank=True, db_column='icmsst_bc', decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='icmsst_aliq',
            field=models.DecimalField(blank=True, db_column='icmsst_aliq', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='valor_icms_st',
            field=models.DecimalField(blank=True, db_column='valor_icms_st', decimal_places=2, max_digits=14, null=True),
        ),
        # ── Bloco PIS ────────────────────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='pis_cst',
            field=models.CharField(blank=True, db_column='pis_cst', max_length=2, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='pis_aliq',
            field=models.DecimalField(blank=True, db_column='pis_aliq', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='pis_bc',
            field=models.DecimalField(blank=True, db_column='pis_bc', decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='valor_pis',
            field=models.DecimalField(blank=True, db_column='valor_pis', decimal_places=2, max_digits=14, null=True),
        ),
        # ── Bloco COFINS ─────────────────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='cofins_cst',
            field=models.CharField(blank=True, db_column='cofins_cst', max_length=2, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='cofins_aliq',
            field=models.DecimalField(blank=True, db_column='cofins_aliq', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='cofins_bc',
            field=models.DecimalField(blank=True, db_column='cofins_bc', decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='valor_cofins',
            field=models.DecimalField(blank=True, db_column='valor_cofins', decimal_places=2, max_digits=14, null=True),
        ),
        # ── Bloco IPI ────────────────────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='ipi_cst',
            field=models.CharField(blank=True, db_column='ipi_cst', max_length=2, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='ipi_aliq',
            field=models.DecimalField(blank=True, db_column='ipi_aliq', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='ipi_bc',
            field=models.DecimalField(blank=True, db_column='ipi_bc', decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='valor_ipi',
            field=models.DecimalField(blank=True, db_column='valor_ipi', decimal_places=2, max_digits=14, null=True),
        ),
        # ── Bloco IBS — Reforma 2026 ─────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='ibs_cst',
            field=models.CharField(blank=True, db_column='ibs_cst', max_length=3, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='ibs_aliq',
            field=models.DecimalField(blank=True, db_column='ibs_aliq', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='ibs_bc',
            field=models.DecimalField(blank=True, db_column='ibs_bc', decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='valor_ibs',
            field=models.DecimalField(blank=True, db_column='valor_ibs', decimal_places=2, max_digits=14, null=True),
        ),
        # ── Bloco CBS — Reforma 2026 ─────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='cbs_cst',
            field=models.CharField(blank=True, db_column='cbs_cst', max_length=3, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='cbs_aliq',
            field=models.DecimalField(blank=True, db_column='cbs_aliq', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='cbs_bc',
            field=models.DecimalField(blank=True, db_column='cbs_bc', decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='valor_cbs',
            field=models.DecimalField(blank=True, db_column='valor_cbs', decimal_places=2, max_digits=14, null=True),
        ),
        # ── Bloco IS — Reforma 2026 ──────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='is_aliq',
            field=models.DecimalField(blank=True, db_column='is_aliq', decimal_places=4, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='valor_is',
            field=models.DecimalField(blank=True, db_column='valor_is', decimal_places=2, max_digits=14, null=True),
        ),
        # ── Tipo de Produto e Split Payment ──────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='tipo_produto_reform',
            field=models.CharField(blank=True, db_column='tipo_produto_reform', max_length=12, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='split_payment',
            field=models.BooleanField(db_column='split_payment', default=False),
        ),
        # ── Totais de Tributos ────────────────────────────────────────────────
        migrations.AddField(
            model_name='vendaitem',
            name='valor_total_tributos',
            field=models.DecimalField(blank=True, db_column='valor_total_tributos', decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name='vendaitem',
            name='carga_tributaria_perc',
            field=models.DecimalField(blank=True, db_column='carga_tributaria_perc', decimal_places=4, max_digits=7, null=True),
        ),
    ]
