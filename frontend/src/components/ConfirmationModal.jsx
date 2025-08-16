import React from 'react';
import styles from './ConfirmationModal.module.css';
import { FiAlertTriangle } from 'react-icons/fi';

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar' }) {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={`card ${styles.content}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <FiAlertTriangle className={styles.icon} size={24} />
          <h2>{title}</h2>
        </div>
        <div className={styles.body}>
          <p>{message}</p>
        </div>
        <div className={styles.actions}>
          <button className="button button-outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="button button-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;