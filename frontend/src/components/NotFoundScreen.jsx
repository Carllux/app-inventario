import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFoundScreen.module.css';

const NotFoundScreen = () => {
  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundContent}>
        <svg className={styles.notFoundIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <h2 className={styles.notFoundTitle}>Item não encontrado</h2>
        <p className={styles.notFoundMessage}>O item que você está procurando não existe ou foi removido.</p>
        <Link to="/inventory" className="button button-primary">
          Voltar para o Inventário
        </Link>
      </div>
    </div>
  );
};

export default NotFoundScreen;