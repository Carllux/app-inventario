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

// Futuramente, podemos adicionar aqui as funções updateItem, deleteItem, etc.