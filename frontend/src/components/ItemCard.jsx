// frontend/src/components/ItemCard.jsx

import React from 'react';
import classNames from 'classnames';
import Detail from './Detail';
import styles from './ItemCard.module.css';

function ItemCard({ item, onAddMovement, onEdit }) {
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
        
        {item.short_description && <p className={styles.shortDesc}>{item.short_description}</p>}

        <p className={styles.sku}>SKU: {item.sku}</p>
        
        {/* ✅ BLOCO DE DETALHES PREENCHIDO */}
        <div className={styles.detailsGrid}>
          <Detail label="Estoque Total" value={`${item.total_quantity} ${item.unit_of_measure || ''}`} />
          <Detail label="Preço de Venda" value={`R$ ${item.sale_price}`} />
          <Detail label="Marca" value={item.brand} />
          <Detail label="Fornecedor" value={item.supplier?.name} />
        </div>
      </div>
      
      {/* ✅ BLOCO DE AÇÕES PREENCHIDO */}
      <div className={styles.actions}>
        <button 
          className="button button-outline button-success button-sm"
          onClick={() => onAddMovement(item)}
        >
          Movimentar
        </button>
        {/* ✅ O botão agora chama a função onEdit, passando o item */}
        <button 
          className="button button-outline button-primary button-sm"
          onClick={() => onEdit(item)}
        >
          Detalhes / Editar
        </button>
      </div>
    </div>
  );
}

export default ItemCard;