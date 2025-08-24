// frontend/src/pages/SuppliersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getSuppliers, deleteSupplier } from '../services/supplierService';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
import SupplierFormModal from '../components/SupplierFormModal';
import FlagRenderer from '../components/FlagRenderer'; 
import toast from 'react-hot-toast';
import styles from './SuppliersPage.module.css';

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data.results || []);
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar os fornecedores.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenCreateModal = () => {
    setEditingSupplierId(null);
    setIsFormModalOpen(true);
  };
  
  const handleOpenEditModal = (supplier) => {
    setEditingSupplierId(supplier.id);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (supplier) => {
    setDeleteTarget(supplier);
  };

  const handleFormSuccess = (newSupplier) => {
    setIsFormModalOpen(false);
    fetchSuppliers();
    if (newSupplier && newSupplier.id) {
      setHighlightedId(newSupplier.id);
    }
  };
  
  const handleConfirmDelete = async () => {
    try {
      await deleteSupplier(deleteTarget.id);
      toast.success(`Fornecedor "${deleteTarget.name}" deletado com sucesso.`);
      setDeleteTarget(null);
      fetchSuppliers();
    } catch (error) {
      toast.error("Não foi possível deletar o fornecedor.");
      console.error(error);
    }
  };

  // ✅ CORREÇÃO: A definição de colunas foi ajustada para lidar com o objeto 'country'.
  const columns = [
    { header: 'Nome', accessor: 'name' },
     { 
      header: 'País', 
      accessor: 'country',
      // ✅ 2. Usar o FlagRenderer para exibir o país
      cell: (country) => <FlagRenderer country={country} showName={true}/>
    },
    { 
      header: 'Ativo', 
      accessor: 'is_active',
      cell: (value) => value ? 'Sim' : 'Não'
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <PageHeader 
        title="Gerenciamento de Fornecedores"
        buttonLabel="+ Adicionar Fornecedor"
        onButtonClick={handleOpenCreateModal}
      />
      
      {error && <div className="errorMessage">{error}</div>}
      
      <main className={styles.contentArea}>
        {loading ? (
          <div className="loadingState">Carregando...</div>
        ) : (
          <DataTable 
            storageKey="SuppliersPage"
            columns={columns} 
            data={suppliers}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            highlightedId={highlightedId}
          />
        )}
      </main>
      
      <SupplierFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        supplierId={editingSupplierId}
      /> 

     <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        // ✅ CORREÇÃO: Usando optional chaining (?.) para acessar '.name' de forma segura.
        message={`Você tem certeza que deseja deletar o fornecedor "${deleteTarget?.name}"?`}
      />
    </div>
  );
}

export default React.memo(SuppliersPage);