/**
 * Utilitários para normalizar dados da API
 */

/**
 * Normaliza a resposta da API para um formato consistente
 * @param {Object} response - Resposta da API
 * @returns {Array} - Array de dados
 */
export const normalizeAPIResponse = (response) => {
  if (!response || !response.data) {
    console.warn('⚠️ Resposta da API vazia ou inválida:', response);
    return [];
  }

  // Se já é um array, retorna diretamente
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Se tem results (paginação do DRF), retorna results
  if (response.data.results && Array.isArray(response.data.results)) {
    return response.data.results;
  }

  // Se é um objeto único, coloca em array
  if (typeof response.data === 'object') {
    return [response.data];
  }

  console.warn('⚠️ Formato de resposta não reconhecido:', response.data);
  return [];
};

/**
 * Extrai metadados de paginação da resposta
 * @param {Object} response - Resposta da API
 * @returns {Object} - Metadados de paginação
 */
export const extractPaginationMeta = (response) => {
  if (!response || !response.data) {
    return { count: 0, next: null, previous: null };
  }

  if (Array.isArray(response.data)) {
    return { count: response.data.length, next: null, previous: null };
  }

  return {
    count: response.data.count || 0,
    next: response.data.next || null,
    previous: response.data.previous || null
  };
};

/**
 * Valida se um campo existe e tem valor válido
 * @param {Object} item - Item a verificar
 * @param {string} field - Campo a verificar
 * @returns {boolean} - Se o campo é válido
 */
export const hasValidField = (item, field) => {
  const value = item?.[field];
  return value !== null && value !== undefined && value !== '';
};

/**
 * Extrai valor numérico de forma segura
 * @param {any} value - Valor a converter
 * @param {number} defaultValue - Valor padréo
 * @returns {number} - Valor numérico
 */
export const safeNumeric = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return !isNaN(num) ? num : defaultValue;
};

/**
 * Formata data para comparação
 * @param {string|Date} date - Data a formatar
 * @returns {string} - Data no formato YYYY-MM-DD
 */
export const formatDateForAPI = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Mapeia nomes de campos comuns da API
 */
export const FIELD_MAPPINGS = {
  // Campos de valor/preço
  valor: ['valor_total', 'total', 'valor', 'preco', 'preco_venda', 'price'],

  // Campos de estoque
  estoque: ['estoque', 'quantidade_estoque', 'quantidade', 'stock', 'qty'],

  // Campos de data
  data_criacao: ['created_at', 'data_cadastro', 'data_criacao', 'created', 'date_created'],
  data_venda: ['data_venda', 'date_sale', 'sale_date', 'created_at'],

  // Campos de cliente
  cliente: ['cliente_nome', 'cliente', 'customer_name', 'customer'],

  // Campos de ID
  id: ['id', 'pk', 'primary_key']
};

/**
 * Busca o valor de um campo usando mapeamentos alternativos
 * @param {Object} item - Item a verificar
 * @param {string} fieldType - Tipo de campo a buscar
 * @returns {any} - Valor encontrado ou null
 */
export const getFieldValue = (item, fieldType) => {
  if (!item || !FIELD_MAPPINGS[fieldType]) {
    return null;
  }

  for (const fieldName of FIELD_MAPPINGS[fieldType]) {
    if (hasValidField(item, fieldName)) {
      return item[fieldName];
    }
  }

  return null;
};