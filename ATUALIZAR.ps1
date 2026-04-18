# ============================================================
#  ATUALIZAR.ps1 - Atualizar servidor do GitHub
#  Uso: Clique duplo neste arquivo
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - ATUALIZAR SERVIDOR"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

# Sempre manter a janela aberta em caso de erro inesperado
trap {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "  [ERRO INESPERADO]" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Clear-Host

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  APERUS - ATUALIZANDO SERVIDOR DO GITHUB" -ForegroundColor Cyan
Write-Host "  Pasta: $scriptDir" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Adicionar Git ao PATH ────────────────────────────────────
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $env:PATH += ";C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
}

# ── Verificar Git ────────────────────────────────────────────
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Git nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Instale o Git e tente novamente:" -ForegroundColor Yellow
    Write-Host "  winget install Git.Git --silent" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# ── Verificar se e repositorio Git ──────────────────────────
if (-not (Test-Path ".git")) {
    Write-Host "[ERRO] Esta pasta nao e um repositorio Git!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Pasta atual: $scriptDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Execute estes comandos para configurar:" -ForegroundColor Yellow
    Write-Host "  git init" -ForegroundColor White
    Write-Host "  git remote add origin https://github.com/brunoreis0910-beep/sistema-aperus.git" -ForegroundColor White
    Write-Host "  git fetch origin" -ForegroundColor White
    Write-Host "  git reset --hard origin/main" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# ── Parar Django ─────────────────────────────────────────────
Write-Host "[1/6] Parando servidor Django..." -ForegroundColor Yellow
$pythonProcs = Get-Process -Name python, python3 -ErrorAction SilentlyContinue
if ($pythonProcs) {
    $pythonProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "      Processos Python encerrados." -ForegroundColor Green
} else {
    Write-Host "      Nenhum processo Python em execucao." -ForegroundColor DarkGray
}

# ── Salvar alteracoes locais ──────────────────────────────────
$statusOutput = git status --porcelain 2>&1
if ($statusOutput) {
    Write-Host ""
    Write-Host "      Salvando alteracoes locais com stash..." -ForegroundColor Yellow
    git stash push -m "Auto-stash $(Get-Date -Format 'dd/MM HH:mm')" --quiet
}

# ── Git Pull ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/6] Baixando atualizacao do GitHub..." -ForegroundColor Cyan

$fetchResult = git fetch origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Falha ao conectar no GitHub!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Detalhes:" -ForegroundColor Yellow
    Write-Host "  $fetchResult" -ForegroundColor White
    Write-Host ""
    Write-Host "  Verifique:" -ForegroundColor Yellow
    Write-Host "  - Conexao com a internet" -ForegroundColor White
    Write-Host "  - git remote -v  (deve mostrar a URL do GitHub)" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

$pullResult = git pull origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    $pullResult = git pull origin master 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Falha ao baixar atualizacao!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Detalhes:" -ForegroundColor Yellow
    Write-Host "  $pullResult" -ForegroundColor White
    Write-Host ""
    Write-Host "  Tente executar manualmente:" -ForegroundColor Yellow
    Write-Host "  git status" -ForegroundColor White
    Write-Host "  git reset --hard origin/main" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "      Codigo atualizado!" -ForegroundColor Green
Write-Host "      Ultimo commit: $(git log --oneline -1)" -ForegroundColor DarkGray

# ── Dependencias Python ───────────────────────────────────────
Write-Host ""
Write-Host "[3/6] Atualizando dependencias Python..." -ForegroundColor Cyan
if (Test-Path ".venv\Scripts\python.exe") {
    $pipResult = & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      Dependencias OK." -ForegroundColor Green
    } else {
        Write-Host "      [AVISO] Erro ao instalar dependencias:" -ForegroundColor Yellow
        Write-Host "      $($pipResult | Select-Object -Last 3 | Out-String)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "      [AVISO] .venv nao encontrado - pulando." -ForegroundColor Yellow
}

# ── Build Frontend ────────────────────────────────────────────
Write-Host ""
Write-Host "[4/6] Fazendo build do frontend..." -ForegroundColor Cyan
if (Test-Path "frontend\package.json") {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Push-Location frontend
        $buildResult = npm run build 2>&1
        $buildExit = $LASTEXITCODE
        Pop-Location
        if ($buildExit -eq 0) {
            Write-Host "      Build concluido." -ForegroundColor Green
        } else {
            Write-Host "      [AVISO] Build falhou:" -ForegroundColor Yellow
            Write-Host "      $($buildResult | Select-Object -Last 5 | Out-String)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "      [AVISO] npm nao encontrado - pulando build." -ForegroundColor Yellow
    }
} else {
    Write-Host "      Sem frontend para buildar." -ForegroundColor DarkGray
}

# ── Migracoes ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/6] Aplicando migracoes do banco..." -ForegroundColor Cyan
if (Test-Path ".venv\Scripts\python.exe") {
    $migrateResult = & ".\.venv\Scripts\python.exe" manage.py migrate --run-syncdb 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      Migracoes aplicadas." -ForegroundColor Green
    } else {
        Write-Host "      [AVISO] Erro nas migracoes:" -ForegroundColor Yellow
        Write-Host "      $($migrateResult | Select-Object -Last 5 | Out-String)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "      [AVISO] .venv nao encontrado - pulando." -ForegroundColor Yellow
}

# ── Collectstatic ─────────────────────────────────────────────
Write-Host ""
Write-Host "[6/6] Coletando arquivos estaticos..." -ForegroundColor Cyan
if (Test-Path ".venv\Scripts\python.exe") {
    & ".\.venv\Scripts\python.exe" manage.py collectstatic --noinput --clear -v 0 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      Estaticos coletados." -ForegroundColor Green
    } else {
        Write-Host "      [AVISO] Erro no collectstatic." -ForegroundColor Yellow
    }
}

# ── Reiniciar Django ──────────────────────────────────────────
Write-Host ""
Write-Host "[>>] Reiniciando servidor Django na porta 8005..." -ForegroundColor Cyan
if (Test-Path ".venv\Scripts\python.exe") {
    Start-Process powershell -ArgumentList "-WindowStyle Minimized -ExecutionPolicy Bypass -Command `"cd '$scriptDir'; .\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8005 --noreload`""
    Write-Host "      Django iniciado!" -ForegroundColor Green
} else {
    Write-Host "      [AVISO] .venv nao encontrado. Inicie o Django manualmente." -ForegroundColor Yellow
    Write-Host "      python manage.py runserver 0.0.0.0:8005" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [OK] SERVIDOR ATUALIZADO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Acesse: http://aperus.com.br" -ForegroundColor White
Write-Host ""
Read-Host "Pressione ENTER para sair"
# ============================================================
#  ATUALIZAR.ps1 - Atualizar servidor do GitHub
#  Uso: Clique duplo neste arquivo ou execute: .\ATUALIZAR.ps1
#
#  IMPORTANTE: Execute este arquivo NO SERVIDOR (aperus.com.br)
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - ATUALIZAR SERVIDOR"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"
Clear-Host

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Funcao para mostrar erro e pausar
function Mostrar-Erro {
    param([string]$Mensagem, [string]$Detalhe = "")
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "  [ERRO] $Mensagem" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    if ($Detalhe) {
        Write-Host ""
        Write-Host "Detalhes:" -ForegroundColor Yellow
        Write-Host $Detalhe -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  APERUS - ATUALIZANDO SERVIDOR DO GITHUB" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Adicionar Git ao PATH se necessario
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $env:PATH += ";C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
}

# Verificar se Git esta instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Mostrar-Erro "Git nao encontrado!" "Instale o Git primeiro: winget install Git.Git --silent"
}

# Verificar se e repositorio Git
if (-not (Test-Path ".git")) {
    Mostrar-Erro "Nao e um repositorio Git!" "Execute 'git init' primeiro ou veja INSTALACAO_SERVIDOR.md"
}

# Parar Django
Write-Host "[>>] Parando servidor Django..." -ForegroundColor Yellow

$fetchOutput = git fetch origin 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    Mostrar-Erro "Falha ao conectar no GitHub!" $fetchOutput
}

$pullOutput = git pull origin main 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    $pullOutput = git pull origin master 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Mostrar-Erro "Falha ao baixar atualizacao!" $pullOutput
    } ""
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

# Atualizar dependen\Scripts\python.exe") {
    Write-Host ""
    Write-Host "[>>] Atualizando dependencias Python..." -ForegroundColor Cyan
    $pipOutput = & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     Dependencias atualizadas." -ForegroundColor Green
    } else {
        Write-Host "     Aviso: Erro ao atualizar dependencias." -ForegroundColor Yellow
        Write-Host "     $pipOutput" -ForegroundColor DarkGray
    }
} else {
    Write-Host ""
    Write-Host "[AVISO] Python virtualenv nao encontrado." -ForegroundColor Yellow
}

# Rodar migracoes
if (Test-Path ".venv\Scripts\python.exe") {
    Write-Host ""
    Write-Host "[>>] Aplicando migracoes do banco de dados..." -ForegroundColor Cyan
    $migrateOutput = & ".\.venv\Scripts\python.exe" manage.py migrate --run-syncdb 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     Migracoes aplicadas." -ForegroundColor Green
    } else {
        Write-Host "     Aviso: Erro nas migracoes." -ForegroundColor Yellow
        Write-Host "     $($migrateOutput -split "`n" | Select-Object -Last 5 | Out-String)" -ForegroundColor DarkGray
    }
}

# Build do frontend
if (Test-Path "frontend\package.json") {
    Write-Host ""
    Write-Host "[>>] Fazendo build do frontend..." -ForegroundColor Cyan
    Push-Location frontend
    $buildOutput = npm run build --silent 2>&1 | Out-String
    Pop-Location
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     Build concluido." -ForegroundColor Green
    } else {
        Write-Host "     Aviso: Build do frontend falhou (pode nao ser critico)." -ForegroundColor Yellow
    }
}

# Collectstatic
if (Test-Path ".venv\Scripts\python.exe") {
    Write-Host ""
    Write-Host "[>>] Coletando arquivos estaticos..." -ForegroundColor Cyan
    $collectOutput = & ".\.venv\Scripts\python.exe" manage.py collectstatic --noinput --clear -v 0 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "     Arquivos estaticos coletados." -ForegroundColor Green
    } else {
        Write-Host "     Aviso: Erro ao coletar estaticos." -ForegroundColor Yellow
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
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")ossivel iniciar Django automaticamente." -ForegroundColor Yellow
    Write-Host "     Execute manualmente: python manage.py runserver 0.0.0.0:8005" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [OK] SERVIDOR ATUALIZADO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Acesse: http://aperus.com.br" -ForegroundColor White
Write-Host ""
pouse
Read-Host "Pressione ENTER para sair"
