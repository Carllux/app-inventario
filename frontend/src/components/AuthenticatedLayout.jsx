// frontend/src/components/AuthenticatedLayout.jsx
import React, { useCallback } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer'; // O Footer já estava importado
import { useAuth } from '../hooks/useAuth';
import FullScreenLoader from './FullScreenLoader';
import styles from './AuthenticatedLayout.module.css';

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      
      {/* Este wrapper precisa ser um flex container para o footer funcionar corretamente.
        CSS necessário em AuthenticatedLayout.module.css:
        .contentWrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          flex-grow: 1;
        }
      */}
      <div className={styles.contentWrapper}>
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className={styles.mainContent} aria-live="polite">
          <Outlet />
        </main>

        {/* --- Footer Adicionado Aqui --- */}
        <Footer />
      </div>
    </div>
  );
}

export default React.memo(AuthenticatedLayout);