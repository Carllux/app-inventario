// frontend/src/components/PageHeader.jsx

import React from 'react';
import styles from './PageHeader.module.css';

function PageHeader({ title, buttonLabel, onButtonClick, isLoading = false }) {
  return (
    <header className={styles.pageHeader}>
      <h1>{title}</h1>
      <div className={styles.headerActions}>
        <button
          className="button button-primary"
          onClick={onButtonClick}
          disabled={isLoading}
        >
          {buttonLabel}
        </button>
      </div>
    </header>
  );
}

export default PageHeader;