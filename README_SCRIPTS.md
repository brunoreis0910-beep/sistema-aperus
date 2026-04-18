# 📦 Arquivos de Configuração do Servidor

Este diretório contém scripts para facilitar a configuração e deploy do sistema.

## 🚀 Scripts Principais

### CONFIGURAR_GEMINI.ps1
**Uso:** Configurar a API Key do Google Gemini no servidor

```powershell
.\CONFIGURAR_GEMINI.ps1
```

**O que faz:**
- ✅ Cria o arquivo `.env` se não existir
- ✅ Adiciona ou atualiza `GEMINI_API_KEY`
- ✅ Opção de reiniciar Django automaticamente
- ✅ Validação de dados

**Quando usar:**
- Primeira instalação no servidor
- Quando a classificação IA retornar erro 503
- Para renovar/trocar a API Key

---

### ATUALIZAR.ps1
**Uso:** Atualizar o servidor com código do GitHub

```powershell
.\ATUALIZAR.ps1
```

**O que faz:**
1. Para o Django
2. Faz `git pull` do GitHub
3. Atualiza dependências Python
4. Compila o frontend (React + Vite)
5. Executa migrações do banco
6. Coleta arquivos estáticos
7. Reinicia o Django
8. **NOVO:** Verifica se `GEMINI_API_KEY` está configurada

**Quando usar:**
- Sempre que houver atualizações no GitHub
- Após executar `ENVIAR.ps1` no ambiente de desenvolvimento

---

### ENVIAR.ps1
**Uso:** Enviar código local para o GitHub (DEV)

```powershell
.\ENVIAR.ps1
```

**O que faz:**
- Adiciona todos os arquivos alterados
- Cria commit automático com timestamp
- Envia para GitHub

**Quando usar:**
- Após fazer alterações no código (desenvolvimento)
- Antes de executar `ATUALIZAR.ps1` no servidor

---

## 📋 Fluxo de Trabalho Completo

### No Computador de Desenvolvimento:
```powershell
# 1. Fazer alterações no código
# 2. Enviar para GitHub
.\ENVIAR.ps1
```

### No Servidor:
```powershell
# 1. Baixar e aplicar atualizações
.\ATUALIZAR.ps1

# 2. Se aparecer aviso sobre GEMINI_API_KEY:
.\CONFIGURAR_GEMINI.ps1
```

---

## ⚠️ Primeira Instalação no Servidor

Execute nesta ordem:

```powershell
# 1. Clonar repositório
git clone https://github.com/brunoreis0910-beep/sistema-aperus.git
cd sistema-aperus

# 2. Criar ambiente virtual Python
python -m venv .venv

# 3. Ativar ambiente virtual
.venv\Scripts\Activate.ps1

# 4. Instalar dependências
pip install -r requirements.txt

# 5. Configurar Gemini API
.\CONFIGURAR_GEMINI.ps1

# 6. Configurar frontend
cd frontend
npm install
npm run build
cd ..

# 7. Configurar banco de dados
python manage.py migrate

# 8. Coletar arquivos estáticos
python manage.py collectstatic --noinput

# 9. Iniciar servidor
python manage.py runserver 0.0.0.0:8005 --noreload
```

---

## 🔑 Obter Chave Gemini API

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada
5. Use no script `CONFIGURAR_GEMINI.ps1`

**Recursos Gratuitos:**
- ✅ 1.500 requisições/dia
- ✅ Sem limite de tempo
- ✅ Sem cartão de crédito necessário

---

## 📁 Arquivos de Configuração

### .env
**Não commitar no Git!** (já está no `.gitignore`)

Variáveis de ambiente sensíveis:
- `SECRET_KEY` - Chave secreta do Django
- `GEMINI_API_KEY` - Chave da API Gemini
- `DB_PASSWORD` - Senha do banco de dados
- etc.

### .env.example
Template do arquivo `.env` com todas as variáveis documentadas.

---

## 📝 Documentação Adicional

- [GEMINI_SETUP.md](GEMINI_SETUP.md) - Guia rápido de configuração do Gemini
- [CONFIGURAR_GEMINI_SERVIDOR.md](CONFIGURAR_GEMINI_SERVIDOR.md) - Documentação completa
- [GUIA_DEPLOY_RAPIDO.md](GUIA_DEPLOY_RAPIDO.md) - Guia de deploy geral

---

## 🆘 Solução de Problemas

### Erro: API key not valid
**Solução:** Execute `.\CONFIGURAR_GEMINI.ps1`

### Django não inicia
**Solução:** 
```powershell
Get-Process python | Stop-Process -Force
.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8005
```

### Git pull falha
**Solução:**
```powershell
git stash
git pull origin main
```

### Frontend não compila
**Solução:**
```powershell
cd frontend
npm install
npm run build
```

---

**Última atualização:** 18/04/2026
