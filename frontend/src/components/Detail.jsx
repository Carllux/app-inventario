// frontend/src/components/Detail.jsx
import React from 'react';
import styles from './Detail.module.css'; // Importa os estilos locais

function Detail({ label, value, className = '' }) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    // Usa a classe do módulo e permite classes extras
    <div className={`${styles.detail} ${className}`}>
      <strong>{label}:</strong>
      <span>{value}</span>
    </div>
  );
}
export default Detail;