import React from 'react';
import styles from './Spinner.module.css'; // Importa os estilos

// A cor padrão agora vem das nossas variáveis globais do CSS
function Spinner({ color = 'var(--color-primary)', size = 50 }) {
  return (
    <svg
      className={styles.spinner} // Aplica a classe de animação
      width={size}
      height={size}
      viewBox="0 0 38 38"
      xmlns="http://www.w3.org/2000/svg"
      stroke={color} // A cor principal é definida no 'stroke'
      aria-label="Carregando"
    >
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="2">
          {/* Círculo de fundo, semi-transparente */}
          <circle strokeOpacity=".2" cx="18" cy="18" r="18" />
          {/* Arco que de fato gira */}
          <path d="M36 18c0-9.94-8.06-18-18-18" />
        </g>
      </g>
    </svg>
  );
}

export default Spinner;