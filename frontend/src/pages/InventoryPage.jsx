// frontend/src/pages/InventoryPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';
import { getItems, deleteItem } from '../services/itemService'; // ✅ USA O NOVO SERVIÇO
import ItemCard from "../components/ItemCard";
import MovementFormModal from "../components/MovementFormModal";
import ItemFormModal from "../components/ItemFormModal";
import ConfirmationModal from '../components/ConfirmationModal';
import FilterBar from "../components/FilterBar/FilterBar";
import Spinner from "../components/Spinner";
import styles from "./InventoryPage.module.css";

function InventoryPage() {
  // Estados da página
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  // const [refreshKey, setRefreshKey] = useState(0); // Para forçar a recarga

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    supplier: '',
    status: ''
  });


  // Estados dos modais
  const [movementModal, setMovementModal] = useState({ isOpen: false, item: null });
  const [itemModal, setItemModal] = useState({ isOpen: false, itemId: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

  // Busca inicial e em refresh
  useEffect(() => {
    const controller = new AbortController();

    const fetchItemsWithFilters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Passa os filtros para o serviço de busca
        const data = await getItems({ page: 1, ...filters }); 
        setItems(data.results || []);
        setPagination({ count: data.count || 0, next: data.next });
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
  }, [filters]); // Dispara a busca sempre que um filtro mudar

  // Função para carregar mais itens
  const handleLoadMore = useCallback(async () => {
    if (!pagination.next || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      setError(null);
      const nextPageUrl = new URL(pagination.next);
      const nextPage = nextPageUrl.searchParams.get("page");
      
      // Passa os filtros atuais também ao carregar mais
      const data = await getItems({ page: nextPage, ...filters });
      
      setItems(prevItems => [...prevItems, ...(data.results || [])]);
      setPagination({ count: data.count, next: data.next });

    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error("Não foi possível carregar mais itens.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [pagination, isLoadingMore, filters]);

  const handleFilterChange = useCallback((newFilter) => {
    setItems([]); 
    setFilters(prevFilters => ({ ...prevFilters, ...newFilter }));
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
        {pagination.next && (
          <div className={styles.loadMoreContainer}>
            <button
              className="button button-outline"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Carregando..." : "Carregar Mais Itens"}
            </button>
          </div>
        )}
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
        {isLoading ? "Buscando informações..." : `Exibindo ${items.length} de ${pagination.count} itens no catálogo.`}
      </p>

      {/* RENDERIZAR O FILTERBAR: Inserido no local ideal */}
      <FilterBar onFilterChange={handleFilterChange} />

      <hr className={styles.divider} />

      {renderContent()}

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