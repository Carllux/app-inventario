// frontend/src/pages/MovementLogPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import CrudResourcePage from '../components/CrudResourcePage';
import { getStockMovements } from '../services/stockMovementService';
import { format } from 'date-fns'; // Biblioteca para formatar datas

function MovementLogPage() {
  const { id: movementTypeId } = useParams();

  const columns = [
    { 
      header: 'Data', 
      accessor: 'created_at',
      cell: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm')
    },
    { header: 'Item', accessor: 'item', sortable: true },
    { header: 'Qtd.', accessor: 'quantity' },
    { 
      header: 'Preço Unit.', 
      accessor: 'unit_price',
      cell: (value) => `R$ ${parseFloat(value).toFixed(2)}`
    },
    { 
      header: 'Valor Total', 
      accessor: 'total_moved_value',
      cell: (value) => `R$ ${parseFloat(value).toFixed(2)}`
    },
    { header: 'Usuário', accessor: 'user', sortable: true },
    { header: 'Local', accessor: 'location', sortable: true },
  ];

  return (
    <CrudResourcePage
      title="Histórico de Movimentações"
      storageKey={`movement-log-${movementTypeId}`}
      columns={columns}
      service={{
        getAll: () => getStockMovements({ movement_type: movementTypeId }),
        // Não passamos um serviço de delete
      }}
      // Desabilitamos as ações de CRUD, tornando a página somente-leitura
      canCreate={false}
      canEdit={false}
      canDelete={false}
    />
  );
}

export default MovementLogPage;