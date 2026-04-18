from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0062_aluguelitem_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ConfiguracaoContrato',
            fields=[
                ('id_configuracao', models.AutoField(primary_key=True)),
                ('tipo_contrato', models.CharField(max_length=50, unique=True, help_text='Tipo de contrato (ex: aluguel)')),
                ('titulo', models.CharField(max_length=200, help_text='Título do contrato')),
                ('template_html', models.TextField(help_text='Template HTML do contrato. Use variáveis como {{numero_aluguel}}, {{cliente_nome}}, etc.')),
                ('ativo', models.BooleanField(default=True)),
                ('data_criacao', models.DateTimeField(auto_now_add=True)),
                ('data_atualizacao', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'configuracao_contratos',
                'verbose_name': 'Configuração de Contrato',
                'verbose_name_plural': 'Configurações de Contratos',
            },
        ),
    ]
