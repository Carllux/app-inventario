// frontend/src/services/supplierService.js
import api from './api';

// Busca a lista de fornecedores
export const getSuppliers = async (params = {}) => {
  try {
    const response = await api.get('/suppliers/', { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    throw error;
  }
};

// ✅ NOVO: Busca um único fornecedor pelo ID
export const getSupplierById = async (id) => {
  try {
    const response = await api.get(`/suppliers/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar fornecedor ${id}:`, error);
    throw error;
  }
};

// ✅ NOVO: Cria um novo fornecedor
export const createSupplier = async (supplierData) => {
  try {
    const response = await api.post('/suppliers/', supplierData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    throw error;
  }
};

// ✅ NOVO: Atualiza um fornecedor existente
export const updateSupplier = async (id, supplierData) => {
  try {
    const response = await api.put(`/suppliers/${id}/`, supplierData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar fornecedor ${id}:`, error);
    throw error;
  }
};

// ✅ NOVO: Deleta (soft delete) um fornecedor
export const deleteSupplier = async (id) => {
  try {
    await api.delete(`/suppliers/${id}/`);
  } catch (error) {
    console.error(`Erro ao deletar fornecedor ${id}:`, error);
    throw error;
  }
};