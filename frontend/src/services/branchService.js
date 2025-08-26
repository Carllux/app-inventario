// frontend/src/services/branchService.js
import api from './api';

export const getBranches = async (params = {}) => {
  return api.get('/branches/', { params }).then(res => res.data);
};

export const getBranchById = async (id) => {
  return api.get(`/branches/${id}/`).then(res => res.data);
};

export const createBranch = async (data) => {
  return api.post('/branches/', data).then(res => res.data);
};

export const updateBranch = async (id, data) => {
  return api.put(`/branches/${id}/`, data).then(res => res.data);
};

export const deleteBranch = async (id) => {
  return api.delete(`/branches/${id}/`);
};