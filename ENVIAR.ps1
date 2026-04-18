# ============================================================
#  ENVIAR.ps1 - Enviar alteracoes para o servidor
#  Uso: Clique duplo neste arquivo ou execute: .\ENVIAR.ps1
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - ENVIAR ALTERACOES"
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
Write-Host "  APERUS - ENVIANDO ALTERACOES PARA O SERVIDOR" -ForegroundColor Cyan
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
    Mostrar-Erro "Nao e um repositorio Git!" "Execute 'git init' primeiro"
}

# Verificar se ha alteracoes
$statusOutput = git status --porcelain
if (-not $statusOutput) {
    Write-Host "[OK] Nenhuma alteracao para enviar!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ultimo commit:" -ForegroundColor DarkGray
    git log --oneline -1
    Write-Host ""
    Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

# Mostrar alteracoes
Write-Host "[>>] Arquivos alterados:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Criar mensagem automatica
$dataHora = Get-Date -Format "dd/MM/yyyy HH:mm"
$mensagem = "Atualizacao APERUS - $dataHora"

Write-Host "[>>] Adicionando arquivos..." -ForegroundColor Cyan
git add -A

Write-Host "[>>] Criando commit: $mensagem" -ForegroundColor Cyan
git commit -m $mensagem | Out-Null

# Sincronizar antes de enviar
$fetchOutput = git fetch origin 2>&1 | Out-String

$commitLocal  = git rev-parse HEAD 2>&1
$commitRemoto = git rev-parse origin/main 2>$null
if (-not $commitRemoto) {
    $commitRemoto = git rev-parse origin/master 2>$null
}

if ($commitLocal -ne $commitRemoto) {
    Write-Host "     Fazendo pull..." -ForegroundColor Yellow
    $pullOutput = git pull origin main --rebase 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        $pullOutput = git pull origin master --rebase 2>&1 | Out-String
        if ($LASTEXITCODE -ne 0) {
            Mostrar-Erro "Falha ao sincronizar!" $pullOutput
        }
    }
}

# Enviar
Write-Host "[>>] Enviando para GitHub..." -ForegroundColor Cyan
$pushOutput = git push origin main 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    $pushOutput = git push origin master 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Mostrar-Erro "Falha ao enviar!" $pushOutput
    }
}
Read-Host "Pressione ENTER para sair"
