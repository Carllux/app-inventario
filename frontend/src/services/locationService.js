// frontend/src/services/locationService.js
import api from './api';

/**
 * Busca a lista de locações.
 * @param {object} params - Parâmetros de query (ex: page, search).
 * @returns {Promise<object>} A resposta da API.
 */
export const getLocations = async (params = {}) => {
  try {
    const response = await api.get('/locations/', { params });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar locações:", error);
    throw error;
  }
};

/**
 * Busca uma única locação pelo seu ID.
 * @param {string} id - O UUID da locação.
 * @returns {Promise<object>} Os dados da locação.
 */
export const getLocationById = async (id) => {
  try {
    const response = await api.get(`/locations/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar locação ${id}:`, error);
    throw error;
  }
};

/**
 * Cria uma nova locação.
 * @param {object} locationData - Os dados da nova locação.
 * @returns {Promise<object>} Os dados da locação criada.
 */
export const createLocation = async (locationData) => {
  try {
    const response = await api.post('/locations/', locationData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar locação:", error);
    throw error;
  }
};

/**
 * Atualiza uma locação existente.
 * @param {string} id - O UUID da locação a ser atualizada.
 * @param {object} locationData - Os novos dados da locação.
 * @returns {Promise<object>} Os dados da locação atualizada.
 */
export const updateLocation = async (id, locationData) => {
  try {
    const response = await api.put(`/locations/${id}/`, locationData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar locação ${id}:`, error);
    throw error;
  }
};

/**
 * Deleta (soft delete) uma locação.
 * @param {string} id - O UUID da locação a ser deletada.
 */
export const deleteLocation = async (id) => {
  try {
    await api.delete(`/locations/${id}/`);
  } catch (error) {
    console.error(`Erro ao deletar locação ${id}:`, error);
    throw error;
  }
};