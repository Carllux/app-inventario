import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Envia os dados de um novo item para a API para criação.
 * @param {object} itemData - Os dados do formulário do item.
 * @returns {Promise<object>} Os dados do item recém-criado.
 */
export const createItem = async (itemData) => {
  try {
    // O token de autorização já está configurado globalmente pelo AuthContext
    const response = await axios.post(`${API_URL}/api/items/`, itemData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar o item:", error.response?.data);
    // Pega a mensagem de erro mais específica da API, se disponível
    const errorMessage = Object.values(error.response?.data || {}).flat().join(' ') || 'Não foi possível criar o item.';
    throw new Error(errorMessage);
  }
};

/**
 * Busca os dados completos de um único item pelo seu ID.
 * @param {number} itemId - O ID do item a ser buscado.
 * @returns {Promise<object>} Os dados do item.
 */
export const getItemById = async (itemId) => {
  try {
    const response = await axios.get(`${API_URL}/api/items/${itemId}/`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar o item ${itemId}:`, error.response?.data);
    throw new Error('Não foi possível carregar os detalhes do item.');
  }
};

/**
 * Envia os dados atualizados de um item para a API.
 * @param {number} itemId - O ID do item a ser atualizado.
 * @param {object} itemData - Os dados do formulário a serem atualizados.
 * @returns {Promise<object>} Os dados do item atualizado.
 */
export const updateItem = async (itemId, itemData) => {
  try {
    // Usamos PATCH para atualizações parciais, é mais eficiente.
    const response = await axios.patch(`${API_URL}/api/items/${itemId}/`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar o item ${itemId}:`, error.response?.data);
    const errorMessage = Object.values(error.response?.data || {}).flat().join(' ') || 'Não foi possível atualizar o item.';
    throw new Error(errorMessage);
  }
};

/**
 * Busca a distribuição de estoque de um item específico.
 * @param {number} itemId - O ID do item.
 * @returns {Promise<Array>} A lista de StockItems (estoque por local).
 */
export const getItemStockDistribution = async (itemId) => {
  try {
    const response = await axios.get(`${API_URL}/api/items/${itemId}/stock/`);
    return response.data.results || response.data;
  } catch (error) {
    console.error(`Erro ao buscar distribuição de estoque para o item ${itemId}:`, error.response?.data);
    throw new Error('Não foi possível carregar a distribuição de estoque.');
  }
};

/**
 * Envia uma requisição para deletar (inativar) um item.
 * @param {number} itemId - O ID do item a ser deletado.
 * @returns {Promise<number>} O status da resposta (geralmente 204).
 */
export const deleteItem = async (itemId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/items/${itemId}/`);
    return response.status;
  } catch (error) {
    console.error(`Erro ao deletar o item ${itemId}:`, error.response?.data);
    throw new Error('Não foi possível deletar o item.');
  }
};