import api from './api';

// Serviço simples para ler/gravar atalhos em localStorage e API
const STORAGE_KEY = 'appShortcuts_v1';

// Lê do LocalStorage (Sincrono)
export function getShortcutsLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro lendo atalhos locais:', err);
    return {};
  }
}

// Salva no LocalStorage (Sincrono)
export function saveShortcutsLocal(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj || {}));
    return true;
  } catch (err) {
    console.error('Erro salvando atalhos locais:', err);
    return false;
  }
}

// Busca da API e atualiza LocalStorage (Async)
export async function fetchShortcutsApi() {
  try {
    const response = await api.get('/api/user-atalhos/map/');
    if (response.data) {
      saveShortcutsLocal(response.data);
      return response.data;
    }
  } catch (error) {
    console.warn('Erro ao buscar atalhos da API:', error);
  }
  return getShortcutsLocal();
}

// Salva na API e LocalStorage (Async)
export async function saveShortcutsApi(shortcuts) {
  // Salva local primeiro para garantir responsividade
  saveShortcutsLocal(shortcuts);
  
  try {
    await api.post('/api/user-atalhos/sync/', shortcuts);
    return true;
  } catch (error) {
    console.error('Erro ao salvar atalhos na API:', error);
    return false;
  }
}

// Mantem compatibilidade com codigo antigo se necessario
export const getShortcuts = getShortcutsLocal;
export const saveShortcuts = saveShortcutsLocal; // Use saveShortcutsApi preferencialmente

export function clearShortcuts() {
  localStorage.removeItem(STORAGE_KEY);
}
