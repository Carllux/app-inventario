// frontend/src/components/AuthenticatedLayout.jsx

import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
// 1. Importamos o nosso hook 'useAuth'
import { useAuth } from '../context/AuthContext';

function AuthenticatedLayout() {
  const navigate = useNavigate();
  // 2. Usamos o hook para pegar o 'user' e a função 'logout' do contexto
  const { user, logout } = useAuth();

  const handleLogout = () => {
    // 3. A função de logout do contexto já limpa tudo (localStorage, estado, etc.)
    logout();
    // A navegação continua sendo responsabilidade do componente
    navigate('/login');
  };

  return (
    <div>
      {/* 4. Passamos o objeto 'user' para o Navbar */}
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthenticatedLayout;