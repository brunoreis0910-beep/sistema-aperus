import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINT } from '../config/api';
import { logger } from '../components/DebugLogger';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Ref que guarda os callbacks mais recentes para uso dentro dos interceptors
  // (evita stale closure sem precisar recriar o axiosInstance a cada render)
  const callbacksRef = useRef({ logout: () => {}, refreshToken: async () => {} });

  // Cria o axiosInstance UMA ÚNICA VEZ (useMemo com []) — não recria a cada render
  // Isso evita que contextos dependentes (ex: GruposProdutoContext) re-executem
  // seus useEffects desnecessariamente e gerem requisições duplicadas.
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: API_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Interceptor de REQUEST — adiciona o token JWT
    instance.interceptors.request.use(
      (config) => {
        const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        logger.network('REQUEST', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          hasToken: !!token
        });
        return config;
      },
      (error) => {
        logger.error('REQUEST ERROR', {
          message: error.message,
          stack: error.stack
        });
        return Promise.reject(error);
      }
    );

    // Interceptor de RESPONSE — lida com token expirado (401) e faz refresh
    instance.interceptors.response.use(
      (response) => {
        logger.network('RESPONSE OK', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        logger.network('RESPONSE ERROR', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data
        });
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            logger.warn('TOKEN EXPIRADO', 'Tentando renovar...');
            const newToken = await callbacksRef.current.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            logger.error('REFRESH FALHOU', 'Deslogando usuário...');
            callbacksRef.current.logout();
            return Promise.reject(refreshError);
          }
        }
        if (error.response?.status === 401) {
          logger.error('TOKEN INVÁLIDO', 'Deslogando usuário...');
          callbacksRef.current.logout();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Funcao de Logout (agora centralizada)
  const logout = () => {
    logger.info('LOGOUT', {
      message: 'Usuário deslogado',
      pathname: location.pathname
    });
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setPermissions({});

    // Navega apenas se nao estiver ja na pagina de login
    if (location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  };

  // Função para fazer refresh do token
  const refreshToken = async () => {
    try {
      logger.info('REFRESH TOKEN', 'Tentando renovar token...');
      const refreshTokenValue = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        logger.error('REFRESH TOKEN', 'Refresh token não encontrado');
        throw new Error('Refresh token não encontrado');
      }

      const response = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
        refresh: refreshTokenValue      }, {
        baseURL: '', // Força usar a URL completa sem baseURL
        timeout: 40000      });

      sessionStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('accessToken', response.data.access);
      logger.success('REFRESH TOKEN', 'Token renovado com sucesso');
      return response.data.access;
    } catch (error) {
      logger.error('REFRESH TOKEN ERROR', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      logout(); // logout ja faz o navigate, nao precisa fazer aqui
      throw error;
    }
  };

  // Mantém os callbacks do ref atualizados a cada render (sem custo de useEffect)
  // Garante que o interceptor (criado uma vez) sempre chame a versão mais recente
  callbacksRef.current = { logout, refreshToken };

  // Funcao para buscar o usuario (usada no Login e no Refresh)
  const fetchUser = async () => {
    try {
      const response = await axiosInstance.get('/usuarios/me/');
      setUser(response.data);
      setPermissions(response.data.permissions || {});
      return response.data; // Retorna o usuario
    } catch (error) {
      console.error("Falha ao buscar dados do usuario.", error);
      throw error;
    }
  };

  // --- NOVA FUNCAO DE LOGIN ---
  const login = async (username, password) => {
    try {
      logger.info('LOGIN INICIADO', {
        username,
        API_BASE_URL,
        fullURL: `${API_BASE_URL}/api/token/`,
        isCapacitor: !!window.Capacitor
      });

      // 1. Pede o token (usando o axios normal, pois ainda nao temos token)
      const response = await axios.post(`${API_BASE_URL}/api/token/`, {
        username,
        password
      }, {
        baseURL: '', // Força usar a URL completa sem baseURL
        timeout: 40000
      });

      logger.success('LOGIN TOKEN RECEBIDO', {
        status: response.status,
        hasAccess: !!response.data.access,
        hasRefresh: !!response.data.refresh
      });

      // 2. Salva os tokens em ambos os storages
      sessionStorage.setItem('accessToken', response.data.access);
      sessionStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);

      // 3. AGORA, busca os dados do usuario (com o token novo)
      const userData = await fetchUser();
      logger.success('LOGIN SUCESSO', {
        username: userData.username,
        email: userData.email
      });

      // 4. Navega para a pagina principal (ou de onde veio)
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });

      return userData; // Sucesso

    } catch (error) {
      console.error('❌ ERRO NO LOGIN:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      // Limpa tudo em caso de falha
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setPermissions({});
      throw error; // Joga o erro para a LoginPage (para ela mostrar o alerta)
    }
  };

  // Roda esta funcao UMA VEZ quando o app carrega (para quem deu F5)
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
      const refreshTokenValue = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');

      // Verificar se há tokens em apenas um storage (situação inválida)
      const hasSessionToken = sessionStorage.getItem('accessToken') && sessionStorage.getItem('refreshToken');
      const hasLocalToken = localStorage.getItem('accessToken') && localStorage.getItem('refreshToken');

      // Se tem em apenas um storage, limpar tudo e forçar novo login
      if ((hasSessionToken && !hasLocalToken) || (!hasSessionToken && hasLocalToken)) {
        console.log('⚠️ Tokens inconsistentes entre storages. Limpando...');
        sessionStorage.clear();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoading(false);
        return;
      }

      if (!token && !refreshTokenValue) {
        setIsLoading(false);
        return; // Se nao tem nenhum token, nao faz nada
      }

      try {
        // Tenta buscar o usuario com o token atual
        await fetchUser();
        console.log('✅ Usuario logado com token valido');
      } catch (error) {
        // Se falhar, tenta renovar o token
        if (refreshTokenValue) {
          try {
            console.log('🔄 Token expirado, tentando renovar na inicializacao...');
            await refreshToken();
            await fetchUser(); // Tenta novamente com o token novo
            console.log('✅ Login restaurado apos refresh do token');
          } catch (refreshError) {
            console.log('❌ Falha no refresh token na inicializacao. Usuario sera deslogado.');
            logout();
          }
        } else {
          console.log('❌ Token antigo invalido e sem refresh token.');
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedInUser();
  }, []); // O [] vazio garante que rode so uma vez

  const value = {
    user,
    permissions,
    isLoading,
    login, // <-- Expoe a nova funcao de login
    logout,
    fetchUser,
    refreshToken, // <-- Nova funcao de refresh
    axiosInstance
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
