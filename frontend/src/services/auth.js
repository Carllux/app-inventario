import api from './api'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Função para fazer o login
export const login = async (username, password) => {
  try {
    const response = await api.post(`/login/`, {
      username,
      password,
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Armazena o objeto de usuário completo, que agora inclui o perfil
      localStorage.setItem('user', JSON.stringify(response.data.user));
      api.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
    }
    return response.data;
  } catch (error) {
    console.error("Falha no login:", error.response?.data?.error || "Erro desconhecido");
    throw new Error(error.response?.data?.error || 'Não foi possível fazer o login.');
  }
};

// Função para fazer logout
export const logout = async () => {
  try {
    // Chama o endpoint do backend para invalidar o token no servidor
    await api.post(`/logout/`);
  } catch (error) {
    console.error("Erro ao fazer logout no servidor (o token será removido localmente de qualquer forma):", error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const fetchCurrentUser = async () => {
    const response = await api.get(`/me/`);
    // Atualiza os dados do usuário no localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
};

// // Função para verificar se o usuário está autenticado
// export const isAuthenticated = () => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     // Configura o header do api se a página for recarregada
//     api.defaults.headers.common['Authorization'] = `Token ${token}`;
//     return true;
//   }
//   return false;
// };