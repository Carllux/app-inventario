// frontend/src/components/FullScreenLoader.jsx
import React from 'react';
import Spinner from './Spinner'; // Importa seu componente SVG
import styles from './FullScreenLoader.module.css'; // Importa os estilos do módulo

function FullScreenLoader() {
  return (
    <div className={styles.loaderContainer}>
      <Spinner size={60} color="var(--color-primary)" />
      <p className={styles.loadingText}>Carregando...</p>
    </div>
  );
}

export default FullScreenLoader;