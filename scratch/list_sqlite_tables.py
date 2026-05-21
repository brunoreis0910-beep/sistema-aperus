import os
import sqlite3

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3'))
print("SQLite path:", db_path)

if not os.path.exists(db_path):
    print("Arquivo não existe.")
    sys.exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tabelas no SQLite:")
for t in tables:
    name = t[0]
    cursor.execute(f"SELECT COUNT(*) FROM `{name}`")
    count = cursor.fetchone()[0]
    print(f" - {name}: {count} registros")
conn.close()
