# Generated manually to add habilitar_central_saas to EmpresaConfig

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0188_templatecontrato'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE empresa_config ADD COLUMN habilitar_central_saas BOOLEAN DEFAULT FALSE;",
            reverse_sql="ALTER TABLE empresa_config DROP COLUMN habilitar_central_saas;"
        ),
    ]
