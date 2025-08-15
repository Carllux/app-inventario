// frontend/src/pages/InventoryPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import MovementFormModal from '../components/MovementFormModal';
import ItemFormModal from '../components/ItemFormModal'; // 1. Importe o novo modal de Item
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
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false); // 2. Novo estado para o modal de Item

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
  const handleMovementSuccess = () => {
    setIsMovementModalOpen(false);
    setRefreshKey(oldKey => oldKey + 1);
  };

  // --- Handlers para o Novo Modal de Item ---
  const handleItemCreateSuccess = () => {
    setIsItemModalOpen(false); // Fecha o modal de item
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
          {/* 3. Novo botão para Adicionar Item */}
          <button className="button button-primary" onClick={() => setIsItemModalOpen(true)}>
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
            />
          ))}
        </div>
      )}

      {/* Renderizamos os dois modais, cada um controlado por seu próprio estado */}
      <MovementFormModal 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={handleMovementSuccess}
        selectedItem={selectedItemForMovement}
      />
      
      {/* 4. Renderização do novo modal de Item */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={handleItemCreateSuccess}
      />
    </div>
  );
}

export default InventoryPage;