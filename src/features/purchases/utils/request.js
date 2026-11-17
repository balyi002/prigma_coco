import { mockRequest } from '../../../mock/mockApi';

/**
 * Cliente de solicitudes para el módulo de compras conectado a datos quemados.
 */
export async function request(path, { body, method = 'GET', ...options } = {}) {
  const res = await mockRequest(method, path, body);
  return res.data;
}
