# ============================================================
#   CONFIGURAR GEMINI API KEY NO SERVIDOR
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURANDO GEMINI API KEY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "manage.py")) {
    Write-Host "[ERRO] Execute este script na pasta do projeto (onde está manage.py)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "[AVISO] Arquivo .env não encontrado. Criando..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "        Arquivo .env criado a partir do .env.example" -ForegroundColor Green
    } else {
        New-Item -Path ".env" -ItemType File | Out-Null
        Write-Host "        Arquivo .env criado (vazio)" -ForegroundColor Green
    }
}

# Verificar se a chave já existe
$conteudoEnv = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
if ($conteudoEnv -match "GEMINI_API_KEY\s*=\s*\S+") {
    Write-Host "[INFO] GEMINI_API_KEY já está configurada no .env" -ForegroundColor Green
    
    $linha = ($conteudoEnv -split "`n" | Select-String "GEMINI_API_KEY").Line
    $chaveAtual = ($linha -split "=")[1].Trim()
    $chaveOculta = $chaveAtual.Substring(0, [Math]::Min(20, $chaveAtual.Length)) + "..."
    
    Write-Host "        Valor atual: $chaveOculta" -ForegroundColor Gray
    Write-Host ""
    
    $resposta = Read-Host "Deseja substituir? (S/N)"
    if ($resposta -ne "S" -and $resposta -ne "s") {
        Write-Host ""
        Write-Host "[OK] Configuração mantida" -ForegroundColor Green
        Write-Host ""
        Read-Host "Pressione ENTER para sair"
        exit 0
    }
}

# Solicitar a chave API
Write-Host ""
Write-Host "Cole a GEMINI_API_KEY abaixo:" -ForegroundColor Yellow
Write-Host "(Obtenha em: https://aistudio.google.com/app/apikey)" -ForegroundColor Gray
Write-Host ""

$apiKey = Read-Host "API Key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host ""
    Write-Host "[ERRO] API Key não pode estar vazia" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Remover linha antiga se existir
$linhas = Get-Content ".env" -ErrorAction SilentlyContinue
$novasLinhas = $linhas | Where-Object { $_ -notmatch "^\s*GEMINI_API_KEY\s*=" }

# Adicionar nova linha
$novasLinhas += ""
$novasLinhas += "# Google Gemini API (Para Assistente IA)"
$novasLinhas += "GEMINI_API_KEY=$apiKey"

# Salvar arquivo
$novasLinhas | Set-Content ".env" -Encoding UTF8

Write-Host ""
Write-Host "[OK] GEMINI_API_KEY configurada com sucesso!" -ForegroundColor Green
Write-Host ""

# Perguntar se quer reiniciar o Django
$reiniciar = Read-Host "Deseja reiniciar o Django agora? (S/N)"

if ($reiniciar -eq "S" -or $reiniciar -eq "s") {
    Write-Host ""
    Write-Host "[>>] Parando Django..." -ForegroundColor Yellow
    
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    Write-Host "[>>] Iniciando Django na porta 8005..." -ForegroundColor Yellow
    
    if (Test-Path ".venv\Scripts\python.exe") {
        Start-Process -FilePath ".venv\Scripts\python.exe" -ArgumentList "manage.py", "runserver", "0.0.0.0:8005", "--noreload" -NoNewWindow
        Write-Host ""
        Write-Host "[OK] Django reiniciado!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "[AVISO] .venv não encontrado. Reinicie manualmente." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAÇÃO CONCLUÍDA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Pressione ENTER para sair"
