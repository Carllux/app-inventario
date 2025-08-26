// frontend/src/components/CrudResourcePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import ConfirmationModal from './ConfirmationModal';
import toast from 'react-hot-toast';

function CrudResourcePage({ 
  title, 
  storageKey, 
  columns, 
  service, 
  // eslint-disable-next-line no-unused-vars
  FormComponent: FormModal,
  itemLabel = 'name',
  getFormProps = null // Função opcional para customizar props do form
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await service.getAll();
      const itemsArray = data.results || data || [];
      setItems(itemsArray);
      setError(null);
    } catch (err) {
      console.error(`Erro ao carregar ${title}:`, err);
      setError(`Não foi possível carregar os dados de ${title}.`);
    } finally {
      setLoading(false);
    }
  }, [service, title]);

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
      await service.deleteById(deleteTarget.id);
      toast.success(`"${deleteTarget[itemLabel]}" deletado com sucesso.`);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error(`Erro ao deletar ${title}:`, error);
      toast.error(`Não foi possível deletar o registro.`);
    }
  };

  const getItemName = (item) => {
    if (!item) return 'este item';
    return item[itemLabel] || item.name || item.title || 'este item';
  };

  // Props base para o formulário
  const baseFormProps = {
    isOpen: isFormModalOpen,
    onClose: () => setIsFormModalOpen(false),
    onSuccess: handleFormSuccess,
    itemId: editingItemId
  };

  // Se fornecido, usa a função customizada para obter props
  const formProps = getFormProps 
    ? getFormProps(baseFormProps, editingItemId) 
    : baseFormProps;

  return (
    <div>
      <PageHeader
        title={title}
        buttonLabel={`+ Adicionar ${title}`}
        onButtonClick={() => { 
          setEditingItemId(null); 
          setIsFormModalOpen(true); 
        }}
      />
      
      {error && <div className="errorMessage">{error}</div>}
      
      <main style={{ marginTop: 'var(--space-lg)' }}>
        {loading ? <div className="loadingState">Carregando...</div> : (
          <DataTable
            storageKey={storageKey}
            columns={columns}
            data={items}
            onEdit={(item) => { 
              setEditingItemId(item.id); 
              setIsFormModalOpen(true); 
            }}
            onDelete={(item) => setDeleteTarget(item)}
            highlightedId={highlightedId}
          />
        )}
      </main>
      

      <FormModal {...formProps} />


      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar "${getItemName(deleteTarget)}"?`}
      />
    </div>
  );
}

export default CrudResourcePage;