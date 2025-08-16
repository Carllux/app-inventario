import React from 'react';
import classNames from 'classnames'; // Importe classNames
import styles from './Spinner.module.css';

// Removemos a prop 'size' e adicionamos 'className' para flexibilidade
function Spinner({ color = 'var(--color-primary)', className }) {
  return (
    <svg
      // Usamos classNames para combinar a classe base com qualquer classe extra
      className={classNames(styles.spinner, className)}
      viewBox="0 0 38 38"
      xmlns="http://www.w3.org/2000/svg"
      stroke={color}
      aria-label="Carregando"
    >
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="2">
          <circle strokeOpacity=".2" cx="18" cy="18" r="18" />
          <path d="M36 18c0-9.94-8.06-18-18-18" />
        </g>
      </g>
    </svg>
  );
}

export default Spinner;