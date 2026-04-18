from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0154_tipo_tributacao_uf'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProdutoSimilar',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('ordem', models.IntegerField(default=0, help_text='Ordem de exibição na sugestão')),
                ('produto', models.ForeignKey(db_column='id_produto', on_delete=django.db.models.deletion.CASCADE, related_name='similares', to='api.produto')),
                ('produto_similar', models.ForeignKey(db_column='id_produto_similar', on_delete=django.db.models.deletion.CASCADE, related_name='similar_de', to='api.produto')),
            ],
            options={
                'verbose_name': 'Produto Similar',
                'verbose_name_plural': 'Produtos Similares',
                'db_table': 'produtos_similares',
                'ordering': ['ordem'],
                'unique_together': {('produto', 'produto_similar')},
            },
        ),
    ]
