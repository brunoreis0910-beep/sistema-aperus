from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Adiciona campo data_nascimento na tabela clientes'

    def handle(self, *args, **options):
        try:
            with connection.cursor() as cursor:
                # Verificar se a coluna já existe
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'clientes'
                      AND COLUMN_NAME = 'data_nascimento'
                """)
                
                exists = cursor.fetchone()[0]
                
                if exists == 0:
                    # Adicionar a coluna
                    cursor.execute("""
                        ALTER TABLE clientes 
                        ADD COLUMN data_nascimento DATE NULL 
                        COMMENT 'Data de nascimento do cliente para envio de mensagens de aniversário'
                    """)
                    self.stdout.write(self.style.SUCCESS('✅ Campo data_nascimento adicionado com sucesso!'))
                else:
                    self.stdout.write(self.style.WARNING('ℹ️  Campo data_nascimento já existe na tabela clientes'))
                    
                self.stdout.write('\n📋 Estrutura atual da tabela clientes:')
                cursor.execute("DESCRIBE clientes")
                for row in cursor.fetchall():
                    self.stdout.write(f"  - {row[0]}: {row[1]} ({row[2]})")
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erro ao adicionar campo: {e}'))
