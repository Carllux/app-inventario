// frontend/src/components/PrivateRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// 1. Importamos o nosso hook 'useAuth'
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children }) {
  // 2. Usamos o hook para pegar os estados de autenticação e carregamento
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 3. Se ainda estamos verificando a sessão inicial (ex: recarregando a página),
  // mostramos uma mensagem de carregamento para evitar um piscar da tela de login.
  if (loading) {
    return <div>Verificando sessão...</div>;
  }

  // 4. Se a verificação terminou e o usuário NÃO está autenticado,
  // redirecionamos para a página de login.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 5. Se a verificação terminou e o usuário ESTÁ autenticado, renderiza a página protegida.
  return children;
}

export default PrivateRoute;