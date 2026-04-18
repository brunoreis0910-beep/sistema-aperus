# ============================================================
#  GIT_SYNC.ps1  -  Sincronizar PC de Desenvolvimento → GitHub
#  Uso: Execute na máquina de desenvolvimento para enviar
#       as alterações para o repositório remoto no GitHub.
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - GIT SYNC"
chcp 65001 | Out-Null
Clear-Host

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║          APERUS - SINCRONIZAR COM GITHUB                     ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Detectar raiz do projeto ────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# ── Verificar se é repositório Git ─────────────────────────
if (-not (Test-Path ".git")) {
    Write-Host "❌ ERRO: Não é um repositório Git. Execute 'git init' primeiro." -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# ── Menu ─────────────────────────────────────────────────────
Write-Host "┌──────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "│  O que deseja fazer?                                         │" -ForegroundColor Yellow
Write-Host "│                                                              │" -ForegroundColor Yellow
Write-Host "│  [1] Enviar alterações para o GitHub (commit + push)         │" -ForegroundColor Yellow
Write-Host "│  [2] Ver status das alterações (git status)                  │" -ForegroundColor Yellow
Write-Host "│  [3] Ver histórico (últimos 10 commits)                      │" -ForegroundColor Yellow
Write-Host "│  [0] Sair                                                    │" -ForegroundColor Yellow
Write-Host "└──────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow
Write-Host ""

$opcao = Read-Host "Digite a opção"

switch ($opcao) {

    "1" {
        Clear-Host
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ENVIANDO ALTERAÇÕES PARA O GITHUB" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""

        # Mostra status atual
        Write-Host "📋 Arquivos alterados:" -ForegroundColor Cyan
        git status --short
        Write-Host ""

        # Verifica se há algo para commitar
        $statusOutput = git status --porcelain
        if (-not $statusOutput) {
            Write-Host "✅ Nada para commitar. Repositório está limpo." -ForegroundColor Green
            Write-Host ""
            # Tenta push mesmo assim (branch pode estar atrás do remote)
            Write-Host "📤 Verificando se há commits locais para enviar..." -ForegroundColor Cyan
            git push origin main 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Push concluído!" -ForegroundColor Green
            } else {
                git push origin master 2>&1
            }
        } else {
            # Pede mensagem de commit
            Write-Host ""
            $dataHora = Get-Date -Format "dd/MM/yyyy HH:mm"
            $msgDefault = "Atualização sistema APERUS - $dataHora"
            Write-Host "💬 Mensagem do commit (ENTER para usar padrão):" -ForegroundColor Cyan
            Write-Host "   Padrão: $msgDefault" -ForegroundColor DarkGray
            $msg = Read-Host "Mensagem"
            if ([string]::IsNullOrWhiteSpace($msg)) {
                $msg = $msgDefault
            }

            Write-Host ""
            Write-Host "📦 Adicionando arquivos..." -ForegroundColor Cyan
            git add -A
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ Erro ao adicionar arquivos!" -ForegroundColor Red
                Read-Host "Pressione ENTER para sair"
                exit 1
            }

            Write-Host "💾 Criando commit..." -ForegroundColor Cyan
            git commit -m "$msg"
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ Erro ao criar commit!" -ForegroundColor Red
                Read-Host "Pressione ENTER para sair"
                exit 1
            }

            Write-Host "📤 Enviando para GitHub..." -ForegroundColor Cyan
            # Tenta push na branch main, depois master
            git push origin main 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  Tentando branch 'master'..." -ForegroundColor DarkGray
                git push origin master 2>&1
            }

            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
                Write-Host "  ✅ ALTERAÇÕES ENVIADAS COM SUCESSO!" -ForegroundColor Green
                Write-Host ""
                Write-Host "  Próximo passo: Execute GIT_ATUALIZAR_SERVIDOR.ps1 no servidor" -ForegroundColor White
                Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "❌ Erro no push! Verifique:" -ForegroundColor Red
                Write-Host "   - Conexão com internet" -ForegroundColor Red
                Write-Host "   - Credenciais do GitHub configuradas" -ForegroundColor Red
                Write-Host "   - Repositório remoto configurado (git remote -v)" -ForegroundColor Red
            }
        }
    }

    "2" {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  STATUS DO REPOSITÓRIO" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        git status
    }

    "3" {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  ÚLTIMOS 10 COMMITS" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        git log --oneline -10
    }

    "0" {
        exit 0
    }

    default {
        Write-Host "❌ Opção inválida!" -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "Pressione ENTER para sair"
