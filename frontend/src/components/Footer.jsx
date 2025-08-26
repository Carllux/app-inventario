// src/components/Footer/Footer.jsx

import React from 'react';
import styles from './Footer.module.css';

/**
 * Componente de rodapé padrão para a aplicação.
 * Exibe o ano atual dinamicamente.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.appFooter}>
      <div className="container">
        <div className={styles.footerContent}>
          <span>
            © {currentYear} Sistema de Inventário. Todos os direitos reservados.
          </span>
          <span>
            Versão 1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;