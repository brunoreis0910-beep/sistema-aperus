from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Adiciona campo whatsapp na tabela clientes'

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                # Verificar se a coluna já existe
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'clientes'
                      AND COLUMN_NAME = 'whatsapp'
                """)
                
                exists = cursor.fetchone()[0]
                
                if exists == 0:
                    # Adicionar a coluna
                    cursor.execute("""
                        ALTER TABLE clientes 
                        ADD COLUMN whatsapp VARCHAR(20) NULL 
                        COMMENT 'Número de WhatsApp do cliente'
                    """)
                    self.stdout.write(self.style.SUCCESS('✅ Campo whatsapp adicionado com sucesso!'))
                else:
                    self.stdout.write(self.style.WARNING('ℹ️  Campo whatsapp já existe na tabela clientes'))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erro ao adicionar campo: {e}'))
