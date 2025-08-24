// frontend/src/components/CategoryGroupsTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getCategoryGroups, deleteCategoryGroup } from '../services/categoryGroupService';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import ConfirmationModal from './ConfirmationModal';
import CategoryGroupFormModal from './CategoryGroupFormModal';
import toast from 'react-hot-toast';

export default function CategoryGroupsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null); // ✅ 1. Adicionar estado de destaque

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategoryGroups();
      console.log('Dados recebidos da API categoriesGroupTab:', data); // DEBUG

      setGroups(data.results || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar categorias categoriesGroupTab: ', err); // DEBUG
      setError("Não foi possível carregar os grupos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFormSuccess = (newItem) => { // ✅ 2. O handler agora recebe o novo item
    setIsFormModalOpen(false);
    fetchData();
    if (newItem?.id) { // ✅ 3. Define o ID para ser destacado
      setHighlightedId(newItem.id);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategoryGroup(deleteTarget.id);
      toast.success(`Grupo "${deleteTarget.name}" deletado.`);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error("Não foi possível deletar o grupo.");
    }
  };

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Descrição', accessor: 'description' },
  ];

  return (
    <div>
      <PageHeader
        title="Grupos de Categoria"
        buttonLabel="+ Adicionar Grupo"
        onButtonClick={() => { setEditingGroupId(null); setIsFormModalOpen(true); }}
      />
      {error && <div className="errorMessage">{error}</div>}
      <main style={{ marginTop: 'var(--space-lg)' }}>
        {loading ? <div className="loadingState">Carregando...</div> : (
          <DataTable
            columns={columns}
            data={groups}
            onEdit={(group) => { setEditingGroupId(group.id); setIsFormModalOpen(true); }}
            onDelete={(group) => setDeleteTarget(group)}
            highlightedId={highlightedId} // ✅ 4. Passa o ID para a DataTable
          />
        )}
      </main>
      <CategoryGroupFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        groupId={editingGroupId}
      />
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o grupo "${deleteTarget?.name}"?`}
      />
    </div>
  );
}