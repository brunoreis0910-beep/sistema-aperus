# ATUALIZAR.ps1 - Atualizar servidor do GitHub
$Host.UI.RawUI.WindowTitle = "APERUS - ATUALIZAR SERVIDOR"
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

Clear-Host
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  APERUS - ATUALIZANDO SERVIDOR DO GITHUB" -ForegroundColor Cyan
Write-Host "  Pasta: $scriptDir" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $env:PATH += ";C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Git nao encontrado!" -ForegroundColor Red
    Write-Host "  Instale: winget install Git.Git --silent" -ForegroundColor Yellow
    Read-Host "Pressione ENTER para sair"
    exit 1
}

if (-not (Test-Path ".git")) {
    Write-Host "[ERRO] Esta pasta nao e um repositorio Git!" -ForegroundColor Red
    Write-Host "  Pasta: $scriptDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Execute para configurar:" -ForegroundColor Yellow
    Write-Host "  git init" -ForegroundColor White
    Write-Host "  git remote add origin https://github.com/brunoreis0910-beep/sistema-aperus.git" -ForegroundColor White
    Write-Host "  git fetch origin" -ForegroundColor White
    Write-Host "  git reset --hard origin/main" -ForegroundColor White
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "[1/6] Parando servidor Django..." -ForegroundColor Yellow
$pythonProcs = Get-Process -Name python, python3 -ErrorAction SilentlyContinue
if ($pythonProcs) {
    $pythonProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "      OK." -ForegroundColor Green
} else {
    Write-Host "      Nenhum processo em execucao." -ForegroundColor DarkGray
}

$statusOutput = git status --porcelain 2>&1
if ($statusOutput) {
    git stash push -m "Auto-stash $(Get-Date -Format 'dd/MM HH:mm')" --quiet
}

Write-Host ""
Write-Host "[2/6] Baixando atualizacao do GitHub..." -ForegroundColor Cyan
git fetch origin 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao conectar no GitHub! Verifique a internet." -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

git pull origin main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    git pull origin master 2>&1 | Out-Null
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha no git pull!" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}
Write-Host "      OK - $(git log --oneline -1)" -ForegroundColor Green

Write-Host ""
Write-Host "[3/6] Atualizando dependencias Python..." -ForegroundColor Cyan
if (Test-Path ".venv\Scripts\python.exe") {
    & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet 2>&1 | Out-Null
    Write-Host "      OK." -ForegroundColor Green
} else {
    Write-Host "      [AVISO] .venv nao encontrado." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/6] Build do frontend..." -ForegroundColor Cyan
if ((Test-Path "frontend\package.json") -and (Get-Command npm -ErrorAction SilentlyContinue)) {
    Push-Location frontend
    npm run build 2>&1 | Out-Null
    $buildExit = $LASTEXITCODE
    Pop-Location
    if ($buildExit -eq 0) {
        Write-Host "      OK." -ForegroundColor Green
    } else {
        Write-Host "      [AVISO] Build falhou." -ForegroundColor Yellow
    }
} else {
    Write-Host "      Pulando." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "[5/6] Migracoes do banco..." -ForegroundColor Cyan
if (Test-Path ".venv\Scripts\python.exe") {
    & ".\.venv\Scripts\python.exe" manage.py migrate --run-syncdb 2>&1 | Out-Null
    Write-Host "      OK." -ForegroundColor Green
}

Write-Host ""
Write-Host "[6/6] Collectstatic..." -ForegroundColor Cyan
if (Test-Path ".venv\Scripts\python.exe") {
    & ".\.venv\Scripts\python.exe" manage.py collectstatic --noinput --clear -v 0 2>&1 | Out-Null
    Write-Host "      OK." -ForegroundColor Green
}

Write-Host ""
Write-Host "[>>] Reiniciando Django na porta 8005..." -ForegroundColor Cyan
if (Test-Path ".venv\Scripts\python.exe") {
    Start-Process powershell -ArgumentList "-WindowStyle Minimized -ExecutionPolicy Bypass -Command `"cd '$scriptDir'; .\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8005 --noreload`""
    Write-Host "      Django iniciado!" -ForegroundColor Green
} else {
    Write-Host "      [AVISO] Execute: python manage.py runserver 0.0.0.0:8005" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [OK] SERVIDOR ATUALIZADO COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Verificar configurações do .env
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
    $avisos = @()

    if ($envContent -notmatch "COSMOS_API_KEY\s*=\s*\S+") {
        $avisos += "COSMOS_API_KEY nao configurada! (busca de produto por EAN nao funcionara)"
    }
    if ($envContent -notmatch "GEMINI_API_KEY\s*=\s*\S+") {
        $avisos += "GEMINI_API_KEY nao configurada! (classificacao IA nao funcionara)"
    }

    if ($avisos.Count -gt 0) {
        Write-Host ""
        Write-Host "  ============================================" -ForegroundColor Yellow
        Write-Host "  [AVISO] Chaves de API nao configuradas:" -ForegroundColor Yellow
        foreach ($aviso in $avisos) {
            Write-Host "    - $aviso" -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "  Para configurar, edite o arquivo .env e adicione:" -ForegroundColor Cyan
        Write-Host "    COSMOS_API_KEY=QZxWcGM5bCOM8CZC4AF0YQ" -ForegroundColor White
        Write-Host "    GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI" -ForegroundColor White
        Write-Host "  ============================================" -ForegroundColor Yellow
        Write-Host ""

        # Oferecer configuração automática do COSMOS_API_KEY se não estiver no .env
        if ($envContent -notmatch "COSMOS_API_KEY\s*=\s*\S+") {
            $resposta = Read-Host "  Deseja configurar COSMOS_API_KEY agora? (S/N)"
            if ($resposta -match "^[Ss]") {
                $chave = Read-Host "  Digite a chave Cosmos (Enter para usar a padrão)"
                if ([string]::IsNullOrWhiteSpace($chave)) {
                    $chave = "QZxWcGM5bCOM8CZC4AF0YQ"
                }
                # Adiciona ou atualiza no .env
                if ($envContent -match "COSMOS_API_KEY") {
                    $envContent = $envContent -replace "COSMOS_API_KEY\s*=.*", "COSMOS_API_KEY=$chave"
                } else {
                    $envContent += "`nCOSMOS_API_KEY=$chave`n"
                }
                Set-Content -Path ".env" -Value $envContent -Encoding UTF8
                Write-Host "  COSMOS_API_KEY configurada!" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "  [AVISO] Arquivo .env nao encontrado!" -ForegroundColor Yellow
    Write-Host "  Criando .env basico..." -ForegroundColor Cyan
    $envBasico = @"
DEBUG=False
SECRET_KEY=django-insecure-altere-esta-chave-em-producao-$(Get-Random)
ALLOWED_HOSTS=localhost,127.0.0.1,*
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
COSMOS_API_KEY=QZxWcGM5bCOM8CZC4AF0YQ
"@
    Set-Content -Path ".env" -Value $envBasico -Encoding UTF8
    Write-Host "  .env criado! Configure as chaves adicionais conforme necessario." -ForegroundColor Green
    Write-Host "  Execute: .\CONFIGURAR_GEMINI.ps1 para configurar a IA." -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "  Acesse: http://aperus.com.br" -ForegroundColor White
Write-Host ""
Read-Host "Pressione ENTER para sair"
