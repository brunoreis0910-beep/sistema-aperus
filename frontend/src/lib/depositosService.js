// Serviço simples para listar/criar/editar/excluir depósitos via API
export async function listDepositos(axiosInstance, q = '') {
  const base = '/api/depositos/';
  const params = {};
  if (q) params.search = q;
  const res = await axiosInstance.get(base, { params });
  return res.data;
}

export async function getDeposito(axiosInstance, id) {
  const base = '/api/depositos/';
  const res = await axiosInstance.get(`${base}${id}/`);
  return res.data;
}

export async function createDeposito(axiosInstance, payload) {
  const base = '/api/depositos/';
  const res = await axiosInstance.post(base, payload);
  return res.data;
}

export async function updateDeposito(axiosInstance, id, payload) {
  const base = '/api/depositos/';
  const res = await axiosInstance.put(`${base}${id}/`, payload);
  return res.data;
}

export async function deleteDeposito(axiosInstance, id) {
  const base = '/api/depositos/';
  const res = await axiosInstance.delete(`${base}${id}/`);
  return res.data;
}
