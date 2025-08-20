import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Função para fazer o login
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/login/`, {
      username,
      password,
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Armazena o objeto de usuário completo, que agora inclui o perfil
      localStorage.setItem('user', JSON.stringify(response.data.user));
      axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
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
    await axios.post(`${API_URL}/api/logout/`);
  } catch (error) {
    console.error("Erro ao fazer logout no servidor (o token será removido localmente de qualquer forma):", error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const fetchCurrentUser = async () => {
    const response = await axios.get(`${API_URL}/api/me/`);
    // Atualiza os dados do usuário no localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
};

// // Função para verificar se o usuário está autenticado
// export const isAuthenticated = () => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     // Configura o header do axios se a página for recarregada
//     axios.defaults.headers.common['Authorization'] = `Token ${token}`;
//     return true;
//   }
//   return false;
// };