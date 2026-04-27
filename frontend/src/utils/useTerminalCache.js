/**
 * useTerminalCache.js
 *
 * Hook que mantém o cache local do terminal atualizado.
 *
 * Responsabilidades:
 *  1. Quando online: busca os dados do servidor e salva no IndexedDB
 *  2. Quando offline: serve os dados do IndexedDB
 *  3. Fornece funções de busca que alternam automaticamente
 *
 * Uso:
 *   const { buscarProdutos, buscarClientes, formasPagamento,
 *           dadosIniciais, carregandoCache, cacheOk } = useTerminalCache(axiosInstance, servidorOk);
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cachearProdutos,
  cachearClientes,
  cachearFormasPagamento,
  cachearOperacoes,
  cachearVendedores,
  cachearTabelasComerciais,
  cachearEmpresa,
  cachearParametros,
  buscarProdutosCache,
  buscarClientesCache,
  buscarFormasPagamentoCache,
  buscarOperacaoCache,
  buscarVendedorCache,
  buscarTabelasComerciaisCache,
  buscarEmpresaCache,
  buscarParametrosCache,
  salvarMeta,
  buscarMeta,
} from './terminalCacheDB';

// Cache expira em 24 horas por padrão
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const META_KEY     = 'ultima_carga_cache';

const agora = () => Date.now();

/**
 * Busca todas as páginas de um endpoint paginado.
 * Suporta tanto arrays simples quanto { results, next }.
 */
const buscarTodosItems = async (axios, endpoint) => {
  let url      = endpoint;
  const todos  = [];
  while (url) {
    const res    = await axios.get(url);
    const { data } = res;
    if (Array.isArray(data)) {
      todos.push(...data);
      break;                       // Não há paginação
    }
    todos.push(...(data.results || []));
    // data.next pode ser URL absoluta ou relativa
    if (data.next) {
      try {
        const u = new URL(data.next);
        url = u.pathname + u.search; // usa apenas o path
      } catch {
        url = data.next;
      }
    } else {
      url = null;
    }
  }
  return todos;
};

const useTerminalCache = (axiosInstance, servidorOk) => {
  const [carregandoCache,  setCarregandoCache]  = useState(false);
  const [cacheOk,          setCacheOk]          = useState(false);
  const [ultimaCarga,      setUltimaCarga]       = useState(null);
  const [formasPagamento,  setFormasPagamento]  = useState([]);
  const [tabelasComerciais, setTabelasComerciais] = useState([]);

  const carregandoRef = useRef(false);

  // ─── Carga completa do cache ──────────────────────────────────────────────
  const carregarCache = useCallback(async (forcar = false) => {
    if (!axiosInstance || !servidorOk) return;
    if (carregandoRef.current) return;

    // Verificar se o cache ainda é válido
    if (!forcar) {
      const ts = await buscarMeta(META_KEY);
      if (ts && (agora() - Number(ts)) < CACHE_TTL_MS) {
        // Cache ainda fresco — apenas recarrega memória
        await recarregarMemoria();
        setCacheOk(true);
        return;
      }
    }

    carregandoRef.current = true;
    setCarregandoCache(true);

    try {
      const promises = [
        // Produtos — busca os primeiros 500 para não travar
        axiosInstance.get('/produtos/?page_size=500').catch(() => ({ data: [] })),
        // Clientes — primeiros 500
        axiosInstance.get('/clientes/?page_size=500').catch(() => ({ data: [] })),
        // Formas de pagamento (normalmente pequena lista)
        axiosInstance.get('/formas-pagamento/').catch(() => ({ data: [] })),
        // Operações
        axiosInstance.get('/operacoes/?page_size=200').catch(() => ({ data: [] })),
        // Vendedores
        axiosInstance.get('/vendedores/?page_size=200').catch(() => ({ data: [] })),
        // Tabelas comerciais
        axiosInstance.get('/tabelas-comerciais/?apenas_ativas=true').catch(() => ({ data: [] })),
        // Empresa
        axiosInstance.get('/empresa/').catch(() => ({ data: [] })),
        // Parâmetros do usuário logado
        axiosInstance.get('/usuarios/me/').catch(() => ({ data: null })),
      ];

      const [
        resProdutos,
        resClientes,
        resFormas,
        resOperacoes,
        resVendedores,
        resTabelas,
        resEmpresa,
        resUsuario,
      ] = await Promise.allSettled(promises);

      const extrair = (res, campo) => {
        if (res.status !== 'fulfilled') return [];
        const d = res.value.data;
        return Array.isArray(d) ? d : (d?.[campo] || d?.results || []);
      };

      const produtos   = extrair(resProdutos,   'results');
      const clientes   = extrair(resClientes,   'results');
      const formas     = extrair(resFormas,      'results');
      const operacoes  = extrair(resOperacoes,  'results');
      const vendedores = extrair(resVendedores, 'results');
      const tabelas    = extrair(resTabelas,    'results');

      // Salva no IndexedDB
      await Promise.all([
        cachearProdutos(produtos),
        cachearClientes(clientes),
        cachearFormasPagamento(formas),
        cachearOperacoes(operacoes),
        cachearVendedores(vendedores),
        cachearTabelasComerciais(tabelas),
      ]);

      // Empresa (primeiro item do array)
      if (resEmpresa.status === 'fulfilled') {
        const d = resEmpresa.value.data;
        const e = Array.isArray(d) ? d[0] : d;
        if (e) await cachearEmpresa(e);
      }

      // Parâmetros do usuário
      if (resUsuario.status === 'fulfilled' && resUsuario.value.data?.parametros) {
        await cachearParametros({
          ...resUsuario.value.data.parametros,
          usuario: resUsuario.value.data,
        });
      }

      await salvarMeta(META_KEY, agora());
      setUltimaCarga(new Date());
      setCacheOk(true);

      // Atualiza estado em memória das listas que a UI usa diretamente
      setFormasPagamento(formas);
      setTabelasComerciais(tabelas);

    } catch (err) {
      console.warn('[CACHE] Erro ao carregar cache:', err);
    } finally {
      setCarregandoCache(false);
      carregandoRef.current = false;
    }
  }, [axiosInstance, servidorOk]);

  // Carrega apenas para memória (sem bater na API)
  const recarregarMemoria = async () => {
    const [formas, tabelas] = await Promise.all([
      buscarFormasPagamentoCache(),
      buscarTabelasComerciaisCache(),
    ]);
    setFormasPagamento(formas);
    setTabelasComerciais(tabelas);
  };

  // ─── Dispara carga quando servidor voltar online ──────────────────────────
  const servidorOkRef = useRef(servidorOk);
  useEffect(() => {
    const voltouOnline = !servidorOkRef.current && servidorOk;
    servidorOkRef.current = servidorOk;

    if (servidorOk) {
      // Ao ficar online (inclusive na primeira vez), sincroniza o cache
      carregarCache(voltouOnline); // forcar se acabou de voltar
    } else {
      // Servidor offline: carrega memória do IndexedDB
      recarregarMemoria().then(() => setCacheOk(true)).catch(() => {});
    }
  }, [servidorOk, carregarCache]);

  // ─── Funções de busca que alternam entre API e cache ─────────────────────

  /**
   * Busca produtos.
   * Online: chama a API.
   * Offline: busca no IndexedDB local.
   */
  const buscarProdutos = useCallback(async (termo, axiosInst = axiosInstance) => {
    if (servidorOk && axiosInst) {
      try {
        const res = await axiosInst.get(`/produtos/?search=${encodeURIComponent(termo)}`);
        return Array.isArray(res.data) ? res.data : (res.data?.results || []);
      } catch (err) {
        console.warn('[CACHE] Falha na API de produtos, usando cache:', err.message);
      }
    }
    return buscarProdutosCache(termo);
  }, [servidorOk, axiosInstance]);

  /**
   * Busca clientes.
   * Online: chama a API.
   * Offline: busca no IndexedDB local.
   */
  const buscarClientes = useCallback(async (termo, axiosInst = axiosInstance) => {
    if (servidorOk && axiosInst) {
      try {
        const res = await axiosInst.get(`/clientes/?search=${encodeURIComponent(termo)}`);
        return Array.isArray(res.data) ? res.data : (res.data?.results || []);
      } catch (err) {
        console.warn('[CACHE] Falha na API de clientes, usando cache:', err.message);
      }
    }
    return buscarClientesCache(termo);
  }, [servidorOk, axiosInstance]);

  /**
   * Carrega os dados iniciais do terminal (empresa, parâmetros, vendedor, operação).
   * Online: da API.
   * Offline: do cache.
   */
  const carregarDadosIniciais = useCallback(async (axiosInst = axiosInstance) => {
    const offline = !servidorOk || !axiosInst;

    if (!offline) {
      // Online: delega ao caller (VendaRapidaPage já tem a lógica)
      return null;
    }

    // Offline: usa cache
    const [empresa, cached] = await Promise.all([
      buscarEmpresaCache(),
      buscarParametrosCache(),
    ]);

    if (!cached) return null;

    const parametros = cached;       // Inclui .usuario
    const usuario    = cached.usuario || null;

    // Vendedor e operação do cache
    // Vendedor e operação do cache — tenta campos específicos de Venda Rápida,
    // depois campos de Venda, e por último os campos padrão
    const idVendedor  = parametros.id_vendedor_venda_rapida || parametros.id_vendedor_venda || parametros.id_vendedor_padrao;
    const idOperacao  = parametros.id_operacao_venda_rapida || parametros.id_operacao_venda || parametros.id_operacao_padrao;
    const idCliente   = parametros.id_cliente_padrao;

    const [vendedor, operacao, cliente] = await Promise.all([
      idVendedor ? buscarVendedorCache(idVendedor) : Promise.resolve(null),
      idOperacao ? buscarOperacaoCache(idOperacao) : Promise.resolve(null),
      idCliente  ? buscarClienteCache(idCliente)   : Promise.resolve(null),
    ]);

    return { empresa, parametros, usuario, vendedor, operacao, cliente };
  }, [servidorOk, axiosInstance]);

  /**
   * Busca formas de pagamento.
   * Online: da API (e cacheia).
   * Offline: do cache.
   */
  const obterFormasPagamento = useCallback(async (axiosInst = axiosInstance) => {
    if (servidorOk && axiosInst) {
      try {
        const res = await axiosInst.get('/formas-pagamento/');
        const lista = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        cachearFormasPagamento(lista); // Salva assincronamente
        return lista;
      } catch (err) {
        console.warn('[CACHE] Falha na API de formas-pagamento, usando cache:', err.message);
      }
    }
    return buscarFormasPagamentoCache();
  }, [servidorOk, axiosInstance]);

  return {
    carregarCache,
    carregandoCache,
    cacheOk,
    ultimaCarga,
    formasPagamento,        // Lista em memória (atualizada junto com o cache)
    tabelasComerciais,      // Lista em memória
    buscarProdutos,
    buscarClientes,
    obterFormasPagamento,
    carregarDadosIniciais,
    // Funções de cache puro para uso avançado
    buscarClienteCache: (id) => buscarClienteCache(id),
  };
};

export default useTerminalCache;
