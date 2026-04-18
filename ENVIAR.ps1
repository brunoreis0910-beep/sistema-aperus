# ============================================================
#  ENVIAR.ps1 - Enviar alteracoes para o servidor
#  Uso: Clique duplo neste arquivo ou execute: .\ENVIAR.ps1
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - ENVIAR ALTERACOES"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  APERUS - ENVIANDO ALTERACOES PARA O SERVIDOR" -ForegroundColor Cyan
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

# Verificar se ha alteracoes
$statusOutput = git status --porcelain
if (-not $statusOutput) {
    Write-Host "[OK] Nenhuma alteracao para enviar!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ultimo commit:" -ForegroundColor DarkGray
    git log --oneline -1
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
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
Write-Host "[>>] Sincronizando com GitHub..." -ForegroundColor Cyan
git fetch origin --quiet 2>&1 | Out-Null

$commitLocal  = git rev-parse HEAD
$commitRemoto = git rev-parse origin/main 2>$null
if (-not $commitRemoto) {
    $commitRemoto = git rev-parse origin/master 2>$null
}

if ($commitLocal -ne $commitRemoto) {
    Write-Host "     Fazendo pull..." -ForegroundColor Yellow
    git pull origin main --rebase --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        git pull origin master --rebase --quiet 2>&1 | Out-Null
    }
}

# Enviar
Write-Host "[>>] Enviando para GitHub..." -ForegroundColor Cyan
git push origin main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    git push origin master 2>&1 | Out-Null
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  [OK] ENVIADO COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Commit: " -NoNewline -ForegroundColor DarkGray
    git log --oneline -1
    Write-Host ""
    Write-Host "  O servidor recebera a atualizacao em ate 5 minutos" -ForegroundColor White
    Write-Host "  (se o auto-update estiver configurado)" -ForegroundColor DarkGray
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERRO] Falha ao enviar! Verifique sua conexao." -ForegroundColor Red
}

Write-Host ""
Read-Host "Pressione ENTER para sair"
