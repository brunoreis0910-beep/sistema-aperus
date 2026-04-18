"""
Migration para atualizar as tabelas mapa_carga e mapa_carga_itens
para corresponder ao modelo atual (MapaCarga e MapaCargaItem).

A migration 0114 criou as tabelas com um schema antigo/diferente.
Esta migration adiciona as colunas faltantes.
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0120_adicionar_campo_material_construcao'),
    ]

    operations = [
        # =========================================================
        # mapa_carga: adicionar colunas faltantes
        # =========================================================
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga ADD COLUMN numero_mapa VARCHAR(50) NULL AFTER id_mapa;",
            reverse_sql="ALTER TABLE mapa_carga DROP COLUMN numero_mapa;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga ADD COLUMN id_motorista_id INT NULL AFTER id_veiculo;",
            reverse_sql="ALTER TABLE mapa_carga DROP COLUMN id_motorista_id;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga ADD COLUMN quantidade_entregas INT NOT NULL DEFAULT 0 AFTER valor_total_carga;",
            reverse_sql="ALTER TABLE mapa_carga DROP COLUMN quantidade_entregas;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga ADD COLUMN distancia_total_km DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER quantidade_entregas;",
            reverse_sql="ALTER TABLE mapa_carga DROP COLUMN distancia_total_km;",
        ),
        # Adicionar FK de id_motorista_id para vendedores
        migrations.RunSQL(
            sql="""
                ALTER TABLE mapa_carga
                ADD CONSTRAINT fk_mapa_carga_motorista
                FOREIGN KEY (id_motorista_id) REFERENCES vendedores(id_vendedor)
                ON DELETE RESTRICT;
            """,
            reverse_sql="ALTER TABLE mapa_carga DROP FOREIGN KEY fk_mapa_carga_motorista;",
        ),
        # Adicionar UNIQUE na coluna numero_mapa
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga ADD UNIQUE INDEX uq_mapa_carga_numero_mapa (numero_mapa);",
            reverse_sql="ALTER TABLE mapa_carga DROP INDEX uq_mapa_carga_numero_mapa;",
        ),

        # =========================================================
        # mapa_carga_itens: renomear PK e adicionar colunas
        # =========================================================
        # Renomeia id_item para id_item_mapa
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga_itens CHANGE id_item id_item_mapa INT NOT NULL AUTO_INCREMENT;",
            reverse_sql="ALTER TABLE mapa_carga_itens CHANGE id_item_mapa id_item INT NOT NULL AUTO_INCREMENT;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga_itens ADD COLUMN status_entrega VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' AFTER entregue;",
            reverse_sql="ALTER TABLE mapa_carga_itens DROP COLUMN status_entrega;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga_itens ADD COLUMN data_entrega_prevista DATETIME NULL AFTER status_entrega;",
            reverse_sql="ALTER TABLE mapa_carga_itens DROP COLUMN data_entrega_prevista;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga_itens ADD COLUMN data_entrega_realizada DATETIME NULL AFTER data_entrega_prevista;",
            reverse_sql="ALTER TABLE mapa_carga_itens DROP COLUMN data_entrega_realizada;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE mapa_carga_itens ADD COLUMN observacoes_entrega TEXT NULL AFTER data_entrega_realizada;",
            reverse_sql="ALTER TABLE mapa_carga_itens DROP COLUMN observacoes_entrega;",
        ),
    ]
