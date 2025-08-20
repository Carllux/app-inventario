// frontend/src/pages/SuppliersPage.jsx

import React, { useState, useEffect } from 'react';
import { getSuppliers } from '../services/supplierService';
import PageHeader from '../components/PageHeader'; // Um componente de cabeçalho reutilizável
import DataTable from '../components/DataTable';   // Um componente de tabela reutilizável

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const data = await getSuppliers();
        setSuppliers(data.results || []); // A API retorna os dados dentro de 'results'
        setError(null);
      } catch (err) {
        setError("Não foi possível carregar os fornecedores.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Definir as colunas para nossa tabela de dados
  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'País', accessor: 'country' },
    { header: 'Status', accessor: 'is_active' }, // Lembre-se que o backend envia 'is_active'
  ];

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="suppliers-page">
      <PageHeader 
        title="Gerenciamento de Fornecedores"
        buttonLabel="Adicionar Fornecedor"
        onButtonClick={() => console.log('Abrir modal de criação')}
      />
      <main className="page-content">
        {/* Futuramente, aqui entrarão os filtros */}
        <DataTable columns={columns} data={suppliers} />
      </main>
    </div>
  );
}

export default SuppliersPage;