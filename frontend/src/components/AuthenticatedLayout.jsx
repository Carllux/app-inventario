import React, { useCallback } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import FullScreenLoader from './FullScreenLoader'; // Usando nosso loader aprimorado
import styles from './AuthenticatedLayout.module.css'; // 1. Importe os estilos do módulo

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // A lógica de loading agora pode viver aqui, protegendo todo o layout
  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    // 2. Aplique as classes do módulo
    <div className={styles.layout}>
      <Sidebar />
      
      <div className={styles.contentWrapper}>
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className={styles.mainContent} aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default React.memo(AuthenticatedLayout);