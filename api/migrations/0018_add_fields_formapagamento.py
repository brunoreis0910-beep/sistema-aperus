"""Migration para adicionar colunas de centro de custo e departamento em formas_pagamento.

Gerado manualmente: adiciona campos opcionais null/blank para manter compatibilidade
com base de dados existente.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_create_unmanaged_tables'),
    ]

    operations = [
        migrations.AddField(
            model_name='formapagamento',
            name='id_centro_custo',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, to='api.centrocusto', db_column='id_centro_custo'),
        ),
        migrations.AddField(
            model_name='formapagamento',
            name='id_departamento',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, to='api.departamento', db_column='id_departamento'),
        ),
    ]
