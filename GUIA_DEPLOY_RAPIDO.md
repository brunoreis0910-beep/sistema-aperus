# 🚀 GUIA RÁPIDO - DEPLOY AUTOMATIZADO

Sistema de deploy automatizado para APERUS. Use Git + GitHub para sincronizar entre PC de desenvolvimento e servidor.

---

## 📍 NO PC DE DESENVOLVIMENTO (onde você trabalha)

Quando fizer alterações no código:

```powershell
.\DEPLOY.ps1
```

Ou com mensagem personalizada:

```powershell
.\DEPLOY.ps1 "Corrigir campo fração bloqueado"
```

**O que o script faz:**
1. ✅ Verifica alterações
2. 📦 Adiciona todos os arquivos modificados
3. 💾 Cria commit
4. 📤 Faz push para GitHub automaticamente

---

## 🏠 NO SERVIDOR (aperus.com.br)

### Opção A - Manual (quando quiser)

```powershell
.\GIT_ATUALIZAR_SERVIDOR.ps1
```

Depois escolhe a opção **[1]** no menu.

**O que faz:**
1. 🛑 Para Django
2. 📥 Baixa código do GitHub (pull)
3. 🐍 Atualiza dependências Python
4. 🗄️ Roda migrações do banco
5. 📁 Coleta arquivos estáticos
6. 🚀 Reinicia Django

---

### Opção B - Automático (configura uma vez)

No servidor, execute **como Administrador**:

```powershell
.\SERVIDOR_AUTO_UPDATE.ps1 -InstalarTarefa
```

**Pronto!** A partir daí, o servidor verifica o GitHub **a cada 5 minutos**. Se houver atualização, aplica automaticamente.

Para desinstalar:

```powershell
.\SERVIDOR_AUTO_UPDATE.ps1 -RemoverTarefa
```

---

## 📊 RESUMO DO FLUXO

| Passo | Onde | Comando | Descrição |
|:---:|---|---|---|
| 1️⃣ | PC dev | `.\DEPLOY.ps1` | Commit + Push para GitHub |
| 2️⃣ | Servidor | Automático OU `.\GIT_ATUALIZAR_SERVIDOR.ps1` | Pull + Build + Restart |

---

## 🔍 VERIFICAR LOGS (no servidor)

```powershell
Get-Content .\logs\auto_update.log -Tail 50
```

---

## 🛠️ COMANDOS ÚTEIS

### Ver status Git
```powershell
git status
git log --oneline -5
```

### Ver último commit do GitHub (sem baixar)
```powershell
git fetch origin
git log origin/main -1
```

### Forçar pull (descarta alterações locais)
```powershell
git fetch origin
git reset --hard origin/main
```

---

## ⚠️ TROUBLESHOOTING

**Erro: "Git não encontrado"**
```powershell
winget install Git.Git --silent
```

**Erro: "Conflict" no pull**
```powershell
git stash
git pull origin main
```

**Servidor não reiniciou após atualização**
```powershell
.\INICIAR_PRODUCAO.ps1
```

---

## 📂 ARQUIVOS DO SISTEMA

- **DEPLOY.ps1** - PC dev: commit + push
- **GIT_ATUALIZAR_SERVIDOR.ps1** - Servidor: atualização manual
- **SERVIDOR_AUTO_UPDATE.ps1** - Servidor: atualização automática
- **GIT_SYNC.ps1** - (antigo, pode usar DEPLOY.ps1 no lugar)
- **GUIA_GIT_SINCRONIZACAO.md** - Documentação detalhada

---

## 🎯 WORKFLOW RECOMENDADO

1. Faça alterações no código (PC dev)
2. Teste localmente: `npm run dev` no frontend
3. Quando estiver OK: `.\DEPLOY.ps1`
4. No servidor: aguardar 5 min (automático) OU rodar `.\GIT_ATUALIZAR_SERVIDOR.ps1`
5. Testar em aperus.com.br

---

**Sistema criado em:** 18/04/2026  
**Desenvolvido para:** APERUS Sistema Gerencial
