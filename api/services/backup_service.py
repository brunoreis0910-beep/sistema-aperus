"""
Serviço para gerenciamento de backups do banco de dados.
"""
import os
import zipfile
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from django.conf import settings
from django.core.management import call_command
from io import StringIO


class BackupService:
    """Serviço para criar e gerenciar backups"""
    
    def __init__(self):
        self.backup_dir = Path(settings.BASE_DIR) / 'backups'
        self.backup_dir.mkdir(exist_ok=True)
    
    def _find_mysql_command(self, command='mysql'):
        """Encontra o executável mysql/mysqldump no sistema"""
        import platform
        
        # Tentar comando direto primeiro
        try:
            result = subprocess.run([command, '--version'], 
                                   capture_output=True, text=True)
            if result.returncode == 0:
                return command
        except FileNotFoundError:
            pass
        
        # Procurar em locais comuns no Windows
        if platform.system() == 'Windows':
            exe = f'{command}.exe'
            common_paths = [
                rf'C:\Program Files\MySQL\MySQL Server 8.0\bin\{exe}',
                rf'C:\Program Files\MySQL\MySQL Server 5.7\bin\{exe}',
                rf'C:\xampp\mysql\bin\{exe}',
                rf'C:\wamp64\bin\mysql\mysql8.0.27\bin\{exe}',
            ]
            
            for path in common_paths:
                if Path(path).exists():
                    return path
        
        # Se não encontrou, retorna o comando padrão
        return command
    
    def create_backup(self, compress: bool = True) -> Dict:
        """
        Cria um novo backup do banco de dados.
        
        Args:
            compress: Se True, comprime o backup em ZIP
            
        Returns:
            Dict com informações do backup criado
        """
        timestamp = datetime.now()
        
        # Executar comando de backup
        out = StringIO()
        try:
            call_command(
                'backup_database',
                output_dir='backups',
                compress=compress,
                stdout=out
            )
            
            # Buscar o backup mais recente
            backup_files = sorted(
                self.backup_dir.glob('backup_*'),
                key=lambda x: x.stat().st_mtime,
                reverse=True
            )
            
            if not backup_files:
                raise Exception('Backup criado mas arquivo não encontrado')
            
            backup_file = backup_files[0]
            
            return {
                'filename': backup_file.name,
                'path': str(backup_file),
                'size': backup_file.stat().st_size,
                'size_mb': round(backup_file.stat().st_size / (1024 * 1024), 2),
                'created_at': datetime.fromtimestamp(backup_file.stat().st_mtime).isoformat(),
                'compressed': backup_file.suffix == '.zip',
                'message': 'Backup criado com sucesso'
            }
            
        except Exception as e:
            raise Exception(f'Erro ao criar backup: {str(e)}')
    
    def list_backups(self) -> List[Dict]:
        """
        Lista todos os backups disponíveis.
        
        Returns:
            Lista de dicionários com informações dos backups
        """
        backups = []
        
        for backup_file in sorted(
            self.backup_dir.glob('backup_*'),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        ):
            stat = backup_file.stat()
            backups.append({
                'filename': backup_file.name,
                'path': str(backup_file),
                'size': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'compressed': backup_file.suffix == '.zip',
            })
        
        return backups
    
    def delete_backup(self, filename: str) -> Dict:
        """
        Remove um backup específico.
        
        Args:
            filename: Nome do arquivo de backup
            
        Returns:
            Dict com resultado da operação
        """
        backup_file = self.backup_dir / filename
        
        if not backup_file.exists():
            raise FileNotFoundError(f'Backup não encontrado: {filename}')
        
        # Validar que é um arquivo de backup
        if not backup_file.name.startswith('backup_'):
            raise ValueError('Arquivo inválido')
        
        size_mb = round(backup_file.stat().st_size / (1024 * 1024), 2)
        backup_file.unlink()
        
        return {
            'filename': filename,
            'size_mb': size_mb,
            'message': 'Backup removido com sucesso'
        }
    
    def restore_backup(self, filename: str) -> Dict:
        """
        Restaura um backup do banco de dados.
        
        Args:
            filename: Nome do arquivo de backup
            
        Returns:
            Dict com resultado da operação
        """
        backup_file = self.backup_dir / filename
        
        if not backup_file.exists():
            raise FileNotFoundError(f'Backup não encontrado: {filename}')
        
        db_config = settings.DATABASES['default']
        engine = db_config['ENGINE']
        
        try:
            if 'sqlite' in engine:
                return self._restore_sqlite(backup_file, db_config)
            elif 'mysql' in engine:
                return self._restore_mysql(backup_file, db_config)
            else:
                raise Exception(f'Banco de dados não suportado: {engine}')
        except Exception as e:
            raise Exception(f'Erro ao restaurar backup: {str(e)}')
    
    def _restore_sqlite(self, backup_file: Path, db_config: Dict) -> Dict:
        """Restaura backup SQLite"""
        import shutil
        
        db_file = Path(db_config['NAME'])
        
        # Criar backup do banco atual antes de restaurar
        if db_file.exists():
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_current = db_file.parent / f'{db_file.stem}.backup_before_restore_{timestamp}{db_file.suffix}'
            shutil.copy2(db_file, backup_current)
        
        # Descompactar se necessário
        if backup_file.suffix == '.zip':
            with zipfile.ZipFile(backup_file, 'r') as zf:
                # Extrair o arquivo .db
                for name in zf.namelist():
                    if name.endswith('.db'):
                        zf.extract(name, self.backup_dir)
                        extracted_file = self.backup_dir / name
                        shutil.copy2(extracted_file, db_file)
                        extracted_file.unlink()
                        break
        else:
            shutil.copy2(backup_file, db_file)
        
        return {
            'filename': backup_file.name,
            'message': 'Backup restaurado com sucesso (SQLite)'
        }
    
    def _restore_mysql(self, backup_file: Path, db_config: Dict) -> Dict:
        """Restaura backup MySQL"""
        db_name = db_config['NAME']
        db_user = db_config['USER']
        db_password = db_config['PASSWORD']
        db_host = db_config.get('HOST', 'localhost')
        db_port = db_config.get('PORT', '3306')
        
        # Descompactar se necessário
        sql_file = backup_file
        temp_file = None
        
        if backup_file.suffix == '.zip':
            with zipfile.ZipFile(backup_file, 'r') as zf:
                for name in zf.namelist():
                    if name.endswith('.sql'):
                        temp_file = self.backup_dir / f'temp_restore_{name}'
                        with zf.open(name) as source, open(temp_file, 'wb') as target:
                            target.write(source.read())
                        sql_file = temp_file
                        break
        
        # Encontrar mysql
        mysql_cmd = self._find_mysql_command('mysql')
        
        # Executar restore via mysql
        cmd = [
            mysql_cmd,
            f'--host={db_host}',
            f'--port={db_port}',
            f'--user={db_user}',
            f'--password={db_password}',
            db_name,
        ]
        
        try:
            with open(sql_file, 'r', encoding='utf-8') as f:
                result = subprocess.run(
                    cmd,
                    stdin=f,
                    stderr=subprocess.PIPE,
                    text=True,
                    check=True
                )
            
            return {
                'filename': backup_file.name,
                'message': 'Backup restaurado com sucesso (MySQL)'
            }
            
        finally:
            # Limpar arquivo temporário
            if temp_file and temp_file.exists():
                temp_file.unlink()
    
    def get_backup_info(self) -> Dict:
        """
        Retorna informações gerais sobre backups.
        
        Returns:
            Dict com estatísticas dos backups
        """
        backups = self.list_backups()
        
        total_size = sum(b['size'] for b in backups)
        
        db_config = settings.DATABASES['default']
        engine = db_config['ENGINE']
        db_type = 'SQLite' if 'sqlite' in engine else 'MySQL' if 'mysql' in engine else 'Desconhecido'
        
        return {
            'total_backups': len(backups),
            'total_size': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'backup_dir': str(self.backup_dir),
            'database_type': db_type,
            'oldest_backup': backups[-1]['created_at'] if backups else None,
            'newest_backup': backups[0]['created_at'] if backups else None,
        }
