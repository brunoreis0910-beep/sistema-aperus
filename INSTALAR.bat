@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║        INSTALADOR SISTEMA APERUS - PRODUCAO                 ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo.

:MENU
echo ┌──────────────────────────────────────────────────────────────┐
echo │                                                              │
echo │   MENU DE INSTALACAO:                                        │
echo │                                                              │
echo │   [1] Instalar Python 3.12                                   │
echo │   [2] Instalar Node.js 20                                    │
echo │   [3] Criar Ambiente Virtual                                 │
echo │   [4] Instalar Dependencias Python                           │
echo │   [5] Configurar Banco de Dados (.env)                       │
echo │   [6] Executar Migracoes                                     │
echo │   [7] Criar Superusuario                                     │
echo │   [8] Instalar Frontend                                      │
echo │   [9] Coletar Arquivos Estaticos                             │
echo │   [A] INSTALACAO COMPLETA (todas as etapas)                  │
echo │   [V] Verificar Instalacao                                   │
echo │   [I] Iniciar Sistema                                        │
echo │   [0] Sair                                                   │
echo │                                                              │
echo └──────────────────────────────────────────────────────────────┘
echo.
set /p opcao="Digite a opcao: "

if /i "%opcao%"=="1" goto PYTHON
if /i "%opcao%"=="2" goto NODEJS
if /i "%opcao%"=="3" goto VENV
if /i "%opcao%"=="4" goto DEPS_PYTHON
if /i "%opcao%"=="5" goto CONFIG_ENV
if /i "%opcao%"=="6" goto MIGRATE
if /i "%opcao%"=="7" goto SUPERUSER
if /i "%opcao%"=="8" goto FRONTEND
if /i "%opcao%"=="9" goto COLLECTSTATIC
if /i "%opcao%"=="A" goto COMPLETA
if /i "%opcao%"=="V" goto VERIFICAR
if /i "%opcao%"=="I" goto INICIAR
if /i "%opcao%"=="0" goto SAIR

echo Opcao invalida!
timeout /t 2 >nul
cls
goto MENU

:PYTHON
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   INSTALANDO PYTHON 3.12
echo ════════════════════════════════════════════════════════════════
echo.
python --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Python ja esta instalado!
    python --version
    echo.
    pause
    cls
    goto MENU
)

echo Baixando Python 3.12.0...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe' -OutFile '%TEMP%\python-installer.exe'"

echo.
echo IMPORTANTE: Marque "Add Python to PATH"!
echo.
pause
start /wait %TEMP%\python-installer.exe

echo.
echo [OK] Python instalado!
python --version
echo.
pause
cls
goto MENU

:NODEJS
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   INSTALANDO NODE.JS 20
echo ════════════════════════════════════════════════════════════════
echo.
node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js ja esta instalado!
    node --version
    echo.
    pause
    cls
    goto MENU
)

echo Baixando Node.js 20.10.0...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'"

echo.
echo Abrindo instalador...
pause
start /wait msiexec /i %TEMP%\node-installer.msi

echo.
echo [OK] Node.js instalado!
node --version
echo.
pause
cls
goto MENU

:VENV
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   CRIANDO AMBIENTE VIRTUAL
echo ════════════════════════════════════════════════════════════════
echo.
if exist .venv (
    echo Removendo ambiente antigo...
    rmdir /s /q .venv
)

echo Criando .venv...
python -m venv .venv

echo.
echo [OK] Ambiente virtual criado!
echo.
pause
cls
goto MENU

:DEPS_PYTHON
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   INSTALANDO DEPENDENCIAS PYTHON
echo ════════════════════════════════════════════════════════════════
echo.
call .venv\Scripts\activate.bat
echo Atualizando pip...
python -m pip install --upgrade pip --quiet

echo.
echo Instalando dependencias (pode demorar 10 minutos)...
pip install -r requirements.txt

echo.
echo [OK] Dependencias instaladas!
echo.
pause
cls
goto MENU

:CONFIG_ENV
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   CONFIGURANDO BANCO DE DADOS (.env)
echo ════════════════════════════════════════════════════════════════
echo.
if exist .env (
    echo Arquivo .env ja existe!
    set /p sobrescrever="Deseja sobrescrever? (S/N): "
    if /i not "%sobrescrever%"=="S" (
        cls
        goto MENU
    )
)

echo Copiando .env.example para .env...
copy .env.example .env >nul

echo.
echo Gerando SECRET_KEY...
call .venv\Scripts\activate.bat
for /f "delims=" %%i in ('python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"') do set SECRET_KEY=%%i

echo.
echo SECRET_KEY gerada: %SECRET_KEY%
echo.
echo AGORA CONFIGURE MANUALMENTE:
echo.
echo 1. Abra o arquivo .env com Bloco de Notas
echo 2. Cole a SECRET_KEY acima
echo 3. Configure:
echo    - DB_NAME
echo    - DB_USER  
echo    - DB_PASSWORD
echo    - DB_HOST
echo    - ALLOWED_HOSTS
echo 4. Coloque DEBUG=False
echo.
pause
notepad .env

echo.
echo [OK] Arquivo .env configurado!
echo.
pause
cls
goto MENU

:MIGRATE
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   EXECUTANDO MIGRACOES DO BANCO
echo ════════════════════════════════════════════════════════════════
echo.
call .venv\Scripts\activate.bat
python manage.py migrate

echo.
echo [OK] Migracoes executadas!
echo.
pause
cls
goto MENU

:SUPERUSER
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   CRIANDO SUPERUSUARIO
echo ════════════════════════════════════════════════════════════════
echo.
call .venv\Scripts\activate.bat
python manage.py createsuperuser

echo.
echo [OK] Superusuario criado!
echo.
pause
cls
goto MENU

:FRONTEND
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   INSTALANDO FRONTEND
echo ════════════════════════════════════════════════════════════════
echo.
cd frontend
echo Instalando dependencias Node.js...
call npm install

echo.
echo Buildando para producao...
call npm run build

cd ..
echo.
echo [OK] Frontend instalado!
echo.
pause
cls
goto MENU

:COLLECTSTATIC
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   COLETANDO ARQUIVOS ESTATICOS
echo ════════════════════════════════════════════════════════════════
echo.
call .venv\Scripts\activate.bat
python manage.py collectstatic --noinput

echo.
echo [OK] Arquivos estaticos coletados!
echo.
pause
cls
goto MENU

:COMPLETA
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   INSTALACAO COMPLETA
echo ════════════════════════════════════════════════════════════════
echo.
echo Tempo estimado: 30-45 minutos
echo.
set /p confirma="Continuar? (S/N): "
if /i not "%confirma%"=="S" (
    cls
    goto MENU
)

call :PYTHON
call :NODEJS
call :VENV
call :DEPS_PYTHON
call :CONFIG_ENV
call :MIGRATE
call :SUPERUSER
call :FRONTEND
call :COLLECTSTATIC

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   INSTALACAO COMPLETA CONCLUIDA!
echo ════════════════════════════════════════════════════════════════
echo.
echo Sistema pronto para producao!
echo.
echo Use a opcao [I] para iniciar o sistema.
echo.
pause
cls
goto MENU

:VERIFICAR
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   VERIFICANDO INSTALACAO
echo ════════════════════════════════════════════════════════════════
echo.

echo [1] Python:
python --version 2>nul || echo     [X] NAO INSTALADO

echo.
echo [2] Node.js:
node --version 2>nul || echo     [X] NAO INSTALADO

echo.
echo [3] Ambiente Virtual:
if exist .venv ( echo     [OK] .venv encontrado ) else ( echo     [X] NAO CRIADO )

echo.
echo [4] Arquivo .env:
if exist .env ( echo     [OK] Encontrado ) else ( echo     [X] NAO CONFIGURADO )

echo.
echo [5] Frontend:
if exist frontend\node_modules ( echo     [OK] Instalado ) else ( echo     [X] NAO INSTALADO )

echo.
echo [6] Build Frontend:
if exist frontend\dist ( echo     [OK] Build feito ) else ( echo     [X] NAO BUILDADO )

echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
cls
goto MENU

:INICIAR
cls
echo.
echo ════════════════════════════════════════════════════════════════
echo   INICIANDO SISTEMA APERUS
echo ════════════════════════════════════════════════════════════════
echo.
echo Iniciando backend na porta 8005...
echo.
echo Para parar: Pressione Ctrl+C
echo.
call .venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8005
pause
cls
goto MENU

:SAIR
cls
echo.
echo Saindo...
timeout /t 1 >nul
exit /b 0
