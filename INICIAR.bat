@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║            INICIANDO SISTEMA APERUS - PRODUCAO               ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Verificar se ambiente virtual existe
if not exist .venv (
    echo [ERRO] Ambiente virtual nao encontrado!
    echo Execute INSTALAR.bat primeiro.
    echo.
    pause
    exit /b 1
)

REM Verificar se .env existe
if not exist .env (
    echo [ERRO] Arquivo .env nao encontrado!
    echo Configure o banco de dados primeiro.
    echo.
    pause
    exit /b 1
)

echo [1/2] Ativando ambiente virtual...
call .venv\Scripts\activate.bat

echo [2/2] Iniciando servidor Django na porta 8005...
echo.
echo ════════════════════════════════════════════════════════════════
echo   Sistema rodando em: http://localhost:8005
echo   Admin: http://localhost:8005/admin/
echo.
echo   Para parar: Pressione Ctrl+C
echo ════════════════════════════════════════════════════════════════
echo.

python manage.py runserver 0.0.0.0:8005

pause
