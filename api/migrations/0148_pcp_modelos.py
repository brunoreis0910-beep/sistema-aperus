from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0147_add_ocorrencia_funcionario'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # -------------------------------------------------------
        # Ficha Técnica (BOM — Bill of Materials)
        # -------------------------------------------------------
        migrations.CreateModel(
            name='ComposicaoProduto',
            fields=[
                ('id_composicao', models.AutoField(primary_key=True, serialize=False)),
                ('produto_acabado', models.ForeignKey(
                    db_column='id_produto_acabado',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='composicao_como_acabado',
                    to='api.produto',
                    help_text='Produto fabricado (produto acabado).',
                )),
                ('insumo', models.ForeignKey(
                    db_column='id_insumo',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='composicao_como_insumo',
                    to='api.produto',
                    help_text='Produto utilizado como insumo / matéria-prima.',
                )),
                ('quantidade_necessaria', models.DecimalField(
                    decimal_places=4, max_digits=12,
                    help_text='Quantidade de insumo necessária por 1 unidade do produto acabado.',
                )),
                ('percentual_perda', models.DecimalField(
                    decimal_places=2, default=Decimal('0.00'), max_digits=5,
                    help_text='Percentual de perda/desperdício (%). Ex: 5 = 5%',
                )),
                ('ativo', models.BooleanField(default=True)),
                ('observacao', models.CharField(blank=True, max_length=255, null=True)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Composição do Produto',
                'verbose_name_plural': 'Composições de Produtos',
                'db_table': 'pcp_composicao_produto',
                'ordering': ['produto_acabado', 'insumo'],
            },
        ),
        migrations.AddConstraint(
            model_name='composicaoproduto',
            constraint=models.UniqueConstraint(
                fields=['produto_acabado', 'insumo'],
                name='pcp_composicao_unique',
            ),
        ),

        # -------------------------------------------------------
        # Ordem de Produção (OP)
        # -------------------------------------------------------
        migrations.CreateModel(
            name='OrdemProducao',
            fields=[
                ('id_op', models.AutoField(primary_key=True, serialize=False)),
                ('produto', models.ForeignKey(
                    db_column='id_produto',
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='ordens_producao',
                    to='api.produto',
                    help_text='Produto acabado a ser fabricado.',
                )),
                ('deposito', models.ForeignKey(
                    db_column='id_deposito',
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='ordens_producao',
                    to='api.deposito',
                    help_text='Depósito de onde saem os insumos e onde entra o produto acabado.',
                )),
                ('quantidade_planejada', models.DecimalField(
                    decimal_places=3, max_digits=12,
                    help_text='Quantidade planejada para esta OP.',
                )),
                ('quantidade_produzida', models.DecimalField(
                    decimal_places=3, default=Decimal('0.000'), max_digits=12,
                    help_text='Quantidade efetivamente produzida.',
                )),
                ('status', models.CharField(
                    choices=[
                        ('ABERTA', 'Aberta'),
                        ('EM_PRODUCAO', 'Em Produção'),
                        ('FINALIZADA', 'Finalizada'),
                        ('CANCELADA', 'Cancelada'),
                    ],
                    db_index=True, default='ABERTA', max_length=20,
                )),
                ('custo_total', models.DecimalField(
                    decimal_places=2, default=Decimal('0.00'), max_digits=15,
                    help_text='Custo total dos insumos consumidos.',
                )),
                ('observacoes', models.TextField(blank=True, null=True)),
                ('data_abertura', models.DateTimeField(auto_now_add=True)),
                ('data_inicio_producao', models.DateTimeField(blank=True, null=True)),
                ('data_finalizacao', models.DateTimeField(blank=True, null=True)),
                ('criado_por', models.ForeignKey(
                    blank=True,
                    db_column='id_criado_por',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Ordem de Produção',
                'verbose_name_plural': 'Ordens de Produção',
                'db_table': 'pcp_ordem_producao',
                'ordering': ['-data_abertura'],
            },
        ),
    ]
