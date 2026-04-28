# Script para executar collectstatic após rebuild do frontend
Write-Host "🔄 Copiando arquivos estáticos do frontend para o Django..." -ForegroundColor Cyan

# Ativar ambiente virtual
& ".\..venv\Scripts\Activate.ps1"

# Executar collectstatic
python manage.py collectstatic --noinput

Write-Host "✅ Arquivos estáticos copiados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Reinicie o servidor Django (se estiver rodando)"
Write-Host "   2. Limpe o cache do navegador (Ctrl+Shift+Delete)"
Write-Host "   3. Acesse https://sistema.aperus.com.br"
