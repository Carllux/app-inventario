// frontend/src/pages/ItemDetailPage.jsx

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
// ✅ 1. Importar os ícones solicitados
import { FiArrowLeft, FiEdit } from 'react-icons/fi';

// ✅ 2. Adicionar uma função para formatar datas
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('pt-BR');
};

const ItemDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  
  const [item, setItem] = useState(location.state?.item || null);
  const [stock, setStock] = useState([]);
  const [isLoading, setIsLoading] = useState(!location.state?.item);
  const [error, setError] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    // ... (lógica de fetch de dados permanece a mesma, já está ótima) ...
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

  const handleImageLoad = useCallback(() => setImageLoading(false), []);
  const handleImageError = useCallback(() => setImageLoading(false), []);
  const handleEditItem = useCallback(() => setIsEditModalOpen(true), []);
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
              {/* 🔄 3. Ícone adicionado ao botão Voltar */}
              <FiArrowLeft /> Voltar
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
              {/* 🔄 4. Ícone adicionado ao botão Editar */}
              <FiEdit /> Editar Item
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
                <div className="card-header"><h2>Detalhes do Catálogo</h2></div>
                <div className="card-body">
                  <Detail label="Status" value={item.status} />
                  <Detail label="Categoria" value={item.category?.name} />
                  <Detail label="Marca" value={item.brand} />
                  <Detail label="Fornecedor" value={item.supplier?.name} />
                  <Detail label="País de Origem" value={item.origin?.name}  />
                  {/* ✅ 5. Novos campos de detalhes adicionados */}
                  <Detail label="Unidade de Medida" value={item.unit_of_measure} />
                  <Detail label="Garantia" value={item.warranty_days ? `${item.warranty_days} dias` : 'N/A'} />
                </div>
              </div>
              
              <div className="card">
                <div className="card-header"><h2>Preços e Códigos</h2></div>
                <div className="card-body">
                  <Detail label="Preço de Compra" value={formatPrice(item.purchase_price)} />
                  <Detail label="Preço de Venda" value={formatPrice(item.sale_price)} />
                  <Detail label="Código EAN" value={item.ean} />
                  <Detail label="Código Interno" value={item.internal_code} />
                </div>
              </div>

              {/* ✅ 6. Novo card para especificações físicas */}
              <div className="card">
                <div className="card-header"><h2>Especificações Físicas</h2></div>
                <div className="card-body">
                  <Detail label="Peso" value={item.weight ? `${item.weight} kg` : 'N/A'} />
                  <Detail label="Altura" value={item.height ? `${item.height} cm` : 'N/A'} />
                  <Detail label="Largura" value={item.width ? `${item.width} cm` : 'N/A'} />
                  <Detail label="Profundidade" value={item.depth ? `${item.depth} cm` : 'N/A'} />
                </div>
              </div>
            </aside>
          </div>

          <div className={styles.bottomGrid}>
            {item.long_description && (
              <section className="card" aria-labelledby="descricao-heading">
                <div className="card-header"><h2 id="descricao-heading">Descrição Detalhada</h2></div>
                <div className="card-body">
                  <p className={styles.descriptionText}>{item.long_description}</p>
                </div>
              </section>
            )}

            <section className={`card ${styles.stockCard}`} aria-labelledby="estoque-heading">
              <div className="card-header">
                <h2 id="estoque-heading">Distribuição de Estoque</h2>
              </div>
              <div className='card-body'>
                {/* ✅ 7. Detalhes de estoque movidos para o corpo do card */}
                <Detail label="Estoque Total" value={item.total_quantity || 0} />
                <Detail label="Estoque Mínimo" value={item.minimum_stock_level || 0} />
              </div>
              <StockTable stock={stock} />
            </section>

            {/* ✅ 8. Novo card para informações de auditoria */}
            <section className="card" aria-labelledby="auditoria-heading">
                <div className="card-header"><h2 id="auditoria-heading">Auditoria</h2></div>
                <div className="card-body">
                  <Detail label="Criado por" value={item.created_by} />
                  <Detail label="Data de Criação" value={formatDate(item.created_at)} />
                  <Detail label="Última Atualização" value={formatDate(item.updated_at)} />
                </div>
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