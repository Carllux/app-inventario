// frontend/src/components/CategoriesTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getCategories, deleteCategory } from '../services/categoryService';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import ConfirmationModal from './ConfirmationModal';
import CategoryFormModal from './CategoryFormModal';
import toast from 'react-hot-toast';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      console.log('Dados recebidos da API categoriesTab:', data); // DEBUG
      setCategories(data.results || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar categorias categoriesTab: ', err); // DEBUG
      setError("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    console.log('useEffect fetchData executado'); // DEBUG
    fetchData(); 
  }, [fetchData]);

  const handleFormSuccess = (newItem) => {
    console.log('Novo item criado/editado:', newItem); // DEBUG
    setIsFormModalOpen(false);
    fetchData();
    if (newItem?.id) {
      console.log('Definindo highlightedId:', newItem.id); // DEBUG
      setHighlightedId(newItem.id);
    } else {
      console.warn('Novo item não possui ID:', newItem); // DEBUG
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategory(deleteTarget.id);
      toast.success(`Categoria "${deleteTarget.name}" deletada.`);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error("Não foi possível deletar a categoria.");
    }
  };

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Grupo', accessor: 'group' },
    { header: 'Descrição', accessor: 'description' },
  ];

  // DEBUG: Log para verificar o estado atual
  console.log('Estado atual - highlightedId:', highlightedId);
  console.log('Estado atual - categories:', categories);
  console.log('Categoria destacada existe?', categories.find(cat => cat.id === highlightedId));

  return (
    <div>
      <PageHeader
        title="Categorias de Itens"
        buttonLabel="+ Adicionar Categoria"
        onButtonClick={() => { 
          console.log('Abrindo modal para nova categoria'); // DEBUG
          setEditingCategoryId(null); 
          setIsFormModalOpen(true); 
        }}
      />
      {error && <div className="errorMessage">{error}</div>}
      <main style={{ marginTop: 'var(--space-lg)' }}>
        {loading ? <div className="loadingState">Carregando...</div> : (
          <DataTable
            storageKey="CategoriesTab"
            columns={columns}
            data={categories}
            onEdit={(cat) => { 
              console.log('Editando categoria:', cat.id); // DEBUG
              setEditingCategoryId(cat.id); 
              setIsFormModalOpen(true); 
            }}
            onDelete={(cat) => {
              console.log('Solicitando exclusão:', cat.id); // DEBUG
              setDeleteTarget(cat);
            }}
            highlightedId={highlightedId}
          />
        )}
      </main>
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          console.log('Fechando modal de categoria'); // DEBUG
          setIsFormModalOpen(false);
        }}
        onSuccess={handleFormSuccess}
        categoryId={editingCategoryId}
      />
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => {
          console.log('Cancelando exclusão'); // DEBUG
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar a categoria "${deleteTarget?.name}"?`}
      />
    </div>
  );
}