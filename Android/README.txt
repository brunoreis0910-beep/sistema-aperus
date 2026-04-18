📱 APERUS - APK Android v9.0
================================

✅ VERSÃO ATUAL: v9.0 (18/04/2026 12:50)

📦 ARQUIVO GERADO:
   APERUS.apk (9,82 MB)
   Compilado em: 18/04/2026 12:50:55
   
🔧 ATUALIZAÇÃO v9.0 - SSL PERMISSIVO + DIAGNÓSTICO:
====================================================

🎯 MUDANÇAS CRÍTICAS (Network Security Config):

1. ✅ CERTIFICADOS SSL MAIS PERMISSIVOS:
   - Aceita certificados do sistema (Cloudflare)
   - Aceita certificados de usuário (para debug)
   - cleartext ativado temporariamente para debug

2. ✅ DOMÍNIOS CONFIGURADOS:
   - sistema.aperus.com.br (incluindo subdomínios)
   - aperus.com.br (incluindo subdomínios)

3. 🔍 SCRIPT DE DIAGNÓSTICO CRIADO:
   Execute: .\\_diagnostico_ssl_cloudflare.ps1
   
   Testa:
   - DNS resolution
   - Conectividade porta 443
   - Certificado SSL
   - API endpoints
   - User-Agent Android
   - Headers CORS

📝 OBSERVAÇÕES IMPORTANTES DO LOG v7.0:
   ❌ ERR_NETWORK persiste - NÃO é erro de CORS!
   - App carrega OK (sem tela branca) ✅
   - URL correta: https://sistema.aperus.com.br ✅
   - Erro ocorre ANTES do servidor responder
   
   POSSÍVEIS CAUSAS:
   1. Cloudflare WAF bloqueando User-Agent Android
   2. Certificado SSL não confiável no Android
   3. DNS não resolve no celular
   4. Firewall/Proxy da operadora bloqueando

🧪 TESTES OBRIGATÓRIOS (NO CELULAR):

1. Navegador do celular:
   https://sistema.aperus.com.br/api/token/
   
   Deve mostrar: {"detail":"Method \"GET\" not allowed."}
   
2. Teste de conectividade:
   https://sistema.aperus.com.br
   
3. Enviar logs novamente após instalar v9.0

================================================================================

🔥 CORREÇÃO CRÍTICA v7.0 - TELA BRANCA RESOLVIDA:
==================================================

❌ PROBLEMA v6.0:
   - Tela ficava totalmente branca
   - Sem logo, sem interface, nada carregava
   - App não conseguia carregar os arquivos JavaScript e CSS
   
   CAUSA RAIZ:
   O Vite estava gerando paths ABSOLUTOS para os assets:
   - index.html continha: src="/assets/index-xxx.js"
   - Scheme "ionic" não conseguia resolver paths absolutos
   - Resultado: nenhum arquivo carregava, tela branca

✅ SOLUÇÃO v7.0 APLICADA:

1. 🎯 VITE BASE PATH CONFIGURADO (vite.config.js):
   ```javascript
   export default defineConfig({
     base: './',  // ← CRÍTICO para Capacitor
     plugins: [react()],
     ...
   })
   ```
   
   ANTES (v1-v6):
   - Paths absolutos: href="/assets/index.css"
   - Não funciona no Capacitor
   
   DEPOIS (v7.0):
   - Paths relativos: href="./assets/index.css"
   - Funciona em qualquer scheme

2. 🔄 SCHEME REVERTIDO PARA HTTPS:
   - androidScheme: "ionic" → "https" (mais estável)
   - O scheme "https" é testado e confiável
   - Paths relativos funcionam com HTTPS também

3. ✅ PRIORIDADE DA API MANTIDA:
   - VITE_API_URL continua como PRIORIDADE 1
   - Apontando para: https://sistema.aperus.com.br
   - getApiUrl() verifica VITE_API_URL PRIMEIRO

📋 TESTE ESPERADO:
   ✅ App carrega interface normalmente (não fica branco)
   ✅ Logo aparece na tela de login
   ✅ Campos de usuário e senha aparecem
   ✅ Log mostra: "🔧 [PRIORIDADE 1] Usando VITE_API_URL"
   ✅ Login conecta em: https://sistema.aperus.com.br/api/token/

═══════════════════════════════════════════════════════════════════════════

🔒 HISTÓRICO COMPLETO:
═══════════════════════════════════════════════════════════════════════════

v7.0 (12:41) ⭐ FIX TELA BRANCA: base: './' no Vite + scheme https
                                 Paths relativos para assets funcionarem
v6.0 (12:27) - FIX: Ordem de prioridades API corrigida (VITE_API_URL primeiro)
v5.0 (12:19) - FIX: Scheme ionic + permissões de rede (causou tela branca)
v4.0 (12:15) - FIX: Axios baseURL vazio para URLs absolutas
v3.0 (12:12) - Adicionado Network Security Config
v2.0 (12:06) - API URL corrigida + Logo instalado
v1.0 (12:01) - Primeiro build

═══════════════════════════════════════════════════════════════════════════

📝 CONFIGURAÇÕES TÉCNICAS v7.0:
═══════════════════════════════════════════════════════════════════════════

🌐 API:
   Base URL: https://sistema.aperus.com.br
   Ambiente: Produção (.env.production)
   VITE_API_URL: Configurado com PRIORIDADE MÁXIMA
   Axios baseURL: "" (vazio - usa URL absoluta)

🎨 Frontend Build:
   Vite base: './' (paths relativos)
   Assets: ./assets/index-xxx.js (relativo, não absoluto)
   index.html: Todos os links relativos (./icons/, ./assets/)

🔐 Segurança Android:
   - Network Security Config: Habilitado
     * Localhost: Cleartext permitido
     * Produção: APENAS HTTPS
   - Permissões: INTERNET, ACCESS_NETWORK_STATE, etc.

⚙️ Capacitor:
   - App ID: com.petshop.gerencial
   - App Name: APERUS
   - Android Scheme: https (revertido de "ionic")
   - Allow Mixed Content: true
   - Allow Navigation: sistema.aperus.com.br
   - Web Dir: dist

🏗️ Build:
   - Gradle: 8.5
   - Android SDK: 34
   - APK Size: 9,82 MB (aumentou porque assets são copiados)

═══════════════════════════════════════════════════════════════════════════

🔍 DIFERENÇAS v6.0 → v7.0:
═══════════════════════════════════════════════════════════════════════════

vite.config.js:
   + base: './'  ← NOVO: força paths relativos

capacitor.config.json:
   - androidScheme: "ionic"
   + androidScheme: "https"  ← REVERTIDO

frontend/dist/index.html:
   ANTES (v6.0):
   <script src="/assets/index-xxx.js"></script>  ← Absoluto, quebrava
   
   DEPOIS (v7.0):
   <script src="./assets/index-xxx.js"></script>  ← Relativo, funciona!

═══════════════════════════════════════════════════════════════════════════

🚀 COMO INSTALAR v7.0:
═══════════════════════════════════════════════════════════════════════════

1. Copie APERUS.apk para o celular
2. Abra o arquivo no celular
3. Permita instalação de fontes desconhecidas (se solicitado)
4. Instale o app (substituirá v6.0 se já instalado)
5. Abra o app

⚠️ IMPORTANTE: 
   - A tela de login DEVE aparecer (não fica mais branca)
   - Se ainda ficar branca, há um problema mais profundo (provavelmente erro JS)

═══════════════════════════════════════════════════════════════════════════

🔬 COMO VERIFICAR SE FUNCIONOU:
═══════════════════════════════════════════════════════════════════════════

AO ABRIR O APP:

✅ SUCESSO:
   - Tela de login aparece
   - Logo "APERUS" visível
   - Campos de usuário e senha aparecem
   - Log: "🔧 [PRIORIDADE 1] Usando VITE_API_URL: https://sistema.aperus.com.br"

❌ FALHA (se tela continuar branca):
   - Erro fatal de JavaScript
   - Problema no build do Vite
   - Verificar logcat do Android para erros

═══════════════════════════════════════════════════════════════════════════

📧 SE TELA CONTINUAR BRANCA NA v7.0:
═══════════════════════════════════════════════════════════════════════════

Se mesmo com v7.0 a tela continuar branca, precisamos:

1. Verificar logcat do Android:
   adb logcat | findstr -i "chromium|console|error"
   
2. Possíveis causas:
   - Erro fatal no código JavaScript (import quebrado)
   - Problema na variável de ambiente VITE_API_URL
   - Incompatibilidade do React com Android WebView
   
3. Teste alternativo:
   - Abra o Chrome no PC
   - Vá para: chrome://inspect/#devices
   - Conecte o celular via USB
   - Inspecione o WebView do app
   - Veja o Console para erros JavaScript

═══════════════════════════════════════════════════════════════════════════

🛠️ ARQUIVOS ALTERADOS NA v7.0:
═══════════════════════════════════════════════════════════════════════════

frontend/vite.config.js:
   + base: './'  (linha 5)

frontend/capacitor.config.json:
   - androidScheme: "ionic"
   + androidScheme: "https"

Resultado:
   - frontend/dist/index.html agora tem paths relativos
   - App carrega corretamente no Capacitor

═══════════════════════════════════════════════════════════════════════════

🎯 PRÓXIMOS PASSOS:
═══════════════════════════════════════════════════════════════════════════

1. Instale v7.0 no celular
2. Verifique se a tela de login aparece (não fica branca)
3. Se aparecer, teste fazer login
4. Me envie o resultado dos logs do DebugLogger

Se der certo, o próximo passo é resolver o Network Error (se ainda houver).

═══════════════════════════════════════════════════════════════════════════
