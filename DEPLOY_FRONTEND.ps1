# Script completo de deploy frontend → Django
Write-Host "🚀 Iniciando deploy completo do frontend..." -ForegroundColor Cyan
Write-Host ""

# 1. Build do frontend
Write-Host "📦 Step 1/3: Building frontend..." -ForegroundColor Yellow
Set-Location frontend
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run build
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
    Write-Host "❌ Erro no build do frontend!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""

# 2. Collectstatic
Write-Host "📁 Step 2/3: Copiando arquivos estáticos..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1
python manage.py collectstatic --noinput 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Arquivos estáticos copiados!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao copiar arquivos estáticos!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Reinicie o servidor Django (se estiver rodando)"
Write-Host "   2. Limpe o cache do navegador (Ctrl+Shift+Delete)"
Write-Host "   3. Acesse: https://sistema.aperus.com.br"
Write-Host ""
Write-Host "🔧 Para reiniciar o servidor Django:" -ForegroundColor Cyan
Write-Host "   python manage.py runserver 0.0.0.0:8005 --noreload"
