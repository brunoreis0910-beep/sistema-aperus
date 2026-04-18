# ============================================================
#  ATUALIZAR.ps1 - Atualizar servidor do GitHub
#  Uso: Clique duplo neste arquivo ou execute: .\ATUALIZAR.ps1
#
#  IMPORTANTE: Execute este arquivo NO SERVIDOR (aperus.com.br)
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - ATUALIZAR SERVIDOR"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  APERUS - ATUALIZANDO SERVIDOR DO GITHUB" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Adicionar Git ao PATH se necessario
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $env:PATH += ";C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
}

# Verificar se e repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "[ERRO] Nao e um repositorio Git." -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Parar Django
Write-Host "[>>] Parando servidor Django..." -ForegroundColor Yellow
$pythonProcs = Get-Process -Name python, python3 -ErrorAction SilentlyContinue
if ($pythonProcs) {
    $pythonProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "     Processos Python encerrados." -ForegroundColor Green
} else {
    Write-Host "     Nenhum processo Python em execucao." -ForegroundColor DarkGray
}

# Salvar alteracoes locais
Write-Host ""
Write-Host "[>>] Verificando alteracoes locais..." -ForegroundColor Cyan
$statusOutput = git status --porcelain
if ($statusOutput) {
    Write-Host "     Salvando alteracoes locais..." -ForegroundColor Yellow
    git stash push -m "Auto-stash $(Get-Date -Format 'dd/MM HH:mm')" --quiet
}

# Baixar atualizacao
Write-Host ""
Write-Host "[>>] Baixando atualizacao do GitHub..." -ForegroundColor Cyan
git fetch origin --quiet 2>&1 | Out-Null
git pull origin main --quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    git pull origin master --quiet 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Falha ao baixar atualizacao!" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "     Atualizacao baixada!" -ForegroundColor Green
Write-Host ""
Write-Host "     Ultimo commit:" -ForegroundColor DarkGray
git log --oneline -1

# Atualizar dependencias Python
if (Test-Path ".venv") {
    Write-Host ""
    Write-Host "[>>] Atualizando dependencias Python..." -ForegroundColor Cyan
    & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     Dependencias atualizadas." -ForegroundColor Green
    }
}

# Rodar migracoes
if (Test-Path ".venv") {
    Write-Host ""
    Write-Host "[>>] Aplicando migracoes do banco de dados..." -ForegroundColor Cyan
    & ".\.venv\Scripts\python.exe" manage.py migrate --run-syncdb 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     Migracoes aplicadas." -ForegroundColor Green
    }
}

# Build do frontend
if (Test-Path "frontend") {
    Write-Host ""
    Write-Host "[>>] Fazendo build do frontend..." -ForegroundColor Cyan
    Push-Location frontend
    npm run build --silent 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     Build concluido." -ForegroundColor Green
    } else {
        Write-Host "     Aviso: Build do frontend falhou (pode nao ser critico)." -ForegroundColor Yellow
    }
    Pop-Location
}

# Collectstatic
if (Test-Path ".venv") {
    Write-Host ""
    Write-Host "[>>] Coletando arquivos estaticos..." -ForegroundColor Cyan
    & ".\.venv\Scripts\python.exe" manage.py collectstatic --noinput --clear -v 0 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     Arquivos estaticos coletados." -ForegroundColor Green
    }
}

# Reiniciar Django
Write-Host ""
Write-Host "[>>] Reiniciando servidor Django..." -ForegroundColor Cyan

$djangoCmd = ".\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8005 --noreload"

# Tentar iniciar em janela minimizada
try {
    Start-Process powershell -ArgumentList "-NonInteractive -WindowStyle Minimized -Command `"cd '$scriptDir'; $djangoCmd`"" -WindowStyle Minimized
    Write-Host "     Django iniciado na porta 8005." -ForegroundColor Green
} catch {
    Write-Host "     Aviso: Nao foi possivel iniciar Django automaticamente." -ForegroundColor Yellow
    Write-Host "     Execute manualmente: python manage.py runserver 0.0.0.0:8005" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [OK] SERVIDOR ATUALIZADO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Acesse: http://aperus.com.br" -ForegroundColor White
Write-Host ""

Read-Host "Pressione ENTER para sair"
