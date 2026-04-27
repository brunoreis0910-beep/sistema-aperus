/**
 * OfflineSyncContext.jsx
 *
 * Contexto global que:
 *  - Monitora se o servidor está acessível (não apenas navigator.onLine)
 *  - Mantém fila de operações pendentes (via offlineQueue.js)
 *  - Sincroniza automaticamente quando o servidor volta
 *  - Exibe indicador visual na UI
 *
 * Tratativa de múltiplos terminais:
 *  - Cada terminal tem um UUID único (terminalId em localStorage)
 *  - IDs temporários offline incluem terminalId → sem colisão entre terminais
 */

import React, {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import {
  listarPendentes, contarPendentes, processarFila, terminalId,
} from '../utils/offlineQueue';
import { API_BASE_URL } from '../config/api';

const OfflineSyncContext = createContext(null);

// Intervalo de verificação de conexão com o servidor (ms)
const INTERVALO_PING = 15_000;
// Timeout do ping (ms)
const TIMEOUT_PING   = 5_000;

export const OfflineSyncProvider = ({ children }) => {
  const { axiosInstance } = useAuth();

  const [isOnline,       setIsOnline]       = useState(navigator.onLine);
  const [servidorOk,     setServidorOk]     = useState(true);
  const [pendentes,      setPendentes]      = useState(0);
  const [sincronizando,  setSincronizando]  = useState(false);
  const [ultimaSync,     setUltimaSync]     = useState(null);
  const [errosSync,      setErrosSync]      = useState(0);

  const pingTimerRef    = useRef(null);
  const sincronizandoRef = useRef(false); // evita execuções concorrentes

  // ─── Verifica se o servidor está respondendo ────────────────────────────────
  const verificarServidor = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setServidorOk(false);
      return false;
    }
    try {
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), TIMEOUT_PING);
      const resp = await fetch(`${API_BASE_URL}/api/health/`, {
        signal: ctrl.signal,
        cache:  'no-store',
      });
      clearTimeout(tid);
      const ok = resp.ok || resp.status < 500;
      setIsOnline(true);
      setServidorOk(ok);
      return ok;
    } catch {
      setServidorOk(false);
      return false;
    }
  }, []);

  // ─── Sincroniza a fila offline ──────────────────────────────────────────────
  const sincronizar = useCallback(async (forcar = false) => {
    if (sincronizandoRef.current && !forcar) return;
    if (!axiosInstance) return;

    const total = await contarPendentes();
    if (total === 0) return;

    sincronizandoRef.current = true;
    setSincronizando(true);

    try {
      const { enviados, erros } = await processarFila(axiosInstance, (env, tot) => {
        setPendentes(tot - env);
      });
      setErrosSync(erros);
      if (enviados > 0) setUltimaSync(new Date());
    } finally {
      const restantes = await contarPendentes();
      setPendentes(restantes);
      setSincronizando(false);
      sincronizandoRef.current = false;
    }
  }, [axiosInstance]);

  // ─── Atualiza contador de pendentes ────────────────────────────────────────
  const atualizarPendentes = useCallback(async () => {
    const total = await contarPendentes();
    setPendentes(total);
  }, []);

  // ─── Loop de ping periódico ─────────────────────────────────────────────────
  useEffect(() => {
    const tick = async () => {
      const ok = await verificarServidor();
      if (ok) await sincronizar();
      await atualizarPendentes();
    };

    // Executa imediatamente
    tick();

    pingTimerRef.current = setInterval(tick, INTERVALO_PING);
    return () => clearInterval(pingTimerRef.current);
  }, [verificarServidor, sincronizar, atualizarPendentes]);

  // ─── Eventos de rede do navegador ──────────────────────────────────────────
  useEffect(() => {
    const aoOnline = async () => {
      setIsOnline(true);
      const ok = await verificarServidor();
      if (ok) await sincronizar();
    };
    const aoOffline = () => {
      setIsOnline(false);
      setServidorOk(false);
    };
    window.addEventListener('online',  aoOnline);
    window.addEventListener('offline', aoOffline);
    return () => {
      window.removeEventListener('online',  aoOnline);
      window.removeEventListener('offline', aoOffline);
    };
  }, [verificarServidor, sincronizar]);

  const valor = {
    isOnline,
    servidorOk,
    pendentes,
    sincronizando,
    ultimaSync,
    errosSync,
    terminalId,
    sincronizar: () => sincronizar(true),
    atualizarPendentes,
  };

  return (
    <OfflineSyncContext.Provider value={valor}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx) throw new Error('useOfflineSync deve ser usado dentro de OfflineSyncProvider');
  return ctx;
};

export default OfflineSyncContext;
