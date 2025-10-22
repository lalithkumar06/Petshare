import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If the request data is FormData, let the browser/axios set Content-Type (including multipart boundary)
  if (config.data instanceof FormData) {
    // do not set content-type
    return config;
  }
  return config;
});

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const pets = {
  getAll: (path = '/pets') => api.get(path),
  getOne: (id) => api.get(`/pets/${id}`),
  create: (data) => api.post('/pets', data),
  getMine: () => api.get('/pets/mine'),
  update: (id, data) => api.patch(`/pets/${id}`, data),
  delete: (id) => api.delete(`/pets/${id}`),
};

export const adoptions = {
  getAll: () => api.get('/adoptions'),
  create: (petId) => api.post('/adoptions', { petId }),
  updateStatus: (id, status) => api.patch(`/adoptions/${id}`, { status }),
};

export default api;