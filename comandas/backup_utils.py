"""
Utilitários para backup e restauração do banco de dados MySQL
"""
import os
import shutil
import subprocess
import zipfile
import platform
from datetime import datetime
from django.conf import settings
from django.db import connection


def get_backup_dir():
    """Retorna o diretório de backups"""
    backup_dir = os.path.join(settings.BASE_DIR, 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    return backup_dir


def _find_mysqldump():
    """Localiza o executável mysqldump no sistema"""
    try:
        result = subprocess.run(['mysqldump', '--version'],
                                capture_output=True, text=True)
        if result.returncode == 0:
            return 'mysqldump'
    except FileNotFoundError:
        pass

    if platform.system() == 'Windows':
        common_paths = [
            r'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe',
            r'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe',
            r'C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe',
            r'C:\xampp\mysql\bin\mysqldump.exe',
            r'C:\wamp64\bin\mysql\mysql8.0.27\bin\mysqldump.exe',
        ]
        for path in common_paths:
            if os.path.exists(path):
                return path

    return 'mysqldump'


def _find_mysql():
    """Localiza o executável mysql no sistema"""
    try:
        result = subprocess.run(['mysql', '--version'],
                                capture_output=True, text=True)
        if result.returncode == 0:
            return 'mysql'
    except FileNotFoundError:
        pass

    if platform.system() == 'Windows':
        common_paths = [
            r'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe',
            r'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe',
            r'C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe',
            r'C:\xampp\mysql\bin\mysql.exe',
            r'C:\wamp64\bin\mysql\mysql8.0.27\bin\mysql.exe',
        ]
        for path in common_paths:
            if os.path.exists(path):
                return path

    return 'mysql'


def create_database_backup(compress=True):
    """Cria um backup do banco de dados MySQL via mysqldump"""
    db_config = settings.DATABASES['default']
    engine = db_config.get('ENGINE', '')
    backup_dir = get_backup_dir()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    if 'mysql' in engine:
        db_name = db_config['NAME']
        db_user = db_config['USER']
        db_password = db_config.get('PASSWORD', '')
        db_host = db_config.get('HOST', 'localhost')
        db_port = str(db_config.get('PORT', '3306'))

        sql_filename = f'backup_mysql_{timestamp}.sql'
        sql_path = os.path.join(backup_dir, sql_filename)

        mysqldump_cmd = _find_mysqldump()
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
            db_name,
        ]

        with open(sql_path, 'w', encoding='utf-8') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)

        if result.returncode != 0:
            if os.path.exists(sql_path):
                os.remove(sql_path)
            raise Exception(f'mysqldump falhou: {result.stderr}')

        if compress:
            zip_filename = f'backup_mysql_{timestamp}.zip'
            zip_path = os.path.join(backup_dir, zip_filename)
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(sql_path, sql_filename)
            os.remove(sql_path)
            print(f"Backup criado: {zip_filename}")
            return zip_path
        else:
            print(f"Backup criado: {sql_filename}")
            return sql_path

    elif 'sqlite' in engine:
        db_path = db_config['NAME']
        if not os.path.exists(db_path):
            raise Exception(f'Arquivo SQLite não encontrado: {db_path}')
        backup_filename = f'backup_sqlite_{timestamp}.db'
        backup_path = os.path.join(backup_dir, backup_filename)
        shutil.copy2(db_path, backup_path)
        if compress:
            zip_filename = backup_filename.replace('.db', '.zip')
            zip_path = os.path.join(backup_dir, zip_filename)
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(backup_path, backup_filename)
            os.remove(backup_path)
            return zip_path
        return backup_path
    else:
        raise Exception(f'Engine de banco não suportada: {engine}')


def restore_database_backup(filename):
    """Restaura um backup do banco de dados"""
    db_config = settings.DATABASES['default']
    engine = db_config.get('ENGINE', '')
    backup_dir = get_backup_dir()
    backup_path = os.path.join(backup_dir, filename)

    if not os.path.exists(backup_path):
        raise Exception(f'Backup não encontrado: {filename}')

    if 'mysql' in engine:
        db_name = db_config['NAME']
        db_user = db_config['USER']
        db_password = db_config.get('PASSWORD', '')
        db_host = db_config.get('HOST', 'localhost')
        db_port = str(db_config.get('PORT', '3306'))

        # Descompactar se necessário
        sql_path = backup_path
        temp_sql = None
        if filename.endswith('.zip'):
            with zipfile.ZipFile(backup_path, 'r') as zf:
                for name in zf.namelist():
                    if name.endswith('.sql'):
                        temp_sql = os.path.join(backup_dir, f'temp_restore_{name}')
                        with zf.open(name) as src, open(temp_sql, 'wb') as dst:
                            dst.write(src.read())
                        sql_path = temp_sql
                        break

        mysql_cmd = _find_mysql()
        cmd = [
            mysql_cmd,
            f'--host={db_host}',
            f'--port={db_port}',
            f'--user={db_user}',
            f'--password={db_password}',
            db_name,
        ]

        try:
            with open(sql_path, 'r', encoding='utf-8') as f:
                result = subprocess.run(cmd, stdin=f, stderr=subprocess.PIPE, text=True)
            if result.returncode != 0:
                raise Exception(f'mysql falhou: {result.stderr}')
            return True
        finally:
            if temp_sql and os.path.exists(temp_sql):
                os.remove(temp_sql)

    elif 'sqlite' in engine:
        db_path = db_config['NAME']
        connection.close()
        backup_current = f"{db_path}.before_restore"
        shutil.copy2(db_path, backup_current)
        if filename.endswith('.zip'):
            with zipfile.ZipFile(backup_path, 'r') as zf:
                for name in zf.namelist():
                    if name.endswith('.db'):
                        with zf.open(name) as src, open(db_path, 'wb') as dst:
                            dst.write(src.read())
                        break
        else:
            shutil.copy2(backup_path, db_path)
        return True
    else:
        raise Exception(f'Engine não suportada: {engine}')


def list_backups():
    """Lista todos os backups disponíveis"""
    try:
        backup_dir = get_backup_dir()
        backups = []

        for filename in os.listdir(backup_dir):
            if filename.startswith('backup_'):
                filepath = os.path.join(backup_dir, filename)
                stat = os.stat(filepath)
                backups.append({
                    'filename': filename,
                    'size_mb': round(stat.st_size / (1024 * 1024), 2),
                    'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    'compressed': filename.endswith(('.zip', '.gz')),
                })

        backups.sort(key=lambda x: x['created_at'], reverse=True)
        return backups

    except Exception as e:
        print(f"Erro ao listar backups: {e}")
        return []


def delete_backup(filename):
    """Deleta um backup"""
    try:
        backup_dir = get_backup_dir()
        backup_path = os.path.join(backup_dir, filename)

        if not filename.startswith('backup_'):
            raise Exception('Arquivo inválido')

        if os.path.exists(backup_path):
            os.remove(backup_path)
            print(f"Backup removido: {filename}")
            return True

        print(f"Backup não encontrado: {filename}")
        return False

    except Exception as e:
        print(f"Erro ao remover backup: {e}")
        raise


def get_backup_info(filename):
    """Retorna informações sobre um backup específico"""
    backup_dir = get_backup_dir()
    backup_path = os.path.join(backup_dir, filename)

    if not os.path.exists(backup_path):
        return None

    stat = os.stat(backup_path)
    return {
        'filename': filename,
        'size_mb': round(stat.st_size / (1024 * 1024), 2),
        'created_at': datetime.fromtimestamp(stat.st_mtime).isoformat(),
        'compressed': filename.endswith(('.zip', '.gz')),
    }
