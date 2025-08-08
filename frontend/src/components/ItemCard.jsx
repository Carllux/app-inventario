import React from 'react';

// Componente auxiliar agora trata o '0' como um valor válido
const Detail = ({ label, value, className = '' }) => {
  // A condição foi ajustada para exibir o número 0
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    <div className={`item-detail ${className}`}>
      <strong>{label}:</strong>
      <span>{value}</span>
    </div>
  );
};

// Adicionamos a prop 'onAddMovement' para receber a função que abre o modal
function ItemCard({ item, onAddMovement }) {
  const cardClasses = `card item-card ${item.is_low_stock ? 'low-stock-warning' : ''}`;

  return (
    <div className={cardClasses}>
      {item.is_low_stock && <div className="low-stock-alert">ESTOQUE BAIXO</div>}

      {item.photo ? (
        <div className="item-image-container">
          <img src={item.photo} alt={item.name} className="item-image" />
        </div>
      ) : (
        <div className="item-image-placeholder">
          <span>Sem Imagem</span>
        </div>
      )}
      
      <div className="item-content">
        {item.category && <p className="item-category">{item.category.name}</p>}
        <h2 className="item-name" title={item.name}>{item.name}</h2>
        <p className="item-sku">SKU: {item.sku}</p>
        
        <div className="item-details-grid">
          {/* O valor agora é um número, permitindo a checagem correta */}
          <Detail label="Estoque Total" value={`${item.total_quantity} ${item.unit_of_measure || ''}`} />
          <Detail label="Preço de Venda" value={`R$ ${item.sale_price}`} />
          <Detail label="Marca" value={item.brand} />
          <Detail label="Fornecedor" value={item.supplier?.name} />
        </div>
      </div>
      
      <div className="item-actions">
        {/* O novo botão de movimentação chama a função passada como prop */}
        <button 
          className="button button-outline button-success"
          onClick={() => onAddMovement(item)} // Passa o item específico
        >
          Movimentar
        </button>
        <button className="button button-outline button-primary">Detalhes</button>
      </div>
    </div>
  );
}

export default ItemCard;