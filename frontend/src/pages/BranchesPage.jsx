// frontend/src/pages/BranchesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getBranches, deleteBranch } from '../services/branchService';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import BranchFormModal from '../components/BranchFormModal';
import toast from 'react-hot-toast';
import styles from './BranchesPage.module.css'; // Criaremos este a seguir

function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBranches();
      setBranches(data.results || []);
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar as filiais.", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFormSuccess = (newItem) => {
    setIsFormModalOpen(false);
    fetchData();
    if (newItem?.id) setHighlightedId(newItem.id);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteBranch(deleteTarget.id);
      toast.success(`Filial "${deleteTarget.name}" deletada.`);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error("Não foi possível deletar a filial.", error);
    }
  };

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Descrição', accessor: 'description' },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Gerenciamento de Filiais"
        buttonLabel="+ Adicionar Filial"
        onButtonClick={() => { setEditingBranchId(null); setIsFormModalOpen(true); }}
      />
      {error && <div className="errorMessage">{error}</div>}
      <main className={styles.contentArea}>
        {loading ? <div className="loadingState">Carregando...</div> : (
          <DataTable
            columns={columns}
            data={branches}
            storageKey="branches-table"
            onEdit={(branch) => { setEditingBranchId(branch.id); setIsFormModalOpen(true); }}
            onDelete={(branch) => setDeleteTarget(branch)}
            highlightedId={highlightedId}
          />
        )}
      </main>
      <BranchFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        branchId={editingBranchId}
      />
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar a filial "${deleteTarget?.name}"?`}
      />
    </div>
  );
}

export default BranchesPage;