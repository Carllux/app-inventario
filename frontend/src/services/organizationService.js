import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Funções para buscar os dados de suporte que os formulários precisam
// SERVIÇOS DE DADOS ORGANIZACIONAIS (Dropdowns, etc.) ---

export const fetchBranches = async () => {
  const response = await axios.get(`${API_URL}/api/branches/`);
  return response.data.results || response.data;
};

export const fetchSectors = async (branchId = null) => {
  const params = branchId ? { branch_id: branchId } : {};
  const response = await axios.get(`${API_URL}/api/sectors/`, { params });
  return response.data.results || response.data;
};

export const fetchLocations = async (branchId = null) => {
  const params = branchId ? { branch_id: branchId } : {};
  const response = await axios.get(`${API_URL}/api/locations/`, { params });
  return response.data.results || response.data;
};

export const fetchMovementTypes = async (itemId = null) => {
  const params = itemId ? { item_id: itemId } : {};
  const response = await axios.get(`${API_URL}/api/movement-types/`, { params });
  return response.data.results || response.data;
};

export const fetchCategories = async () => {
  const response = await axios.get(`${API_URL}/api/categories/`);
  return response.data.results || response.data;
};

export const fetchSuppliers = async () => {
  const response = await axios.get(`${API_URL}/api/suppliers/`);
  return response.data.results || response.data;
};