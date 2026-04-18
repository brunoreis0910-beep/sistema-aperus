from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0156_produto_cest'),
    ]

    operations = [
        migrations.CreateModel(
            name='OsFoto',
            fields=[
                ('id_os_foto', models.AutoField(primary_key=True, serialize=False)),
                ('id_os', models.ForeignKey(
                    db_column='id_os',
                    db_constraint=False,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='fotos',
                    to='api.ordemservico',
                )),
                ('nome_arquivo', models.CharField(max_length=255)),
                ('imagem_base64', models.TextField()),
                ('data_criacao', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'os_fotos',
                'ordering': ['data_criacao'],
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='OsAssinatura',
            fields=[
                ('id_os_assinatura', models.AutoField(primary_key=True, serialize=False)),
                ('id_os', models.OneToOneField(
                    db_column='id_os',
                    db_constraint=False,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='assinatura',
                    to='api.ordemservico',
                )),
                ('nome_assinante', models.CharField(blank=True, max_length=255, null=True)),
                ('assinatura_base64', models.TextField()),
                ('data_assinatura', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'os_assinaturas',
                'managed': True,
            },
        ),
    ]
