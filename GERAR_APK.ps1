# GERADOR DE APK - APERUS
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   GERADOR DE APK - APERUS" -ForegroundColor Cyan  
Write-Host "   Servidor: https://sistema.aperus.com.br" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Build do Frontend
Write-Host "[1/4] Buildando frontend React..." -ForegroundColor Yellow
cd "C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend"
npm run build
Write-Host ""

# Capacitor Sync
Write-Host "[2/4] Sincronizando Capacitor..." -ForegroundColor Yellow
npx cap sync android
Write-Host ""

# Verificar Gradle Wrapper
Write-Host "[3/4] Verificando Gradle Wrapper..." -ForegroundColor Yellow
cd "C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\frontend\android"

if (!(Test-Path "gradlew.bat")) {
    Write-Host "Criando Gradle Wrapper..." -ForegroundColor Yellow
    
    # Criar diretório wrapper
    New-Item -ItemType Directory -Path "gradle\wrapper" -Force | Out-Null
    
    # Baixar gradle-wrapper.jar
    $wrapperJar = "gradle\wrapper\gradle-wrapper.jar"
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar" -OutFile $wrapperJar
    
    # Criar gradle-wrapper.properties
    @"
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
"@ | Out-File -FilePath "gradle\wrapper\gradle-wrapper.properties" -Encoding ASCII
    
    # Criar gradlew.bat
    @"
@rem Gradle Wrapper
@if "%DEBUG%" == "" @echo off
set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome
set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe
if exist "%JAVA_EXE%" goto execute
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
goto fail

:execute
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:end
if "%ERRORLEVEL%"=="0" goto mainEnd
:fail
exit /b 1
:mainEnd
if "%OS%"=="Windows_NT" endlocal
:omega
"@ | Out-File -FilePath "gradlew.bat" -Encoding ASCII
}

Write-Host "✓ Gradle Wrapper OK!" -ForegroundColor Green
Write-Host ""

# Build APK
Write-Host "[4/4] Compilando APK (pode demorar)..." -ForegroundColor Yellow
.\gradlew.bat assembleDebug

# Copiar APK
$apkSource = "app\build\outputs\apk\debug\app-debug.apk"
$apkDest = "C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\APERUS.apk"

if (Test-Path $apkSource) {
    Copy-Item $apkSource $apkDest -Force
    $apkInfo = Get-Item $apkDest
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "   APK GERADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "Arquivo: APERUS.apk" -ForegroundColor White
    Write-Host "Tamanho: $([math]::Round($apkInfo.Length / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "Servidor: https://sistema.aperus.com.br" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERRO: APK não foi encontrado!" -ForegroundColor Red
    Write-Host "Tente abrir o Android Studio e compilar manualmente" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Pressione Enter para sair"
