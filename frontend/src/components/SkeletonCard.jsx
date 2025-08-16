import React from 'react';
import styles from './SkeletonCard.module.css';

function SkeletonCard() {
  return (
    <div className={`card ${styles.skeletonCard}`}>
      <div className={`${styles.placeholder} ${styles.image}`}></div>
      <div className={styles.content}>
        <div className={`${styles.placeholder} ${styles.line} ${styles.short}`}></div>
        <div className={`${styles.placeholder} ${styles.line} ${styles.long}`}></div>
        <div className={`${styles.placeholder} ${styles.line}`}></div>
      </div>
    </div>
  );
}

export default SkeletonCard;