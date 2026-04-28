# ============================================================
#  EXECUTAR_NO_SERVIDOR.ps1
#  Script para rodar NO SERVIDOR DE PRODUÇÃO
#  Faz: Git Pull → Build Frontend → Collectstatic → Restart
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - ATUALIZAR PRODUÇÃO"
Clear-Host

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║       ATUALIZAR SERVIDOR DE PRODUÇÃO                         ║" -ForegroundColor Cyan
Write-Host "║       🔧 Corrigir erro TDZ na tela de Vendas                ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# ═══════════════════════════════════════════════════════════
# PASSO 1: Parar servidor Django
# ═══════════════════════════════════════════════════════════
Write-Host "🛑 PASSO 1: Parando servidor Django..." -ForegroundColor Yellow
Write-Host ""

$procs = Get-Process -Name python -ErrorAction SilentlyContinue
if ($procs) {
    $procs | Stop-Process -Force
    Write-Host "✅ Servidor Django parado" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "ℹ️  Servidor Django não estava rodando" -ForegroundColor DarkGray
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PASSO 2: Git Pull
# ═══════════════════════════════════════════════════════════
Write-Host "📥 PASSO 2: Baixando código atualizado do GitHub..." -ForegroundColor Yellow
Write-Host ""

git fetch origin
git pull origin main 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Tentando branch master..." -ForegroundColor Yellow
    git pull origin master 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO no git pull! Verifique conflitos:" -ForegroundColor Red
    git status
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "✅ Código atualizado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Último commit:" -ForegroundColor Cyan
git log --oneline -1
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PASSO 3: Build do Frontend
# ═══════════════════════════════════════════════════════════
Write-Host "🏗️  PASSO 3: Compilando frontend..." -ForegroundColor Yellow
Write-Host ""

Set-Location frontend

# Verifica se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências do Node.js..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        Set-Location ..
        Read-Host "Pressione ENTER para sair"
        exit 1
    }
}

# Limpa cache do Vite
Write-Host "🧹 Limpando cache do Vite..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules\.vite, dist -ErrorAction SilentlyContinue

# Build
Write-Host "⚙️  Executando npm run build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 1) {
    Write-Host "❌ Erro no build do frontend!" -ForegroundColor Red
    Set-Location ..
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "✅ Frontend compilado!" -ForegroundColor Green
Set-Location ..
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PASSO 4: Collectstatic
# ═══════════════════════════════════════════════════════════
Write-Host "📁 PASSO 4: Copiando arquivos estáticos..." -ForegroundColor Yellow
Write-Host ""

# Remove assets antigos para forçar cópia
Write-Host "🗑️  Removendo assets antigos..." -ForegroundColor Cyan
Remove-Item -Recurse -Force staticfiles\assets -ErrorAction SilentlyContinue

# Ativa ambiente virtual Python
if (Test-Path ".venv\Scripts\Activate.ps1") {
    & .\.venv\Scripts\Activate.ps1
} elseif (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
}

# Collectstatic
Write-Host "📦 Executando collectstatic..." -ForegroundColor Cyan
python manage.py collectstatic --noinput

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no collectstatic!" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "✅ Arquivos estáticos copiados!" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PASSO 5: Verificar novo arquivo JS
# ═══════════════════════════════════════════════════════════
Write-Host "🔍 PASSO 5: Verificando arquivos gerados..." -ForegroundColor Yellow
Write-Host ""

$indexFiles = Get-ChildItem staticfiles\assets\index-*.js -ErrorAction SilentlyContinue
if ($indexFiles) {
    Write-Host "✅ Arquivos JS encontrados:" -ForegroundColor Green
    $indexFiles | ForEach-Object {
        Write-Host "   📄 $($_.Name) - $([math]::Round($_.Length / 1MB, 2)) MB" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  Nenhum arquivo index-*.js encontrado!" -ForegroundColor Yellow
}
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PASSO 6: Reiniciar Django
# ═══════════════════════════════════════════════════════════
Write-Host "🚀 PASSO 6: Reiniciando servidor Django..." -ForegroundColor Yellow
Write-Host ""

Write-Host "⚙️  Iniciando Django na porta 8005..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python manage.py runserver 0.0.0.0:8005 --noreload"

Start-Sleep -Seconds 3

$djangoProc = Get-Process -Name python -ErrorAction SilentlyContinue
if ($djangoProc) {
    Write-Host "✅ Servidor Django iniciado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Servidor pode não ter iniciado. Verifique!" -ForegroundColor Yellow
}

Write-Host ""

# ═══════════════════════════════════════════════════════════
# SUCESSO!
# ═══════════════════════════════════════════════════════════
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║  ✅ SERVIDOR ATUALIZADO COM SUCESSO!                         ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "┌──────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "│  PRÓXIMO PASSO: LIMPAR CACHE DO NAVEGADOR                    │" -ForegroundColor Yellow
Write-Host "└──────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 ACESSE NO NAVEGADOR:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   https://sistema.aperus.com.br/limpar-cache.html" -ForegroundColor Green
Write-Host ""
Write-Host "   E clique em 'Limpar TUDO e Recarregar'" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "OU limpe manualmente (F12 → Console):" -ForegroundColor Cyan
Write-Host ""
Write-Host "   localStorage.clear(); sessionStorage.clear();" -ForegroundColor White
Write-Host "   await indexedDB.deleteDatabase('AperusTerminalCache');" -ForegroundColor White
Write-Host "   await indexedDB.deleteDatabase('SistemaGerencialOffline');" -ForegroundColor White
Write-Host "   location.reload(true);" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Após limpar o cache, o erro NÃO deve mais aparecer!" -ForegroundColor Green
Write-Host ""

Read-Host "Pressione ENTER para sair"
