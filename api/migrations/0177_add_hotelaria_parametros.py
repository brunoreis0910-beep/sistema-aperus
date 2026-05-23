from django.db import migrations

def add_hotelaria_columns(apps, schema_editor):
    conn = schema_editor.connection
    with conn.cursor() as cur:
        # Introspect user_parametros to see which columns already exist
        desc = conn.introspection.get_table_description(cur, 'user_parametros')
        existing_columns = [col.name.lower() for col in desc]
        
        is_mysql = conn.vendor == 'mysql'
        
        # Columns that need to be added to user_parametros
        columns_to_add = [
            ('id_operacao_hotel', 'INT NULL'),
            ('perguntar_operacao_checkout', 'TINYINT(1) NULL DEFAULT 0' if is_mysql else 'INTEGER DEFAULT 0'),
            ('id_operacao_hotel_checkout', 'INT NULL'),
            ('id_operacao_hotel_nfce', 'INT NULL'),
        ]
        
        for col_name, col_type in columns_to_add:
            if col_name.lower() not in existing_columns:
                cur.execute(f"ALTER TABLE user_parametros ADD COLUMN {col_name} {col_type}")

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0176_venda_chave_nfse_venda_data_emissao_nfse_and_more'),
    ]

    operations = [
        migrations.RunPython(add_hotelaria_columns, reverse_code=migrations.RunPython.noop),
    ]
