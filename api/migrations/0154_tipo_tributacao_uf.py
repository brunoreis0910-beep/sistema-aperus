"""
Migration 0154 — Cria tabelas tributacao_tipos e tributacao_uf.

Implementa o modelo de perfis de tributação ICMS por tipo (ex: CONSUMIDOR,
REVENDEDOR) com grid de alíquotas por UF de destino.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0153_add_fcp_aliq_regra_fiscal'),
    ]

    operations = [
        # ── Cabeçalho do perfil de tributação ────────────────────────────────
        migrations.CreateModel(
            name='TipoTributacao',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100, help_text='Nome do perfil (ex: CONSUMIDOR, REVENDEDOR)')),
                ('icms_cst_csosn', models.CharField(
                    max_length=3, null=True, blank=True,
                    help_text='CST (00-99) ou CSOSN (101, 102, 400, 500, 900…)',
                )),
                ('icms_modalidade_bc', models.CharField(
                    max_length=1, default='3',
                    choices=[
                        ('0', '0 - Margem Valor Agregado (%)'),
                        ('1', '1 - Pauta (valor)'),
                        ('2', '2 - Preço Tabelado Máx. Sugerido'),
                        ('3', '3 - Valor da Operação'),
                    ],
                )),
                ('cfop_padrao', models.CharField(max_length=5, null=True, blank=True)),
                ('cfop_devolucao', models.CharField(max_length=5, null=True, blank=True)),
                ('icmsst_modalidade_bc', models.CharField(
                    max_length=1, null=True, blank=True,
                    choices=[
                        ('0', '0 - Preço Tabelado ou Máximo Sugerido'),
                        ('1', '1 - Lista Negativa (valor)'),
                        ('2', '2 - Lista Positiva (valor)'),
                        ('3', '3 - Lista Neutra (valor)'),
                        ('4', '4 - Margem Valor Agregado (%)'),
                        ('5', '5 - Pauta (valor)'),
                        ('6', '6 - Valor da Operação'),
                    ],
                )),
                ('antecipacao_tributaria', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('considera_sintegra', models.BooleanField(default=False)),
                ('observacao_nfe', models.TextField(null=True, blank=True)),
                ('ativo', models.BooleanField(default=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('empresa', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='tipos_tributacao',
                    to='api.empresaconfig',
                )),
            ],
            options={
                'verbose_name': 'Tipo de Tributação ICMS',
                'verbose_name_plural': 'Tipos de Tributação ICMS',
                'db_table': 'tributacao_tipos',
                'ordering': ['nome'],
                'managed': True,
            },
        ),
        migrations.AlterUniqueTogether(
            name='tipotributacao',
            unique_together={('empresa', 'nome')},
        ),
        migrations.AddIndex(
            model_name='tipotributacao',
            index=models.Index(fields=['empresa', 'nome'], name='trib_tipo_empresa_nome_idx'),
        ),

        # ── Grid de alíquotas por UF ─────────────────────────────────────────
        migrations.CreateModel(
            name='TributacaoUF',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uf_destino', models.CharField(
                    max_length=2,
                    choices=[
                        ('AC', 'AC - Acre'), ('AL', 'AL - Alagoas'), ('AM', 'AM - Amazonas'),
                        ('AP', 'AP - Amapá'), ('BA', 'BA - Bahia'), ('CE', 'CE - Ceará'),
                        ('DF', 'DF - Distrito Federal'), ('ES', 'ES - Espírito Santo'),
                        ('EX', 'EX - Exterior'), ('GO', 'GO - Goiás'), ('MA', 'MA - Maranhão'),
                        ('MG', 'MG - Minas Gerais'), ('MS', 'MS - Mato Grosso do Sul'),
                        ('MT', 'MT - Mato Grosso'), ('PA', 'PA - Pará'), ('PB', 'PB - Paraíba'),
                        ('PE', 'PE - Pernambuco'), ('PI', 'PI - Piauí'), ('PR', 'PR - Paraná'),
                        ('RJ', 'RJ - Rio de Janeiro'), ('RN', 'RN - Rio G. Norte'),
                        ('RO', 'RO - Rondônia'), ('RR', 'RR - Roraima'),
                        ('RS', 'RS - Rio G. do Sul'), ('SC', 'SC - Santa Catarina'),
                        ('SE', 'SE - Sergipe'), ('SP', 'SP - São Paulo'), ('TO', 'TO - Tocantins'),
                    ],
                )),
                ('cfop_saida', models.CharField(max_length=5, null=True, blank=True)),
                ('icms_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('reducao_bc_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('icmsst_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('icmsst_mva_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('reducao_bc_st_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('frete_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('seguro_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('outras_despesas_perc', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('fcp_aliq', models.DecimalField(max_digits=7, decimal_places=4, default=0.0)),
                ('tipo_tributacao', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='aliquotas_uf',
                    to='api.tipotributacao',
                )),
            ],
            options={
                'verbose_name': 'Alíquota por UF',
                'verbose_name_plural': 'Alíquotas por UF',
                'db_table': 'tributacao_uf',
                'ordering': ['uf_destino'],
                'managed': True,
            },
        ),
        migrations.AlterUniqueTogether(
            name='tributacaouf',
            unique_together={('tipo_tributacao', 'uf_destino')},
        ),
        migrations.AddIndex(
            model_name='tributacaouf',
            index=models.Index(fields=['tipo_tributacao', 'uf_destino'], name='trib_uf_tipo_uf_idx'),
        ),
    ]
