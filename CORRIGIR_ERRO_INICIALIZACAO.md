# Correção para Erro: ReferenceError: can't access lexical declaration 'I' before initialization

## Problema Identificado

O erro "ReferenceError: can't access lexical declaration 'I' before initialization" geralmente ocorre quando:

1. **Temporal Dead Zone (TDZ)**: Uma variável `const` ou `let` é acessada antes de ser declarada
2. **Dependência Circular**: Módulos que importam um ao outro criam referencias circulares
3. **Código em nível de módulo**: Código executando antes da inicialização completa do módulo

## Soluções Aplicadas

### 1. Verificar imports circulares

Use o comando abaixo para detectar dependências circulares:

```powershell
cd frontend
npm install --save-dev madge
npx madge --circular src/
```

### 2. Lazy Loading para componentes pesados

Alterar imports diretos para lazy loading:

**Antes:**
```javascript
import ComponentePesado from './pages/ComponentePesado'
```

**Depois:**
```javascript
const ComponentePesado = React.lazy(() => import('./pages/ComponentePesado'))
```

### 3. Adicionar key para identificar variável problemática

No código minificado, a variável 'I' foi gerada pelo minificador. Para debug:

```powershell
cd frontend
# Build com sourcemaps para debug
npm run build -- --sourcemap
```

### 4. Corrigir ordem de declarações

Certifique-se que todas as exportações de constantes são feitas após a declaração:

```javascript
// ❌ ERRADO
export const A = B + 1;
const B = 10;

// ✅ CORRETO  
const B = 10;
export const A = B + 1;
```

### 5. Evitar referências circulares em objetos

```javascript
// ❌ ERRADO
const config = {
  base: API_URL,
  full: config.base + '/api'  // config ainda não está definido!
};

// ✅ CORRETO
const config = {
  base: API_URL
};
config.full = config.base + '/api';
```

## Comandos de Correção

### 1. Limpar cache e rebuild

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules/.vite, dist
npm run build
```

### 2. Verificar erros de TypeScript/ESLint

```powershell
cd frontend
npm run lint
```

### 3. Testar build localmente antes de deployer

```powershell
cd frontend
npm run build
npm run preview
```

## Próximos Passos

Se o erro persistir:

1. Verifique o arquivo `frontend/src/App.jsx` para imports circulares
2. Revise `frontend/src/config/api.js` para código em nível de módulo
3. Verifique `frontend/src/pages/Consultor NegociosPage.jsx` (aparece no stack trace)
4. Use sourcemaps para identificar a linha exata do erro

## Stack Trace do Erro

```
P8@https://sistema.aperus.com.br/assets/index-g6BCtEgu.js:844:8875
e9@...
```

Este é um erro de runtime (não de build), então:
- ✅ Build está funcionando
- ❌ Erro ocorre ao executar o código no navegador
- 🔍 Provavelmente relacionado a lazy loading ou importações dinâmicas

## Workaround Temporário

Se precisar resolver rapidamente, force um rebuild completo:

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
npm run build
```

Em seguida, faça o deploy da nova versão.
