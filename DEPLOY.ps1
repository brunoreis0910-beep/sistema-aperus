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

# ── Verificar pré-requisitos ─────────────────────────────────
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não encontrado no PATH." -ForegroundColor Red
    $env:PATH += ";C:\Program Files\Git\cmd"
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Instale o Git: winget install Git.Git --silent" -ForegroundColor Red
        Read-Host "ENTER para sair"
        exit 1
    }
}

if (-not (Test-Path ".git")) {
    Write-Host "❌ Não é um repositório Git nesta pasta." -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

# ── Verificar alterações ──────────────────────────────────────
$statusOutput = git status --porcelain
if (-not $statusOutput) {
    Write-Host "✅ Nenhuma alteração para enviar. Repositório está limpo." -ForegroundColor Green
    Write-Host ""
    git log --oneline -3
    Write-Host ""
    Read-Host "ENTER para sair"
    exit 0
}

# ── Mostrar o que será enviado ────────────────────────────────
Write-Host "📋 Arquivos alterados:" -ForegroundColor Cyan
git status --short
Write-Host ""

# ── Mensagem do commit ────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($Mensagem)) {
    $dataHora = Get-Date -Format "dd/MM/yyyy HH:mm"
    $padrao = "Atualização APERUS - $dataHora"
    Write-Host "💬 Mensagem do commit (ENTER para: '$padrao'):" -ForegroundColor Cyan
    $Mensagem = Read-Host ">"
    if ([string]::IsNullOrWhiteSpace($Mensagem)) {
        $Mensagem = $padrao
    }
}

Write-Host ""
Write-Host "  Mensagem: $Mensagem" -ForegroundColor DarkGray
Write-Host ""

# ── Commit ────────────────────────────────────────────────────
Write-Host "📦 Adicionando arquivos..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar arquivos!" -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

Write-Host "💾 Criando commit..." -ForegroundColor Cyan
git commit -m $Mensagem
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar commit!" -ForegroundColor Red
    Read-Host "ENTER para sair"
    exit 1
}

# ── Push ──────────────────────────────────────────────────────
Write-Host "📤 Enviando para GitHub..." -ForegroundColor Cyan
git push origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    git push origin master 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Último commit:" -ForegroundColor DarkGray
    git log --oneline -1
    Write-Host ""
    Write-Host "  O servidor vai detectar a atualização automaticamente" -ForegroundColor White
    Write-Host "  (se SERVIDOR_AUTO_UPDATE estiver configurado)" -ForegroundColor DarkGray
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erro no push! Verifique a conexão e as credenciais do GitHub." -ForegroundColor Red
}

Write-Host ""
Read-Host "ENTER para sair"
