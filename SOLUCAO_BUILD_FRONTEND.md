# 🔧 Solução - Falha no Build do Frontend

**Data**: 07/05/2026  
**Problema**: Build do frontend falha durante atualização do servidor  
**Status**: ✅ RESOLVIDO

---

## 📋 Problema Identificado

```
[4/6] Build do frontend...
      [AVISO] Build falhou.
```

### Causa Raiz
Conflito de dependências npm entre versões do Capacitor:
- `@capacitor/android@7.4.4` → requer `@capacitor/core@^7.4.4`
- `@capacitor/camera@8.0.2` → requer `@capacitor/core@>=8.0.0`

**Erro completo**:
```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error While resolving: @capacitor/camera@8.0.2
npm error Found: @capacitor/core@7.4.4
```

---

## ✅ Solução Aplicada

### 1️⃣ Reinstalar dependências com flag de compatibilidade

```powershell
cd frontend
npm install --legacy-peer-deps
```

### 2️⃣ Executar build do Vite

```powershell
npm run build
```

### 3️⃣ Coletar arquivos estáticos no Django

```powershell
cd ..
python manage.py collectstatic --noinput --clear
```

---

## 🚀 Correção Permanente

Os scripts de atualização foram atualizados:

### `GIT_ATUALIZAR_SERVIDOR.ps1`
Agora a função `Run-FrontendBuild` inclui:
```powershell
npm install --legacy-peer-deps  # Instalação com compatibilidade
npm run build                     # Build do frontend
```

### `DEPLOY_FRONTEND.ps1`
Também atualizado para incluir a instalação de dependências antes do build.

---

## 🎯 Resultado

✅ **Build concluído com sucesso**

```
✓ 14335 modules transformed.
dist/index.html                       11.20 kB │ gzip:     3.42 kB
...
✓ built in 27.72s
```

---

## 💡 Prevenção Futura

- Os scripts de atualização agora executam `npm install --legacy-peer-deps` automaticamente
- Não será mais necessário intervir manualmente no build do frontend
- A flag `--legacy-peer-deps` é compatível com conflitos de peer dependencies do npm

---

## 📞 Referência Rápida

Se o problema ocorrer novamente:

```powershell
# Comando único para resolver:
cd frontend && npm install --legacy-peer-deps && npm run build && cd .. && python manage.py collectstatic --noinput --clear
```

---

**Próximas atualizações:** O build do frontend será feito automaticamente durante as atualizações do servidor.
