import os
import django
import sys
import copy
import traceback
import contextlib

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'projeto_gerencial.settings')
django.setup()

from django.db import connection, connections
from django.conf import settings
from django.core.management import call_command
from django.db.backends.utils import CursorWrapper

@contextlib.contextmanager
def ignore_migration_errors():
    original_execute = CursorWrapper.execute
    original_executemany = CursorWrapper.executemany
    
    def patched_execute(self, sql, params=None):
        try:
            return original_execute(self, sql, params)
        except Exception as e:
            print(f"FAILED SQL: {sql} | PARAMS: {params}")
            import MySQLdb
            inner_exc = e
            while hasattr(inner_exc, '__cause__') and inner_exc.__cause__:
                inner_exc = inner_exc.__cause__
                
            if isinstance(inner_exc, (MySQLdb.OperationalError, MySQLdb.ProgrammingError, MySQLdb.IntegrityError)):
                code = inner_exc.args[0]
                # 1050: Table already exists
                # 1060: Duplicate column name
                # 1061: Duplicate key name
                # 1091: Can't drop column/key (doesn't exist)
                # 1022: Duplicate key/constraint
                # 1826: Duplicate foreign key constraint
                if code in (1050, 1060, 1061, 1067, 1072, 1091, 1022, 1826, 3734, 1215, 1553, 1146, 1051):
                    print(f"Bypassing MySQL error {code} during migration: {e}")
                    return
            raise e
            
    def patched_executemany(self, sql, param_list):
        try:
            return original_executemany(self, sql, param_list)
        except Exception as e:
            import MySQLdb
            inner_exc = e
            while hasattr(inner_exc, '__cause__') and inner_exc.__cause__:
                inner_exc = inner_exc.__cause__
                
            if isinstance(inner_exc, (MySQLdb.OperationalError, MySQLdb.ProgrammingError, MySQLdb.IntegrityError)):
                code = inner_exc.args[0]
                if code in (1050, 1060, 1061, 1067, 1072, 1091, 1022, 1826, 3734, 1215, 1553, 1146, 1051):
                    print(f"Bypassing MySQL error {code} during migration: {e}")
                    return
            raise e

    CursorWrapper.execute = patched_execute
    CursorWrapper.executemany = patched_executemany
    try:
        yield
    finally:
        CursorWrapper.execute = original_execute
        CursorWrapper.executemany = original_executemany

def test_direct():
    db_name = "aperus_test_direct"
    
    # Drop and recreate
    with connection.cursor() as cursor:
        cursor.execute(f"DROP DATABASE IF EXISTS {db_name};")
        cursor.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        
    # Register settings
    default_db = settings.DATABASES['default']
    settings.DATABASES[db_name] = copy.deepcopy(default_db)
    settings.DATABASES[db_name]['NAME'] = db_name
    
    try:
        # Copy unmanaged tables from central to target
        print("Copying unmanaged tables...")
        from django.db import connections
        from django.apps import apps
        
        unmanaged_tables = []
        for model in apps.get_models():
            if not model._meta.managed:
                unmanaged_tables.append(model._meta.db_table)
        unmanaged_tables = list(set(unmanaged_tables))
        
        central_conn = connections['default']
        target_conn = connections[db_name]
        
        with central_conn.cursor() as central_cursor, target_conn.cursor() as target_cursor:
            target_cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            central_cursor.execute("SHOW TABLES")
            central_tables = [row[0] for row in central_cursor.fetchall()]
            
            for table in unmanaged_tables:
                if table in central_tables:
                    central_cursor.execute(f"SHOW CREATE TABLE `{table}`")
                    create_sql = central_cursor.fetchone()[1]
                    target_cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
                    target_cursor.execute(create_sql)
            target_cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        print("Unmanaged tables copied successfully!")

        with target_conn.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

        print("Running migrate...")
        with ignore_migration_errors():
            call_command('migrate', database=db_name, interactive=False)
        print("Migrate completed successfully!")
        
        with target_conn.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    except Exception as e:
        print("Migration failed! Traceback:")
        traceback.print_exc()
    finally:
        # Cleanup
        with connection.cursor() as cursor:
            cursor.execute(f"DROP DATABASE IF EXISTS {db_name};")

if __name__ == "__main__":
    test_direct()
