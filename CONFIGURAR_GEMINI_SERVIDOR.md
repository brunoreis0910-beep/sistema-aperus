# 🔧 Configurar API Gemini no Servidor

## ⚠️ Problema
A classificação IA está retornando erro:
```
API key not valid. Please pass a valid API key.
```

## ✅ Solução

### 1️⃣ Acessar o servidor de produção
```powershell
# Via RDP, SSH ou console direto
```

### 2️⃣ Navegar até o diretório do projeto
```powershell
cd C:\inetpub\wwwroot\sistema-aperus
# OU o caminho onde está instalado
```

### 3️⃣ Verificar se existe arquivo .env
```powershell
if (Test-Path ".env") { 
    Write-Host "✅ Arquivo .env existe" 
} else { 
    Write-Host "❌ Arquivo .env NÃO existe - Criar!" 
}
```

### 4️⃣ Editar ou criar o arquivo .env
```powershell
# Abrir no Notepad
notepad .env
```

### 5️⃣ Adicionar a chave Gemini
Adicione esta linha no arquivo `.env`:
```env
GEMINI_API_KEY=AIzaSyBsVyF1oZ5gHbEei86z-HQxBdDpqDZlgLA
```

**IMPORTANTE:** Se a chave acima não funcionar, gere uma nova em:
👉 https://aistudio.google.com/app/apikey

### 6️⃣ Salvar e reiniciar o Django
```powershell
# Parar processos Python
Get-Process -Name 'python' -ErrorAction SilentlyContinue | Stop-Process -Force

# Reiniciar Django
.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8005 --noreload
```

### 7️⃣ Testar
```powershell
# Teste rápido da API
curl https://sistema.aperus.com.br/api/health/
```

---

## 🔐 Alternativa: Gerar Nova Chave

Se a chave atual não funcionar:

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a nova chave
5. Cole no arquivo `.env` do servidor

---

## 📋 Checklist

- [ ] Acessar servidor de produção
- [ ] Verificar arquivo .env existe
- [ ] Adicionar `GEMINI_API_KEY=...`
- [ ] Salvar arquivo
- [ ] Reiniciar Django
- [ ] Testar classificação IA no Cadastro Turbo

---

## 🚀 Atalho Rápido

Se tiver acesso SSH/PowerShell remoto:

```powershell
# Adicionar a chave diretamente (substitua SEU_CAMINHO)
cd C:\inetpub\wwwroot\sistema-aperus
Add-Content -Path .env -Value "`nGEMINI_API_KEY=AIzaSyBsVyF1oZ5gHbEei86z-HQxBdDpqDZlgLA"

# Reiniciar Django
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2
.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8005 --noreload &
```

---

## ❓ Dúvidas

- **Onde fica o .env no servidor?** No mesmo diretório do `manage.py`
- **A chave é gratuita?** Sim! 1.500 requests/dia grátis
- **Precisa reiniciar?** Sim, o Django só lê o .env na inicialização
