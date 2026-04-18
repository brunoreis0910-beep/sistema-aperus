from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0111_add_limite_desconto_percentual_operacao'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE user_parametros
                ADD COLUMN whatsapp_supervisor VARCHAR(20) NULL DEFAULT '';
            """,
            reverse_sql="""
                ALTER TABLE user_parametros
                DROP COLUMN whatsapp_supervisor;
            """,
        ),
    ]
