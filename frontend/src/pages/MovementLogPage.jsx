// frontend/src/pages/MovementLogPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CrudResourcePage from '../components/CrudResourcePage';
import { getStockMovements } from '../services/stockMovementService';
import { getMovementTypeById } from '../services/movementTypeService'; // Para buscar o nome do TPO
import { format } from 'date-fns';
import { FiArrowLeft } from 'react-icons/fi';

function MovementLogPage() {
  const { id: movementTypeId } = useParams();
  const [tpo, setTpo] = useState(null); // Estado para guardar os detalhes do TPO

  useEffect(() => {
    // Busca os dados do TPO para exibir no título
    getMovementTypeById(movementTypeId).then(setTpo);
  }, [movementTypeId]);

  const columns = [
    { header: 'Data', accessor: 'created_at', cell: (value) => format(new Date(value), 'dd/MM/yyyy HH:mm') },
    { header: 'Item', accessor: 'item', sortable: true },
    { header: 'Qtd.', accessor: 'quantity' },
    { header: 'Preço Unit.', accessor: 'unit_price', cell: (value) => `R$ ${parseFloat(value).toFixed(2)}` },
    { header: 'Valor Total', accessor: 'total_moved_value', cell: (value) => `R$ ${parseFloat(value).toFixed(2)}` },
    { header: 'Usuário', accessor: 'user', sortable: true },
    { header: 'Local', accessor: 'location', sortable: true },
  ];

  // O título agora é dinâmico, mostrando o TPO que está sendo auditado
  const pageTitle = tpo ? `Auditoria: ${tpo.name}` : 'Histórico de Movimentações';

  return (
    <div>
      <Link to="/settings/movement-types" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
        <FiArrowLeft /> Voltar para Tipos de Movimento
      </Link>
      <CrudResourcePage
        title={pageTitle}
        storageKey={`movement-log-${movementTypeId}`}
        columns={columns}
        service={{ getAll: () => getStockMovements({ movement_type: movementTypeId }) }}
        canCreate={false}
        canEdit={false}
        canDelete={false}
      />
    </div>
  );
}

export default MovementLogPage;