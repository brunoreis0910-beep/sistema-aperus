# ============================================================
#  DEPLOY.ps1  -  Commit + Push rapido para o GitHub
#  Uso: .\DEPLOY.ps1
#       .\DEPLOY.ps1 "Descricao da alteracao"
# ============================================================

param(
    [string]$Mensagem = ""
)

$Host.UI.RawUI.WindowTitle = "APERUS - DEPLOY"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "           APERUS - DEPLOY PARA GITHUB                     " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Verificar pre-requisitos
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[X] Git nao encontrado no PATH." -ForegroundColor Red
    $env:PATH += ";C:\Program Files\Git\cmd"
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "[X] Instale o Git: winget install Git.Git --silent" -ForegroundColor Red
        Read-Host "ENTER para sair"
        exit 1
    }
}

if (-not (Test-Path ".git")) {
    Write-Host "[X] Nao e um repositorio Git nesta pasta." -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

# Verificar alteracoes
$statusOutput = git status --porcelain
if (-not $statusOutput) {
    Write-Host "[OK] Nenhuma alteracao para enviar. Repositorio esta limpo." -ForegroundColor Green
    Write-Host ""
    git log --oneline -3
    Write-Host ""
    Read-Host "ENTER para sair"
    exit 0
}

# Mostrar o que sera enviado
Write-Host "[>>] Arquivos alterados:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Mensagem do commit
if ([string]::IsNullOrWhiteSpace($Mensagem)) {
    $dataHora = Get-Date -Format "dd/MM/yyyy HH:mm"
    $padrao = "Atualizacao APERUS - $dataHora"
    Write-Host "[>>] Mensagem do commit (ENTER para usar padrao):" -ForegroundColor Cyan
    Write-Host "     Padrao: $padrao" -ForegroundColor DarkGray
    $Mensagem = Read-Host "    >"
    if ([string]::IsNullOrWhiteSpace($Mensagem)) {
        $Mensagem = $padrao
    }
}

Write-Host ""
Write-Host "     Mensagem: $Mensagem" -ForegroundColor DarkGray
Write-Host ""

# Commit
Write-Host "[>>] Adicionando arquivos..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Erro ao adicionar arquivos!" -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

Write-Host "[>>] Criando commit..." -ForegroundColor Cyan
git commit -m $Mensagem
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Erro ao criar commit!" -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

# Sincronizar com GitHub (pull) antes do push
Write-Host "[>>] Sincronizando com GitHub..." -ForegroundColor Cyan
git fetch origin --quiet 2>&1 | Out-Null
$commitLocal  = git rev-parse HEAD
$commitRemoto = git rev-parse origin/main 2>$null
if (-not $commitRemoto) {
    $commitRemoto = git rev-parse origin/master 2>$null
}

if ($commitLocal -ne $commitRemoto) {
    Write-Host "     Nova versao no GitHub detectada. Fazendo pull..." -ForegroundColor Yellow
    git pull origin main --rebase --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        git pull origin master --rebase --quiet 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[X] Erro ao sincronizar! Resolva conflitos manualmente." -ForegroundColor Red
        Write-Host "    Execute: git status" -ForegroundColor Yellow
        Read-Host "ENTER para sair"
        exit 1
    }
    Write-Host "     [OK] Sincronizado." -ForegroundColor Green
}

# Push
Write-Host "[>>] Enviando para GitHub..." -ForegroundColor Cyan
git push origin main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    git push origin master 2>&1 | Out-Null
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  [OK] DEPLOY CONCLUIDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Ultimo commit:" -ForegroundColor DarkGray
    git log --oneline -1
    Write-Host ""
    Write-Host "  O servidor vai detectar a atualizacao automaticamente" -ForegroundColor White
    Write-Host "  (se SERVIDOR_AUTO_UPDATE estiver configurado)" -ForegroundColor DarkGray
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[X] Erro no push! Verifique a conexao e as credenciais." -ForegroundColor Red
}

Write-Host ""
Read-Host "ENTER para sair"
# ============================================================
#  DEPLOY.ps1  -  Commit + Push rápido para o GitHub
#  Uso: .\DEPLOY.ps1
#       .\DEPLOY.ps1 "Descrição da alteração"
# ============================================================

param(
    [string]$Mensagem = ""
)

$Host.UI.RawUI.WindowTitle = "APERUS - DEPLOY"
chcp 65001 | Out-Null
Clear-Host

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           APERUS - DEPLOY PARA GITHUB                       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# -- Verificar pre-requisitos ------------------------------------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "X  Git nao encontrado no PATH." -ForegroundColor Red
    $env:PATH += ";C:\Program Files\Git\cmd"
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "X  Instale o Git: winget install Git.Git --silent" -ForegroundColor Red
        Read-Host "ENTER para sair"
        exit 1
    }
}

if (-not (Test-Path ".git")) {
    Write-Host "X  Nao e um repositorio Git nesta pasta." -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

# -- Verificar alteracoes -----------------------------------------
$statusOutput = git status --porcelain
if (-not $statusOutput) {
    Write-Host "OK - Nenhuma alteracao para enviar. Repositorio esta limpo." -ForegroundColor Green
    Write-Host ""
    git log --oneline -3
    Write-Host ""
    Read-Host "ENTER para sair"
    exit 0
}

# -- Mostrar o que sera enviado -----------------------------------
Write-Host ">> Arquivos alterados:" -ForegroundColor Cyan
git status --short
Write-Host ""

# -- Mensagem do commit -------------------------------------------
if ([string]::IsNullOrWhiteSpace($Mensagem)) {
    $dataHora = Get-Date -Format "dd/MM/yyyy HH:mm"
    $padrao = "Atualizacao APERUS - $dataHora"
    Write-Host ">> Mensagem do commit (ENTER para usar padrao):" -ForegroundColor Cyan
    Write-Host "   Padrao: $padrao" -ForegroundColor DarkGray
    $Mensagem = Read-Host ">"
    if ([string]::IsNullOrWhiteSpace($Mensagem)) {
        $Mensagem = $padrao
    }
}

Write-Host ""
Write-Host "  Mensagem: $Mensagem" -ForegroundColor DarkGray
Write-Host ""

# -- Commit --------------------------------------------------------
Write-Host ">> Adicionando arquivos..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "X  Erro ao adicionar arquivos!" -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

Write-Host ">> Criando commit..." -ForegroundColor Cyan
git commit -m $Mensagem
if ($LASTEXITCODE -ne 0) {
    Write-Host "X  Erro ao criar commit!" -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

# ── Sincronizar com GitHub (pull) antes do push ──────────────
Write-Host ">> Sincronizando com GitHub..." -ForegroundColor Cyan
git fetch origin --quiet 2>&1
$commitLocal  = git rev-parse HEAD
$commitRemoto = git rev-parse origin/main 2>$null
if (-not $commitRemoto) {
    $commitRemoto = git rev-parse origin/master 2>$null
}

if ($commitLocal -ne $commitRemoto) {
    Write-Host "   Nova versao no GitHub detectada. Fazendo pull..." -ForegroundColor Yellow
    git pull origin main --rebase --quiet 2>&1
    if ($LASTEXITCODE -ne 0) {
        git pull origin master --rebase --quiet 2>&1
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "X  Erro ao sincronizar! Resolva conflitos manualmente." -ForegroundColor Red
        Write-Host "   Execute: git status" -ForegroundColor Yellow
        Read-Host "ENTER para sair"
        exit 1
    }
    Write-Host "   OK - Sincronizado." -ForegroundColor Green
}

# ── Push ──────────────────────────────────────────────────────
Write-Host ">> Enviando para GitHub..." -ForegroundColor Cyan
git push origin main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    git push origin master 2>&1 | Out-Null
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  OK - DEPLOY CONCLUIDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Ultimo commit:" -ForegroundColor DarkGray
    git log --oneline -1
    Write-Host ""
    Write-Host "  O servidor vai detectar a atualizacao automaticamente" -ForegroundColor White
    Write-Host "  (se SERVIDOR_AUTO_UPDATE estiver configurado)" -ForegroundColor DarkGray
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "X  Erro no push! Verifique a conexao e as credenciais do GitHub." -ForegroundColor Red
}

Write-Host ""
Read-Host "ENTER para sair"
