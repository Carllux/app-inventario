// frontend/src/components/ItemCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { FiEdit2, FiTrash2, FiPlusCircle } from 'react-icons/fi'; 
import Detail from './Detail'; // Nosso componente auxiliar
import styles from './ItemCard.module.css';

function ItemCard({ item, onAddMovement, onEdit, onDelete }) {
  const cardClasses = classNames(
    'card', // Classe global de card
    styles.card, // Classe local para o ItemCard
    { [styles.lowStockWarning]: item.is_low_stock }
  );

  return (
    <div className={cardClasses}>
      {/* Link envolve a área principal do card para navegação */}
      <Link to={`/inventory/${item.id}`} state={{ item: item }}   className={styles.clickableArea}>
        {item.is_low_stock && <div className={styles.lowStockAlert}>ESTOQUE BAIXO</div>}

        {item.photo ? (
          <div className={styles.imageContainer}>
            <img src={item.photo} alt={item.name} className={styles.image} loading="lazy"/>
          </div>
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>Sem Imagem</span>
          </div>
        )}
        
        <div className={styles.content}>
          {/* Usamos o acesso seguro '?' para evitar erros se a categoria for nula */}
          <p className={styles.category}>{item.category?.name || 'Não Categorizado'}</p>
          <h2 className={styles.name} title={item.name}>{item.name}</h2>
          <p className={styles.sku}>SKU: {item.sku}</p>
          {item.short_description && <p className={styles.shortDesc}>{item.short_description}</p>}
          <div className={styles.detailsGrid}>
            <Detail label="Estoque Total" value={`${item.total_quantity} ${item.unit_of_measure || ''}`} />
            <Detail label="Preço de Venda" value={`R$ ${item.sale_price}`} />
            <Detail label="Marca" value={item.brand} />
            <Detail label="Fornecedor" value={item.supplier?.name} />
          </div>
        </div>
      </Link>
      
      {/* A área de ações fica fora do Link para ter seus próprios eventos de clique */}
      <div className={styles.actions}>
        {/* Ação Principal: Botão sólido e com texto claro */}
        <button 
          className="button button-success button-sm"
          onClick={() => onAddMovement(item)}
          title="Adicionar ou remover estoque"
        >
          <FiPlusCircle />
          <span>Movimentar</span>
        </button>

        {/* Ações Secundárias: Botões com contorno */}
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
            title="Deletar item"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemCard;