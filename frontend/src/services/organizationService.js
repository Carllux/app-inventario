import api from './api'; 

// Funções para buscar os dados de suporte que os formulários precisam
// SERVIÇOS DE DADOS ORGANIZACIONAIS (Dropdowns, etc.) ---

export const fetchBranches = async () => {
  const response = await api.get(`/branches/`);
  return response.data.results || response.data;
};

export const fetchSectors = async (branchId = null) => {
  const params = branchId ? { branch_id: branchId } : {};
  const response = await api.get(`/sectors/`, { params });
  return response.data.results || response.data;
};

export const fetchLocations = async (branchId = null) => {
  const params = branchId ? { branch_id: branchId } : {};
  const response = await api.get(`/locations/`, { params });
  return response.data.results || response.data;
};

export const fetchMovementTypes = async (itemId = null) => {
  const params = itemId ? { item_id: itemId } : {};
  const response = await api.get(`/movement-types/`, { params });
  return response.data.results || response.data;
};

export const fetchCategories = async () => {
  const response = await api.get(`/categories/`);
  return response.data.results || response.data;
};

export const fetchSuppliers = async () => {
  const response = await api.get(`/suppliers/`);
  return response.data.results || response.data;
};