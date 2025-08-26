// frontend/src/services/movementTypeService.js
import api from './api';

/**
 * Busca a lista de Tipos de Movimento.
 * @param {object} params - Parâmetros de query (ex: page, search).
 * @returns {Promise<object>} A resposta da API.
 */
export const getMovementTypes = async (params = {}) => {
  return api.get('/movement-types/', { params }).then(res => res.data);
};

/**
 * Busca um único Tipo de Movimento pelo seu ID.
 * @param {string} id - O UUID do Tipo de Movimento.
 * @returns {Promise<object>} Os dados do Tipo de Movimento.
 */
export const getMovementTypeById = async (id) => {
  return api.get(`/movement-types/${id}/`).then(res => res.data);
};

/**
 * Cria um novo Tipo de Movimento.
 * @param {object} data - Os dados do novo Tipo de Movimento.
 * @returns {Promise<object>} Os dados do Tipo de Movimento criado.
 */
export const createMovementType = async (data) => {
  return api.post('/movement-types/', data).then(res => res.data);
};

/**
 * Atualiza um Tipo de Movimento existente.
 * @param {string} id - O UUID do Tipo de Movimento a ser atualizado.
 * @param {object} data - Os novos dados do Tipo de Movimento.
 * @returns {Promise<object>} Os dados do Tipo de Movimento atualizado.
 */
export const updateMovementType = async (id, data) => {
  // Usamos PUT para uma atualização completa, mas PATCH também seria uma opção
  return api.put(`/movement-types/${id}/`, data).then(res => res.data);
};

/**
 * Deleta (soft delete) um Tipo de Movimento.
 * @param {string} id - O UUID do Tipo de Movimento a ser deletado.
 */
export const deleteMovementType = async (id) => {
  return api.delete(`/movement-types/${id}/`);
};