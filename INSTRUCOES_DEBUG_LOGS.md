# 🔍 LOGS DETALHADOS ATIVADOS - Depuração Erro TDZ

## 📊 O QUE FOI ADICIONADO

Logs detalhados foram adicionados em **todos os pontos críticos** para rastrear onde o erro está ocorrendo:

### ✅ Arquivos Modificados:

1. **`frontend/src/hooks/useSafeDashboardData.js`**
   - Logs no carregamento do módulo
   - Logs em cada declaração de export
   - Logs quando cada função é chamada
   - Logs dentro do useMemo

2. **`frontend/src/hooks/useScreenSize.js`**
   - Logs no carregamento do módulo
   - Logs nas chamadas das funções

3. **`frontend/src/components/Vendas.jsx`**
   - Log no início do carregamento do módulo
   - Logs em cada hook chamado (useAuth, useOfflineSync, useImpressaoVenda)
   - Logs mostrando os valores retornados

---

## 🚀 COMO USAR

### **ETAPA 1: Atualizar o Servidor**

No **servidor de produção**, execute:

```powershell
cd C:\caminho\para\1_Sistema_Gerencial_Backend
git pull origin main
.\EXECUTAR_NO_SERVIDOR.ps1
```

### **ETAPA 2: Limpar Cache do Navegador**

1. Acesse: **https://sistema.aperus.com.br/limpar-cache.html**
2. Clique em **"Limpar TUDO e Recarregar"**

### **ETAPA 3: Abrir Console do Navegador**

1. Pressione **F12** (DevTools)
2. Vá na aba **Console**
3. Clique em **Vendas** na aplicação

---

## 📋 O QUE VOCÊ VERÁ NO CONSOLE

### ✅ **SE TUDO ESTIVER FUNCIONANDO:**

Você verá logs nesta ordem:

```
📦 [useSafeDashboardData.js] CARREGANDO módulo - INÍCIO
📦 [useSafeDashboardData.js] Versão: v2.0 - Com logs detalhados
📦 [useSafeDashboardData.js] Declarando formatCurrency...
✅ [useSafeDashboardData.js] formatCurrency DECLARADO
📦 [useSafeDashboardData.js] Declarando calculatePercentage...
✅ [useSafeDashboardData.js] calculatePercentage DECLARADO
📦 [useSafeDashboardData.js] Declarando useSafeDashboardData...
✅ [useSafeDashboardData.js] useSafeDashboardData DECLARADO
✅ [useSafeDashboardData.js] Módulo COMPLETAMENTE CARREGADO

📦 [useScreenSize.js] CARREGANDO módulo
✅ [useScreenSize.js] useScreenSize DECLARADO

📦 [Vendas.jsx] INÍCIO DO CARREGAMENTO DO MÓDULO
📦 [Vendas.jsx] Versão: v3.0 - Com logs de depuração detalhados
🚀 [Vendas.jsx] COMPONENTE INICIANDO - Props: {...}
📍 [Vendas.jsx] Location: /vendas
🔐 [Vendas.jsx] Chamando useAuth...
✅ [Vendas.jsx] useAuth retornou: {...}
🌐 [Vendas.jsx] Chamando useOfflineSync...
✅ [Vendas.jsx] useOfflineSync retornou: {...}
🖨️  [Vendas.jsx] Chamando useImpressaoVenda...
```

### ❌ **SE HOUVER ERRO TDZ:**

Você verá logs até um certo ponto, depois:

```
ReferenceError: can't access lexical declaration 'I' before initialization
```

**IMPORTANTE:** Anote qual foi o **ÚLTIMO LOG ANTES DO ERRO**.

Exemplos:

- Se o último log foi `📦 [useSafeDashboardData.js] Declarando calculatePercentage...`
  → O erro está entre `calculatePercentage` e `useSafeDashboardData`

- Se o último log foi `🔐 [Vendas.jsx] Chamando useAuth...`
  → O erro está no hook `useAuth`

- Se o último log foi `🖨️  [Vendas.jsx] Chamando useImpressaoVenda...`
  → O erro está no hook `useImpressaoVenda`

---

## 📸 CAPTURAR EVIDÊNCIAS

### 1. **Screenshot do Console Completo**

- Pressione **F12**
- Aba **Console**
- Capture TODO o conteúdo (desde o primeiro log até o erro)
- **Inclua também a pilha de erro** (stack trace)

### 2. **Aba Network**

- F12 → **Network**
- Recarregue com **Ctrl + Shift + R**
- Procure por `index-*.js`
- Capture qual arquivo está sendo carregado

**Deve ser:** `index-BUk6-fdb.js` ✅  
**NÃO deve ser:** `index-g-wlZe9R.js` ou `index-fegZlb3J.js` ❌

### 3. **Aba Application (opcional)**

- F12 → **Application**
- **IndexedDB** → Verifique se há:
  - `AperusTerminalCache`
  - `SistemaGerencialOffline`
- **Local Storage** → Anote quantos itens existem

---

## 🔍 ANÁLISE DOS LOGS

### **Padrão 1: Erro antes de declarar as funções**

Se o erro acontecer ANTES de `✅ [useSafeDashboardData.js] useSafeDashboardData DECLARADO`:
→ O problema é ordem de declaração (TDZ)

### **Padrão 2: Erro ao chamar useAuth**

Se o último log for `🔐 [Vendas.jsx] Chamando useAuth...`:
→ O problema está no contexto AuthContext

### **Padrão 3: Erro ao chamar useImpressaoVenda**

Se o último log for `🖨️  [Vendas.jsx] Chamando useImpressaoVenda...`:
→ O problema está no hook useImpressaoVenda (1261 linhas)

### **Padrão 4: Nenhum log aparece**

Se NENHUM log aparecer:
→ Cache do navegador não foi limpo corretamente
→ Ainda está carregando arquivo antigo

---

## 📊 CHECKLIST DE VERIFICAÇÃO

- [ ] Servidor de produção foi atualizado (`git pull`)
- [ ] Build foi feito (`npm run build`)
- [ ] Collectstatic foi executado
- [ ] Servidor Django foi reiniciado
- [ ] Cache do navegador foi limpo (via ferramenta ou manual)
- [ ] Acessei em modo anônimo para testar
- [ ] Abri Console (F12) ANTES de clicar em Vendas
- [ ] Capturei screenshot do console completo
- [ ] Verifiquei qual arquivo `index-*.js` está sendo carregado
- [ ] Anotei o último log ANTES do erro

---

## 🎯 PRÓXIMOS PASSOS

Após executar os passos acima e capturar os logs:

### **Se o erro persistir:**

1. **Copie TODOS os logs do console** (do primeiro ao último)
2. **Copie o stack trace completo do erro**
3. **Informe qual arquivo JS está sendo carregado**
4. **Compartilhe as informações**

Com essas informações, poderei:
- Identificar EXATAMENTE onde o erro está
- Qual hook/função está causando o TDZ
- Se é problema de cache ou código

### **Se NÃO houver mais erro:**

✅ **Problema resolvido!** Os logs podem ser removidos depois.

---

## 🗑️ REMOVER LOGS (Depois de Resolver)

Quando o erro estiver resolvido, execute:

```bash
git revert HEAD  # Reverte o commit dos logs
npm run build
python manage.py collectstatic --noinput
```

Ou edite manualmente os arquivos removendo os `console.log`.

---

## 📞 INFORMAÇÕES IMPORTANTES

**Novo Hash do Build:** `index-BUk6-fdb.js`  
**Tamanho:** 3.8 MB  
**Data:** 28/04/2026 10:18  
**Versão dos Logs:** v2.0 (useSafeDashboardData) / v3.0 (Vendas)

---

## ⚠️ LEMBRETE FINAL

**NÃO ESQUEÇA:**
1. Limpar cache do navegador (crucial!)
2. Abrir console ANTES de acessar Vendas
3. Copiar TODOS os logs (não só o erro)
4. Verificar qual arquivo `index-*.js` está carregando

**O erro `[{}]` indica que o componente está quebrando antes de renderizar. Os logs vão mostrar EXATAMENTE onde!**
