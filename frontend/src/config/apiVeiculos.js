/**
 * Configuração de APIs para Consulta de Veículos por Placa
 * 
 * Escolha uma das APIs abaixo e configure conforme necessário
 */

// ============================================
// OPÇÃO 1: Brasil API (GRATUITA) ⭐ RECOMENDADA
// ============================================
// Documentação: https://brasilapi.com.br/docs#tag/FIPE
// Sem necessidade de token
// Limite: Ilimitado
export const API_BRASIL_API = {
  nome: 'Brasil API',
  ativa: true,
  gratuita: true,
  url: (placa) => `https://brasilapi.com.br/api/fipe/preco/v1/${placa}`,
  headers: {
    'Content-Type': 'application/json'
  },
  formatarResposta: (data) => ({
    marca: data.marca || '',
    modelo: data.modelo || '',
    ano: data.ano_modelo || '',
    cor: ''
  })
};

// ============================================
// OPÇÃO 2: API Placas (PAGA)
// ============================================
// Site: https://api.placas.app.br
// Precisa cadastro e token
// Planos a partir de R$ 29,90/mês
export const API_PLACAS = {
  nome: 'API Placas',
  ativa: false, // Mude para true se for usar
  gratuita: false,
  token: 'SEU_TOKEN_AQUI', // Substitua pelo seu token
  url: (placa) => `https://api.placas.app.br/api/v1/consulta/${placa}`,
  headers: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }),
  formatarResposta: (data) => ({
    marca: data.dados?.marca || '',
    modelo: data.dados?.modelo || '',
    ano: data.dados?.ano || '',
    cor: data.dados?.cor || ''
  })
};

// ============================================
// OPÇÃO 3: Consulta Placa (FREEMIUM)
// ============================================
// Site: https://consultaplaca.com.br
// 100 consultas grátis/mês
export const API_CONSULTA_PLACA = {
  nome: 'Consulta Placa',
  ativa: false, // Mude para true se for usar
  gratuita: false,
  token: 'SEU_TOKEN_AQUI', // Substitua pelo seu token
  url: (placa) => `https://api.consultaplaca.com.br/v1/veiculos/${placa}`,
  headers: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }),
  formatarResposta: (data) => ({
    marca: data.marca || '',
    modelo: data.modelo || '',
    ano: data.ano || '',
    cor: data.cor || ''
  })
};

// ============================================
// OPÇÃO 4: API Própria (Backend Django)
// ============================================
// Se você quiser criar sua própria API no backend
export const API_BACKEND = {
  nome: 'Backend Django',
  ativa: false, // Mude para true se criar endpoint no backend
  gratuita: true,
  url: (placa) => `/api/veiculos/consultar-placa/${placa}/`,
  headers: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }),
  formatarResposta: (data) => ({
    marca: data.marca || '',
    modelo: data.modelo || '',
    ano: data.ano || '',
    cor: data.cor || ''
  })
};

/**
 * Retorna a API configurada para uso
 */
export const getAPIAtiva = () => {
  if (API_PLACAS.ativa) return API_PLACAS;
  if (API_CONSULTA_PLACA.ativa) return API_CONSULTA_PLACA;
  if (API_BACKEND.ativa) return API_BACKEND;
  return API_BRASIL_API; // Padrão
};

/**
 * Lista todas as APIs disponíveis
 */
export const getAPIsDisponiveis = () => [
  API_BRASIL_API,
  API_PLACAS,
  API_CONSULTA_PLACA,
  API_BACKEND
];
