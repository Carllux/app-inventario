// frontend/src/services/api.js

import axios from 'axios';

// 1. Pega a URL da API a partir das variáveis de ambiente do Vite
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// 2. Cria a instância do Axios com a configuração base
const api = axios.create({
  baseURL: `${API_URL}/api`, // Define a URL base para todas as requisições
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 3. (A MÁGICA ACONTECE AQUI) Configura o interceptor de requisições
api.interceptors.request.use(
  (config) => {
    // Pega o token do localStorage (ou de onde quer que seu AuthContext o salve)
    const token = localStorage.getItem('token');

    // Se o token existir, adiciona ao cabeçalho de autorização
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }

    return config; // Retorna a configuração modificada para a requisição prosseguir
  },
  (error) => {
    // Se houver um erro na configuração da requisição, ele é rejeitado
    return Promise.reject(error);
  }
);

export default api;