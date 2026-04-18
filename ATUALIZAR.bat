@echo off
title APERUS - ATUALIZAR SERVIDOR
powershell.exe -NoExit -ExecutionPolicy Bypass -File "%~dp0ATUALIZAR.ps1" > "%~dp0logs\atualizar_saida.txt" 2>&1
echo.
echo ============================================================
echo  Processo finalizado. Veja o log em:
echo  %~dp0logs\atualizar_saida.txt
echo ============================================================
echo.
pause
