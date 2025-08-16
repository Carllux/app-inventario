import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getItemById, getItemStockDistribution } from '../services/itemService';
import FullScreenLoader from '../components/FullScreenLoader';
import Detail from '../components/Detail';
import styles from './ItemDetailPage.module.css';

function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [itemData, stockData] = await Promise.all([
          getItemById(id),
          getItemStockDistribution(id)
        ]);
        setItem(itemData);
        setStock(stockData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return <FullScreenLoader />;
  if (error) return <p className="status-message error">Erro: {error}</p>;
  if (!item) return <p className="status-message">Item não encontrado.</p>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <Link to="/inventory" className="button button-outline button-sm">&larr; Voltar</Link>
          <div>
            <h1>{item.name}</h1>
            <p className="text-muted">SKU: {item.sku}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className="button button-primary">Editar Item</button>
        </div>
      </header>

      {/* ✅ NOVA ESTRUTURA DE GRID */}
      <div className={styles.topGrid}>
        {/* Card de Imagem */}
        <div className={`card ${styles.imageCard}`}>
          {item.photo ? (
            <img src={item.photo} alt={item.name} className={styles.itemImage} />
          ) : (
            <div className={styles.imagePlaceholder}>Sem Imagem</div>
          )}
        </div>

        {/* Sidebar de Detalhes */}
        <aside className={styles.detailsSidebar}>
          <div className="card">
            <div className="card-header"><h3>Detalhes do Catálogo</h3></div>
            <div className="card-body">
              <Detail label="Status" value={item.status} />
              <Detail label="Categoria" value={item.category?.name} />
              <Detail label="Marca" value={item.brand} />
              <Detail label="Fornecedor" value={item.supplier?.name} />
              <Detail label="País de Origem" value={item.origin} />
              <Detail label="Peso" value={item.weight ? `${item.weight} kg` : null} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Informações de Preço</h3></div>
            <div className="card-body">
              <Detail label="Preço de Compra" value={`R$ ${item.purchase_price || '0.00'}`} />
              <Detail label="Preço de Venda" value={`R$ ${item.sale_price || '0.00'}`} />
            </div>
          </div>
        </aside>
      </div>

      {/* Os cards inferiores (Descrição, Estoque) continuam como antes */}
      <div className={styles.bottomGrid}>
        {item.long_description && (
          <div className="card">
            <div className="card-header"><h3>Descrição Detalhada</h3></div>
            <div className="card-body"><p>{item.long_description}</p></div>
          </div>
        )}

        <div className={`card ${styles.stockCard}`}>
          <div className="card-header">
            <h2>Distribuição de Estoque (Total: {item.total_quantity})</h2>
          </div>
          <div className={styles.stockTableContainer}>
            <table className={styles.stockTable}>
              <thead>
                <tr>
                  <th>Filial</th>
                  <th>Locação</th>
                  <th>Quantidade</th>
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
                    <td colSpan="3">Este item não possui estoque em nenhuma locação.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailPage;