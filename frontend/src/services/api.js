import axios from 'axios';
import { logger } from '../components/DebugLogger';
import { API_BASE_URL } from '../config/api';

// Cria instância axios para requisições à API
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log da configuração inicial
logger.info('API Configurada', {
  baseURL: API_BASE_URL,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE
});

// Interceptor para adicionar token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    console.log('🔐 [API Interceptor] Verificando token...');
    console.log('   Token existe:', !!token);
    
    logger.network('Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      params: config.params,
      data: config.data
    });
    
    if (token) {
      console.log('   Token primeiros 50 chars:', token.substring(0, 50) + '...');
      config.headers.Authorization = `Bearer ${token}`;
      console.log('   ✅ Header Authorization adicionado');
    } else {
      console.log('   ❌ Nenhum token encontrado!');
    }
    console.log('   URL:', config.url);
    return config;
  },
  (error) => {
    logger.error('Request Error', {
      message: error.message,
      code: error.code,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API Response]', response.status, response.config.url);
    
    logger.network('Response OK', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      dataSize: JSON.stringify(response.data).length + ' bytes'
    });
    
    return response;
  },
  (error) => {
    console.error('❌ [API Error]', error.response?.status, error.config?.url);
    console.error('   Resposta:', error.response?.data);

    // Log detalhado do erro
    logger.error('API Error', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
      responseData: error.response?.data,
      requestData: error.config?.data,
      headers: error.config?.headers
    });

    // Se for erro 401 (não autorizado), limpar token e redirecionar
    if (error.response?.status === 401) {
      console.error('   ⚠️ Token inválido ou expirado! Limpando sessionStorage e redirecionando...');
      logger.warn('Token Expirado', 'Redirecionando para login...');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
