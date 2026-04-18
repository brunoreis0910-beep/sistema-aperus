"""
Migration 0153 — Recria tabela regras_fiscais.

A tabela foi excluída pela migration 0118_operacao_numeracao (DeleteModel).
Esta migration recria o modelo com todos os campos (incluindo o novo fcp_aliq).
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0152_allow_blank_descricao_recorrencia'),
    ]

    operations = [
        migrations.CreateModel(
            name='RegraFiscal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('regime_tributario', models.CharField(
                    blank=True, null=True, max_length=20,
                    choices=[
                        ('SIMPLES', 'Simples Nacional'), ('MEI', 'MEI'),
                        ('LUCRO_PRESUMIDO', 'Lucro Presumido'), ('LUCRO_REAL', 'Lucro Real'),
                        ('TODOS', 'Todos os regimes'),
                    ],
                    help_text='Regime tributário ao qual a regra se aplica',
                )),
                ('ncm_codigo', models.CharField(max_length=8, help_text='NCM do produto (8 dígitos, sem pontos)')),
                ('cest_codigo', models.CharField(max_length=7, blank=True, null=True, help_text='Código CEST (7 dígitos)')),
                ('tipo_operacao', models.CharField(
                    max_length=20, default='TODOS',
                    choices=[
                        ('INTERNA', 'Interna (dentro do estado)'), ('INTERESTADUAL', 'Interestadual'),
                        ('EXPORTACAO', 'Exportação'), ('TODOS', 'Todos os tipos'),
                    ],
                )),
                ('uf_destino', models.CharField(max_length=2, blank=True, null=True, help_text='UF de destino (vazio = todas)')),
                ('uf_origem', models.CharField(max_length=2, blank=True, null=True, help_text='UF de origem/emitente')),
                ('tipo_cliente', models.CharField(
                    max_length=20, default='TODOS',
                    choices=[
                        ('TODOS', 'Todos os clientes'),
                        ('CONSUMIDOR_FINAL', 'Consumidor Final (não contribuinte)'),
                        ('REVENDEDOR', 'Revendedor / Contribuinte ICMS'),
                    ],
                )),
                ('cfop', models.CharField(max_length=5, blank=True, null=True, help_text='CFOP (ex: 5102)')),
                ('c_benef', models.CharField(max_length=10, blank=True, null=True)),
                ('c_class_trib', models.CharField(max_length=10, blank=True, null=True)),
                ('icms_cst_csosn', models.CharField(max_length=3, blank=True, null=True, default='400')),
                ('icms_modalidade_bc', models.CharField(max_length=1, blank=True, null=True, default='3')),
                ('icms_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('icms_reducao_bc_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('icms_desonerado', models.DecimalField(max_digits=10, decimal_places=2, default=0.0, help_text='Valor do ICMS desonerado (vICMSDeson) em R$')),
                ('icmsst_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('icmsst_mva_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text='MVA / IVA original (%)')),
                ('icmsst_reducao_bc_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('fcp_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text='Alíquota FCP/FEM (%) — calculado sobre BC ICMS')),
                ('pis_cst', models.CharField(max_length=2, blank=True, null=True, default='07')),
                ('pis_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('cofins_cst', models.CharField(max_length=2, blank=True, null=True, default='07')),
                ('cofins_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('ipi_cst', models.CharField(max_length=2, blank=True, null=True, default='99')),
                ('ipi_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('ipi_classe_enquadramento', models.CharField(max_length=5, blank=True, null=True)),
                ('ibs_cst', models.CharField(max_length=3, blank=True, null=True)),
                ('ibs_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('cbs_cst', models.CharField(max_length=3, blank=True, null=True)),
                ('cbs_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('is_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0, help_text='Alíquota Imposto Seletivo (%)')),
                ('diferimento_icms_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('funrural_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('senar_aliq', models.DecimalField(max_digits=5, decimal_places=4, default=0.0)),
                ('split_payment', models.BooleanField(default=False)),
                ('tipo_produto_reform', models.CharField(
                    max_length=12, default='PADRAO',
                    choices=[
                        ('PADRAO', 'Padrão (alíquota cheia)'), ('REDUZIDA_50', 'Redução 50%'),
                        ('REDUZIDA_60', 'Redução 60%'), ('ISENTO', 'Isento'), ('MONOFASICO', 'Monofásico'),
                    ],
                )),
                ('descricao', models.CharField(max_length=255, blank=True, null=True)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('empresa', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='regras_fiscais',
                    to='api.empresaconfig',
                )),
            ],
            options={
                'verbose_name': 'Regra Fiscal ICMS',
                'verbose_name_plural': 'Regras Fiscais ICMS',
                'db_table': 'regras_fiscais',
                'ordering': ['ncm_codigo', 'tipo_operacao', 'uf_destino'],
                'managed': True,
            },
        ),
        migrations.AlterUniqueTogether(
            name='regrafiscal',
            unique_together={('empresa', 'ncm_codigo', 'tipo_operacao', 'uf_destino', 'uf_origem', 'tipo_cliente')},
        ),
        migrations.AddIndex(
            model_name='regrafiscal',
            index=models.Index(fields=['empresa', 'ncm_codigo', 'tipo_operacao'], name='regras_fisc_empresa_6ea746_idx'),
        ),
        migrations.AddIndex(
            model_name='regrafiscal',
            index=models.Index(fields=['tipo_produto_reform'], name='regras_fisc_tipo_pr_981237_idx'),
        ),
    ]
