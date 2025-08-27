// frontend/src/pages/InventoryPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';
import { getItems, deleteItem } from '../services/itemService';
import ItemCard from "../components/ItemCard";
import MovementFormModal from "../components/MovementFormModal";
import ItemFormModal from "../components/ItemFormModal";
import Pagination from "../components/Pagination/Pagination";
import ConfirmationModal from '../components/ConfirmationModal';
import FilterBar from "../components/FilterBar/FilterBar";
import Spinner from "../components/Spinner";
import styles from "./InventoryPage.module.css";

function InventoryPage() {
  // Estados da página
  const [items, setItems] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState({ count: 0 }); // 2. Simplificar estado da paginação
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);
  // const [refreshKey, setRefreshKey] = useState(0); // Para forçar a recarga

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    supplier: '',
    status: '',
    page: 1,
    pageSize: 25,
  });


  // Estados dos modais
  const [movementModal, setMovementModal] = useState({ isOpen: false, item: null });
  const [itemModal, setItemModal] = useState({ isOpen: false, itemId: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

  useEffect(() => {
    const controller = new AbortController();

    const fetchItemsWithFilters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Passa todos os filtros, incluindo paginação, para o serviço
        const data = await getItems(filters, { signal: controller.signal });
        
        // A lógica agora SUBSTITUI os itens da página, em vez de adicionar
        setItems(data.results || []);
        setPaginationInfo({ count: data.count || 0 });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemsWithFilters();
    return () => controller.abort();
  }, [filters]);

  const handlePageChange = useCallback((newPage) => {
    setFilters(prevFilters => ({ ...prevFilters, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setFilters(prevFilters => ({ ...prevFilters, page: 1, pageSize: newPageSize }));
  }, []);

  const handleFilterChange = useCallback((newFilter) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilter, page: 1 }));
  }, []);
  
  const forceRefresh = () => setFilters(prev => ({...prev}));

  const handleFormSuccess = () => {
    setItemModal({ isOpen: false, itemId: null });
    setMovementModal({ isOpen: false, item: null });
    forceRefresh();
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.item) return;
    
    try {
      await deleteItem(deleteModal.item.id);
      toast.success(`Item "${deleteModal.item.name}" inativado com sucesso.`);
      setDeleteModal({ isOpen: false, item: null });
      forceRefresh();
    } catch (error) {
      toast.error(error.message);
      setDeleteModal({ isOpen: false, item: null });
    }
  }, [deleteModal.item]);

  // Renderização condicional do conteúdo
  const renderContent = () => {
    if (isLoading) {
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
          <button className="button button-primary" onClick={forceRefresh}>
            Tentar Novamente
          </button>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>Nenhum item encontrado no catálogo.</p>
          <button className="button button-primary" onClick={() => setItemModal({ isOpen: true, itemId: null })}>
            Adicionar Primeiro Item
          </button>
        </div>
      );
    }
    return (
      <>
        <div className={styles.itemList}>
          {items.map((item) => (
            <ItemCard
              key={item.id} // ✅ UUIDs são chaves perfeitas
              item={item}
              onAddMovement={(item) => setMovementModal({ isOpen: true, item })}
              onEdit={(item) => setItemModal({ isOpen: true, itemId: item.id })}
              onDelete={(item) => setDeleteModal({ isOpen: true, item })}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h1>Itens do Inventário</h1>
        <div className={styles.headerActions}>
          <button
            className="button button-primary"
            onClick={() => setItemModal({ isOpen: true, itemId: null })}
            disabled={isLoading}
          >
            + Adicionar Item
          </button>
          <button
            className="button button-success"
            onClick={() => setMovementModal({ isOpen: true, item: null })}
            disabled={isLoading}
          >
            + Movimentar Estoque
          </button>
        </div>
      </div>

      <p className={styles.itemsCount}>
        {isLoading ? "Buscando informações..." : `Exibindo ${items.length} de ${paginationInfo.count} itens no catálogo.`}
      </p>

      {/* RENDERIZAR O FILTERBAR: Inserido no local ideal */}
      <FilterBar onFilterChange={handleFilterChange} />

      <hr className={styles.divider} />

      {renderContent()}

      {!isLoading && paginationInfo.count > 0 && (
        <Pagination
          currentPage={filters.page}
          pageSize={filters.pageSize}
          totalItems={paginationInfo.count}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
      
      {/* Modais */}
      <MovementFormModal
        isOpen={movementModal.isOpen}
        onClose={() => setMovementModal({ isOpen: false, item: null })}
        onSuccess={handleFormSuccess}
        selectedItem={movementModal.item}
      />

      <ItemFormModal
        isOpen={itemModal.isOpen}
        onClose={() => setItemModal({ isOpen: false, itemId: null })}
        onSuccess={handleFormSuccess}
        itemId={itemModal.itemId}
      />
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={handleConfirmDelete}
        title="Confirmar Inativação"
        message={`Você tem certeza que deseja inativar o item "${deleteModal.item?.name}"? Ele não poderá ser usado em novas movimentações.`}
      />
    </div>
  );
}

export default InventoryPage;