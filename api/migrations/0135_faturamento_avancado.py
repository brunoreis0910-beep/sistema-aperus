# Generated migration for sistema de faturamento avançado

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0134_add_categoria_produto'),
    ]

    operations = [
        # ========================================
        # 1. Adicionar novos campos ao modelo Operacao
        # ========================================
        migrations.AddField(
            model_name='operacao',
            name='ind_faturamento',
            field=models.BooleanField(
                default=False,
                db_column='ind_faturamento',
                help_text='Se TRUE, esta operação é de faturamento (transforma pedidos/cupons em NF-e/NFC-e)'
            ),
        ),
        migrations.AddField(
            model_name='operacao',
            name='validar_estoque_fiscal',
            field=models.BooleanField(
                default=False,
                db_column='validar_estoque_fiscal',
                help_text='Se TRUE, valida o estoque fiscal antes de autorizar a emissão (diferente do estoque gerencial)'
            ),
        ),
        
        # ========================================
        # 2. Criar modelo SugestaoCFOP
        # ========================================
        migrations.CreateModel(
            name='SugestaoCFOP',
            fields=[
                ('id_sugestao_cfop', models.AutoField(db_column='id_sugestao_cfop', primary_key=True, serialize=False)),
                ('tipo_destino', models.CharField(
                    choices=[
                        ('dentro_estado', 'Dentro do Estado'),
                        ('fora_estado', 'Fora do Estado'),
                        ('cupom_para_nota', 'Cupom → Nota (CFOP 5929)'),
                    ],
                    db_column='tipo_destino',
                    help_text='Tipo de destino: dentro_estado, fora_estado, cupom_para_nota',
                    max_length=20
                )),
                ('cfop_sugerido', models.CharField(
                    db_column='cfop_sugerido',
                    help_text='CFOP sugerido para este tipo de destino (ex: 5102, 6102, 5929)',
                    max_length=4
                )),
                ('descricao', models.CharField(
                    blank=True,
                    db_column='descricao',
                    help_text='Descrição da natureza da operação (ex: Venda de mercadoria adquirida de terceiros)',
                    max_length=200,
                    null=True
                )),
                ('ativo', models.BooleanField(
                    db_column='ativo',
                    default=True,
                    help_text='Se FALSE, esta sugestão não será aplicada'
                )),
                ('id_operacao', models.ForeignKey(
                    db_column='id_operacao',
                    help_text='Operação à qual esta sugestão de CFOP está vinculada',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='sugestoes_cfop',
                    to='api.operacao'
                )),
            ],
            options={
                'db_table': 'sugestao_cfop',
                'ordering': ['id_operacao', 'tipo_destino'],
                'managed': True,
            },
        ),
        migrations.AlterUniqueTogether(
            name='sugestaocfop',
            unique_together={('id_operacao', 'tipo_destino')},
        ),
        
        # ========================================
        # 3. Criar modelo NotaFiscalReferenciada
        # ========================================
        migrations.CreateModel(
            name='NotaFiscalReferenciada',
            fields=[
                ('id_nota_referenciada', models.AutoField(db_column='id_nota_referenciada', primary_key=True, serialize=False)),
                ('tipo_documento', models.CharField(
                    choices=[
                        ('NFE', 'NF-e (Nota Fiscal Eletrônica)'),
                        ('NFCE', 'NFC-e (Nota Fiscal Consumidor Eletrônica)'),
                        ('SAT', 'SAT (CF-e-SAT)'),
                        ('NFP', 'NF Produtor'),
                        ('CTE', 'CT-e (Conhecimento de Transporte Eletrônico)'),
                    ],
                    db_column='tipo_documento',
                    help_text='Tipo do documento referenciado',
                    max_length=10
                )),
                ('chave_acesso', models.CharField(
                    db_column='chave_acesso',
                    help_text='Chave de acesso do documento referenciado (44 caracteres)',
                    max_length=44
                )),
                ('numero_documento', models.CharField(
                    blank=True,
                    db_column='numero_documento',
                    help_text='Número do documento (apenas para visualização)',
                    max_length=20,
                    null=True
                )),
                ('serie_documento', models.CharField(
                    blank=True,
                    db_column='serie_documento',
                    help_text='Série do documento (apenas para visualização)',
                    max_length=3,
                    null=True
                )),
                ('data_emissao', models.DateTimeField(
                    blank=True,
                    db_column='data_emissao',
                    help_text='Data de emissão do documento referenciado',
                    null=True
                )),
                ('valor_total', models.DecimalField(
                    blank=True,
                    db_column='valor_total',
                    decimal_places=2,
                    help_text='Valor total do documento referenciado (informativo)',
                    max_digits=12,
                    null=True
                )),
                ('observacoes', models.TextField(
                    blank=True,
                    db_column='observacoes',
                    help_text='Observações sobre a referência',
                    null=True
                )),
                ('data_cadastro', models.DateTimeField(
                    auto_now_add=True,
                    db_column='data_cadastro'
                )),
                ('id_venda', models.ForeignKey(
                    db_column='id_venda',
                    help_text='Venda (NF-e/NFC-e) que referencia documentos anteriores',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notas_referenciadas',
                    to='api.venda'
                )),
            ],
            options={
                'db_table': 'notas_fiscais_referenciadas',
                'ordering': ['id_venda', 'data_cadastro'],
                'managed': True,
            },
        ),
        migrations.AddIndex(
            model_name='notafiscalreferenciada',
            index=models.Index(fields=['id_venda'], name='notas_fisca_id_vend_idx'),
        ),
        migrations.AddIndex(
            model_name='notafiscalreferenciada',
            index=models.Index(fields=['chave_acesso'], name='notas_fisca_chave_a_idx'),
        ),
    ]
