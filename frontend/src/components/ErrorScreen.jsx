import React from 'react';
import PropTypes from 'prop-types';
import styles from './ErrorScreen.module.css';

const ErrorScreen = ({ error, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <svg className={styles.errorIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8z"/>
        </svg>
        <h2 className={styles.errorTitle}>Ocorreu um erro</h2>
        <p className={styles.errorMessage}>{error}</p>
        {onRetry && (
          <button 
            className="button button-primary"
            onClick={onRetry}
            aria-label="Tentar novamente"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    </div>
  );
};

ErrorScreen.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func
};

export default ErrorScreen;