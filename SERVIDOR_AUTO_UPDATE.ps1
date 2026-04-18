# ============================================================
#  SERVIDOR_AUTO_UPDATE.ps1  -  Auto-atualização do servidor
#  
#  Verifica se há novos commits no GitHub.
#  Se sim: para o sistema, faz pull, roda migrate e reinicia.
#
#  Configure como Tarefa Agendada do Windows para rodar
#  automaticamente (ex: a cada 5 minutos).
#
#  Para instalar a tarefa agendada, execute:
#    .\SERVIDOR_AUTO_UPDATE.ps1 -InstalarTarefa
#
#  Para remover a tarefa agendada:
#    .\SERVIDOR_AUTO_UPDATE.ps1 -RemoverTarefa
# ============================================================

param(
    [switch]$InstalarTarefa,
    [switch]$RemoverTarefa,
    [int]$IntervaloMinutos = 5
)

$Host.UI.RawUI.WindowTitle = "APERUS - AUTO UPDATE"
chcp 65001 | Out-Null

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$logFile    = Join-Path $scriptDir "logs\auto_update.log"
$lockFile   = Join-Path $scriptDir ".update_running"
$nomeTarefa = "APERUS-AutoUpdate"

# ── Garantir pasta de logs ────────────────────────────────────
if (-not (Test-Path (Split-Path $logFile))) {
    New-Item -ItemType Directory -Path (Split-Path $logFile) -Force | Out-Null
}

function Write-Log {
    param([string]$msg, [string]$cor = "White")
    $linha = "[$(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')] $msg"
    Write-Host $linha -ForegroundColor $cor
    Add-Content -Path $logFile -Value $linha -Encoding UTF8
}

# ════════════════════════════════════════════════════════════════
# INSTALAR TAREFA AGENDADA
# ════════════════════════════════════════════════════════════════
if ($InstalarTarefa) {
    Write-Host ""
    Write-Host "⚙️  Instalando Tarefa Agendada '$nomeTarefa'..." -ForegroundColor Cyan
    Write-Host "   Intervalo: a cada $IntervaloMinutos minuto(s)" -ForegroundColor DarkGray
    Write-Host ""

    $scriptPath = Join-Path $scriptDir "SERVIDOR_AUTO_UPDATE.ps1"
    $action  = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
    $trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes $IntervaloMinutos) `
        -Once -At (Get-Date)
    $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
        -MultipleInstances IgnoreNew -StartWhenAvailable

    # Remove se já existir
    Unregister-ScheduledTask -TaskName $nomeTarefa -Confirm:$false -ErrorAction SilentlyContinue

    Register-ScheduledTask -TaskName $nomeTarefa `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -RunLevel Highest `
        -Force | Out-Null

    if ($LASTEXITCODE -eq 0 -or (Get-ScheduledTask -TaskName $nomeTarefa -ErrorAction SilentlyContinue)) {
        Write-Host "✅ Tarefa agendada instalada com sucesso!" -ForegroundColor Green
        Write-Host "   O servidor verificará atualizações a cada $IntervaloMinutos minuto(s)." -ForegroundColor Green
    } else {
        Write-Host "❌ Falha ao criar a tarefa. Execute como Administrador." -ForegroundColor Red
    }

    Write-Host ""
    Read-Host "ENTER para sair"
    exit 0
}

# ════════════════════════════════════════════════════════════════
# REMOVER TAREFA AGENDADA
# ════════════════════════════════════════════════════════════════
if ($RemoverTarefa) {
    Unregister-ScheduledTask -TaskName $nomeTarefa -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "✅ Tarefa '$nomeTarefa' removida." -ForegroundColor Green
    Read-Host "ENTER para sair"
    exit 0
}

# ════════════════════════════════════════════════════════════════
# EXECUÇÃO NORMAL - Verificar e aplicar atualização
# ════════════════════════════════════════════════════════════════
Set-Location $scriptDir

# ── Evitar execuções simultâneas ─────────────────────────────
if (Test-Path $lockFile) {
    $lockAge = (Get-Date) - (Get-Item $lockFile).LastWriteTime
    if ($lockAge.TotalMinutes -lt 15) {
        Write-Log "⚠️  Atualização já em andamento. Ignorando." "Yellow"
        exit 0
    }
    Remove-Item $lockFile -Force
}
New-Item $lockFile -ItemType File -Force | Out-Null

try {
    # ── Verificar Git ─────────────────────────────────────────
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        $env:PATH += ";C:\Program Files\Git\cmd"
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Log "❌ Git não encontrado!" "Red"
        exit 1
    }

    if (-not (Test-Path ".git")) {
        Write-Log "❌ Não é um repositório Git." "Red"
        exit 1
    }

    # ── Buscar informações do remoto ──────────────────────────
    Write-Log "🔍 Verificando atualizações no GitHub..." "Cyan"
    git fetch origin --quiet 2>&1 | Out-Null

    $commitLocal  = git rev-parse HEAD
    $commitRemoto = git rev-parse origin/main 2>$null
    if (-not $commitRemoto) {
        $commitRemoto = git rev-parse origin/master 2>$null
    }

    if ($commitLocal -eq $commitRemoto) {
        Write-Log "✅ Sistema já está atualizado. ($($commitLocal.Substring(0,7)))" "Green"
        exit 0
    }

    # ── Há atualização! Iniciar processo ──────────────────────
    Write-Log "🆕 Nova versão detectada! Atualizando..." "Yellow"
    Write-Log "   Local:  $($commitLocal.Substring(0,7))" "DarkGray"
    Write-Log "   Remoto: $($commitRemoto.Substring(0,7))" "DarkGray"

    # Para o Django
    Write-Log "🛑 Parando servidor Django..." "Yellow"
    $procs = Get-Process -Name python, python3 -ErrorAction SilentlyContinue
    if ($procs) {
        $procs | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Log "   Processos Python encerrados." "Green"
    }

    # Stash de arquivos locais (ex: .env não commitado)
    $localChanges = git status --porcelain
    if ($localChanges) {
        git stash push -m "Auto-stash $(Get-Date -Format 'dd/MM HH:mm')" --quiet
    }

    # Pull
    Write-Log "📥 Baixando atualização..." "Cyan"
    git pull origin main --quiet 2>&1
    if ($LASTEXITCODE -ne 0) {
        git pull origin master --quiet 2>&1
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Erro no git pull! Abortando." "Red"
        exit 1
    }
    Write-Log "   Pull concluído." "Green"

    # Dependências Python
    if (Test-Path ".venv") {
        Write-Log "🐍 Atualizando dependências Python..." "Cyan"
        & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet 2>&1 | Out-Null
        Write-Log "   Dependências OK." "Green"
    }

    # Migrações
    if (Test-Path ".venv") {
        Write-Log "🗄️  Rodando migrações..." "Cyan"
        & ".\.venv\Scripts\python.exe" manage.py migrate --run-syncdb 2>&1 | Out-Null
        Write-Log "   Migrações aplicadas." "Green"
    }

    # Collectstatic
    if (Test-Path ".venv") {
        Write-Log "📁 Coletando estáticos..." "Cyan"
        & ".\.venv\Scripts\python.exe" manage.py collectstatic --noinput --clear -v 0 2>&1 | Out-Null
        Write-Log "   Estáticos coletados." "Green"
    }

    # Reinicia Django
    Write-Log "🚀 Reiniciando servidor Django na porta 8005..." "Green"
    $djangoCmd = ".\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8005"
    Start-Process powershell -ArgumentList "-NonInteractive -WindowStyle Minimized -Command `"cd '$scriptDir'; $djangoCmd`"" -WindowStyle Minimized

    Write-Log "════════════════════════════════════════════════════════" "Green"
    Write-Log "✅ ATUALIZAÇÃO CONCLUÍDA! Commit: $($commitRemoto.Substring(0,7))" "Green"
    Write-Log "════════════════════════════════════════════════════════" "Green"

} finally {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
