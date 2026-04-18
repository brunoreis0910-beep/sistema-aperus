from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Adiciona campo data_entrada na tabela compras'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Verifica se a coluna ja existe
            cursor.execute("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'compras'
                  AND COLUMN_NAME = 'data_entrada'
            """)
            
            exists = cursor.fetchone()[0]
            
            if exists > 0:
                self.stdout.write(self.style.SUCCESS('Coluna data_entrada ja existe'))
            else:
                # Adiciona a coluna
                cursor.execute("""
                    ALTER TABLE compras 
                    ADD COLUMN data_entrada DATE NULL 
                    COMMENT 'Data de entrada da mercadoria no estoque'
                """)
                self.stdout.write(self.style.SUCCESS('Coluna data_entrada adicionada!'))
            
            # Atualiza compras existentes
            cursor.execute("""
                UPDATE compras 
                SET data_entrada = DATE(data_movimento_entrada)
                WHERE data_entrada IS NULL AND data_movimento_entrada IS NOT NULL
            """)
            rows1 = cursor.rowcount
            self.stdout.write(f'{rows1} compras atualizadas com data do documento')
            
            cursor.execute("""
                UPDATE compras 
                SET data_entrada = CURDATE()
                WHERE data_entrada IS NULL
            """)
            rows2 = cursor.rowcount
            self.stdout.write(f'{rows2} compras atualizadas com data atual')
            
            # Verifica total
            cursor.execute("SELECT COUNT(*) FROM compras WHERE data_entrada IS NOT NULL")
            total = cursor.fetchone()[0]
            self.stdout.write(self.style.SUCCESS(f'Total de compras com data_entrada: {total}'))
