/**
 * osOfflineDB.js
 * IndexedDB para armazenar fotos e OSs pendentes offline.
 * - "os_fotos": store para fotos (base64) keyed por { id_os, id_temp }
 * - "os_pendentes": store para ordens criadas/editadas sem internet
 */

const DB_NAME = 'SistemaGerencialOS';
const DB_VERSION = 1;

let _db = null;

const abrirDB = () =>
  new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('os_fotos')) {
        const store = db.createObjectStore('os_fotos', { keyPath: 'fotoId', autoIncrement: true });
        store.createIndex('por_os', 'chaveOS', { unique: false });
      }
      if (!db.objectStoreNames.contains('os_pendentes')) {
        db.createObjectStore('os_pendentes', { keyPath: 'chaveOS' });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });

// ─── FOTOS ────────────────────────────────────────────────────────────────────

/**
 * Salva uma foto. chaveOS pode ser o id_os real (ex: "42") ou uma chave
 * temporária (ex: "temp_1711893600000") para OS ainda não salvas.
 */
export const salvarFotoOS = async (chaveOS, base64, nomeArquivo = '') => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('os_fotos', 'readwrite');
    const store = tx.objectStore('os_fotos');
    const req = store.add({
      chaveOS: String(chaveOS),
      base64,
      nomeArquivo,
      dataCriacao: new Date().toISOString(),
    });
    req.onsuccess = () => resolve(req.result); // retorna o fotoId gerado
    req.onerror = () => reject(req.error);
  });
};

/** Lista todas as fotos de uma OS */
export const listarFotosOS = async (chaveOS) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('os_fotos', 'readonly');
    const index = tx.objectStore('os_fotos').index('por_os');
    const req = index.getAll(String(chaveOS));
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

/** Remove uma foto pelo fotoId */
export const removerFotoOS = async (fotoId) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('os_fotos', 'readwrite');
    const req = tx.objectStore('os_fotos').delete(fotoId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/** Quando a OS for salva com id real, migra fotos da chave temporária */
export const migrarFotosOS = async (chaveTemp, idOsReal) => {
  const db = await abrirDB();
  const fotos = await listarFotosOS(chaveTemp);
  for (const foto of fotos) {
    await salvarFotoOS(idOsReal, foto.base64, foto.nomeArquivo);
    await removerFotoOS(foto.fotoId);
  }
};

// ─── OS PENDENTES (offline) ───────────────────────────────────────────────────

/** Salva uma OS inteira para envio posterior */
export const salvarOSPendente = async (chaveOS, dadosOrdem) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('os_pendentes', 'readwrite');
    const req = tx.objectStore('os_pendentes').put({
      chaveOS: String(chaveOS),
      dadosOrdem,
      tentativaEm: new Date().toISOString(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/** Lista todas as OS pendentes */
export const listarOSPendentes = async () => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('os_pendentes', 'readonly');
    const req = tx.objectStore('os_pendentes').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

/** Remove uma OS pendente após sincronização bem-sucedida */
export const removerOSPendente = async (chaveOS) => {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('os_pendentes', 'readwrite');
    const req = tx.objectStore('os_pendentes').delete(String(chaveOS));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/** Conta OS pendentes */
export const contarOSPendentes = async () => {
  const pendentes = await listarOSPendentes();
  return pendentes.length;
};
