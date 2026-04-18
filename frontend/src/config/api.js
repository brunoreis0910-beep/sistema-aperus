// Configuração centralizada da API
// Detecta automaticamente o IP do servidor (WiFi ou cabo)

// Detecta se está rodando dentro do Capacitor (app nativo)
// window.Capacitor pode não estar disponível no momento do import dos ES modules
const isCapacitorApp = () => {
  // Capacitor serve de localhost no WebView (sem porta = não é dev server)
  if (window.location.hostname === 'localhost' && !window.location.port) {
    return true;
  }
  if (window.Capacitor) return true;
  // Android WebView
  if (navigator.userAgent.includes('; wv)')) return true;
  return false;
};

// IP padrão do servidor na rede local
const SERVIDOR_IP = '192.168.1.4';  // IP atual do servidor (atualizar se mudar)
const SERVIDOR_PORTA = '8005';

// Testa se um IP está acessível (qualquer resposta HTTP = servidor rodando)
const testarIP = async (ip) => {
  try {
    const response = await fetch(`http://${ip}:${SERVIDOR_PORTA}/api/token/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });
    // Qualquer resposta HTTP (inclusive 401/405) significa que o servidor está acessível
    return response.status > 0;
  } catch {
    return false;
  }
};

// Tenta encontrar o IP correto testando vários IPs
const detectarIPDisponivel = async () => {
  console.log('🔍 Testando IPs disponíveis...');

  const ipsParaTestar = [
    'localhost',       // Primeiro tenta localhost (mais estável)
    '127.0.0.1',       // IP local alternativo
    SERVIDOR_IP,       // IP configurado
    '192.168.1.4',     // IP atual da rede
  ];

  for (const ip of ipsParaTestar) {
    console.log(`  Testando ${ip}...`);
    if (await testarIP(ip)) {
      console.log(`  ✔ ${ip} respondeu!`);
      localStorage.setItem('servidor_ip_auto', ip);
      return ip;
    }
  }

  console.log('  ✗ Nenhum IP respondeu');
  return null;
};

const getApiUrl = () => {
  // PRIORIDADE 0: Se a página está em HTTPS no domínio público, usa a mesma origem
  // para evitar Mixed Content (nginx deve ter proxy_pass /api/ → localhost:8005)
  const pageProtocol = window.location.protocol;
  const pageHostname = window.location.hostname;
  if (
    pageProtocol === 'https:' &&
    pageHostname !== 'localhost' &&
    pageHostname !== '127.0.0.1'
  ) {
    console.log('🔒 HTTPS detectado - usando origem da página para evitar Mixed Content:', window.location.origin);
    return window.location.origin;
  }

  // PRIORIDADE 1: IP configurado manualmente pelo usuário (ConfiguracaoIP)
  const ipManual = localStorage.getItem('servidor_ip');
  if (ipManual) {
    console.log('🔧 Usando IP manual:', ipManual);
    return `http://${ipManual}:${SERVIDOR_PORTA}`;
  }

  // PRIORIDADE 2: Se estiver no Capacitor (app nativo) → usar IP fixo do servidor
  if (isCapacitorApp()) {
    // Verifica cache de IP auto-detectado primeiro
    const ipAutoCache = localStorage.getItem('servidor_ip_auto');
    if (ipAutoCache) {
      console.log('📱 Capacitor - Usando IP auto-detectado (cache):', ipAutoCache);
      return `http://${ipAutoCache}:${SERVIDOR_PORTA}`;
    }
    const defaultIP = `http://${SERVIDOR_IP}:${SERVIDOR_PORTA}`;
    console.log('📱 Capacitor detectado - Usando IP do servidor:', defaultIP);
    return defaultIP;
  }

  // PRIORIDADE 3: Variável de ambiente (desenvolvimento local no navegador)
  if (import.meta.env.VITE_API_URL) {
    console.log('🔧 Usando VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }

  // PRIORIDADE 4: Auto-detectar pelo hostname (navegador acessando pelo IP)
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname) {
    const autoUrl = `http://${hostname}:${SERVIDOR_PORTA}`;
    console.log('🔍 IP auto-detectado pelo hostname:', autoUrl);
    return autoUrl;
  }

  // FALLBACK: localhost (dev local)
  console.log('🌐 Usando 127.0.0.1 (dev local)');
  return `http://127.0.0.1:${SERVIDOR_PORTA}`;
};

// Limpa IPs obsoletos do cache e força IP correto
const limparCacheAntigo = () => {
  const ipsAntigos = ['192.168.1.5', '192.168.1.4', '192.168.1.3', '192.168.0.54'];

  // Limpa servidor_ip_auto se contém IP antigo → força para localhost
  const ipAutoCache = localStorage.getItem('servidor_ip_auto');
  if (ipAutoCache && ipsAntigos.some(ip => ipAutoCache.includes(ip))) {
    console.log('🧹 Limpando IP antigo do cache (auto):', ipAutoCache, '→ localhost');
    localStorage.removeItem('servidor_ip_auto');  // Remove para forçar nova detecção
  }

  // Limpa servidor_ip (manual) se contém IP antigo
  const ipManual = localStorage.getItem('servidor_ip');
  if (ipManual && ipsAntigos.some(ip => ipManual.includes(ip))) {
    console.log('🧹 Limpando IP antigo do cache (manual):', ipManual);
    localStorage.removeItem('servidor_ip');
  }
};

limparCacheAntigo();

// Auto-detecta na inicialização (apenas no Capacitor, sem IP salvo)
if (isCapacitorApp() && !localStorage.getItem('servidor_ip') && !localStorage.getItem('servidor_ip_auto')) {
  console.log('🔍 Primeira inicialização - detectando IP...');
  detectarIPDisponivel().then(ip => {
    if (ip) {
      console.log(`✔ IP detectado: ${ip}`);
    }
  });
}

export const API_BASE_URL = getApiUrl();
export const API_ENDPOINT = `${API_BASE_URL}/api`;

console.log('✔ API_BASE_URL configurada:', API_BASE_URL);

export default {
  BASE_URL: API_BASE_URL,
  ENDPOINT: API_ENDPOINT,
};