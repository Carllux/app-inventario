// frontend/src/services/stockMovementService.js
import api from './api';

/**
 * Busca o histórico de movimentações de estoque.
 * @param {object} params - Parâmetros de filtro (ex: movement_type, item).
 * @returns {Promise<object>} A resposta paginada da API.
 */
export const getStockMovements = async (params = {}) => {
  return api.get('/movements/history/', { params }).then(res => res.data);
};

// A função de criar movimento pode vir para este arquivo também para centralizar
export const createStockMovement = async (data) => {
  return api.post('/movements/', data).then(res => res.data);
};