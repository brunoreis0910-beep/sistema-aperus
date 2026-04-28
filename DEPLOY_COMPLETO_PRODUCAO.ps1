# ============================================================
#  DEPLOY_COMPLETO_PRODUCAO.ps1
#  Deploy completo: Commit → Push → Atualizar Servidor
# ============================================================

param(
    [string]$Mensagem = "Corrigir erro TDZ (Temporal Dead Zone) em useSafeDashboardData"
)

$Host.UI.RawUI.WindowTitle = "APERUS - DEPLOY PRODUÇÃO"
Clear-Host

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║       DEPLOY COMPLETO PARA PRODUÇÃO                          ║" -ForegroundColor Cyan
Write-Host "║       sistema.aperus.com.br                                  ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# ═══════════════════════════════════════════════════════════
# PASSO 1: Verificar alterações
# ═══════════════════════════════════════════════════════════
Write-Host "🔍 PASSO 1: Verificando alterações..." -ForegroundColor Yellow
Write-Host ""

$statusOutput = git status --porcelain
if (-not $statusOutput) {
    Write-Host "❌ Nenhuma alteração para enviar. Repositório limpo." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Se já fez commit antes, execute:" -ForegroundColor Cyan
    Write-Host "   git push origin main" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 0
}

Write-Host "✅ Alterações detectadas:" -ForegroundColor Green
git status --short | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PASSO 2: Commit local
# ═══════════════════════════════════════════════════════════
Write-Host "📦 PASSO 2: Criando commit..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Mensagem: $Mensagem" -ForegroundColor White
Write-Host ""

$confirma = Read-Host "Confirma commit? (S/N)"
if ($confirma -ne "S" -and $confirma -ne "s") {
    Write-Host "❌ Operação cancelada." -ForegroundColor Red
    exit 0
}

git add .
git commit -m "$Mensagem"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar commit!" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "✅ Commit criado com sucesso!" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PASSO 3: Push para GitHub
# ═══════════════════════════════════════════════════════════
Write-Host "🌐 PASSO 3: Enviando para GitHub..." -ForegroundColor Yellow
Write-Host ""

git push origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Branch 'main' não encontrada. Tentando 'master'..." -ForegroundColor Yellow
    git push origin master 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer push! Verifique:" -ForegroundColor Red
    Write-Host "   - Conexão com internet" -ForegroundColor DarkGray
    Write-Host "   - Credenciais Git configuradas" -ForegroundColor DarkGray
    Write-Host "   - git push origin main (ou master)" -ForegroundColor DarkGray
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "✅ Código enviado para GitHub!" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════
# PASSO 4: Instruções para atualizar servidor
# ═══════════════════════════════════════════════════════════
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║  ✅ DEPLOY LOCAL CONCLUÍDO!                                  ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Último commit:" -ForegroundColor Cyan
git log --oneline -1 | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
Write-Host ""
Write-Host "┌──────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "│  PRÓXIMO PASSO: ATUALIZAR SERVIDOR DE PRODUÇÃO               │" -ForegroundColor Yellow
Write-Host "└──────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔐 ACESSE O SERVIDOR:" -ForegroundColor Cyan
Write-Host "   1. Conecte via RDP ou SSH ao servidor" -ForegroundColor White
Write-Host "   2. Navegue até a pasta do projeto" -ForegroundColor White
Write-Host "   3. Execute:" -ForegroundColor White
Write-Host ""
Write-Host "      .\GIT_ATUALIZAR_SERVIDOR.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "   4. Escolha opção [1] - Atualizar do GitHub" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "💡 ALTERNATIVA - Deploy automático:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Se o servidor tiver atualização automática ativada," -ForegroundColor DarkGray
Write-Host "   aguarde 5 minutos e o deploy será feito automaticamente!" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Para ativar atualização automática no servidor:" -ForegroundColor DarkGray
Write-Host "   .\SERVIDOR_AUTO_UPDATE.ps1 -InstalarTarefa" -ForegroundColor DarkGray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "⚠️  IMPORTANTE APÓS ATUALIZAR O SERVIDOR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Acesse: https://sistema.aperus.com.br/limpar-cache.html" -ForegroundColor White
Write-Host "   2. Clique em 'Limpar TUDO e Recarregar'" -ForegroundColor White
Write-Host "   3. Faça login novamente" -ForegroundColor White
Write-Host "   4. Teste a tela de Vendas" -ForegroundColor White
Write-Host ""
Write-Host "   Ou limpe manualmente (F12 → Console):" -ForegroundColor DarkGray
Write-Host "   localStorage.clear(); sessionStorage.clear();" -ForegroundColor DarkGray
Write-Host "   await indexedDB.deleteDatabase('AperusTerminalCache');" -ForegroundColor DarkGray
Write-Host "   await indexedDB.deleteDatabase('SistemaGerencialOffline');" -ForegroundColor DarkGray
Write-Host "   location.reload(true);" -ForegroundColor DarkGray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

Read-Host "Pressione ENTER para sair"
