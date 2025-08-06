import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Função para fazer o login
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login/`, {
      username,
      password,
    });

    if (response.data.token) {
      // Salva o token no armazenamento local do navegador
      localStorage.setItem('token', response.data.token);
      // Configura o axios para enviar o token em todas as futuras requisições
      axios.defaults.headers.common['Authorization'] = `Token ${response.data.token}`;
    }
    return response.data;
  } catch (error) {
    console.error("Falha no login:", error.response?.data?.error || "Erro desconhecido");
    throw new Error(error.response?.data?.error || 'Não foi possível fazer o login.');
  }
};

// Função para fazer logout
export const logout = () => {
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
};

// Função para verificar se o usuário está autenticado
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Configura o header do axios se a página for recarregada
    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    return true;
  }
  return false;
};