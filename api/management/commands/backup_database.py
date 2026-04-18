"""
Comando Django para realizar backup do banco de dados.
Suporta SQLite e MySQL/MariaDB.
"""
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'Cria um backup do banco de dados (SQLite ou MySQL)'

    def _find_mysqldump(self):
        """Encontra o executável mysqldump no sistema"""
        import platform
        
        # Tentar comando direto primeiro
        try:
            result = subprocess.run(['mysqldump', '--version'], 
                                   capture_output=True, text=True)
            if result.returncode == 0:
                return 'mysqldump'
        except FileNotFoundError:
            pass
        
        # Procurar em locais comuns no Windows
        if platform.system() == 'Windows':
            common_paths = [
                r'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe',
                r'C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe',
                r'C:\xampp\mysql\bin\mysqldump.exe',
                r'C:\wamp64\bin\mysql\mysql8.0.27\bin\mysqldump.exe',
            ]
            
            for path in common_paths:
                if Path(path).exists():
                    return path
        
        # Se não encontrou, retorna o comando padrão e deixa dar erro
        return 'mysqldump'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='backups',
            help='Diretório onde os backups serão salvos (padrão: backups/)',
        )
        parser.add_argument(
            '--keep-last',
            type=int,
            default=10,
            help='Número de backups a manter (padrão: 10)',
        )
        parser.add_argument(
            '--compress',
            action='store_true',
            help='Comprimir o backup em formato ZIP',
        )

    def handle(self, *args, **options):
        output_dir = options['output_dir']
        keep_last = options['keep_last']
        compress = options['compress']

        # Criar diretório de backups se não existir
        backup_path = Path(settings.BASE_DIR) / output_dir
        backup_path.mkdir(exist_ok=True)

        # Obter configuração do banco
        db_config = settings.DATABASES['default']
        engine = db_config['ENGINE']

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        try:
            if 'sqlite' in engine:
                backup_file = self._backup_sqlite(db_config, backup_path, timestamp)
            elif 'mysql' in engine:
                backup_file = self._backup_mysql(db_config, backup_path, timestamp)
            else:
                raise CommandError(f'Banco de dados não suportado: {engine}')

            # Comprimir se solicitado
            if compress and backup_file:
                backup_file = self._compress_backup(backup_file)

            self.stdout.write(
                self.style.SUCCESS(f'✓ Backup criado com sucesso: {backup_file}')
            )

            # Limpar backups antigos
            self._cleanup_old_backups(backup_path, keep_last)

        except Exception as e:
            raise CommandError(f'Erro ao criar backup: {str(e)}')

    def _backup_sqlite(self, db_config, backup_path, timestamp):
        """Backup para banco SQLite"""
        db_file = Path(db_config['NAME'])
        
        if not db_file.exists():
            raise CommandError(f'Arquivo do banco não encontrado: {db_file}')

        backup_file = backup_path / f'backup_sqlite_{timestamp}.db'
        
        self.stdout.write('Criando backup do SQLite...')
        shutil.copy2(db_file, backup_file)
        
        # Calcular tamanho
        size_mb = backup_file.stat().st_size / (1024 * 1024)
        self.stdout.write(f'Tamanho do backup: {size_mb:.2f} MB')
        
        return backup_file

    def _backup_mysql(self, db_config, backup_path, timestamp):
        """Backup para banco MySQL/MariaDB"""
        db_name = db_config['NAME']
        db_user = db_config['USER']
        db_password = db_config['PASSWORD']
        db_host = db_config.get('HOST', 'localhost')
        db_port = db_config.get('PORT', '3306')

        backup_file = backup_path / f'backup_mysql_{timestamp}.sql'
        
        self.stdout.write(f'Criando backup do MySQL: {db_name}...')
        
        # Encontrar mysqldump
        mysqldump_cmd = self._find_mysqldump()
        self.stdout.write(f'Usando mysqldump: {mysqldump_cmd}')
        
        # Comando mysqldump
        cmd = [
            mysqldump_cmd,
            f'--host={db_host}',
            f'--port={db_port}',
            f'--user={db_user}',
            f'--password={db_password}',
            '--single-transaction',
            '--quick',
            '--lock-tables=false',
            '--routines',
            '--triggers',
            '--events',
            db_name,
        ]
        
        try:
            with open(backup_file, 'w', encoding='utf-8') as f:
                result = subprocess.run(
                    cmd,
                    stdout=f,
                    stderr=subprocess.PIPE,
                    text=True,
                    check=True
                )
            
            # Calcular tamanho
            size_mb = backup_file.stat().st_size / (1024 * 1024)
            self.stdout.write(f'Tamanho do backup: {size_mb:.2f} MB')
            
            return backup_file
            
        except subprocess.CalledProcessError as e:
            if backup_file.exists():
                backup_file.unlink()
            raise CommandError(f'Erro ao executar mysqldump: {e.stderr}')
        except FileNotFoundError:
            raise CommandError(
                'mysqldump não encontrado. Certifique-se de que o MySQL está instalado.'
            )

    def _compress_backup(self, backup_file):
        """Comprime o backup em formato ZIP"""
        import zipfile
        
        zip_file = backup_file.with_suffix('.zip')
        
        self.stdout.write(f'Comprimindo backup...')
        
        with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(backup_file, backup_file.name)
        
        # Remover arquivo original
        backup_file.unlink()
        
        size_mb = zip_file.stat().st_size / (1024 * 1024)
        self.stdout.write(f'Backup comprimido: {size_mb:.2f} MB')
        
        return zip_file

    def _cleanup_old_backups(self, backup_path, keep_last):
        """Remove backups antigos mantendo apenas os mais recentes"""
        if keep_last <= 0:
            return

        # Listar todos os arquivos de backup
        backup_files = sorted(
            backup_path.glob('backup_*'),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )

        # Remover backups excedentes
        if len(backup_files) > keep_last:
            removed_count = 0
            for old_backup in backup_files[keep_last:]:
                old_backup.unlink()
                removed_count += 1
            
            self.stdout.write(
                self.style.WARNING(
                    f'✓ {removed_count} backup(s) antigo(s) removido(s)'
                )
            )
