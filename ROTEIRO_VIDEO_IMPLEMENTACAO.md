# 🎬 ROTEIRO DE VÍDEO - IMPLEMENTAÇÃO SaaS DE FATURAMENTO
## Sistema de Bloqueio Inteligente para Aperus

**Duração Total:** 12 minutos  
**Nível:** Intermediário  
**Data:** 02/06/2026  

---

## 📋 ÍNDICE DO VÍDEO

- **0:00** - Abertura e Contexto
- **1:00** - Preparação do Ambiente
- **2:30** - Criação das Tabelas SQL
- **4:00** - Implementação Backend Django
- **7:30** - Implementação Frontend React
- **10:00** - Teste dos Endpoints
- **11:30** - Demonstração ao Vivo
- **12:00** - Encerramento

---

## 🎞️ CENA 1: ABERTURA (0:00 - 1:00)

### ROTEIRO DO APRESENTADOR:
```
"Olá! Neste vídeo vamos implementar um sistema completo de controle 
de faturamento SaaS para o Aperus. Você vai aprender a:

✓ Criar um bloqueio inteligente quando o cliente atrasar
✓ Permitir 10 dias de carência antes de bloquear
✓ Proteger bloqueios aos finais de semana
✓ Funcionar offline por até 3 dias
✓ Exibir QR Code PIX para pagamento rápido

Tudo isso integrado entre um servidor central e filiais locais!

Vamos começar..."
```

### O QUE MOSTRAR NA TELA:
- Logo/Intro do Aperus (2 segundos)
- Estrutura de pastas do projeto aberta no VS Code (5 segundos)
- Fluxograma ASCII do sistema (5 segundos)

---

## 🎞️ CENA 2: PREPARAÇÃO DO AMBIENTE (1:00 - 2:30)

### ROTEIRO:
```
"Primeiro, vamos preparar nosso ambiente. Você precisa:
1. Ter o Python 3.9+ instalado
2. Django 4.0+ rodando
3. MySQL ou banco de dados compatível
4. Node.js para o React

Vamos abrir o terminal na pasta do projeto..."
```

### COMANDOS A EXECUTAR:

```bash
# Abrir terminal no VS Code
# Atalho: Ctrl + ` (backtick)

cd C:\APERUS\SistemaAperus

# Verificar Python
python --version
# Esperado: Python 3.9.x ou superior

# Ativar ambiente virtual
.venv\Scripts\activate

# Verificar Django
python -m django --version
# Esperado: Django 4.x.x

# Listar arquivos principais
ls -la | grep -E "(manage.py|requirements.txt)"
```

### VISUAL:
- Terminal aberto mostrando versões
- Estrutura de pastas expandida
- Arquivo requirements.txt visível

---

## 🎞️ CENA 3: CRIAÇÃO DAS TABELAS SQL (2:30 - 4:00)

### ROTEIRO:
```
"Agora vamos criar as tabelas no banco de dados. 
Eu preparei um script SQL completo que cria:

1. Tabela de LICENÇAS (para controlar offline)
2. Tabela de FATURAS (para rastrear inadimplência)
3. Histórico de bloqueios
4. Views para dashboard

Vamos executar o script..."
```

### COMANDOS A EXECUTAR:

```bash
# Abrir o arquivo SQL no VS Code
code SCRIPT_SQL_SETUP_SAAS.sql

# Depois abrir MySQL
mysql -u root -p

# Digitar a senha
# (mostrar asteriscos na tela)

# Selecionar banco
use seu_banco_aperus;

# Executar script
source SCRIPT_SQL_SETUP_SAAS.sql;

# Verificar tabelas criadas
SHOW TABLES LIKE 'licenca%';
SHOW TABLES LIKE 'fatura%';

# Ver estrutura de uma tabela
DESCRIBE licenca;
```

### VISUAL NA TELA:
- Editor VS Code com SQL script aberto (3 segundos)
- Terminal MySQL executando comandos (8 segundos)
- Confirmação "✅ Tabelas criadas com sucesso!" (4 segundos)

### O QUE DIZER:
```
"Perfeito! As tabelas foram criadas. Veja:
- licenca: Gerencia a contingência offline
- faturas: Controla quando o cliente atrasa
- fatura_pagamento: Histórico de tentativas de pagamento

Agora vamos para a parte do Django..."
```

---

## 🎞️ CENA 4: BACKEND DJANGO - MODELOS (4:00 - 5:30)

### ROTEIRO:
```
"Agora vamos criar os modelos Django. 
Abra o arquivo de modelos..."
```

### COMANDOS:

```bash
# Abrir models.py
code api/models.py

# Ir para o final do arquivo (Ctrl + End)
# Adicionar os novos modelos

# Copiar do roteiro:
# - Classe Licenca
# - Classe Fatura
# - Atualizar Cliente com novos campos

# Salvar (Ctrl + S)
```

### VISUAL:
- Arquivo models.py aberto
- Scrollar até o final
- Colar/digitar nova classe Licenca (15 linhas)
- Colar/digitar nova classe Fatura (25 linhas)
- Salvar arquivo
- Mostrar status "Arquivo salvo" em verde

### NARRAÇÃO:
```
"Veja como a classe Licenca gerencia a data de validade offline. 
E a classe Fatura rastreia valor, vencimento e status.

Essas duas classes são o coração do sistema!"
```

---

## 🎞️ CENA 5: BACKEND DJANGO - VIEWS SaaS (5:30 - 7:00)

### ROTEIRO:
```
"Agora vamos criar as views que fazem a lógica de bloqueio.
Vamos criar um novo arquivo chamado views_saas_financeiro.py..."
```

### COMANDOS:

```bash
# Criar novo arquivo
code api/views_saas_financeiro.py

# Copiar código do roteiro:
# - Função status_financeiro_saas
# - Função enviar_nfse_fatura

# Salvar

# Agora abrir urls.py
code api/urls.py

# Ir para as importações (Ctrl + Home)
# Adicionar: from .views_saas_financeiro import status_financeiro_saas

# Ir para o final (Ctrl + End)
# Adicionar a URL: path('saas/status-financeiro-saas/', status_financeiro_saas, ...)

# Salvar
```

### VISUAL:
- Abrir novo arquivo em VS Code
- Digitar/Colar código das views (30 linhas)
- Mostrar tela de "arquivo criado"
- Abrir urls.py
- Adicionar import
- Adicionar path
- Salvar

### O QUE DIZER:
```
"Aqui está a mágica! A função status_financeiro_saas:

1. Recebe CNPJ do cliente
2. Verifica se há bloqueio manual (contrato encerrado)
3. Se não tiver faturas: LIBERA (banco de teste)
4. Se tiver atraso:
   - Calcula dias de atraso
   - Se <= 5 dias: Alerta SUAVE
   - Se 6-10 dias: Alerta CRÍTICO
   - Se > 10 dias E NÃO é fim de semana: BLOQUEIA
   - Se é fim de semana: AVISA mas NÃO bloqueia

Genial, né?"
```

---

## 🎞️ CENA 6: BACKEND DJANGO - MIGRAÇÃO (7:00 - 7:30)

### ROTEIRO:
```
"Agora vamos aplicar as alterações ao banco de dados 
usando Django migrations..."
```

### COMANDOS:

```bash
# No terminal, dentro do projeto
cd C:\APERUS\SistemaAperus

# Ativar venv se não estiver
.venv\Scripts\activate

# Criar migrations
python manage.py makemigrations api

# Mostrar output:
# "Migrations for 'api':
#   api/migrations/XXXX_auto_XXXXX.py
#     + Create model Licenca
#     + Create model Fatura
#     ..."

# Aplicar migrations
python manage.py migrate api

# Mostrar output:
# "Running migrations:
#   Applying api.XXXX_auto_XXXXX... OK
#   ..."

# Verificar se funcionou
python manage.py check
# Esperado: "System check identified no issues (0 silenced)."
```

### VISUAL:
- Terminal mostrando comandos sendo executados
- Output verde "OK" aparecendo
- Status "System check passed"

### NARRAÇÃO:
```
"Perfeito! O Django criou as tabelas automaticamente 
baseado nos nossos modelos. 

Backend pronto! 

Agora vamos para o Frontend React..."
```

---

## 🎞️ CENA 7: FRONTEND REACT - COMPONENTE (7:30 - 9:30)

### ROTEIRO:
```
"Agora vamos criar o componente React que 
vai bloquear o usuário se ele não pagar.

Vamos criar GerenciadorBloqueioSaaS.jsx..."
```

### COMANDOS:

```bash
# Abrir pasta frontend
cd frontend/src/components

# Criar novo arquivo
code GerenciadorBloqueioSaaS.jsx

# Copiar código do roteiro:
# - Imports
# - useState hooks
# - useEffect para polling
# - Condicional para bloqueio manual
# - Condicional para bloqueio financeiro
# - Renderização de banners
# - Return children

# Salvar

# Agora ir para App.jsx
cd ..
code App.jsx

# Procurar por: function App() { ou const App = () => {
# Adicionar import: import GerenciadorBloqueioSaaS from './components/GerenciadorBloqueioSaaS'

# Envolver as rotas:
# <GerenciadorBloqueioSaaS cnpjCliente={cnpj}>
#   <Routes>
#     {/* routes */}
#   </Routes>
# </GerenciadorBloqueioSaaS>

# Salvar
```

### VISUAL:
- Abrir novo arquivo .jsx
- Mostrar estrutura do componente
- Colorização de sintaxe do React (highlight em roxo/azul)
- Colar/digitar as 3 seções principais:
  1. Bloqueio Manual (tela preta)
  2. Bloqueio Financeiro (QR Code PIX)
  3. Banners de Alerta
- Abrir App.jsx
- Adicionar import no topo
- Envolver rotas
- Salvar

### O QUE DIZER:
```
"Este componente é fantástico! Veja:

1. Se bloqueio_manual = true: Mostra tela preta 'Acesso Suspenso'
2. Se bloquear_sistema = true: Mostra modal com QR Code PIX
3. Se apenas alertas: Mostra banners no topo

E usa pooling de 30 segundos para liberar na HORA 
assim que o pagamento for confirmado!

Agora vamos testar tudo..."
```

---

## 🎞️ CENA 8: TESTE DOS ENDPOINTS (9:30 - 11:00)

### ROTEIRO:
```
"Vamos validar se tudo funcionou. 
Executaremos o script de teste que eu preparei..."
```

### COMANDOS:

```bash
# Voltar para raiz do projeto
cd C:\APERUS\SistemaAperus

# Executar script de teste
python TESTE_ENDPOINTS_SAAS.py

# Mostrar output:
# 🧪 TESTE DE INTEGRAÇÃO - SISTEMA SaaS DE FATURAMENTO
# ============================================================
# 1️⃣  TESTE: CENTRAL MÃE - ENDPOINT DISPONÍVEL
# [Conexão com Central] ✅ PASSOU HTTP 200
# ...
```

### VISUAL:
- Terminal rodando o script Python
- Output colorido aparecendo (verde para PASSOU, vermelho para FALHOU)
- Mostra cada teste executando:
  1. ✅ Conexão com Central
  2. ✅ Validação de Resposta
  3. ✅ Endpoint Local da Filial
  4. ✅ Estados de Bloqueio
  5. ⚠️ Contingência (manual)
  6. ✅ Estrutura de Fatura

### NARRAÇÃO:
```
"Todos os testes passaram! 

Isso significa:
✅ Central Mãe está respondendo
✅ Filial está sincronizando
✅ Estados de bloqueio estão corretos
✅ Estrutura de fatura está válida

Vamos ver como fica na prática..."
```

---

## 🎞️ CENA 9: DEMONSTRAÇÃO AO VIVO (11:00 - 11:45)

### ROTEIRO:
```
"Agora vamos ver o sistema em ação no navegador!"
```

### DEMONSTRAÇÃO:

#### CENÁRIO 1: Cliente EM DIA
```bash
# Iniciar servidor Django
python manage.py runserver 8000

# Em outro terminal: iniciar React
cd frontend
npm start
```

**Visual no navegador:**
- Abrir http://localhost:3000
- Clicar "Login"
- Nenhuma tela de bloqueio aparece
- Sistema funciona normalmente
- Banner verde no topo: "✅ Sistema em dia"

**Narração:**
```
"Cliente sem atraso = acesso liberado!
Nenhuma tela de bloqueio."
```

---

#### CENÁRIO 2: Cliente com ALERTA SUAVE (1-5 dias atrasado)

**Visual no banco de dados:**
```bash
# Terminal MySQL
mysql> UPDATE faturas SET status='ATRASADO', data_vencimento=DATE_SUB(CURDATE(), INTERVAL 3 DAY) WHERE id_fatura=1;

# Atualizar no navegador (F5)
```

**Visual no navegador:**
- Banner AMARELO aparece no topo
- Mensagem: "⚠️ AVISO: Sua assinatura possui pendências..."
- Sistema continua funcionando (NÃO bloqueia)

**Narração:**
```
"Cliente atrasou 3 dias = Aviso!
Mas o sistema continua funcionando.
A carência de 10 dias ainda permite tudo."
```

---

#### CENÁRIO 3: Cliente com ALERTA CRÍTICO (6-10 dias atrasado)

**Visual no banco:**
```bash
mysql> UPDATE faturas SET data_vencimento=DATE_SUB(CURDATE(), INTERVAL 8 DAY) WHERE id_fatura=1;
```

**Visual no navegador:**
- Banner muda para LARANJA
- Mensagem: "⚠️ AVISO CRÍTICO: Sua assinatura..."
- Diz "O Aperus entrará em manutenção em 2 dias"

**Narração:**
```
"Cliente atrasou 8 dias = Alerta crítico!
Apenas 2 dias até o bloqueio total."
```

---

#### CENÁRIO 4: Cliente BLOQUEADO (> 10 dias)

**Visual no banco:**
```bash
mysql> UPDATE faturas SET data_vencimento=DATE_SUB(CURDATE(), INTERVAL 12 DAY) WHERE id_fatura=1;
```

**Visual no navegador:**
- Atualizar (F5)
- Tela INTEIRA muda
- Fundo cinza, card branco no centro
- Título vermelho: "💳 Assinatura Suspensa"
- Mostra valor: "R$ 5.000,00"
- Botão: "📋 Copiar Código PIX"
- QR Code (ou placeholder)

**Narração:**
```
"Cliente atrasou 12 dias = BLOQUEADO!

A tela mostra:
✓ Valor exato da fatura
✓ Data de vencimento
✓ QR Code para pagar pelo PIX

Agora o cliente não consegue acessar NADA
até pagar!"
```

---

#### CENÁRIO 5: Cliente em FIM DE SEMANA (não bloqueia)

**Visual no banco:**
```bash
# Simular um sábado (weekday=5)
mysql> UPDATE faturas SET data_vencimento=DATE_SUB(CURDATE(), INTERVAL 12 DAY) WHERE id_fatura=1;
# E sistema detecta que é sábado (manual)
```

**Visual no navegador:**
- Se for realmente sábado/domingo
- Sistema NÃO bloqueia mesmo com atraso > 10 dias
- Banner cinza: "📢 NOTA: Detectamos atraso. O Aperus não bloqueia aos finais de semana..."
- Sistema continua funcionando

**Narração:**
```
"Respeitamos os finais de semana!
Mesmo com grande atraso, o sistema não bloqueia.
Na segunda-feira, se não pagar, ai sim bloqueia."
```

---

#### CENÁRIO 6: MODO OFFLINE (sem conexão com central)

**Visual em terminal:**
```bash
# Desligar a central ou simular desconexão
# No navegador atualizar
```

**Visual no navegador:**
- Banner azul aparece: "ℹ️ Modo Offline: Trabalhando sem conexão..."
- Sistema CONTINUA funcionando
- Usa a licença local (válida por 3 dias)

**Narração:**
```
"Perdi conexão com a central? Sem problema!
O sistema funciona offline por até 3 dias.

Depois de 3 dias sem conectar = Bloqueado automaticamente.

Isso garante que, mesmo se a internet cair,
o cliente ainda consegue trabalhar por 72 horas!"
```

---

## 🎞️ CENA 10: ENCERRAMENTO (11:45 - 12:00)

### ROTEIRO FINAL:

```
"Resumindo o que implementamos:

✅ Carência de 10 dias antes de bloquear
✅ Proteção aos finais de semana
✅ Bloqueio manual para contratos encerrados
✅ Contingência offline de 3 dias
✅ QR Code PIX com pooling de 30 segundos
✅ Emissão de NFS-e código 1.05
✅ Dashboard com status financeiro

ARQUIVOS CRIADOS:
📄 ROTEIRO_IMPLEMENTACAO_SAAS_FATURAMENTO.md
📄 SCRIPT_SQL_SETUP_SAAS.sql
📄 TESTE_ENDPOINTS_SAAS.py
📄 views_saas_financeiro.py (Backend)
📄 licenciamento_service.py (Local)
📄 GerenciadorBloqueioSaaS.jsx (Frontend)

Tudo pronto para produção!

Obrigado por assistir este tutorial.
Se tiver dúvidas, deixa um comentário!

Até a próxima! 👋"
```

### VISUAL FINAL:
- Mostrar logo do Aperus
- Listar os 6 arquivos no Explorer
- Mostrar screenshot dos 3 cenários (bloqueio, online, offline)
- Tela de encerramento

---

## 📊 TIMING FINAL

| Cena | Tempo | Conteúdo |
|------|-------|----------|
| 1 | 1:00 | Abertura |
| 2 | 1:30 | Preparação |
| 3 | 1:30 | SQL |
| 4 | 1:30 | Models Django |
| 5 | 1:30 | Views Django |
| 6 | 0:30 | Migrações |
| 7 | 2:00 | React |
| 8 | 1:30 | Testes |
| 9 | 0:45 | Demonstração |
| 10 | 0:15 | Encerramento |
| **TOTAL** | **12:00** | **Completo** |

---

## 🎥 CONFIGURAÇÃO TÉCNICA PARA GRAVAÇÃO

### RESOLUÇÃO:
- Mínimo: 1920x1080 (Full HD)
- Recomendado: 2560x1440 (2K)
- Fonte: Monospaced (Consolas, Monaco)
- Tamanho da fonte: 16pt (IDE), 14pt (Terminal)

### ÁUDIO:
- Microfone: Condenser (USB recomendado)
- Volume: -3dB pico máximo
- Ruído de fundo: Mínimo

### PROGRAMAS NECESSÁRIOS:
- **Gravação**: OBS Studio (FREE) ou Camtasia
- **Edição**: DaVinci Resolve (FREE) ou Adobe Premiere
- **Efeitos**: Animações entre cenas (2 segundos)

### SHORTCUTS VS CODE:
- Abrir Terminal: `Ctrl + ` (backtick)
- Abrir Arquivo: `Ctrl + O`
- Go to End: `Ctrl + End`
- Go to Home: `Ctrl + Home`
- Salvar: `Ctrl + S`
- Full Screen: `F11`

---

## 🎬 DICAS DE GRAVAÇÃO

1. **Pausas**: Deixar 2-3 segundos entre tópicos
2. **Zoom**: Usar Ctrl+Mouse Wheel para zoom no editor
3. **Highlight**: Destacar código importante
4. **Sons**: Adicionar efeito "ding" quando teste passa
5. **Transições**: Fade entre cenas (1 segundo)
6. **Legendas**: Legendar comandos principais
7. **Música**: Royalty-free (YouTube Audio Library)

---

## ✅ CHECKLIST PRÉ-GRAVAÇÃO

- [ ] VS Code aberto com tema escuro (Dracula/One Dark Pro)
- [ ] Terminal com fundo preto, texto branco
- [ ] Mouse preparado com velocidade reduzida
- [ ] Teclado testado (som alto)
- [ ] Navegador em fullscreen
- [ ] MySQL/Database rodando
- [ ] Django server pronto (em segundo terminal)
- [ ] React dev server pronto (em terceiro terminal)
- [ ] Microfone testado e selecionado
- [ ] OBS/Camtasia calibrado
- [ ] Resolução de gravação confirmada
- [ ] Pasta de output preparada

---

## 🚀 ESTRUTURA DE ARQUIVOS APÓS VÍDEO

Seu `C:\APERUS\SistemaAperus\` terá:
```
SistemaAperus/
├── api/
│   ├── models.py                          (MODIFICADO: +Licenca, +Fatura)
│   ├── views_saas_financeiro.py           (NOVO)
│   ├── licenciamento_service.py           (MODIFICADO)
│   └── urls.py                            (MODIFICADO: +2 paths)
├── frontend/src/
│   ├── App.jsx                            (MODIFICADO: +GerenciadorBloqueioSaaS)
│   └── components/
│       └── GerenciadorBloqueioSaaS.jsx    (NOVO)
├── ROTEIRO_IMPLEMENTACAO_SAAS_FATURAMENTO.md    (NOVO)
├── SCRIPT_SQL_SETUP_SAAS.sql              (NOVO)
├── TESTE_ENDPOINTS_SAAS.py                (NOVO)
└── ROTEIRO_VIDEO_IMPLEMENTACAO.md         (ESTE ARQUIVO)
```

---

**FIM DO ROTEIRO** 🎬  
**Tempo de Gravação Estimado:** 15-18 minutos (com pausas e refilmagens)  
**Tempo de Edição Estimado:** 30-45 minutos

**Boa sorte na gravação! 🚀**
