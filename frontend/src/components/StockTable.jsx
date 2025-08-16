import React from 'react';
import PropTypes from 'prop-types';
import styles from './StockTable.module.css';

const StockTable = ({ stock }) => {
  return (
    <div className={styles.stockTableContainer}>
      <table className={styles.stockTable} aria-label="Distribuição de estoque">
        <thead>
          <tr>
            <th scope="col">Filial</th>
            <th scope="col">Locaçã</th>
            <th scope="col">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {stock.map(stockItem => (
            <tr key={stockItem.id}>
              <td>{stockItem.location.branch}</td>
              <td>{stockItem.location.name}</td>
              <td>{stockItem.quantity}</td>
            </tr>
          ))}
          {stock.length === 0 && (
            <tr>
              <td colSpan="3" className={styles.emptyMessage}>
                Este item não possui estoque em nenhuma locação.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

StockTable.propTypes = {
  stock: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      quantity: PropTypes.number.isRequired,
      location: PropTypes.shape({
        branch: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }).isRequired
    })
  ).isRequired
};

export default React.memo(StockTable);