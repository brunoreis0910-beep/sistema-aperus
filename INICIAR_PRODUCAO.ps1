# ============================================================
#  INICIAR_PRODUCAO.ps1  -  Iniciar o Sistema APERUS em Produção
#  Executa: frontend build, collectstatic, migrate e Django server
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - PRODUCAO"
chcp 65001 | Out-Null
Clear-Host

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║         APERUS - INICIANDO SISTEMA EM PRODUCAO              ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ── Detectar raiz do projeto ────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$PORTA = "8005"
$step = 0
function Step($msg) {
    $script:step++
    Write-Host ""
    Write-Host "[$script:step] $msg" -ForegroundColor Cyan
}

# ────────────────────────────────────────────────────────────
# 1. Verificar pré-requisitos
# ────────────────────────────────────────────────────────────
Step "Verificando pré-requisitos..."

if (-not (Test-Path ".venv")) {
    Write-Host "❌ Ambiente virtual não encontrado!" -ForegroundColor Red
    Write-Host "   Execute: python -m venv .venv" -ForegroundColor Yellow
    Read-Host "Pressione ENTER para sair"
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "   Crie o arquivo .env com as configurações do banco de dados." -ForegroundColor Yellow
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "  ✅ Pré-requisitos OK." -ForegroundColor Green

# ────────────────────────────────────────────────────────────
# 2. Ativar ambiente virtual
# ────────────────────────────────────────────────────────────
Step "Ativando ambiente virtual Python..."

$activateScript = ".\.venv\Scripts\Activate.ps1"
if (-not (Test-Path $activateScript)) {
    Write-Host "❌ Activate.ps1 não encontrado em .venv\Scripts\" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

& $activateScript
Write-Host "  ✅ Ambiente virtual ativado." -ForegroundColor Green

# ────────────────────────────────────────────────────────────
# 3. Build do Frontend (se Node.js disponível)
# ────────────────────────────────────────────────────────────
Step "Build do Frontend..."

if (Test-Path "frontend\package.json") {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Write-Host "  🔨 Executando npm run build..." -ForegroundColor DarkGray
        Push-Location "frontend"
        npm run build --silent 2>&1
        $buildOk = $LASTEXITCODE -eq 0
        Pop-Location
        if ($buildOk) {
            Write-Host "  ✅ Frontend compilado." -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Aviso no build do frontend. Continuando com a versão anterior..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  npm não encontrado. Pulando build do frontend." -ForegroundColor Yellow
    }
} else {
    Write-Host "  ℹ️  Pasta frontend/ não encontrada. Pulando." -ForegroundColor DarkGray
}

# ────────────────────────────────────────────────────────────
# 4. Collectstatic
# ────────────────────────────────────────────────────────────
Step "Coletando arquivos estáticos..."

python manage.py collectstatic --noinput --clear -v 0 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Arquivos estáticos coletados." -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Aviso no collectstatic (continuando...)" -ForegroundColor Yellow
}

# ────────────────────────────────────────────────────────────
# 5. Migrações do banco de dados
# ────────────────────────────────────────────────────────────
Step "Aplicando migrações do banco de dados..."

python manage.py migrate --run-syncdb 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Migrações aplicadas." -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Aviso nas migrações (verifique o banco de dados)." -ForegroundColor Yellow
}

# ────────────────────────────────────────────────────────────
# 6. Iniciar servidor Django
# ────────────────────────────────────────────────────────────
Step "Iniciando servidor Django na porta $PORTA..."

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ SISTEMA APERUS INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Acesse: http://localhost:$PORTA" -ForegroundColor White
Write-Host "  🔧 Admin:  http://localhost:$PORTA/admin/" -ForegroundColor White
Write-Host ""
Write-Host "  Para parar o servidor: Ctrl+C" -ForegroundColor DarkGray
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

python manage.py runserver 0.0.0.0:$PORTA --noreload

# ALTERNATIVA RECOMENDADA: Waitress (servidor WSGI para produção no Windows)
# Descomente a linha abaixo e comente a linha acima para usar o Waitress:
# python -m waitress --port=$PORTA --threads=8 --host=0.0.0.0 projeto_gerencial.wsgi:application

# Se o servidor parar (Ctrl+C ou erro)
Write-Host ""
Write-Host "⏹️  Servidor encerrado." -ForegroundColor Yellow
Read-Host "Pressione ENTER para sair"
