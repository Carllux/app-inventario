import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import MovementFormModal from '../components/MovementFormModal';
import ItemFormModal from '../components/ItemFormModal';
import Spinner from '../components/Spinner';
import styles from './InventoryPage.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function InventoryPage() {
  // Estados da página
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados dos modais
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Busca os itens com paginação
  const fetchItems = useCallback(async () => {
    const controller = new AbortController();
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/items/?page=${page}`, {
        signal: controller.signal,
      });
      
      const newItems = response.data.results || [];
      
      // Se for a primeira página, substitui a lista. Senão, concatena.
      setItems(prevItems => (page === 1 ? newItems : [...prevItems, ...newItems]));
      setTotalItems(response.data.count || 0);
      setHasNextPage(response.data.next !== null);
      
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError('Falha ao carregar os itens. Tente novamente mais tarde.');
        console.error('Erro ao buscar itens:', err);
      }
    } finally {
      setIsLoading(false);
    }
    
    return () => controller.abort();
  }, [page, refreshKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handlers para modais
  const handleOpenMovementModal = useCallback((item = null) => {
    setSelectedItemForMovement(item);
    setIsMovementModalOpen(true);
  }, []);

  const handleOpenCreateItemModal = useCallback(() => {
    setEditingItemId(null);
    setIsItemModalOpen(true);
  }, []);

  const handleOpenEditItemModal = useCallback((item) => {
    setEditingItemId(item.id);
    setIsItemModalOpen(true);
  }, []);

  // Handler de sucesso simplificado
  const handleFormSuccess = useCallback(() => {
    setIsItemModalOpen(false);
    setIsMovementModalOpen(false);
    
    // Limpa a lista e volta para a página 1
    setItems([]);
    setPage(1);
  }, []);

  // Handler para carregar mais itens
  const handleLoadMore = useCallback(() => {
    if (hasNextPage) {
      setPage(prevPage => prevPage + 1);
    }
  }, [hasNextPage]);

  // Renderização condicional
  const renderContent = () => {
    if (isLoading && page === 1) {
      return (
        <div className={styles.loadingContainer}>
          <Spinner size="large" />
          <p className={styles.loadingText}>Carregando catálogo...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
          <button 
            className="button button-primary"
            onClick={() => {
              setPage(1);
              setRefreshKey(old => old + 1);
            }}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>Nenhum item encontrado.</p>
          <button 
            className="button button-primary"
            onClick={handleOpenCreateItemModal}
          >
            Adicionar Primeiro Item
          </button>
        </div>
      );
    }
    return (
      <>
        <div className={styles.itemList}>
          {items.map(item => (
            <ItemCard 
              key={`item-${item.id}`}
              item={item} 
              onAddMovement={handleOpenMovementModal}
              onEdit={handleOpenEditItemModal}
            />
          ))}
        </div>
        {hasNextPage && (
          <div className={styles.loadMoreContainer}>
            <button 
              className="button button-outline"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Carregando...' : 'Carregar Mais Itens'}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.pageContent}>
      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <h1>Itens do Inventário</h1>
        <div className={styles.headerActions}>
          <button 
            className="button button-primary" 
            onClick={handleOpenCreateItemModal}
            disabled={isLoading}
          >
            + Adicionar Item
          </button>
          <button 
            className="button button-success" 
            onClick={() => handleOpenMovementModal()}
            disabled={isLoading}
          >
            + Adicionar Movimentação
          </button>
        </div>
      </div>

      {/* Contador de itens */}
      <p className={styles.itemsCount}>
        {isLoading && page === 1 
          ? 'Carregando catálogo...' 
          : `Exibindo ${items.length} de ${totalItems} itens no catálogo.`
        }
      </p>
      <hr className={styles.divider} />
      
      {/* Conteúdo principal */}
      {renderContent()}

      {/* Modais */}
      <MovementFormModal 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={handleFormSuccess}
        selectedItem={selectedItemForMovement}
      />
      
      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={handleFormSuccess}
        itemId={editingItemId}
      />
    </div>
  );
}

export default InventoryPage;