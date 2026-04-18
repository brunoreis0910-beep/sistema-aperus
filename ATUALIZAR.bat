@echo off
title APERUS - ATUALIZAR SERVIDOR
if not exist "%~dp0logs" mkdir "%~dp0logs"
set LOGFILE=%~dp0logs\atualizar_saida.txt
echo Iniciando atualizacao em %date% %time% > "%LOGFILE%"
powershell.exe -ExecutionPolicy Bypass -File "%~dp0ATUALIZAR.ps1" >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"
echo === FIM === >> "%LOGFILE%"
notepad "%LOGFILE%"
