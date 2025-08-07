import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { logout } from '../services/auth';

function AuthenticatedLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <Navbar onLogout={handleLogout} />
      <main className="main-content">
        {/* O Outlet é um placeholder. O React Router irá renderizar a página
            correspondente (ex: InventoryPage) aqui dentro. */}
        <Outlet />
      </main>
    </div>
  );
}

export default AuthenticatedLayout;