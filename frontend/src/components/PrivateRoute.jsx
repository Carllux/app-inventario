import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';

function PrivateRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Se não estiver autenticado, redireciona para a página de login
    // Passamos a localização atual para que possamos redirecionar de volta após o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderiza o componente filho (a página protegida)
  return children;
}

export default PrivateRoute;