import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getItemById, getItemStockDistribution } from '../services/itemService';
import FullScreenLoader from '../components/FullScreenLoader';
import Detail from '../components/Detail';
import ErrorScreen from '../components/ErrorScreen';
import NotFoundScreen from '../components/NotFoundScreen';
import ImageCard from '../components/ImageCard';
import StockTable from '../components/StockTable';
import styles from './ItemDetailPage.module.css';

const ItemDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();

  const [item, setItem] = useState(location.state?.item || null);
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(!location.state?.item);
  const [error, setError] = useState(null);
  
  const [state, setState] = useState({
    item: location.state?.item || null,
    stock: [],
    isLoading: !location.state?.item,
    error: null,
    imageLoading: true
  });

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      // Só mostra loading se não tivermos dados iniciais
      if (!state.item) {
        setState(prev => ({ ...prev, isLoading: true }));
      }
      
      setState(prev => ({ ...prev, error: null, imageLoading: true }));
      
      const [itemData, stockData] = await Promise.all([
        getItemById(id, { signal: controller.signal }),
        getItemStockDistribution(id, { signal: controller.signal })
      ]);
      
      setState({
        item: itemData,
        stock: stockData,
        isLoading: false,
        error: null,
        imageLoading: !!itemData?.photo
      });
    } catch (err) {
      if (!controller.signal.aborted) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || 'Falha ao carregar dados do item'
        }));
      }
    }

    return () => controller.abort();
  }, [id, state.item]);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      // Começa o loading apenas se não tivermos dados iniciais
      if (!location.state?.item) {
        setIsLoading(true);
      }
      setError(null);
      
      try {
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
    };

    fetchData();

    // Função de limpeza
    return () => {
      controller.abort();
    };
  }, [id, location.state?.item]); // Roda apenas se o ID ou o item inicial mudar

  const handleImageLoad = useCallback(() => {
    setState(prev => ({ ...prev, imageLoading: false }));
  }, []);

  const handleImageError = useCallback(() => {
    setState(prev => ({ ...prev, imageLoading: false }));
  }, []);

  const handleEditItem = useCallback(() => {
    console.log('Editar item:', state.item?.id);
  }, [state.item]);

  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    const number = Number(price);
    return isNaN(number) ? 'N/A' : `R$ ${number.toFixed(2)}`;
  };

  if (state.isLoading) return <FullScreenLoader />;
  if (state.error) return <ErrorScreen error={state.error} onRetry={fetchData} />;
  if (!state.item) return <NotFoundScreen />;

  return (
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
            <h1>{state.item.name}</h1>
            <p className="text-muted">SKU: {state.item.sku}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button 
            className="button button-primary"
            onClick={handleEditItem}
            aria-label={`Editar item ${state.item.name}`}
          >
            Editar Item
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.topGrid}>
          <ImageCard 
            image={state.item.photo}
            alt={`Imagem do produto ${state.item.name}`}
            isLoading={state.imageLoading}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          <aside className={styles.detailsSidebar}>
            <div className="card">
              <div className="card-header">
                <h2>Detalhes do Catálogo</h2>
              </div>
              <div className="card-body">
                <Detail label="Status" value={state.item.status} />
                <Detail label="Categoria" value={state.item.category?.name} />
                <Detail label="Marca" value={state.item.brand} />
                <Detail label="Fornecedor" value={state.item.supplier?.name} />
                <Detail label="País de Origem" value={state.item.origin} />
                <Detail label="Peso" value={state.item.weight ? `${state.item.weight} kg` : 'N/A'} />
              </div>
            </div>
            
            <div className="card">
              <div className="card-header">
                <h2>Informações de Preço</h2>
              </div>
              <div className="card-body">
                <Detail label="Preço de Compra" value={formatPrice(state.item.purchase_price)} />
                <Detail label="Preço de Venda" value={formatPrice(state.item.sale_price)} />
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.bottomGrid}>
          {state.item.long_description && (
            <section className="card" aria-labelledby="descricao-heading">
              <div className="card-header">
                <h2 id="descricao-heading">Descrição Detalhada</h2>
              </div>
              <div className="card-body">
                <p className={styles.descriptionText}>{state.item.long_description}</p>
              </div>
            </section>
          )}

          <section className={`card ${styles.stockCard}`} aria-labelledby="estoque-heading">
            <div className="card-header">
              <h2 id="estoque-heading">
                Distribuição de Estoque (Total: {state.item.total_quantity || 0})
              </h2>
            </div>
            <StockTable stock={state.stock} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default React.memo(ItemDetailPage);