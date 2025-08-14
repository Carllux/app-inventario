// frontend/src/components/UserMenu.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiLogOut, FiUser, FiBriefcase, FiMapPin } from 'react-icons/fi';
import styles from './UserMenu.module.css';

function UserMenu({ user, onLogout }) {
  const getInitials = (name = '') => {
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Extrai os dados do perfil para facilitar o acesso e a verificação
  const profile = user?.profile;
  const hasPermissionsInfo = profile?.branches?.length > 0 || profile?.sectors?.length > 0;

  return (
    <div className={styles.userMenu}>
      <button className={styles.userMenuButton}>
        <div className={styles.avatar}>{getInitials(user.username)}</div>
        <span className={styles.username}>Olá, {user.username}</span>
      </button>
      
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <span className={styles.headerName}>{user.username}</span>
          <span className={styles.headerDetail}>{profile?.job_title || user.email}</span>
        </div>

        {/* Só renderiza a seção de permissões se houver alguma informação */}
        {hasPermissionsInfo && (
          <div className={styles.section}>
            {profile.branches.length > 0 && (
              <div className={styles.infoItem}>
                <FiMapPin size={14} className={styles.infoIcon} />
                <span>{profile.branches.map(b => b.name).join(', ')}</span>
              </div>
            )}
            {profile.sectors.length > 0 && (
              <div className={styles.infoItem}>
                <FiBriefcase size={14} className={styles.infoIcon} />
                <span>{profile.sectors.map(s => s.name).join(', ')}</span>
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