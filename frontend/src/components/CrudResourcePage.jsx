// frontend/src/components/CrudResourcePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from './PageHeader';
import DataTable from './DataTable';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination/Pagination'; // 1. Importar o componente Pagination
import toast from 'react-hot-toast';

function CrudResourcePage({ 
  title, 
  storageKey, 
  columns, 
  service, 
  FormComponent: FormModal,
  itemLabel = 'name',
  getFormProps = null,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canPaginate = true, // 7. Adicionar novo prop 'canPaginate' para controlar a visibilidade da paginação
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 2. Adicionar estado para parâmetros de busca (incluindo paginação)
  const [params, setParams] = useState({
    page: 1,
    pageSize: 25, // Pode ser customizado via prop no futuro se necessário
  });

  // 3. Adicionar estado para informações da paginação (total de itens)
  const [paginationInfo, setPaginationInfo] = useState({ count: 0 });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  // 4. Modificar a função de busca para enviar os parâmetros
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Passa os parâmetros (página, etc.) para o serviço
      const data = await service.getAll(params); 
      const itemsArray = data.results || data || [];
      setItems(itemsArray);
      // Armazena a contagem total de itens para o componente de paginação
      setPaginationInfo({ count: data.count || itemsArray.length });
      setError(null);
    } catch (err) {
      console.error(`Erro ao carregar ${title}:`, err);
      setError(`Não foi possível carregar os dados de ${title}.`);
    } finally {
      setLoading(false);
    }
  }, [service, title, params]); // Adiciona 'params' à lista de dependências

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

  // 5. Adicionar handlers para as ações de paginação
  const handlePageChange = useCallback((newPage) => {
    setParams(prevParams => ({ ...prevParams, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setParams(prevParams => ({ ...prevParams, page: 1, pageSize: newPageSize }));
  }, []);

  const getItemName = (item) => {
    if (!item) return 'este item';
    return item[itemLabel] || item.name || item.title || 'este item';
  };
  
  const baseFormProps = { /* ...código existente... */ };
  const formProps = getFormProps ? getFormProps(baseFormProps, editingItemId) : baseFormProps;

  return (
    <div>
      {/* O PageHeader e o botão de "Adicionar" só aparecem se canCreate for true */}
      {canCreate && (
      <PageHeader
        title={title}
        buttonLabel={`+ Adicionar ${title}`}
        onButtonClick={() => { 
          setEditingItemId(null); 
          setIsFormModalOpen(true); 
        }}
      />
    )}
      {/* Se não puder criar, exibe um título simples */}
      {!canCreate && <h1>{title}</h1>}
      {error && <div className="errorMessage">{error}</div>}

      <main style={{ marginTop: 'var(--space-lg)' }}>
        {loading ? <div className="loadingState">Carregando...</div> : (
          <DataTable
            storageKey={storageKey}
            columns={columns}
            data={items}
            onEdit={canEdit ? (item) => { setEditingItemId(item.id); setIsFormModalOpen(true); } : null}
            onDelete={canDelete ? (item) => setDeleteTarget(item) : null}
            highlightedId={highlightedId}
          />
        )}
      </main>
      
      {/* 6. Renderizar o componente Pagination no final */}
      {canPaginate && !loading && items.length > 0 && (
        <Pagination
          currentPage={params.page}
          pageSize={params.pageSize}
          totalItems={paginationInfo.count}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {(canCreate || canEdit) && <FormModal  {...formProps} />}

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