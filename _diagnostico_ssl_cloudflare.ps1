# 🔍 DIAGNÓSTICO SSL E CONECTIVIDADE - sistema.aperus.com.br
# Execute este script para verificar se o servidor está acessível

Write-Host "`n🔍 DIAGNÓSTICO DE CONECTIVIDADE E SSL`n" -ForegroundColor Cyan
Write-Host "Servidor: https://sistema.aperus.com.br`n" -ForegroundColor Yellow

# 1. Teste de DNS
Write-Host "1️⃣  Testando resolução DNS..." -ForegroundColor Green
try {
    $dns = Resolve-DnsName -Name "sistema.aperus.com.br" -ErrorAction Stop
    Write-Host "   ✅ DNS OK:" -ForegroundColor Green
    $dns | ForEach-Object {
        if ($_.Type -eq 'A') {
            Write-Host "      - IPv4: $($_.IPAddress)" -ForegroundColor White
        }
        if ($_.Type -eq 'AAAA') {
            Write-Host "      - IPv6: $($_.IPAddress)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   ❌ Erro DNS: $_" -ForegroundColor Red
}

# 2. Teste de Ping
Write-Host "`n2️⃣  Testando conectividade (ICMP)..." -ForegroundColor Green
$ping = Test-Connection -ComputerName "sistema.aperus.com.br" -Count 2 -ErrorAction SilentlyContinue
if ($ping) {
    Write-Host "   ✅ PING OK - Tempo médio: $([math]::Round(($ping | Measure-Object -Property ResponseTime -Average).Average, 2)) ms" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  PING falhou (normal para servidores Cloudflare)" -ForegroundColor Yellow
}

# 3. Teste de Porta 443 (HTTPS)
Write-Host "`n3️⃣  Testando porta 443 (HTTPS)..." -ForegroundColor Green
$tcpTest = Test-NetConnection -ComputerName "sistema.aperus.com.br" -Port 443 -WarningAction SilentlyContinue
if ($tcpTest.TcpTestSucceeded) {
    Write-Host "   ✅ Porta 443 ABERTA" -ForegroundColor Green
    Write-Host "      - IP Remoto: $($tcpTest.RemoteAddress)" -ForegroundColor White
} else {
    Write-Host "   ❌ Porta 443 FECHADA ou BLOQUEADA" -ForegroundColor Red
}

# 4. Teste de Certificado SSL
Write-Host "`n4️⃣  Testando certificado SSL..." -ForegroundColor Green
try {
    $request = [System.Net.WebRequest]::Create("https://sistema.aperus.com.br")
    $request.Timeout = 10000
    $response = $request.GetResponse()
    $cert = $request.ServicePoint.Certificate
    
    if ($cert) {
        Write-Host "   ✅ Certificado SSL válido:" -ForegroundColor Green
        Write-Host "      - Emissor: $($cert.Issuer)" -ForegroundColor White
        Write-Host "      - Válido até: $($cert.GetExpirationDateString())" -ForegroundColor White
        Write-Host "      - Subject: $($cert.Subject)" -ForegroundColor White
    }
    $response.Close()
} catch {
    Write-Host "   ⚠️  Erro ao verificar certificado: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. Teste HTTP GET na API
Write-Host "`n5️⃣  Testando endpoint /api/token/ (GET)..." -ForegroundColor Green
try {
    $webResponse = Invoke-WebRequest -Uri "https://sistema.aperus.com.br/api/token/" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "   ❌ Status $($webResponse.StatusCode) - INESPERADO (deveria retornar 405)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 405) {
        Write-Host "   ✅ API respondeu corretamente (405 Method Not Allowed)" -ForegroundColor Green
        Write-Host "      Isso significa que o servidor está funcionando!" -ForegroundColor White
    } elseif ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   ⚠️  Status 403 Forbidden - Cloudflare pode estar bloqueando" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. Teste HTTP POST (simulando login)
Write-Host "`n6️⃣  Testando POST /api/token/ (simulando login)..." -ForegroundColor Green
try {
    $body = @{
        username = "teste"
        password = "teste123"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
        "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/146.0.0.0"
    }

    $postResponse = Invoke-WebRequest -Uri "https://sistema.aperus.com.br/api/token/" `
        -Method POST `
        -Body $body `
        -Headers $headers `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "   ❓ Status $($postResponse.StatusCode): $($postResponse.Content)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ API respondeu (401 Unauthorized) - Credenciais inválidas OK!" -ForegroundColor Green
        Write-Host "      O servidor está aceitando POST corretamente!" -ForegroundColor White
    } elseif ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   ⚠️  Status 403 Forbidden - Cloudflare WAF pode estar bloqueando" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "      Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# 7. Teste com User-Agent do Android (Capacitor)
Write-Host "`n7️⃣  Testando POST com User-Agent do Capacitor Android..." -ForegroundColor Green
try {
    $body = @{
        username = "teste"
        password = "teste123"
    } | ConvertTo-Json

    $androidHeaders = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
        "User-Agent" = "Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.177 Mobile Safari/537.36"
        "Origin" = "https://localhost"
    }

    $androidResponse = Invoke-WebRequest -Uri "https://sistema.aperus.com.br/api/token/" `
        -Method POST `
        -Body $body `
        -Headers $androidHeaders `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "   ❓ Status $($androidResponse.StatusCode)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ API aceitou User-Agent Android (401 OK)" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   🚨 Status 403 - CLOUDFLARE BLOQUEANDO USER-AGENT ANDROID!" -ForegroundColor Red
        Write-Host "      SOLUÇÃO: Configure regra no Cloudflare WAF para permitir apps mobile" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 8. Verificar headers CORS
Write-Host "`n8️⃣  Verificando headers CORS da resposta..." -ForegroundColor Green
try {
    $corsTest = Invoke-WebRequest -Uri "https://sistema.aperus.com.br/api/token/" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = "https://localhost"
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "   ✅ Resposta OPTIONS (preflight):" -ForegroundColor Green
    $corsTest.Headers.Keys | ForEach-Object {
        if ($_ -like "Access-Control-*") {
            Write-Host "      - $_`: $($corsTest.Headers[$_])" -ForegroundColor White
        }
    }
} catch {
    Write-Host "   ⚠️  Preflight falhou: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 DIAGNÓSTICO COMPLETO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n✅ = OK    ⚠️ = Atenção    ❌ = Problema    🚨 = Crítico`n" -ForegroundColor White
