// frontend/src/components/FlagRenderer.jsx
import React from 'react';
import ReactCountryFlag from 'react-country-flag';
import styles from './FlagRenderer.module.css';

// ✅ 1. Adiciona a nova prop 'showName' com o valor padrão 'false'.
function FlagRenderer({ country, showName = false }) {
  if (!country || !country.code) {
    return null;
  }

  return (
    <div className={styles.flagContainer} title={country.name}>
      <ReactCountryFlag
        countryCode={country.code}
        svg
        className={styles.flagIcon}
        aria-label={country.name}
      />
      {/* ✅ 2. O nome do país só é renderizado se 'showName' for verdadeiro. */}
      {showName && <span className={styles.countryName}>{country.name}</span>}
    </div>
  );
}

export default FlagRenderer;