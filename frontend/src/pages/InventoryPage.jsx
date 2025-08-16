import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import MovementFormModal from '../components/MovementFormModal';
import ItemFormModal from '../components/ItemFormModal';
import styles from './InventoryPage.module.css';
import SkeletonCard from '../components/SkeletonCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para os modais
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/api/items/`, {
          signal: controller.signal,
        });
        setItems(response.data.results || response.data);
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError('Falha ao carregar os itens. Tente novamente mais tarde.');
          console.error('Erro ao buscar itens:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
    return () => controller.abort();
  }, [refreshKey]);

  // Handlers para modais
  const handleOpenMovementModal = (item = null) => {
    setSelectedItemForMovement(item);
    setIsMovementModalOpen(true);
  };

  const handleOpenCreateItemModal = () => {
    setEditingItemId(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItemModal = (item) => {
    setEditingItemId(item.id);
    setIsItemModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsItemModalOpen(false);
    setIsMovementModalOpen(false);
    setEditingItemId(null);
    setSelectedItemForMovement(null);
    setRefreshKey(oldKey => oldKey + 1);
  };

  // Renderização condicional
  if (isLoading) {
    return (
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <h1>Itens do Inventário</h1>
          <div className={styles.headerActions}>
            <button className="button button-primary" disabled>
              + Adicionar Item
            </button>
            <button className="button button-success" disabled>
              + Adicionar Movimentação
            </button>
          </div>
        </div>
        <p className="text-muted">Carregando catálogo...</p>
        <hr />
        <div className={styles.itemList}>
          {[...Array(8)].map((_, index) => (
            <SkeletonCard key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <h1>Itens do Inventário</h1>
        </div>
        <p className={`${styles.statusMessage} ${styles.error}`}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1>Itens do Inventário</h1>
        <div className={styles.headerActions}>
          <button 
            className="button button-primary" 
            onClick={handleOpenCreateItemModal}
          >
            + Adicionar Item
          </button>
          <button 
            className="button button-success" 
            onClick={() => handleOpenMovementModal()}
          >
            + Adicionar Movimentação
          </button>
        </div>
      </div>
      
      <p className="text-muted">Total de itens: {items.length}</p>
      <hr />
      
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.statusMessage}>Nenhum item encontrado.</p>
          <button 
            className="button button-primary"
            onClick={handleOpenCreateItemModal}
          >
            Adicionar Primeiro Item
          </button>
        </div>
      ) : (
        <div className={styles.itemList}>
          {items.map(item => (
            <ItemCard 
              key={`item-${item.id}`}
              item={item} 
              onAddMovement={() => handleOpenMovementModal(item)}
              onEdit={() => handleOpenEditItemModal(item)}
            />
          ))}
        </div>
      )}

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