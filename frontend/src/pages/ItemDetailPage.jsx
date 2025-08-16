// frontend\src\pages\ItemDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getItemById, getItemStockDistribution } from '../services/itemService';
import FullScreenLoader from '../components/FullScreenLoader';
import Detail from '../components/Detail';
import ErrorScreen from '../components/ErrorScreen';
import NotFoundScreen from '../components/NotFoundScreen';
import ImageCard from '../components/ImageCard';
import StockTable from '../components/StockTable';
import ItemFormModal from '../components/ItemFormModal';
import styles from './ItemDetailPage.module.css';

const ItemDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  
  // Estados individuais para melhor clareza
  const [item, setItem] = useState(location.state?.item || null);
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(!location.state?.item);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      if (!location.state?.item) {
        setIsLoading(true);
      }
      setError(null);
      
      const [itemData, stockData] = await Promise.all([
        getItemById(id, { signal: controller.signal }),
        getItemStockDistribution(id, { signal: controller.signal })
      ]);
      setItem(itemData);
      setStock(stockData);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.message || 'Falha ao carregar dados do item');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }

    return () => {
      controller.abort();
    };
  }, [id, location.state?.item]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleEditItem = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setIsEditModalOpen(false);
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    const number = Number(price);
    return isNaN(number) ? 'N/A' : `R$ ${number.toFixed(2)}`;
  };

  if (isLoading) return <FullScreenLoader />;
  if (error) return <ErrorScreen error={error} onRetry={fetchData} />;
  if (!item) return <NotFoundScreen />;

  return (
    <>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <Link 
              to="/inventory" 
              className="button button-outline button-sm" 
              aria-label="Voltar para lista de itens"
            >
              &larr; Voltar
            </Link>
            <div className={styles.itemTitle}>
              <h1>{item.name}</h1>
              <p className="text-muted">SKU: {item.sku}</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button 
              className="button button-primary"
              onClick={handleEditItem}
              aria-label={`Editar item ${item.name}`}
            >
              Editar Item
            </button>
          </div>
        </header>

        <main className={styles.mainContent}>
          <div className={styles.topGrid}>
            <ImageCard 
              image={item.photo}
              alt={`Imagem do produto ${item.name}`}
              isLoading={imageLoading}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            <aside className={styles.detailsSidebar}>
              <div className="card">
                <div className="card-header">
                  <h2>Detalhes do Catálogo</h2>
                </div>
                <div className="card-body">
                  <Detail label="Status" value={item.status} />
                  <Detail label="Categoria" value={item.category?.name} />
                  <Detail label="Marca" value={item.brand} />
                  <Detail label="Fornecedor" value={item.supplier?.name} />
                  <Detail label="País de Origem" value={item.origin} />
                  <Detail label="Peso" value={item.weight ? `${item.weight} kg` : 'N/A'} />
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h2>Informações de Preço</h2>
                </div>
                <div className="card-body">
                  <Detail label="Preço de Compra" value={formatPrice(item.purchase_price)} />
                  <Detail label="Preço de Venda" value={formatPrice(item.sale_price)} />
                </div>
              </div>
            </aside>
          </div>

          <div className={styles.bottomGrid}>
            {item.long_description && (
              <section className="card" aria-labelledby="descricao-heading">
                <div className="card-header">
                  <h2 id="descricao-heading">Descrição Detalhada</h2>
                </div>
                <div className="card-body">
                  <p className={styles.descriptionText}>{item.long_description}</p>
                </div>
              </section>
            )}

            <section className={`card ${styles.stockCard}`} aria-labelledby="estoque-heading">
              <div className="card-header">
                <h2 id="estoque-heading">
                  Distribuição de Estoque (Total: {item.total_quantity || 0})
                </h2>
              </div>
              <StockTable stock={stock} />
            </section>
          </div>
        </main>
      </div>

      <ItemFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        itemId={item.id}
      />
    </>
  );
};

export default React.memo(ItemDetailPage);