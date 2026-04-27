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
import { sincronizarVendasOffline, contarVendasOffline } from '../utils/terminalCacheDB';
import { API_BASE_URL } from '../config/api';

const OfflineSyncContext = createContext(null);

// Intervalo de verificação de conexão com o servidor (ms)
const INTERVALO_PING = 15_000;
// Timeout do ping (ms)
const TIMEOUT_PING   = 4_000;

export const OfflineSyncProvider = ({ children }) => {
  // axiosInstance é injetado externamente via registerAxios()
  // para não depender do useAuth e evitar crash antes do login
  const axiosRef = useRef(null);

  const [isOnline,       setIsOnline]       = useState(navigator.onLine);
  // Se já sabemos que não temos internet, começa como offline imediatamente
  const [servidorOk,     setServidorOk]     = useState(navigator.onLine);
  const [pendentes,      setPendentes]      = useState(0);
  const [vendasOffline,  setVendasOffline]  = useState(0);
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
    if (!axiosRef.current) return;

    const totalFila   = await contarPendentes();
    const totalVendas = await contarVendasOffline();
    if (totalFila === 0 && totalVendas === 0) return;

    sincronizandoRef.current = true;
    setSincronizando(true);

    try {
      // 1) Fila genérica (operações de outros módulos)
      const { enviados, erros } = await processarFila(axiosRef.current, (env, tot) => {
        setPendentes(tot - env);
      });
      // 2) Vendas offline do terminal (VendaRapidaPage)
      const { enviadas, erros: errosVendas } = await sincronizarVendasOffline(axiosRef.current);

      setErrosSync(erros + errosVendas);
      if (enviados > 0 || enviadas > 0) setUltimaSync(new Date());
    } finally {
      const restantes = await contarPendentes();
      const restantesVendas = await contarVendasOffline();
      setPendentes(restantes);
      setVendasOffline(restantesVendas);
      setSincronizando(false);
      sincronizandoRef.current = false;
    }
  }, []);

  // ─── Atualiza contador de pendentes ────────────────────────────────────────
  const atualizarPendentes = useCallback(async () => {
    const [total, totalVendas] = await Promise.all([
      contarPendentes(),
      contarVendasOffline(),
    ]);
    setPendentes(total);
    setVendasOffline(totalVendas);
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
    vendasOffline,
    totalPendentes: pendentes + vendasOffline,
    sincronizando,
    ultimaSync,
    errosSync,
    terminalId,
    sincronizar: () => sincronizar(true),
    atualizarPendentes,
    // Chamado pelo AuthContext após login para registrar o axiosInstance
    registerAxios: (instance) => { axiosRef.current = instance; },
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
