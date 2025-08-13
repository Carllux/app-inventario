import React from 'react';
import { Link } from 'react-router-dom';
import { FiLogOut, FiUser } from 'react-icons/fi';
import styles from './Navbar.module.css'; // Importa os estilos locais

function Navbar({ user, onLogout }) {

  // Função para gerar as iniciais do usuário para o avatar
  const getInitials = (name = '') => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.menu}>
        {user ? (
          <div className={styles.userMenu}>
            <button className={styles.userMenuButton}>
              <div className={styles.avatar}>
                {getInitials(user.username)}
              </div>
              <span className={styles.username}>Olá, {user.username}</span>
            </button>
            
            <div className={styles.dropdown}>
              <Link to="/profile" className={styles.dropdownItem}>
                <FiUser />
                <span>Meu Perfil</span>
              </Link>
              <button onClick={onLogout} className={styles.dropdownButton}>
                <FiLogOut />
                <span>Sair</span>
              </button>
            </div>
          </div>
        ) : (
          // Pode ser um placeholder ou um link para login se o usuário não estiver logado
          <Link to="/login" className="button button-primary">Entrar</Link>
        )}
      </div>
    </nav>
  );
}

export default React.memo(Navbar);