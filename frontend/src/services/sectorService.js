// frontend/src/services/sectorService.js
import api from './api';

// Busca a lista de setores, permitindo filtrar por filial
export const getSectors = async (params = {}) => {
  return api.get('/sectors/', { params }).then(res => res.data);
};

export const getSectorById = async (id) => {
  return api.get(`/sectors/${id}/`).then(res => res.data);
};

export const createSector = async (data) => {
  return api.post('/sectors/', data).then(res => res.data);
};

export const updateSector = async (id, data) => {
  return api.put(`/sectors/${id}/`, data).then(res => res.data);
};

export const deleteSector = async (id) => {
  return api.delete(`/sectors/${id}/`);
};