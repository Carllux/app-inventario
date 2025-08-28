// src/components/ProfileCard/ProfileCard.jsx

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import styles from './ProfileCard.module.css';
import { FaUser, FaBoxOpen, FaSyncAlt, FaCalendarCheck, FaBuilding, FaBriefcase, FaUserTie } from 'react-icons/fa';

const ProfileCard = ({ user, avatarPreview, onAvatarChange }) => {
  const [stats, setStats] = useState(null);

  const displayName = user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username;
  const memberSinceDate = stats?.member_since ? new Date(stats.member_since) : null;
  const formattedMemberSince = memberSinceDate && !isNaN(memberSinceDate) 
                               ? memberSinceDate.toLocaleDateString(navigator.language, { year: 'numeric', month: 'long', day: 'numeric' }) 
                               : 'N/A';
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/me/stats/');
        setStats(response.data);
      } catch (error) {
        console.error("Falha ao buscar estatísticas", error);
      }
    };
    fetchStats();
  }, []);
  
  
  return (
    <div className={styles.profileCard}>
      <div className={styles.avatarSection}>
        <img src={avatarPreview || `https://ui-avatars.com/api/?name=${displayName}&background=random`} alt="Avatar" className={styles.avatar} />
        <label htmlFor="avatar-upload" className={styles.uploadButton}>Alterar Foto</label>
        <input id="avatar-upload" type="file" accept="image/*" onChange={onAvatarChange} style={{ display: 'none' }} />
      </div>
      <div className={styles.infoSection}>
        <h2>{displayName}</h2>
        <p className={styles.jobTitle}>{user.profile?.job_title || 'Cargo não informado'}</p>
        <hr />
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <FaBoxOpen /> 
            <span>{stats?.items_created ?? '...'} Itens Cadastrados</span>
          </div>
          <div className={styles.statItem}>
            <FaSyncAlt /> 
            <span>{stats?.most_frequent_movement || 'N/A'}</span>
          </div>
          <div className={styles.statItem}>
            <FaCalendarCheck /> 
            <span>Membro desde {formattedMemberSince}</span>
          </div>
        </div>
        {/* --- NOVA SEÇÃO DE DETALHES ORGANIZACIONAIS --- */}
        <div className={styles.orgDetails}>
          <div className={styles.detailItem}>
            <FaUserTie className={styles.detailIcon} />
            <strong>Gerente Direto:</strong>
            <span>{user.profile?.manager_name || 'Não definido'}</span>
          </div>
          <div className={styles.detailItem}>
            <FaBuilding className={styles.detailIcon} />
            <strong>Filiais de Acesso:</strong>
            <div className={styles.tagContainer}>
              {user.profile?.branches?.length > 0 
                ? user.profile.branches.map(b => <span key={b.id} className={styles.tag}>{b.name}</span>)
                : <span>Nenhuma</span>
              }
            </div>
          </div>
          <div className={styles.detailItem}>
            <FaBriefcase className={styles.detailIcon} />
            <strong>Setores de Atuação:</strong>
            <div className={styles.tagContainer}>
            {user.profile?.sectors?.length > 0 
                ? user.profile.sectors.map(s => <span key={s.id} className={styles.tag}>{s.name}</span>)
                : <span>Nenhum</span>
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileCard;