/**
 * terminalCacheDB.js
 *
 * Cache local (IndexedDB) das tabelas essenciais para o terminal funcionar
 * sem conexão com o servidor.
 *
 * Tabelas cacheadas:
 *  - produtos        : catálogo de produtos para busca
 *  - clientes        : lista de clientes
 *  - formas_pagamento: formas de pagamento
 *  - operacoes       : operações de venda
 *  - vendedores      : vendedores cadastrados
 *  - empresa         : dados da empresa (1 registro)
 *  - parametros      : parâmetros do usuário logado (1 registro)
 *  - tabelas_comerciais: tabelas de preço
 *  - vendas_offline  : vendas realizadas offline aguardando sync
 *
 * Conflito entre terminais:
 *  - Cada terminal tem terminalId único (localStorage)
 *  - Vendas offline usam tempId = "venda_offline_<terminalId>_<ts>"
 *  - O servidor é quem atribui o id_venda definitivo
 */

import { terminalId } from './offlineQueue';

const DB_NAME = 'AperusTerminalCache';
const DB_VER  = 2;

let _db = null;

const abrirDB = () =>
  new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      const criar = (nome, opts = {}) => {
        if (!db.objectStoreNames.contains(nome)) {
          return db.createObjectStore(nome, opts);
        }
        return e.target.transaction.objectStore(nome);
      };

      // Tabelas de catálogo
      const sProdutos = criar('produtos', { keyPath: 'id_produto' });
      if (!sProdutos.indexNames.contains('por_descricao'))
        sProdutos.createIndex('por_descricao', 'descricao', { unique: false });
      if (!sProdutos.indexNames.contains('por_codigo'))
        sProdutos.createIndex('por_codigo', 'codigo', { unique: false });

      const sClientes = criar('clientes', { keyPath: 'id_cliente' });
      if (!sClientes.indexNames.contains('por_nome'))
        sClientes.createIndex('por_nome', 'nome', { unique: false });

      criar('formas_pagamento',    { keyPath: 'id_forma_pagamento' });
      criar('operacoes',           { keyPath: 'id_operacao' });
      criar('vendedores',          { keyPath: 'id_vendedor' });
      criar('tabelas_comerciais',  { keyPath: 'id_tabela' });

      // Registros únicos (usam chave fixa 'singleton')
      criar('empresa',    { keyPath: 'chave' });
      criar('parametros', { keyPath: 'chave' });

      // Fila de vendas offline
      const sVendas = criar('vendas_offline', { keyPath: 'tempId' });
      if (!sVendas.indexNames.contains('por_status'))
        sVendas.createIndex('por_status', 'status', { unique: false });

      // Metadados (data do último sync)
      criar('meta', { keyPath: 'chave' });
    };

    req.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror    = ()  => reject(req.error);
  });

// ─── Helpers genéricos ────────────────────────────────────────────────────────

const salvarLista = async (store, lista) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readwrite');
    const obj = tx.objectStore(store);
    lista.forEach(item => obj.put(item));
    tx.oncomplete = () => resolve(lista.length);
    tx.onerror    = () => reject(tx.error);
  });
};

const buscarTodos = async (store) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
};

const buscarPorId = async (store, id) => {
  // Coerce string numérica para número (evita mismatch de tipo com keyPath integer)
  const chave = (typeof id === 'string' && /^\d+$/.test(id)) ? parseInt(id, 10) : id;
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(chave);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
};

const salvarSingleton = async (store, dados) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put({ chave: 'singleton', ...dados });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
};

const buscarSingleton = async (store) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get('singleton');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
};

// ─── Metadados de sync ────────────────────────────────────────────────────────

export const salvarMeta = async (chave, valor) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('meta', 'readwrite');
    const req = tx.objectStore('meta').put({ chave, valor, em: new Date().toISOString() });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
};

export const buscarMeta = async (chave) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get(chave);
    req.onsuccess = () => resolve(req.result?.valor || null);
    req.onerror   = () => reject(req.error);
  });
};

// ─── Produtos ─────────────────────────────────────────────────────────────────

export const cachearProdutos = (lista) => salvarLista('produtos', lista);

/**
 * Busca produtos no cache local por código ou descrição.
 * Busca case-insensitive por substring.
 */
export const buscarProdutosCache = async (termo) => {
  const todos = await buscarTodos('produtos');
  if (!termo) return todos.slice(0, 50);
  const t = termo.toLowerCase();
  return todos.filter(p =>
    (p.descricao  && p.descricao.toLowerCase().includes(t)) ||
    (p.codigo     && String(p.codigo).toLowerCase().includes(t)) ||
    (p.id_produto && String(p.id_produto) === t)
  ).slice(0, 50);
};

export const buscarProdutoCache = (id) => buscarPorId('produtos', id);

// ─── Clientes ─────────────────────────────────────────────────────────────────

export const cachearClientes = (lista) => salvarLista('clientes', lista);

export const buscarClientesCache = async (termo) => {
  const todos = await buscarTodos('clientes');
  if (!termo) return todos.slice(0, 50);
  const t = termo.toLowerCase();
  return todos.filter(c =>
    (c.nome       && c.nome.toLowerCase().includes(t)) ||
    (c.cpf_cnpj   && c.cpf_cnpj.replace(/\D/g, '').includes(t.replace(/\D/g, '')))
  ).slice(0, 50);
};

export const buscarClienteCache = (id) => buscarPorId('clientes', id);

// ─── Formas de Pagamento ──────────────────────────────────────────────────────

export const cachearFormasPagamento = (lista) => salvarLista('formas_pagamento', lista);
export const buscarFormasPagamentoCache = () => buscarTodos('formas_pagamento');

// ─── Operações ────────────────────────────────────────────────────────────────

export const cachearOperacoes = (lista) => salvarLista('operacoes', lista);
export const buscarOperacaoCache = (id) => buscarPorId('operacoes', id);

// ─── Vendedores ───────────────────────────────────────────────────────────────

export const cachearVendedores = (lista) => salvarLista('vendedores', lista);
export const buscarVendedorCache = (id) => buscarPorId('vendedores', id);

// ─── Tabelas Comerciais ───────────────────────────────────────────────────────

export const cachearTabelasComerciais = (lista) => salvarLista('tabelas_comerciais', lista);
export const buscarTabelasComerciaisCache = () => buscarTodos('tabelas_comerciais');

// ─── Empresa ──────────────────────────────────────────────────────────────────

export const cachearEmpresa = (dados) => salvarSingleton('empresa', dados);
export const buscarEmpresaCache = () => buscarSingleton('empresa');

// ─── Parâmetros do usuário ────────────────────────────────────────────────────

export const cachearParametros = (dados) => salvarSingleton('parametros', dados);
export const buscarParametrosCache = () => buscarSingleton('parametros');

// ─── Vendas Offline ───────────────────────────────────────────────────────────

export const gerarTempIdVenda = () =>
  `venda_offline_${terminalId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Salva uma venda realizada offline.
 * @param {object} dadosVenda - Payload para POST /vendas/
 * @param {Array}  dadosFinanceiros - Array de payloads para POST /contas/ (sem id_venda_origem)
 */
export const salvarVendaOffline = async (dadosVenda, dadosFinanceiros = []) => {
  const tempId = gerarTempIdVenda();
  const db     = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('vendas_offline', 'readwrite');
    const req = tx.objectStore('vendas_offline').put({
      tempId,
      dadosVenda,
      dadosFinanceiros,
      terminalId,
      status: 'pendente',
      criadoEm: new Date().toISOString(),
    });
    req.onsuccess = () => resolve(tempId);
    req.onerror   = () => reject(req.error);
  });
};

/** Lista todas as vendas offline pendentes */
export const listarVendasOffline = async () => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('vendas_offline', 'readonly');
    const req = tx.objectStore('vendas_offline').getAll();
    req.onsuccess = () => resolve((req.result || []).filter(v => v.status !== 'sincronizado'));
    req.onerror   = () => reject(req.error);
  });
};

export const contarVendasOffline = async () => {
  const lista = await listarVendasOffline();
  return lista.length;
};

/** Remove venda offline após sincronização bem-sucedida */
export const removerVendaOffline = async (tempId) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction('vendas_offline', 'readwrite');
    const req = tx.objectStore('vendas_offline').delete(tempId);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
};

/**
 * Sincroniza todas as vendas offline com o servidor.
 * Após cada POST /vendas/, cria os registros financeiros (POST /contas/).
 * Retorna { enviadas, erros }.
 */
export const sincronizarVendasOffline = async (axiosInstance) => {
  const pendentes = await listarVendasOffline();
  let enviadas = 0;
  let erros    = 0;

  for (const venda of pendentes) {
    try {
      const res    = await axiosInstance.post('/vendas/', venda.dadosVenda);
      const idVenda = res.data.id_venda || res.data.id;

      // Criar registros financeiros que foram preparados antes de ir offline
      const financeiros = venda.dadosFinanceiros || [];
      for (const fin of financeiros) {
        try {
          await axiosInstance.post('/contas/', { ...fin, id_venda_origem: idVenda });
        } catch (finErr) {
          console.warn('[OFFLINE] Falha ao criar financeiro na sync:', finErr?.response?.data || finErr.message);
        }
      }

      await removerVendaOffline(venda.tempId);
      enviadas++;
    } catch (err) {
      erros++;
      console.warn('[OFFLINE] Falha ao sincronizar venda:', venda.tempId, err?.response?.data || err.message);
    }
  }

  return { enviadas, erros };
};
