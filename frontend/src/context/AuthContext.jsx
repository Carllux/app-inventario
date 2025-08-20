// frontend/src/context/AuthContext.jsx - Versão Corrigida
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, fetchCurrentUser } from '../services/auth';
import axios from 'axios';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Para a verificação inicial da sessão

  // ✅ Função centralizada para atualizar o estado de autenticação (agora com useCallback)
  const updateAuthState = useCallback((token, userData) => {
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
  }, []); // Dependências vazias pois não depende de nenhum estado externo

  // Verificação inicial da sessão: mais robusta
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Token ${token}`;
        try {
          // Verifica se o token ainda é válido no backend
          const currentUser = await fetchCurrentUser();
          // Atualiza o estado com os dados mais recentes do usuário
          updateAuthState(token, currentUser);
        } catch (error) {
          console.error("Falha ao checar sessão:", error);
          // Se o token for inválido, limpa tudo
          updateAuthState(null, null);
        }
      }
      setLoading(false);
    };
    checkUserSession();
  }, [updateAuthState]); // ✅ Agora updateAuthState é estável

  // ✅ FUNÇÃO LOGIN ATUALIZADA
  const login = useCallback(async (username, password) => {
    try {
      const data = await apiLogin(username, password);
      // A função de serviço já retorna o token e o usuário.
      // Agora, simplesmente passamos esses dados para nossa função centralizada.
      updateAuthState(data.token, data.user);
      return data.user;
    } catch (error) {
      // Limpa qualquer estado antigo em caso de falha no login
      updateAuthState(null, null);
      console.error("Falha no login:", error);
      throw error;
    }
  }, [updateAuthState]);

  // ✅ FUNÇÃO LOGOUT ATUALIZADA
  const logout = useCallback(async () => {
    try {
      await apiLogout(); // Tenta invalidar o token no backend
    } catch (error) {
      console.error("Erro no logout do servidor:", error);
    } finally {
      // Independentemente do sucesso da API, limpa o estado e o localStorage
      updateAuthState(null, null);
    }
  }, [updateAuthState]);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  }), [user, isAuthenticated, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}