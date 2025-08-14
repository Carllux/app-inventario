// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';

function Navbar({ user, onLogout }) {
  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.start}>
          {/* Espaço para o Filtro Global de Filial ou Busca */}
        </div>
        
        <div className={styles.end}>
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <Link to="/login" className="button button-primary">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default React.memo(Navbar);