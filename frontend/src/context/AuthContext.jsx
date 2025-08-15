// frontend/src/context/AuthContext.jsx - Versão Melhorada
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Função centralizada para atualizar o estado de autenticação
  const updateAuthState = (token, userData) => {
    if (token && userData) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      setUser(userData);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Verificação inicial da sessão
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      // Verifica se o token ainda é válido
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
      axios.get(`${API_URL}/api/me/`)
        .then(() => {
          updateAuthState(token, JSON.parse(userData));
        })
        .catch(() => {
          updateAuthState(null, null); // Limpa se o token for inválido
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/login/`, {
        username,
        password,
      });
      
      const { token, user: userData } = response.data;
      updateAuthState(token, userData);
      return userData;
    } catch (error) {
      console.error("Falha no login:", error);
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.error || 
        'Não foi possível fazer o login.'
      );
    }
  };

  const logout = async () => {
    try {
      // Chama o endpoint de logout do backend se existir
      await axios.post(`${API_URL}/api/logout/`);
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      updateAuthState(null, null);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    // Adicionando função para atualizar dados do usuário
    updateUser: (newUserData) => {
      localStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}