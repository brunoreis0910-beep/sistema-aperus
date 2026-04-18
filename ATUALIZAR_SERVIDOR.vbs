'' ATUALIZAR_SERVIDOR.vbs
'' Clique duplo para atualizar o servidor APERUS
'' Solicita permissao de Administrador automaticamente

Set oShell = CreateObject("Shell.Application")
Set oFSO = CreateObject("Scripting.FileSystemObject")

' Caminho do script
scriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)
ps1File = scriptDir & "\ATUALIZAR.ps1"

' Verificar se ATUALIZAR.ps1 existe
If Not oFSO.FileExists(ps1File) Then
    MsgBox "ERRO: Arquivo ATUALIZAR.ps1 nao encontrado em:" & vbCrLf & scriptDir, 16, "APERUS - Erro"
    WScript.Quit
End If

' Montar comando PowerShell
cmd = "powershell.exe -ExecutionPolicy Bypass -NoExit -Command """ & _
      "Set-Location '" & scriptDir & "'; " & _
      "& '" & ps1File & "'"""

' Executar como Administrador (abre dialogo UAC)
oShell.ShellExecute "powershell.exe", _
    "-ExecutionPolicy Bypass -NoExit -File """ & ps1File & """", _
    scriptDir, "runas", 1

WScript.Quit
