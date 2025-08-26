// frontend/src/pages/MovementTypesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // ✅ 1. Importar o Link
import { FiFileText, FiActivity  } from 'react-icons/fi'; // ✅ 2. Importar um ícone para a auditoria
import { getMovementTypes, deleteMovementType } from '../services/movementTypeService';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import MovementTypeFormModal from '../components/MovementTypeFormModal';
import toast from 'react-hot-toast';
import styles from './MovementTypesPage.module.css';

const TABS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'IN', label: 'Entrada' },
  { key: 'OUT', label: 'Saída' },
  { key: 'ADJ', label: 'Ajuste' },
  // Adicione outras categorias do seu modelo se necessário
];

function MovementTypesPage() {
  const [movementTypes, setMovementTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // Aba inicial

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = activeTab === 'ALL' ? {} : { category: activeTab };
      const data = await getMovementTypes(params);
      setMovementTypes(data.results || []);
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar os Tipos de Movimento.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]); // ✅ Refaz a busca sempre que a aba ativa mudar

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFormSuccess = (newItem) => {
    setIsFormModalOpen(false);
    fetchData();
    if (newItem?.id) setHighlightedId(newItem.id);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMovementType(deleteTarget.id);
      toast.success(`TPO "${deleteTarget.name}" deletado.`);
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error("Não foi possível deletar o TPO.");
    }
  };

  const columns = [
    { header: 'Código', accessor: 'code', sortable: true },
    { header: 'Nome', accessor: 'name', sortable: true },
    { header: 'Categoria', accessor: 'category_display' },
    { 
      header: 'Fator', 
      accessor: 'factor_display',
      cell: (value) => value.includes('Adicionar') ? `+1 (Entrada)` : `-1 (Saída)`
    },
    { header: 'Ativo', accessor: 'is_active', cell: (value) => value ? 'Sim' : 'Não'},
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Gerenciamento de Tipos de Movimento (TPOs)"
        buttonLabel="+ Adicionar TPO"
        onButtonClick={() => { setEditingItemId(null); setIsFormModalOpen(true); }}
      />
      
      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? styles.active : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="errorMessage">{error}</div>}
      
      <main className={styles.contentArea}>
        {loading ? <div className="loadingState">Carregando...</div> : (
          <DataTable
            columns={columns}
            data={movementTypes}
            storageKey={`movement-types-table-${activeTab}`} // Chave de armazenamento única por aba
            onEdit={(item) => { setEditingItemId(item.id); setIsFormModalOpen(true); }}
            onDelete={(item) => setDeleteTarget(item)}
            highlightedId={highlightedId}
            renderCustomActions={(row) => (
              <Link
                to={`/audit/movement-types/${row.id}`}
                className="button button-icon button-outline"
                title="Auditar Movimentações"
              >
                <FiFileText />
              </Link>
            )}
          />
        )}
      </main>
      
      <MovementTypeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        movementTypeId={editingItemId}
      /> 

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja deletar o TPO "${deleteTarget?.name}"?`}
      />
    </div>
  );
}

export default MovementTypesPage;