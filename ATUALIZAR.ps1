# ATUALIZAR.ps1 - Atualizar cliente a partir do template SistemaAperus
# ============================================================
# ATENCAO: Este script e exclusivo para instancias de CLIENTES.
# Ele NAO faz git pull. Em vez disso, copia apenas os arquivos
# de CODIGO do template SistemaAperus, preservando os arquivos
# de configuracao do banco de dados (.env, settings, etc.)
# Usa NSSM para parar/iniciar o servico corretamente.
# ============================================================
$Host.UI.RawUI.WindowTitle = "APERUS - ATUALIZAR CLIENTE"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

Clear-Host
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  APERUS - ATUALIZANDO CLIENTE" -ForegroundColor Cyan
Write-Host "  Pasta: $scriptDir" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Detectar PORTA do cliente a partir do .env (para reiniciar
# na porta correta)
# ============================================================
$portaCliente = "8005"
Write-Host "  Porta do cliente: $portaCliente" -ForegroundColor DarkGray
Write-Host ""

# ============================================================
# Detectar nome do venv (pode ser 'venv' ou '.venv')
# ============================================================
$venvPath = "venv"
if (Test-Path ".venv\\Scripts\\python.exe") { $venvPath = ".venv" }

# ============================================================
# [1/5] Parar servidor Django do cliente (via NSSM)
# ============================================================
Write-Host "[1/5] Parando servidor Django..." -ForegroundColor Yellow

# Detectar o nome do servico NSSM do cliente
$nssmPath = "C:\\APERUS\\nssm.exe"
$nomeServico = "AperusServerFilho"
Write-Host "  Servico: $nomeServico" -ForegroundColor DarkGray

# Tentar parar pelo servico NSSM
$servicoParado = $false
try {
    $statusResult = & $nssmPath status $nomeServico 2>$null
    if ($statusResult -match 'SERVICE_RUNNING') {
        Write-Host "  Parando servico $nomeServico via NSSM..." -ForegroundColor Yellow
        & $nssmPath stop $nomeServico 2>$null
        Start-Sleep -Seconds 3
        $servicoParado = $true
        Write-Host "  OK - Servico parado." -ForegroundColor Green
    } else {
        Write-Host "  Servico $nomeServico ja estava parado." -ForegroundColor DarkGray
        $servicoParado = $true
    }
} catch {
    Write-Host "  [AVISO] Nao foi possivel parar pelo NSSM. Tentando matar processo na porta..." -ForegroundColor Yellow
}

# Fallback: matar processo pela porta se o NSSM nao conseguiu
if (-not $servicoParado) {
    $pids = @()
    if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
        $connections = Get-NetTCPConnection -LocalPort $portaCliente -ErrorAction SilentlyContinue
        if ($connections) {
            $pids = @($connections.OwningProcess)
        }
    }
    foreach ($procId in $pids | Select-Object -Unique) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc -and ($proc.Name -like "*python*")) {
            Write-Host "  Parando processo Python (PID $procId) na porta $portaCliente..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "  OK." -ForegroundColor Green
}

# Garantir que a porta esta livre (matar qualquer processo orfao)
$connections = Get-NetTCPConnection -LocalPort $portaCliente -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($procId in ($connections.OwningProcess | Select-Object -Unique)) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc -and ($proc.Name -like "*python*")) {
            Write-Host "  Matando processo orfao (PID $procId) na porta $portaCliente..." -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
}

# ============================================================
# [2/5] Fazer backup dos arquivos de configuracao do banco
#       ANTES de qualquer copia (para garantir preservacao)
# ============================================================
Write-Host ""
Write-Host "[2/5] Protegendo arquivos de configuracao do banco..." -ForegroundColor Yellow

# Arquivos de configuracao que NUNCA devem ser sobrescritos
$arquivosProtegidos = @(
    ".env",
    "projeto_gerencial\\settings.py",
    "projeto_gerencial\\settings_production.py",
    "projeto_gerencial\\settings_azure.py",
    "projeto_gerencial\\settings_exe.py",
    "INICIAR.bat",
    "INICIAR_PRODUCAO.ps1",
    "ATUALIZAR.ps1",
    "ATUALIZAR.bat"
)

# Pasta temporaria para backup dos arquivos protegidos
$backupDir = Join-Path $env:TEMP "aperus_backup_$($portaCliente)_$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$backupFeito = @{}
foreach ($arquivo in $arquivosProtegidos) {
    $caminhoCompleto = Join-Path $scriptDir $arquivo
    if (Test-Path $caminhoCompleto) {
        $destino = Join-Path $backupDir $arquivo
        $pastaDestino = Split-Path -Parent $destino
        if (-not (Test-Path $pastaDestino)) {
            New-Item -ItemType Directory -Path $pastaDestino -Force | Out-Null
        }
        Copy-Item -Path $caminhoCompleto -Destination $destino -Force -ErrorAction SilentlyContinue
        $backupFeito[$arquivo] = $destino
        Write-Host "  Protegido: $arquivo" -ForegroundColor DarkGray
    }
}
Write-Host "  OK - $($backupFeito.Count) arquivos de configuracao protegidos." -ForegroundColor Green

# ============================================================
# [3/5] Copiar arquivos de codigo do template SistemaAperus
#       (apenas arquivos .py, .js, .jsx, etc. -- sem .env)
# ============================================================
Write-Host ""
Write-Host "[3/5] Copiando atualizacoes de codigo..." -ForegroundColor Cyan

$templateDir = "C:\\APERUS\\aperus_mae"
if (-not (Test-Path $templateDir)) {
    Write-Host "  [AVISO] Pasta template $templateDir nao encontrada. Pulando copia." -ForegroundColor Yellow
} else {
    # Extensoes de arquivos de CODIGO que podem ser atualizados
    $extensoesCodigo = @(".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".json", ".txt", ".md", ".rst")
    
    # Pastas que NAO devem ser copiadas
    $pastasIgnoradas = @(".git", ".venv", "venv", "node_modules", "backups", "logs", "scratch",
                         "staticfiles", "media", "__pycache__", ".vscode")
    
    # Arquivos que NAO devem ser copiados (configuracoes do banco/instancia)
    $arquivosIgnorados = @(".env", ".env.example", ".env.local", ".env.production",
                           "INICIAR.bat", "INICIAR_PRODUCAO.ps1", "ATUALIZAR.ps1", "ATUALIZAR.bat",
                           "ATUALIZAR_SERVIDOR.vbs", "db.sqlite3")
    
    # Arquivos de settings que contem configuracao do banco
    $settingsIgnorados = @("settings.py", "settings_production.py", "settings_azure.py", "settings_exe.py")
    
    function Copy-TemplateFiles ($srcDir, $currentRelPath) {
        $srcPath = if ($currentRelPath) { Join-Path $srcDir $currentRelPath } else { $srcDir }
        $items = Get-ChildItem -Path $srcPath
        foreach ($item in $items) {
            $relItemPath = if ($currentRelPath) { Join-Path $currentRelPath $item.Name } else { $item.Name }
            if ($item.PSIsContainer) {
                # Ignora pastas desnecessarias na origem
                if ($pastasIgnoradas -contains $item.Name) { continue }
                Copy-TemplateFiles $srcDir $relItemPath
            } else {
                # Ignora arquivos de configuracao e banco na raiz/settings
                if ($arquivosIgnorados -contains $item.Name) { continue }
                if ($relItemPath -like "projeto_gerencial\\*" -and $settingsIgnorados -contains $item.Name) { continue }
                
                # Filtra extensoes de codigo
                $ext = $item.Extension.ToLower()
                if ($extensoesCodigo -notcontains $ext) { continue }
                
                # Copia para o destino
                $destino = Join-Path $scriptDir $relItemPath
                $pastaDestino = Split-Path -Parent $destino
                try {
                    if (-not (Test-Path $pastaDestino)) {
                        New-Item -ItemType Directory -Path $pastaDestino -Force | Out-Null
                    }
                    Copy-Item -Path $item.FullName -Destination $destino -Force -ErrorAction Stop
                    $script:arquivosAtualizados++
                } catch {
                    $script:erros++
                }
            }
        }
    }

    $script:arquivosAtualizados = 0
    $script:erros = 0
    Copy-TemplateFiles $templateDir ""
    
    Write-Host "  OK - $script:arquivosAtualizados arquivo(s) de codigo atualizado(s)." -ForegroundColor Green
    if ($script:erros -gt 0) {
        Write-Host "  [AVISO] $script:erros arquivo(s) com erro ao copiar (podem estar em uso)." -ForegroundColor Yellow
    }
}

# ============================================================
# [4/5] Restaurar arquivos de configuracao protegidos
# ============================================================
Write-Host ""
Write-Host "[4/5] Restaurando configuracoes do banco de dados..." -ForegroundColor Yellow

foreach ($arquivo in $backupFeito.Keys) {
    $origem = $backupFeito[$arquivo]
    $destino = Join-Path $scriptDir $arquivo
    $pastaDestino = Split-Path -Parent $destino
    
    if (-not (Test-Path $pastaDestino)) {
        New-Item -ItemType Directory -Path $pastaDestino -Force | Out-Null
    }
    
    try {
        Copy-Item -Path $origem -Destination $destino -Force -ErrorAction Stop
        Write-Host "  Restaurado: $arquivo" -ForegroundColor DarkGray
    } catch {
        Write-Host "  [ERRO] Nao foi possivel restaurar: $arquivo" -ForegroundColor Red
    }
}

# Limpar backup temporario
Remove-Item -Path $backupDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  OK - Configuracoes do banco de dados preservadas." -ForegroundColor Green

# ============================================================
# [4.2/5] Executando migracoes do banco de dados (migrate)
# ============================================================
Write-Host ""
Write-Host "[4.2/5] Executando migracoes do banco de dados (migrate)..." -ForegroundColor Yellow
if (Test-Path "$venvPath\Scripts\activate.bat") {
    cmd.exe /c "call $venvPath\Scripts\activate.bat && python manage.py migrate --run-syncdb"
    Write-Host "  OK - Banco de dados migrado!" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] Ambiente virtual nao encontrado. Pulando migrate." -ForegroundColor Yellow
}

# ============================================================
# [4.5/5] Sincronizar arquivos estaticos do frontend
# ============================================================
Write-Host ""
Write-Host "[4.5/5] Sincronizando arquivos estaticos do frontend (collectstatic)..." -ForegroundColor Yellow

# Limpar staticfiles antigos para evitar conflito com builds anteriores
$staticDir = Join-Path $scriptDir "staticfiles"
if (Test-Path $staticDir) {
    Write-Host "  Limpando staticfiles antigos..." -ForegroundColor DarkGray
    Remove-Item -Path $staticDir -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path "$venvPath\Scripts\activate.bat") {
    cmd.exe /c "call $venvPath\Scripts\activate.bat && python manage.py collectstatic --noinput"
    Write-Host "  OK - Arquivos estaticos sincronizados!" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] Ambiente virtual nao encontrado. Pulando collectstatic." -ForegroundColor Yellow
}

# ============================================================
# [5/5] Reiniciar servidor Django do cliente (via NSSM)
# ============================================================
Write-Host ""
Write-Host "[5/5] Reiniciando servidor Django na porta $portaCliente..." -ForegroundColor Cyan

# Tentar iniciar pelo servico NSSM (metodo correto)
$servicoIniciado = $false
try {
    $statusResult = & $nssmPath status $nomeServico 2>$null
    if ($statusResult -match 'SERVICE_STOPPED|SERVICE_PAUSED') {
        Write-Host "  Iniciando servico $nomeServico via NSSM..." -ForegroundColor Cyan
        & $nssmPath start $nomeServico 2>$null
        Start-Sleep -Seconds 3
        $statusResult2 = & $nssmPath status $nomeServico 2>$null
        if ($statusResult2 -match 'SERVICE_RUNNING') {
            $servicoIniciado = $true
            Write-Host "  OK - Servico $nomeServico iniciado via NSSM!" -ForegroundColor Green
        } else {
            Write-Host "  [AVISO] NSSM nao confirmou inicio. Status: $statusResult2" -ForegroundColor Yellow
        }
    } elseif ($statusResult -match 'SERVICE_RUNNING') {
        Write-Host "  Servico $nomeServico ja esta rodando." -ForegroundColor Green
        $servicoIniciado = $true
    }
} catch {
    Write-Host "  [AVISO] Falha ao iniciar pelo NSSM: $_" -ForegroundColor Yellow
}

# Fallback: iniciar processo diretamente se NSSM falhou
if (-not $servicoIniciado) {
    Write-Host "  Tentando iniciar Django diretamente..." -ForegroundColor Yellow
    if (Test-Path "$venvPath\\Scripts\\python.exe") {
        Start-Process powershell -ArgumentList "-WindowStyle Minimized -ExecutionPolicy Bypass -Command `"cd '$scriptDir'; .\\$venvPath\\Scripts\\python.exe manage.py runserver 0.0.0.0:$portaCliente --noreload`""
        Write-Host "  OK - Django iniciado diretamente na porta $portaCliente!" -ForegroundColor Green
    } else {
        Write-Host "  [AVISO] Ambiente virtual nao encontrado ($venvPath). Execute INSTALAR.bat." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [OK] CLIENTE ATUALIZADO COM SUCESSO!" -ForegroundColor Green
Write-Host "  Configuracoes do banco de dados preservadas." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
