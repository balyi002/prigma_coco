import { mockRequest } from '../mock/mockApi';

/**
 * Cliente API simulado (Mock Data Engine) para PRIGMA.
 * Intercepta todas las llamadas de la aplicación y las resuelve
 * directamente con datos quemados de alta fidelidad sin requerir
 * servidor backend ni base de datos activa.
 */
const api = {
  get: (url, config) => mockRequest('GET', url),
  post: (url, data, config) => mockRequest('POST', url, data),
  put: (url, data, config) => mockRequest('PUT', url, data),
  patch: (url, data, config) => mockRequest('PATCH', url, data),
  delete: (url, config) => mockRequest('DELETE', url),
  create: () => api,
  defaults: {
    baseURL: '',
    headers: { common: {} },
  },
  interceptors: {
    request: { use: () => {}, eject: () => {} },
    response: { use: () => {}, eject: () => {} },
  },
};

export default api;
