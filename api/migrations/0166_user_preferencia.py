from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0165_adicionar_fracao_aplicada_compra_item'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPreferencia',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chave', models.CharField(help_text='Nome da preferência', max_length=100)),
                ('valor', models.TextField(blank=True, help_text='Valor da preferência', null=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(db_column='id_user', on_delete=django.db.models.deletion.CASCADE, related_name='preferencias', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'user_preferencias',
                'managed': True,
                'unique_together': {('user', 'chave')},
            },
        ),
    ]
