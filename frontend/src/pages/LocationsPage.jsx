// frontend/src/pages/LocationsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getLocations, deleteLocation } from '../services/locationService';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import LocationFormModal from '../components/LocationFormModal'; // O modal que acabamos de criar
import toast from 'react-hot-toast';
import styles from './LocationsPage.module.css';

function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // ✅ 1. Novo estado para guardar o ID do item a ser destacado
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLocations();
      setLocations(data.results || []);
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar as locações.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // ✅ 2. Handlers que abrem o modal em diferentes modos (criar vs. editar)
  const handleOpenCreateModal = () => {
    setEditingLocationId(null); // ID nulo significa "modo de criação"
    setIsFormModalOpen(true);
  };
  
  const handleOpenEditModal = (location) => {
    setEditingLocationId(location.id); // Passar o ID significa "modo de edição"
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (location) => {
    setDeleteTarget(location);
  };

  const handleFormSuccess = (newLocation) => {
    setIsFormModalOpen(false);
    fetchLocations(); // Atualiza a lista completa

    // Se uma nova locação foi criada, define seu ID para ser destacado
    if (newLocation && newLocation.id) {
      setHighlightedId(newLocation.id);
    }
  };
  
  const handleConfirmDelete = async () => {
    try {
      await deleteLocation(deleteTarget.id);
      toast.success(`Locação "${deleteTarget.name}" deletada com sucesso.`);
      setDeleteTarget(null);
      fetchLocations();
    } catch (error) {
      toast.error("Não foi possível deletar a locação.");
      console.error(error);
    }
  };

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Código', accessor: 'location_code' },
    { header: 'Filial', accessor: 'branch' },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader 
        title="Gerenciamento de Locações"
        buttonLabel="+ Adicionar Locação"
        onButtonClick={handleOpenCreateModal} // O botão de header abre o modal de criação
      />
      
      {error && <div className="errorMessage">{error}</div>}
      
      <main className={styles.contentArea}>
        {loading ? (
          <div className="loadingState">Carregando...</div>
        ) : (
          <DataTable 
            storageKey="LocationsPage"
            columns={columns} 
            data={locations}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            // ✅ 3. Passa o ID para o componente DataTable
            highlightedId={highlightedId}
          />
        )}
      </main>
      
      {/* ✅ 4. O componente do modal renderizado e conectado aos estados e handlers */}
      <LocationFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        locationId={editingLocationId}
      /> 

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Você tem certeza que deseja deletar a locação "${deleteTarget?.name}"?`}
      />
    </div>
  );
}

export default React.memo(LocationsPage);