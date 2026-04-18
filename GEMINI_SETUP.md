# 🚀 GUIA RÁPIDO - Configurar Gemini API no Servidor

## ⚡ Problema
A classificação automática por IA está retornando erro:
```
API key not valid. Please pass a valid API key.
```

## ✅ Solução em 2 Passos

### 1️⃣ No servidor, execute:
```powershell
.\CONFIGURAR_GEMINI.ps1
```

### 2️⃣ Quando solicitado, cole a chave:
```
AIzaSyBsVyF1oZ5gHbEei86z-HQxBdDpqDZlgLA
```

**Pronto!** O script irá configurar tudo automaticamente.

---

## 📋 O que o script faz?

1. ✅ Verifica se o arquivo `.env` existe (cria se necessário)
2. ✅ Remove configuração antiga (se houver)
3. ✅ Adiciona a nova `GEMINI_API_KEY`
4. ✅ Reinicia o Django automaticamente

---

## 🔑 Gerar Nova Chave (se necessário)

Se a chave acima não funcionar:

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada
5. Execute `.\CONFIGURAR_GEMINI.ps1` e cole a nova chave

---

## 🎯 Alternativa Manual

Se preferir editar o `.env` manualmente:

1. Abra o arquivo `.env` no Notepad:
   ```powershell
   notepad .env
   ```

2. Adicione ou edite a linha:
   ```env
   GEMINI_API_KEY=AIzaSyBsVyF1oZ5gHbEei86z-HQxBdDpqDZlgLA
   ```

3. Salve e feche o arquivo

4. Reinicie o Django:
   ```powershell
   Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
   .venv\Scripts\python.exe manage.py runserver 0.0.0.0:8005 --noreload
   ```

---

## ✔️ Como testar se funcionou?

Após configurar, teste no sistema:

1. Importe um XML de NFe com produtos novos
2. Clique no botão ⚡ **Cadastro Turbo**
3. Verifique se aparece a mensagem "🤖 Classificando com IA..."
4. Os campos **Grupo** e **Categoria** devem preencher automaticamente

Se aparecer erro 503, a chave não está configurada corretamente.

---

## 💡 Dicas

- ✅ A API Gemini é **100% gratuita** (até 1.500 requisições/dia)
- ✅ A chave nunca expira (a menos que você revogue)
- ✅ Você pode usar a mesma chave em desenvolvimento e produção
- ⚠️ Nunca commite o arquivo `.env` no Git (já está no `.gitignore`)

---

**Dúvidas?** Consulte [CONFIGURAR_GEMINI_SERVIDOR.md](CONFIGURAR_GEMINI_SERVIDOR.md)
