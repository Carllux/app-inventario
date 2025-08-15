// frontend/src/pages/InventoryPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import MovementFormModal from '../components/MovementFormModal';
import ItemFormModal from '../components/ItemFormModal';
import styles from './InventoryPage.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para controlar os dois modais
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
          setError('Sua sessão pode ter expirado ou falhou ao carregar os itens.');
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
    return () => controller.abort();
  }, [refreshKey]);

  // --- Handlers para o Modal de Movimentação ---
  const handleOpenMovementModal = (item = null) => {
    setSelectedItemForMovement(item);
    setIsMovementModalOpen(true);
  };

  // --- Handlers para o Modal de Item (Criar/Editar) ---
  const handleOpenCreateItemModal = () => {
    setEditingItemId(null); // Assegura que estamos no modo de criação
    setIsItemModalOpen(true);
  };

  const handleOpenEditItemModal = (item) => {
    setEditingItemId(item.id); // Define o ID para o modo de edição
    setIsItemModalOpen(true);
  };

  // --- Handler de Sucesso Genérico ---
  // Esta função é chamada por AMBOS os modais após sucesso
  const handleFormSuccess = () => {
    setIsItemModalOpen(false);
    setIsMovementModalOpen(false);
    setEditingItemId(null);
    setSelectedItemForMovement(null);
    setRefreshKey(oldKey => oldKey + 1); // Força a atualização da lista
  };

  if (isLoading) {
    return <p className={styles.statusMessage}>Carregando itens...</p>;
  }
  if (error) {
    return <p className={`${styles.statusMessage} ${styles.error}`}>Erro: {error}</p>;
  }
  
  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1>Itens do Inventário</h1>
        <div className={styles.headerActions}>
          <button className="button button-primary" onClick={handleOpenCreateItemModal}>
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
      <p className="text-muted">Total de itens no catálogo: {items.length}</p>
      <hr />
      
      {items.length === 0 ? (
        <p className={styles.statusMessage}>Nenhum item encontrado.</p>
      ) : (
        <div className={styles.itemList}>
          {items.map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onAddMovement={handleOpenMovementModal}
              onEdit={handleOpenEditItemModal} // Conectado corretamente
            />
          ))}
        </div>
      )}

      {/* Renderização dos Modais */}
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