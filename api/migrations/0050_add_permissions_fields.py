# Generated migration for UserPermissoes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0049_agendamento_preco_total_pacote_and_more'),
    ]

    operations = [
        # Compras
        migrations.AddField(
            model_name='userpermissoes',
            name='compras_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='compras_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='compras_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='compras_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Trocas
        migrations.AddField(
            model_name='userpermissoes',
            name='trocas_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='trocas_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='trocas_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='trocas_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Ordens de Serviço
        migrations.AddField(
            model_name='userpermissoes',
            name='ordens_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='ordens_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='ordens_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='ordens_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Cotações
        migrations.AddField(
            model_name='userpermissoes',
            name='cotacoes_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='cotacoes_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='cotacoes_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='cotacoes_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Devoluções
        migrations.AddField(
            model_name='userpermissoes',
            name='devolucoes_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='devolucoes_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='devolucoes_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='devolucoes_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Comandas
        migrations.AddField(
            model_name='userpermissoes',
            name='comandas_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='comandas_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='comandas_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='comandas_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Pet Shop
        migrations.AddField(
            model_name='userpermissoes',
            name='petshop_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='petshop_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='petshop_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='petshop_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Catálogo
        migrations.AddField(
            model_name='userpermissoes',
            name='catalogo_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='catalogo_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Etiquetas
        migrations.AddField(
            model_name='userpermissoes',
            name='etiquetas_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='etiquetas_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='etiquetas_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='etiquetas_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Relatórios
        migrations.AddField(
            model_name='userpermissoes',
            name='relatorios_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='relatorios_exportar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Gráficos
        migrations.AddField(
            model_name='userpermissoes',
            name='graficos_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Mapa de Promoção
        migrations.AddField(
            model_name='userpermissoes',
            name='mapa_promocao_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='mapa_promocao_criar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='mapa_promocao_editar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.AddField(
            model_name='userpermissoes',
            name='mapa_promocao_excluir',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        # Venda Rápida
        migrations.AddField(
            model_name='userpermissoes',
            name='venda_rapida_acessar',
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
    ]
