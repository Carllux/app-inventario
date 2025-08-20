// frontend/src/services/supplierService.js

import api from './api'; //

// Busca a lista de fornecedores (com suporte para filtros e paginação no futuro)
export const getSuppliers = async (params = {}) => {
  try {
    const response = await api.get('/suppliers/', { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    throw error;
  }
};

// Cria um novo fornecedor
export const createSupplier = async (supplierData) => {
  try {
    const response = await api.post('/suppliers/', supplierData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    throw error;
  }
};

// Adicione aqui as funções de updateSupplier e deleteSupplier quando necessário...