# ============================================================
#  GIT_ATUALIZAR_SERVIDOR.ps1  -  Atualizar servidor a partir
#  do GitHub.
#  Uso: Execute no servidor Windows para puxar a versão mais
#       recente do repositório e reiniciar o sistema.
# ============================================================

$Host.UI.RawUI.WindowTitle = "APERUS - ATUALIZAR SERVIDOR"
chcp 65001 | Out-Null
Clear-Host

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "║        APERUS - ATUALIZAR SERVIDOR VIA GITHUB               ║" -ForegroundColor Cyan
Write-Host "║                                                              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Detectar raiz do projeto ────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "📁 Diretório: $scriptDir" -ForegroundColor DarkGray
Write-Host ""

# ── Verificar pré-requisitos ────────────────────────────────
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git não encontrado! Instale com: winget install Git.Git --silent" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

if (-not (Test-Path ".git")) {
    Write-Host "❌ ERRO: Não é um repositório Git nesta pasta." -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# ── Menu ─────────────────────────────────────────────────────
Write-Host "┌──────────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "│  O que deseja fazer?                                         │" -ForegroundColor Yellow
Write-Host "│                                                              │" -ForegroundColor Yellow
Write-Host "│  [1] Atualizar do GitHub (pull + restart)                    │" -ForegroundColor Yellow
Write-Host "│  [2] Apenas baixar atualizações (sem reiniciar)              │" -ForegroundColor Yellow
Write-Host "│  [3] Ver status / último commit                              │" -ForegroundColor Yellow
Write-Host "│  [0] Sair                                                    │" -ForegroundColor Yellow
Write-Host "└──────────────────────────────────────────────────────────────┘" -ForegroundColor Yellow
Write-Host ""

$opcao = Read-Host "Digite a opção"

# ── Função: parar processos Python rodando na porta 8005 ─────
function Stop-SistemaPython {
    Write-Host ""
    Write-Host "🛑 Parando processos Python do sistema..." -ForegroundColor Yellow

    # Para todos os processos python.exe (servidor Django)
    $procs = Get-Process -Name python, python3 -ErrorAction SilentlyContinue
    if ($procs) {
        $procs | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Processos Python encerrados." -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  ℹ️  Nenhum processo Python em execução." -ForegroundColor DarkGray
    }
}

# ── Função: pull do GitHub ────────────────────────────────────
function Pull-GitHub {
    Write-Host ""
    Write-Host "🌐 Buscando atualizações no GitHub..." -ForegroundColor Cyan

    # Guarda alterações locais não commitadas (evita conflito)
    $statusOutput = git status --porcelain
    if ($statusOutput) {
        Write-Host "  ⚠️  Há arquivos locais modificados. Salvando com stash..." -ForegroundColor Yellow
        git stash push -m "Auto-stash antes de atualizar $(Get-Date -Format 'dd/MM HH:mm')"
    }

    git fetch origin 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao buscar do GitHub. Verifique a conexão." -ForegroundColor Red
        return $false
    }

    # Tenta pull na branch main, depois master
    git pull origin main 2>&1
    if ($LASTEXITCODE -ne 0) {
        git pull origin master 2>&1
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Código atualizado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  📋 Último commit:" -ForegroundColor DarkGray
        git log --oneline -1
        return $true
    } else {
        Write-Host "❌ Erro no pull! Verifique conflitos com: git status" -ForegroundColor Red
        return $false
    }
}

# ── Função: instalar dependências Python se requirements mudou ─
function Update-PythonDeps {
    if (-not (Test-Path ".venv")) {
        Write-Host "⚠️  Ambiente virtual não encontrado. Pulando atualização de deps." -ForegroundColor Yellow
        return
    }

    Write-Host ""
    Write-Host "🐍 Verificando dependências Python..." -ForegroundColor Cyan
    & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Dependências OK." -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Aviso ao instalar dependências (verifique manualmente)." -ForegroundColor Yellow
    }
}

# ── Função: rodar migrações ────────────────────────────────────
function Run-Migrations {
    if (-not (Test-Path ".venv")) { return }

    Write-Host ""
    Write-Host "🗄️  Rodando migrações do banco de dados..." -ForegroundColor Cyan
    & ".\.venv\Scripts\python.exe" manage.py migrate --run-syncdb 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Migrações aplicadas." -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Aviso nas migrações (verifique manualmente)." -ForegroundColor Yellow
    }
}

# ── Função: build do frontend ────────────────────────────────
function Run-FrontendBuild {
    if (-not (Test-Path "frontend\package.json")) { return }

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "  ⚠️  npm não encontrado. Pulando build do frontend." -ForegroundColor Yellow
        return
    }

    Write-Host ""
    Write-Host "⚡ Executando build do frontend..." -ForegroundColor Cyan
    Push-Location "frontend"
    npm run build 2>&1
    Pop-Location
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Build do frontend concluído." -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Aviso no build do frontend (verifique manualmente)." -ForegroundColor Yellow
    }
}

# ── Função: collectstatic ─────────────────────────────────────
function Run-CollectStatic {
    if (-not (Test-Path ".venv")) { return }

    Write-Host ""
    Write-Host "📁 Coletando arquivos estáticos..." -ForegroundColor Cyan
    & ".\.venv\Scripts\python.exe" manage.py collectstatic --noinput --clear -v 0 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Arquivos estáticos coletados." -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Aviso no collectstatic." -ForegroundColor Yellow
    }
}

# ── Processamento das opções ─────────────────────────────────
switch ($opcao) {

    "1" {
        Clear-Host
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ATUALIZANDO SERVIDOR DO GITHUB" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green

        Stop-SistemaPython
        $ok = Pull-GitHub
        if (-not $ok) {
            Read-Host "Pressione ENTER para sair"
            exit 1
        }
        Update-PythonDeps
        Run-FrontendBuild
        Run-Migrations
        Run-CollectStatic

        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ ATUALIZAÇÃO CONCLUÍDA!" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""

        $restart = Read-Host "Deseja reiniciar o sistema agora? (S/N)"
        if ($restart -imatch "^[Ss]") {
            Write-Host ""
            Write-Host "🚀 Iniciando sistema..." -ForegroundColor Green
            Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptDir\INICIAR_PRODUCAO.ps1`""
        } else {
            Write-Host "ℹ️  Sistema não reiniciado. Execute INICIAR_PRODUCAO.ps1 quando quiser." -ForegroundColor Yellow
        }
    }

    "2" {
        Clear-Host
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  BAIXANDO ATUALIZAÇÕES (sem reiniciar)" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

        $ok = Pull-GitHub
        if ($ok) {
            Update-PythonDeps
            Run-Migrations
            Run-CollectStatic
            Write-Host ""
            Write-Host "✅ Pronto! Execute INICIAR_PRODUCAO.ps1 para reiniciar." -ForegroundColor Green
        }
    }

    "3" {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  STATUS DO REPOSITÓRIO" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        git status
        Write-Host ""
        Write-Host "📋 Últimos 5 commits:" -ForegroundColor Cyan
        git log --oneline -5
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
