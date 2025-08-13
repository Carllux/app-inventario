import React from 'react';
import styles from './Detail.module.css'; // Importa os estilos locais

function Detail({ label, value }) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    // Aplica a classe do módulo
    <div className={styles.detail}>
      <strong>{label}:</strong>
      <span>{value}</span>
    </div>
  );
}

export default Detail;