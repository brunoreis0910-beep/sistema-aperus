import os
import re

migrations_dir = r"C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\api\migrations"

def fix():
    files = [f for f in os.listdir(migrations_dir) if f.endswith(".py") and not f.startswith("__")]
    
    print("Fixing database connection scopes in migration files...")
    for filename in files:
        filepath = os.path.join(migrations_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        modified = False
        
        # We only want to replace connection when it is imported from django.db
        if "from django.db import" in content and "connection" in content:
            # Replace connection.cursor() with schema_editor.connection.cursor()
            if "connection.cursor()" in content:
                content = content.replace("connection.cursor()", "schema_editor.connection.cursor()")
                modified = True
                
            # Replace connection.vendor with schema_editor.connection.vendor
            if "connection.vendor" in content:
                content = content.replace("connection.vendor", "schema_editor.connection.vendor")
                modified = True
                
        if modified:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Successfully modified connection references in: {filename}")

if __name__ == "__main__":
    fix()
