// frontend/src/components/ItemCard.jsx

import React from 'react';
import classNames from 'classnames';
import Detail from './Detail';
import styles from './ItemCard.module.css';

function ItemCard({ item, onAddMovement }) {
  const cardClasses = classNames(
    'card',
    styles.card,
    { [styles.lowStockWarning]: item.is_low_stock }
  );

  return (
    <div className={cardClasses}>
      {item.is_low_stock && <div className={styles.lowStockAlert}>ESTOQUE BAIXO</div>}

      {item.photo ? (
        <div className={styles.imageContainer}>
          <img src={item.photo} alt={item.name} className={styles.image} />
        </div>
      ) : (
        <div className={styles.imagePlaceholder}>
          <span>Sem Imagem</span>
        </div>
      )}
      
      <div className={styles.content}>
        {item.category && <p className={styles.category}>{item.category.name}</p>}
        <h2 className={styles.name} title={item.name}>{item.name}</h2>
        <p className={styles.sku}>SKU: {item.sku}</p>
        
        <div className={styles.detailsGrid}>
          {/* ... */}
        </div>
      </div>
      
      <div className={styles.actions}>
        {/* ... */}
      </div>
    </div>
  );
}

export default ItemCard;