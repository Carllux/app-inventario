// frontend/src/components/SectorsTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getSectors, deleteSector } from '../services/sectorService';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import ConfirmationModal from './ConfirmationModal';
import SectorFormModal from './SectorFormModal';
import toast from 'react-hot-toast';

// O componente recebe o ID da filial como propriedade
function SectorsTab({ branchId }) {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSectorId, setEditingSectorId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Filtra os setores pela filial atual
      const data = await getSectors({ branch: branchId });
      setSectors(data.results || []);
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar os setores desta filial.");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormSuccess = (newItem) => {
    setIsFormModalOpen(false);
    fetchData();
    if (newItem?.id) setHighlightedId(newItem.id);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteSector(deleteTarget.id);
      toast.success(`Setor "${deleteTarget.name}" deletado.`);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error("Não foi possível deletar o setor.");
    }
  };

  const columns = [
    { header: 'Nome do Setor', accessor: 'name' },
    { header: 'Descrição', accessor: 'description' },
  ];

  return (
    <div>
      <PageHeader
        title="Setores da Filial"
        buttonLabel="+ Adicionar Setor"
        onButtonClick={() => { setEditingSectorId(null); setIsFormModalOpen(true); }}
      />
      {error && <div className="errorMessage">{error}</div>}
      <main style={{ marginTop: 'var(--space-lg)' }}>
        {loading ? <div className="loadingState">Carregando...</div> : (
          <DataTable
            columns={columns}
            data={sectors}
            storageKey={`sectors-table-${branchId}`} // Chave de armazenamento única por filial
            onEdit={(sector) => { setEditingSectorId(sector.id); setIsFormModalOpen(true); }}
            onDelete={(sector) => setDeleteTarget(sector)}
            highlightedId={highlightedId}
          />
        )}
      </main>
      
      <SectorFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        sectorId={editingSectorId}
        branchId={branchId} // Passa o ID da filial para o modal
      />

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o setor "${deleteTarget?.name}"?`}
      />
    </div>
  );
}

export default React.memo(SectorsTab);