# INSTALACAO NO SERVIDOR - APERUS

Guia para configurar o servidor (aperus.com.br) para receber atualizacoes automaticas do GitHub.

---

## ARQUIVOS PARA COPIAR DO PC PARA O SERVIDOR

Copie APENAS estes 2 arquivos para o servidor:

1. **ATUALIZAR.ps1**
2. **SERVIDOR_AUTO_UPDATE.ps1**

**Como copiar:**
- Pendrive
- Acesso remoto (Area de Trabalho Remota)
- Email/Drive (envie para si mesmo)

---

## PASSO 1: INSTALAR GIT NO SERVIDOR

Abra PowerShell **como Administrador** no servidor e execute:

```powershell
winget install Git.Git --silent
```

Aguarde a instalacao concluir (1-2 minutos).

---

## PASSO 2: CLONAR REPOSITORIO DO GITHUB

No servidor, va ate a pasta onde quer instalar o sistema. Exemplo:

```powershell
cd C:\Projetos
```

Clone o repositorio:

```powershell
git clone https://github.com/brunoreis0910-beep/sistema-aperus.git
cd sistema-aperus
```

**OU**, se ja tem a pasta do sistema (sem Git):

```powershell
cd C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend
git init
git remote add origin https://github.com/brunoreis0910-beep/sistema-aperus.git
git fetch origin
git reset --hard origin/main
```

---

## PASSO 3: CONFIGURAR AMBIENTE PYTHON (se nao tiver)

**Criar ambiente virtual:**
```powershell
python -m venv .venv
```

**Ativar ambiente:**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Instalar dependencias:**
```powershell
pip install -r requirements.txt
```

---

## PASSO 4: CONFIGURAR BANCO DE DADOS

```powershell
python manage.py migrate
```

---

## PASSO 5: COPIAR OS 2 ARQUIVOS

Copie para a pasta do projeto no servidor:
- **ATUALIZAR.ps1**
- **SERVIDOR_AUTO_UPDATE.ps1**

Cole em: `C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\`
(ou onde voce clonou o repositorio)

---

## PASSO 6: TESTAR ATUALIZACAO MANUAL

No servidor, clique duplo em **ATUALIZAR.ps1**

Deve aparecer:
```
[OK] SERVIDOR ATUALIZADO COM SUCESSO!
```

---

## PASSO 7 (OPCIONAL): CONFIGURAR AUTO-UPDATE

Para o servidor se atualizar sozinho a cada 5 minutos:

Abra PowerShell **como Administrador** e execute:

```powershell
cd C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend
.\SERVIDOR_AUTO_UPDATE.ps1 -InstalarTarefa
```

Pronto! O servidor agora verifica GitHub a cada 5 minutos e se atualiza automaticamente.

---

## CREDENCIAIS DO GITHUB (se pedir)

Durante o primeiro `git clone` ou `git pull`, pode pedir credenciais:

- **Usuario:** brunoreis0910-beep
- **Senha:** Use um Personal Access Token (NAO a senha da conta)

### Como criar Token:
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Marque: `repo` (acesso completo)
4. Gere e copie o token
5. Use como senha no Git

---

## RESUMO RAPIDO

### No Servidor (primeira vez):
```powershell
# 1. Instalar Git
winget install Git.Git --silent

# 2. Clonar repositorio
cd C:\Projetos
git clone https://github.com/brunoreis0910-beep/sistema-aperus.git
cd sistema-aperus

# 3. Instalar Python deps (se necessario)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 4. Migracoes
python manage.py migrate

# 5. Copiar ATUALIZAR.ps1 e SERVIDOR_AUTO_UPDATE.ps1 para a pasta

# 6. Configurar auto-update (como Admin)
.\SERVIDOR_AUTO_UPDATE.ps1 -InstalarTarefa
```

### Depois disso:
- **PC dev:** Clique duplo em ENVIAR.ps1
- **Servidor:** Aguarde 5 minutos (auto) OU clique duplo em ATUALIZAR.ps1

---

## ESTRUTURA DE PASTAS NO SERVIDOR

```
C:\Projetos\SistemaGerencial\1_Sistema_Gerencial_Backend\
├── .git\                      (criado pelo git clone)
├── .venv\                     (ambiente Python)
├── api\                       (codigo Django)
├── frontend\                  (codigo React)
├── manage.py                  (Django)
├── requirements.txt           (dependencias)
├── ATUALIZAR.ps1              ← COPIAR DO PC
├── SERVIDOR_AUTO_UPDATE.ps1   ← COPIAR DO PC
└── logs\                      (logs do auto-update)
```

---

## TROUBLESHOOTING

### Git nao encontrado
```powershell
$env:PATH += ";C:\Program Files\Git\bin"
```

### Erro de permissao no PowerShell
Execute como Administrador:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Django nao inicia
Verifique porta 8005:
```powershell
netstat -ano | findstr :8005
```

Se estiver ocupada, mate o processo:
```powershell
Get-Process -Id <PID> | Stop-Process -Force
```

### Auto-update nao funciona
Verifique se a tarefa foi criada:
```powershell
Get-ScheduledTask -TaskName "APERUS-AutoUpdate"
```

---

## PROXIMOS PASSOS

Apos configurar o servidor:

1. **No PC dev:** Faca uma pequena alteracao (ex: adicione um comentario em qualquer arquivo)
2. **No PC dev:** Clique duplo em ENVIAR.ps1
3. **Aguarde 5 minutos** (ou rode ATUALIZAR.ps1 no servidor)
4. **Verifique** se a alteracao apareceu em aperus.com.br

---

**Sistema criado em:** 18/04/2026  
**Desenvolvido para:** APERUS Sistema Gerencial
