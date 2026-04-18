from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0146_add_matricula_to_funcionario'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='OcorrenciaFuncionario',
            fields=[
                ('id_ocorrencia', models.AutoField(primary_key=True, serialize=False)),
                ('tipo', models.CharField(choices=[
                    ('FALTA', 'Falta'),
                    ('FALTA_JUSTIFICADA', 'Falta Justificada'),
                    ('ATESTADO', 'Atestado Médico'),
                    ('ATESTADO_ODONTO', 'Atestado Odontológico'),
                    ('AFASTAMENTO', 'Afastamento INSS'),
                    ('FERIAS', 'Férias'),
                    ('LICENCA', 'Licença'),
                    ('ATRASO', 'Atraso'),
                    ('SAIDA_ANTECIPADA', 'Saída Antecipada'),
                    ('OUTROS', 'Outros'),
                ], max_length=25)),
                ('data_inicio', models.DateField()),
                ('data_fim', models.DateField()),
                ('dias', models.PositiveSmallIntegerField(default=1, help_text='Total de dias de afastamento/ausência')),
                ('descricao', models.TextField(blank=True, null=True)),
                ('desconta_salario', models.BooleanField(default=False, help_text='Se marcado, desconta proporcionalmente do salário no holerite')),
                ('status', models.CharField(choices=[
                    ('PENDENTE', 'Pendente'),
                    ('APROVADO', 'Aprovado'),
                    ('REJEITADO', 'Rejeitado'),
                ], default='PENDENTE', max_length=15)),
                ('arquivo_url', models.CharField(blank=True, max_length=500, null=True, help_text='URL do documento digitalizado')),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('atualizado_em', models.DateTimeField(auto_now=True)),
                ('funcionario', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ocorrencias',
                    to='api.funcionario',
                )),
                ('registrado_por', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='ocorrencias_registradas',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Ocorrência',
                'verbose_name_plural': 'Ocorrências',
                'db_table': 'rh_ocorrencia_funcionario',
                'ordering': ['-data_inicio'],
            },
        ),
        migrations.AddIndex(
            model_name='ocorrenciafuncionario',
            index=models.Index(fields=['funcionario', 'data_inicio'], name='rh_ocorr_func_data_idx'),
        ),
    ]
