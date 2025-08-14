// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import UserMenu from './UserMenu'; // Componente de menu já separado

function Navbar({ user, onLogout }) {
  return (
    <header className={styles.navbar}>
      <div className={styles.start}>
        {/* Espaço reservado para o Filtro Global de Filial ou Busca */}
      </div>
      
      <div className={styles.end}>
        {/* Futuros ícones de notificação ou ajuda podem entrar aqui */}
        
        {user ? (
          <UserMenu user={user} onLogout={onLogout} />
        ) : (
          <Link to="/login" className="button button-primary">Entrar</Link>
        )}
      </div>
    </header>
  );
}

export default React.memo(Navbar);