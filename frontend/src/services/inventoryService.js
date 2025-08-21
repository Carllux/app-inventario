import api from './api'; 

/**
 * Envia os dados de uma nova movimentação para a API.
 * @param {object} movementData - Os dados do formulário.
 * @returns {Promise<object>} Os dados da movimentação criada.
 */
export const createMovement = async (movementData) => {
  try {
    const response = await api.post(`/movements/`, movementData);
    return response.data;
  } catch (error) {
    // Lança o erro para ser tratado no componente que chamou a função
    console.error("Erro ao criar movimentação:", error.response?.data);
    throw new Error(error.response?.data?.detail || 'Não foi possível registrar a movimentação.');
  }
};

/**
 * Busca a lista de Tipos de Movimentação (TPOs).
 * Se um itemId for fornecido, a API filtrará os TPOs com base no estoque do item.
 * @param {number|null} itemId - O ID opcional do item para filtrar os TPOs.
 * @returns {Promise<Array>} A lista de TPOs.
 */
export const fetchMovementTypes = async (itemId = null) => {
  try {
    let url = `/movement-types/`;

    // Adiciona o parâmetro de filtro na URL se um itemId for passado
    if (itemId) {
      url += `?item_id=${itemId}`;
    }

    const response = await api.get(url);
    return response.data.results || response.data; // Suporta paginação se houver
  } catch (error) {
    console.error("Erro ao buscar tipos de movimentação:", error.response?.data);
    throw new Error(error.response?.data?.detail || 'Não foi possível carregar os tipos de movimentação.');
  }
};