// frontend/src/services/categoryService.js
import api from './api';

export const getCategories = async (params = {}) => {
  return api.get('/categories/', { params }).then(res => res.data);
};

export const getCategoryById = async (id) => {
  return api.get(`/categories/${id}/`).then(res => res.data);
};

export const createCategory = async (data) => {
  // ✅ Converter 'group' para 'group_id' antes de enviar
  const payload = {
    ...data,
    group_id: data.group || null
  };
  delete payload.group; // Remover o campo antigo
  
  return api.post('/categories/', payload).then(res => res.data);
};

export const updateCategory = async (id, data) => {
  const payload = {
    ...data,
    group_id: data.group || null
  };
  delete payload.group;
  
  // ✅ Usar PATCH em vez de PUT para updates parciais
  return api.patch(`/categories/${id}/`, payload).then(res => res.data);
};

export const deleteCategory = async (id) => {
  return api.delete(`/categories/${id}/`);
};