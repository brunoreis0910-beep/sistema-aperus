@echo off
title APERUS - ATUALIZAR SERVIDOR

:: Solicitar elevacao para Administrador automaticamente
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

if not exist "%~dp0logs" mkdir "%~dp0logs"
set LOGFILE=%~dp0logs\atualizar_saida.txt
echo Iniciando atualizacao em %date% %time% > "%LOGFILE%"
powershell.exe -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser -Force; & '%~dp0ATUALIZAR.ps1'" >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"
echo === FIM === >> "%LOGFILE%"
notepad "%LOGFILE%"
