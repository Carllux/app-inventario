// frontend/src/pages/SuppliersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getSuppliers, deleteSupplier } from '../services/supplierService';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmationModal from '../components/ConfirmationModal';
// import SupplierFormModal from '../components/SupplierFormModal';
import toast from 'react-hot-toast';
import styles from './SuppliersPage.module.css'; // ✅ 1. Importar o CSS Module

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'País', accessor: 'country' },
    { 
      header: 'Ativo', 
      accessor: 'is_active',
      cell: (value) => value ? 'Sim' : 'Não'
    },
  ];

  return (
    // ✅ 2. Aplicar a classe do container principal
    <div className={styles.pageContainer}>
      <PageHeader 
        title="Gerenciamento de Fornecedores"
        buttonLabel="+ Adicionar Fornecedor"
        onButtonClick={handleOpenCreateModal}
      />
      
      {error && (
        // ✅ 3. Aplicar a classe de erro
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {/* ✅ 4. Aplicar a classe da área de conteúdo */}
      <main className={styles.contentArea}>
        {loading ? (
          // ✅ 5. Aplicar a classe de carregamento
          <div className={styles.loadingState}>Carregando...</div>
        ) : (
          <DataTable 
            columns={columns} 
            data={suppliers}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
          />
        )}
      </main>
      
      {/* <SupplierFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={fetchSuppliers}
          supplierId={editingSupplierId}
        /> 
      */}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Você tem certeza que deseja deletar o fornecedor "${deleteTarget?.name}"?`}
      />
    </div>
  );
}

export default React.memo(SuppliersPage);