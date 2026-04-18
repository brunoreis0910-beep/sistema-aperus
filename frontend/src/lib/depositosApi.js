// Helper para descobrir o endpoint correto de 'depósitos' e executar operações
// Aceita um overrideEndpoint opcional (ex.: fornecido pelo usuário via Settings).
// Endpoints devem ser relativos à baseURL do axiosInstance (que costuma incluir '/api').
// Removemos entradas duplicadas com '/api/...' para evitar construir URLs como '/api/api/depositos/'.
const CANDIDATE_ENDPOINTS = [
  '/api/depositos/',
  '/depositos-bancarios/',
  '/deposito/',
  '/depositos_bancarios/',
  '/contas-deposito/',
  '/api/contas-bancarias/',
  '/api/contas/',
  '/contas_deposito/',
  '/depositosbancarios/',
  '/depositos-bancario/',
  '/api/depositos-bancarios/', // manter candidato alternativo caso backend exponha sob /api/ diretamente
];

async function tryEndpoints(axiosInstance, method, endpoints, options = {}) {
  const attempts = [];
  for (const ep of endpoints) {
    try {
      let res;
      if (method === 'get') res = await axiosInstance.get(ep, options);
      else if (method === 'post') res = await axiosInstance.post(ep, options?.data, options?.config);
      else if (method === 'put') res = await axiosInstance.put(ep, options?.data, options?.config);
      else if (method === 'delete') res = await axiosInstance.delete(ep, options?.config);
      attempts.push({ endpoint: ep, status: res.status });
      if (res && res.status >= 200 && res.status < 300) return { res, endpoint: ep, attempts };
    } catch (err) {
      const status = err?.response?.status || null;
      const message = err?.response?.data ? JSON.stringify(err.response.data) : (err.message || String(err));
      attempts.push({ endpoint: ep, status, message });
      // continue on 404, but rethrow on other non-network errors to surface auth/validation issues
      if (status && status !== 404) throw Object.assign(err, { attempts });
    }
  }
  throw Object.assign(new Error('Nenhum endpoint disponível'), { attempts });
}

export async function tryGetDepositos(axiosInstance, overrideEndpoint = null) {
  // Se não for passado override, checa se o usuário salvou um override em localStorage
  let saved = null;
  try { saved = (typeof window !== 'undefined') ? localStorage.getItem('depositosEndpointOverride') : null; } catch (e) { saved = null; }
  const effectiveOverride = overrideEndpoint || saved || null;
  const endpoints = effectiveOverride ? [effectiveOverride, ...CANDIDATE_ENDPOINTS] : CANDIDATE_ENDPOINTS;
  try {
    const { res, endpoint, attempts } = await tryEndpoints(axiosInstance, 'get', endpoints);
    return { data: res.data, endpoint, attempts };
  } catch (err) {
    const attempts = err.attempts || [];
    const msg = `Nenhum endpoint de depósitos disponível (${attempts.map(a => `${a.endpoint}:${a.status || 'err'}`).join(', ')})`;
    const e = new Error(msg);
    e.attempts = attempts;
    throw e;
  }
}

export async function tryPostDeposito(axiosInstance, payload, overrideEndpoint = null) {
  let saved = null;
  try { saved = (typeof window !== 'undefined') ? localStorage.getItem('depositosEndpointOverride') : null; } catch (e) { saved = null; }
  const effectiveOverride = overrideEndpoint || saved || null;
  const endpoints = effectiveOverride ? [effectiveOverride, ...CANDIDATE_ENDPOINTS] : CANDIDATE_ENDPOINTS;
  try {
    const { res, endpoint, attempts } = await tryEndpoints(axiosInstance, 'post', endpoints, { data: payload });
    return { data: res.data, endpoint, attempts };
  } catch (err) {
    const attempts = err.attempts || [];
    const msg = `Nenhum endpoint de depósitos aceitou o POST (${attempts.map(a => `${a.endpoint}:${a.status || 'err'}`).join(', ')})`;
    const e = new Error(msg);
    e.attempts = attempts;
    e.status = 404;
    throw e;
  }
}

export async function tryPutDeposito(axiosInstance, id, payload, overrideEndpoint = null) {
  let saved = null;
  try { saved = (typeof window !== 'undefined') ? localStorage.getItem('depositosEndpointOverride') : null; } catch (e) { saved = null; }
  const effectiveOverride = overrideEndpoint || saved || null;
  const endpoints = effectiveOverride ? [effectiveOverride, ...CANDIDATE_ENDPOINTS] : CANDIDATE_ENDPOINTS;
  const endpointsWithId = endpoints.map(ep => (ep.endsWith('/') ? `${ep}${id}/` : `${ep}/${id}/`));
  try {
    const { res, endpoint, attempts } = await tryEndpoints(axiosInstance, 'put', endpointsWithId, { data: payload });
    return { data: res.data, endpoint, attempts };
  } catch (err) {
    const attempts = err.attempts || [];
    const msg = `Nenhum endpoint de depósitos aceitou o PUT (${attempts.map(a => `${a.endpoint}:${a.status || 'err'}`).join(', ')})`;
    const e = new Error(msg);
    e.attempts = attempts;
    e.status = 404;
    throw e;
  }
}

export async function tryDeleteDeposito(axiosInstance, id, overrideEndpoint = null) {
  let saved = null;
  try { saved = (typeof window !== 'undefined') ? localStorage.getItem('depositosEndpointOverride') : null; } catch (e) { saved = null; }
  const effectiveOverride = overrideEndpoint || saved || null;
  const endpoints = effectiveOverride ? [effectiveOverride, ...CANDIDATE_ENDPOINTS] : CANDIDATE_ENDPOINTS;
  const endpointsWithId = endpoints.map(ep => (ep.endsWith('/') ? `${ep}${id}/` : `${ep}/${id}/`));
  try {
    const { res, endpoint, attempts } = await tryEndpoints(axiosInstance, 'delete', endpointsWithId);
    return { endpoint, attempts };
  } catch (err) {
    const attempts = err.attempts || [];
    const msg = `Nenhum endpoint de depósitos aceitou o DELETE (${attempts.map(a => `${a.endpoint}:${a.status || 'err'}`).join(', ')})`;
    const e = new Error(msg);
    e.attempts = attempts;
    e.status = 404;
    throw e;
  }
}
