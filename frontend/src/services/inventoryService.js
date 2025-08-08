import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Envia os dados de uma nova movimentação para a API.
 * @param {object} movementData - Os dados do formulário.
 * @returns {Promise<object>} Os dados da movimentação criada.
 */
export const createMovement = async (movementData) => {
  try {
    const response = await axios.post(`${API_URL}/api/movements/`, movementData);
    return response.data;
  } catch (error) {
    // Lança o erro para ser tratado no componente que chamou a função
    console.error("Erro ao criar movimentação:", error.response?.data);
    throw new Error(error.response?.data?.detail || 'Não foi possível registrar a movimentação.');
  }
};