// frontend/src/services/categoryGroupService.js
import api from './api';

export const getCategoryGroups = async (params = {}) => {
  return api.get('/category-groups/', { params }).then(res => res.data);
};

export const getCategoryGroupById = async (id) => {
  return api.get(`/category-groups/${id}/`).then(res => res.data);
};

export const createCategoryGroup = async (data) => {
  return api.post('/category-groups/', data).then(res => res.data);
};

export const updateCategoryGroup = async (id, data) => {
  return api.put(`/category-groups/${id}/`, data).then(res => res.data);
};

export const deleteCategoryGroup = async (id) => {
  return api.delete(`/category-groups/${id}/`);
};