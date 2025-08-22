// frontend/src/components/ItemCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { FiEdit2, FiTrash2, FiPlusCircle } from 'react-icons/fi';
import Detail from './Detail';
import styles from './ItemCard.module.css';
import FlagRenderer from './FlagRenderer';

// Componente de Badge para o Status
const StatusBadge = ({ status }) => {
  const statusStyles = {
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-warning',
    DISCONTINUED: 'badge-danger',
  };
  const statusText = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    DISCONTINUED: 'Fora de Linha',
  };
  return (
    <span className={`badge ${statusStyles[status] || 'badge-secondary'}`}>
      {statusText[status] || status}
    </span>
  );
};


function ItemCard({ item, onAddMovement, onEdit, onDelete }) {
  const cardClasses = classNames(
    'card',
    styles.card,
    { [styles.lowStockWarning]: item.is_low_stock }
  );

  return (
    <div className={cardClasses}>
      <Link to={`/inventory/${item.id}`} state={{ item: item }} className={styles.clickableArea}>
        {item.is_low_stock && <div className={styles.lowStockAlert}>ESTOQUE BAIXO</div>}

        {/* O container da imagem agora engloba a imagem e o overlay da bandeira */}
        <div className={styles.imageContainer}>
          {item.photo ? (
            <img src={item.photo} alt={item.name} className={styles.image} loading="lazy" />
          ) : (
            <div className={styles.imagePlaceholder}>
              <span>Sem Imagem</span>
            </div>
          )}

          {/* ✅ 1. Adiciona o FlagRenderer aqui, dentro do container da imagem */}
          {/* Ele só será renderizado se o item tiver um país de origem. */}
          <div className={styles.flagOverlay}>
            <FlagRenderer country={item.origin} />
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
             <p className={styles.category}>{item.category?.name || 'Não Categorizado'}</p>
             {/* ✅ Exibe o status do item com um badge */}
             <StatusBadge status={item.status} />
          </div>
          <h2 className={styles.name} title={item.name}>{item.name}</h2>
          <p className={styles.sku}>SKU: {item.sku}</p>
          
          {/* ✅ Exibe a descrição curta se existir */}
          {item.short_description && <p className={styles.shortDesc}>{item.short_description}</p>}

          <div className={styles.detailsGrid}>
            <Detail label="Estoque Total" value={`${item.total_quantity || 0} ${item.unit_of_measure || ''}`} />
            <Detail label="Preço de Venda" value={`R$ ${parseFloat(item.sale_price || 0).toFixed(2)}`} />
            <Detail label="Marca" value={item.brand} />
            {/* ✅ Exibe a filial do item */}
            <Detail label="Filial" value={item.branch?.name} />
            <Detail label="Fornecedor" value={item.supplier?.name} />
          </div>
        </div>
      </Link>
      
      <div className={styles.actions}>
        <button
          className="button button-success button-sm"
          onClick={() => onAddMovement(item)}
          title="Adicionar ou remover estoque"
        >
          <FiPlusCircle />
          <span>Movimentar</span>
        </button>

        <div className={styles.secondaryActions}>
          <button
            className="button button-outline button-sm"
            onClick={() => onEdit(item)}
            title="Edição rápida"
          >
            <FiEdit2 />
            <span>Editar</span>
          </button>
          <button
            className="button button-outline button-danger button-sm"
            onClick={() => onDelete(item)}
            title="Inativar item"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemCard;