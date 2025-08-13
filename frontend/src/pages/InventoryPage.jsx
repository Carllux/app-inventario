import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ItemCard from '../components/ItemCard';
import MovementFormModal from '../components/MovementFormModal';
// 1. Importe os estilos do módulo
import styles from './InventoryPage.module.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function InventoryPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleOpenMovementModal = (item = null) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleMovementSuccess = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setRefreshKey(oldKey => oldKey + 1);
  };

  // 2. Aplique as classes do módulo na lógica de renderização
  if (isLoading) {
    return <p className={styles.statusMessage}>Carregando itens...</p>;
  }

  if (error) {
    return <p className={`${styles.statusMessage} ${styles.error}`}>Erro: {error}</p>;
  }
  
  return (
    // 3. Aplique as classes do módulo no JSX principal
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1>Itens do Inventário</h1>
        <button 
          className="button button-success" 
          onClick={() => handleOpenMovementModal()}
        >
          + Adicionar Movimentação
        </button>
      </div>
      <p className="text-muted">Total de itens na base de dados: {items.length}</p>
      <hr />
      
      {items.length === 0 ? (
        <p className={styles.statusMessage}>Nenhum item encontrado no inventário.</p>
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

      <MovementFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMovementSuccess}
        selectedItem={selectedItem}
      />
    </div>
  );
}

export default InventoryPage;