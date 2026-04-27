/**
 * offlineQueue.js
 * Fila genérica de operações offline usando IndexedDB.
 *
 * Resolve conflitos de ID entre múltiplos terminais usando:
 *   - terminalId: UUID único por aba/navegador (salvo em localStorage)
 *   - tempId: "offline_<terminalId>_<timestamp>_<random>" — garante unicidade
 *
 * Fluxo:
 *   1. Operação falha (offline) → enfileirada com tempId único
 *   2. Servidor volta → processQueue() envia tudo em ordem
 *   3. Se POST cria registro → backend retorna id real (não há conflito pois
 *      o servidor controla o ID final)
 */

const DB_NAME  = 'SistemaGerencialOffline';
const DB_VER   = 1;
const STORE    = 'fila_operacoes';

let _db = null;

// ─── Terminal ID ─────────────────────────────────────────────────────────────
// Cada aba/dispositivo tem um ID único para evitar colisão de tempIds offline.
const getTerminalId = () => {
  let tid = localStorage.getItem('aperus_terminal_id');
  if (!tid) {
    tid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('aperus_terminal_id', tid);
  }
  return tid;
};

export const terminalId = getTerminalId();

// ─── UUID para registros temporários ─────────────────────────────────────────
export const gerarTempId = () =>
  `offline_${terminalId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ─── IndexedDB ────────────────────────────────────────────────────────────────
const abrirDB = () =>
  new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('por_modulo', 'modulo', { unique: false });
        store.createIndex('por_status', 'status', { unique: false });
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror  = () => reject(req.error);
  });

// ─── Enfileirar operação ──────────────────────────────────────────────────────
/**
 * Adiciona uma operação à fila offline.
 * @param {string} modulo  - ex: 'vendas', 'clientes', 'ordem-servico'
 * @param {string} method  - 'POST' | 'PUT' | 'PATCH' | 'DELETE'
 * @param {string} endpoint - URL relativa, ex: '/vendas/'
 * @param {object} data    - payload da requisição
 * @param {string} [tempId] - ID temporário local (se criação offline)
 */
export const enfileirar = async (modulo, method, endpoint, data = {}, tempId = null) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add({
      modulo,
      method: method.toUpperCase(),
      endpoint,
      data,
      tempId: tempId || (method.toUpperCase() === 'POST' ? gerarTempId() : null),
      terminalId,
      status: 'pendente',     // 'pendente' | 'enviando' | 'erro'
      tentativas: 0,
      criadoEm: new Date().toISOString(),
      erroMsg: null,
    });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
};

// ─── Listar pendentes ─────────────────────────────────────────────────────────
export const listarPendentes = async () => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result || []).filter(r => r.status !== 'sincronizado'));
    req.onerror   = () => reject(req.error);
  });
};

export const contarPendentes = async () => {
  const lista = await listarPendentes();
  return lista.length;
};

// ─── Atualizar status de item ─────────────────────────────────────────────────
const atualizarItem = async (id, campos) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const get   = store.get(id);
    get.onsuccess = () => {
      const item = get.result;
      if (!item) return resolve();
      Object.assign(item, campos);
      const put = store.put(item);
      put.onsuccess = () => resolve();
      put.onerror   = () => reject(put.error);
    };
    get.onerror = () => reject(get.error);
  });
};

// ─── Remover item sincronizado ────────────────────────────────────────────────
export const removerItem = async (id) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
};

// ─── Limpar erros permanentes (retry manual) ──────────────────────────────────
export const limparErros = async () => {
  const db = await abrirDB();
  const lista = await listarPendentes();
  for (const item of lista.filter(i => i.status === 'erro' && i.tentativas >= 3)) {
    await removerItem(item.id);
  }
};

// ─── Processar fila (chamado quando volta online) ────────────────────────────
/**
 * @param {AxiosInstance} axiosInstance - instância autenticada do axios
 * @param {function} [onProgresso]      - callback(enviados, total)
 * @returns {Promise<{ enviados: number, erros: number }>}
 */
export const processarFila = async (axiosInstance, onProgresso) => {
  const pendentes = await listarPendentes();
  if (!pendentes.length) return { enviados: 0, erros: 0 };

  let enviados = 0;
  let erros    = 0;

  for (const item of pendentes) {
    await atualizarItem(item.id, { status: 'enviando' });

    try {
      const { method, endpoint, data } = item;

      if      (method === 'POST')   await axiosInstance.post(endpoint, data);
      else if (method === 'PUT')    await axiosInstance.put(endpoint, data);
      else if (method === 'PATCH')  await axiosInstance.patch(endpoint, data);
      else if (method === 'DELETE') await axiosInstance.delete(endpoint);

      await removerItem(item.id);
      enviados++;
    } catch (err) {
      erros++;
      await atualizarItem(item.id, {
        status: 'erro',
        tentativas: (item.tentativas || 0) + 1,
        erroMsg: err?.response?.data ? JSON.stringify(err.response.data) : err.message,
      });
    }

    if (onProgresso) onProgresso(enviados, pendentes.length);
  }

  return { enviados, erros };
};
