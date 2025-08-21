import api from './api'; 

/**
 * Busca a lista paginada de itens da API.
 * @param {object} params - Parâmetros de query (ex: page, search).
 * @returns {Promise<object>} A resposta completa da API, incluindo 'count' e 'results'.
 */
export const getItems = async (params = {}) => {
  try {
    const response = await api.get(`items/`, { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar itens:", error.response?.data);
    throw new Error('Não foi possível carregar os itens.');
  }
};

/**
 * Envia os dados de um novo item para a API para criação.
 * @param {FormData} itemData - Os dados do formulário como FormData.
 * @returns {Promise<object>} Os dados do item recém-criado.
 */
export const createItem = async (itemData) => {
  try {
    const response = await api.post(`items/`, itemData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao criar o item:", error.response?.data);
    const errorMessage = Object.values(error.response?.data || {}).flat().join(' ') || 'Não foi possível criar o item.';
    throw new Error(errorMessage);
  }
};

/**
 * Busca os dados completos de um único item pelo seu UUID.
 * @param {string} itemId - O UUID do item.
 * @returns {Promise<object>} Os dados do item.
 */
export const getItemById = async (itemId) => {
  try {
    const response = await api.get(`items/${itemId}/`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar o item ${itemId}:`, error.response?.data);
    throw new Error('Não foi possível carregar os detalhes do item.');
  }
};

/**
 * Envia os dados atualizados de um item para a API.
 * @param {string} itemId - O UUID do item.
 * @param {FormData} itemData - Os dados do formulário como FormData.
 * @returns {Promise<object>} Os dados do item atualizado.
 */
export const updateItem = async (itemId, itemData) => {
  try {
    const response = await api.patch(`items/${itemId}/`, itemData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar o item ${itemId}:`, error.response?.data);
    const errorMessage = Object.values(error.response?.data || {}).flat().join(' ') || 'Não foi possível atualizar o item.';
    throw new Error(errorMessage);
  }
};

/**
 * Busca a distribuição de estoque de um item específico.
 * @param {string} itemId - O UUID do item.
 * @returns {Promise<Array>} A lista de StockItems.
 */
export const getItemStockDistribution = async (itemId) => {
  try {
    const response = await api.get(`items/${itemId}/stock/`);
    return response.data.results || response.data;
  } catch (error) {
    console.error(`Erro ao buscar distribuição de estoque para ${itemId}:`, error.response?.data);
    throw new Error('Não foi possível carregar a distribuição de estoque.');
  }
};

/**
 * Envia uma requisição para deletar (soft delete) um item.
 * @param {string} itemId - O UUID do item.
 * @returns {Promise<number>} O status da resposta.
 */
export const deleteItem = async (itemId) => {
  try {
    const response = await api.delete(`items/${itemId}/`);
    return response.status;
  } catch (error) {
    console.error(`Erro ao deletar o item ${itemId}:`, error.response?.data);
    throw new Error('Não foi possível deletar o item.');
  }
};