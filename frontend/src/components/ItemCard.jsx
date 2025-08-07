import React from 'react';

// Um componente simples para exibir um par de rótulo e valor, evitando repetição.
const Detail = ({ label, value }) => (
  <p className="item-detail">
    <strong>{label}:</strong> {value}
  </p>
);

function ItemCard({ item }) {
  // Objeto para mapear os códigos de unidade de medida para seus nomes completos.
  const unitMap = {
    PC: 'Peça(s)',
    BOX: 'Caixa(s)',
    PAIR: 'Par(es)',
    KIT: 'Kit(s)',
  };

  return (
    <div className="item-card">
      {item.photo && (
        <div className="item-image-container">
          <img src={item.photo} alt={item.name} className="item-image" />
        </div>
      )}
      
      <div className="item-content">
        <h2 className="item-name">{item.name}</h2>
        <p className="item-short-desc">{item.short_description}</p>
        
        <div className="item-details-grid">
          <Detail label="Quantidade" value={`${item.quantity} ${unitMap[item.unit_of_measure] || item.unit_of_measure}`} />
          <Detail label="Preço de Compra" value={`R$ ${item.purchase_price}`} />
          {item.brand && <Detail label="Marca" value={item.brand} />}
          {item.origin && <Detail label="Origem" value={item.origin} />}
          {item.weight && <Detail label="Peso" value={`${item.weight} kg`} />}
        </div>
      </div>
      
      {/* Botões de ação que adicionaremos no futuro */}
      <div className="item-actions">
        <button className="button button-edit">Editar</button>
        <button className="button button-delete">Deletar</button>
      </div>
    </div>
  );
}

export default ItemCard;