Write-Host "=== Corrigindo Django automaticamente ===" -ForegroundColor Cyan

# Navegar para o diretório
Set-Location "C:\Projetos\SistemaGerencial"

# Limpar cache Python
Write-Host "Limpando cache Python..." -ForegroundColor Yellow
Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Recurse -Filter "*.pyc" | Remove-Item -Force -ErrorAction SilentlyContinue

# Criar migrações
Write-Host "Criando migrações..." -ForegroundColor Yellow
python manage.py makemigrations

# Aplicar migrações
Write-Host "Aplicando migrações..." -ForegroundColor Yellow
python manage.py migrate

# Iniciar servidor
Write-Host "Iniciando servidor Django..." -ForegroundColor Green
Write-Host "Servidor rodando em http://127.0.0.1:8000/" -ForegroundColor Cyan
python manage.py runserver
