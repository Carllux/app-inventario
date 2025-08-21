// frontend/src/components/FormGroup.jsx
import React from 'react';
import styles from './FormGroup.module.css';

const FormGroup = ({ label, children, error }) => {
  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>{label}</label>
      {children}
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
};

export default FormGroup;