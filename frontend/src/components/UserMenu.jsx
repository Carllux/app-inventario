// frontend/src/components/UserMenu.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Importar para pegar a filial selecionada
import { FiLogOut, FiUser, FiBriefcase, FiMapPin } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle'; // Importar o seletor de tema
import styles from './UserMenu.module.css';

function UserMenu({ user, onLogout }) {
  const { selectedBranch } = useAuth(); // Pega a filial ativa do contexto

  const getInitials = (firstName = '', lastName = '', username = '') => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return username.substring(0, 2).toUpperCase();
  };

  const displayName = (user.first_name && user.last_name) 
    ? `${user.first_name} ${user.last_name}` 
    : user.username;

  const profile = user?.profile;
  const hasPermissionsInfo = profile?.branches?.length > 0 || profile?.sectors?.length > 0;

  return (
    <div className={styles.userMenu}>
      <button className={styles.userMenuButton}>
        <div className={styles.avatar}>{getInitials(user.first_name, user.last_name, user.username)}</div>
        <span className={styles.username}>Olá, {user.first_name || user.username}</span>
      </button>
      
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <span className={styles.headerName}>{displayName}</span>
          <span className={styles.headerDetail}>{profile?.job_title || 'Usuário'}</span>
        </div>

        {/* ✅ FEATURE: Exibe a filial selecionada atualmente */}
        {selectedBranch && (
          <div className={styles.section}>
             <div className={styles.infoItem}>
                <FiMapPin size={14} className={styles.infoIcon} />
                <span>Operando em: <strong>{selectedBranch.name}</strong></span>
              </div>
          </div>
        )}

        {hasPermissionsInfo && (
          <div className={styles.section}>
            {profile.branches.length > 0 && (
              <div className={styles.infoItem}>
                <FiBriefcase size={14} className={styles.infoIcon} />
                <span>Acesso a: {profile.branches.map(b => b.name).join(', ')}</span>
              </div>
            )}
          </div>
        )}

        <div className={styles.section}>
          <Link to="/profile" className={styles.actionItem}>
            <FiUser />
            <span>Meu Perfil</span>
          </Link>

          <button onClick={onLogout} className={styles.actionItem}>
            <FiLogOut />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserMenu;