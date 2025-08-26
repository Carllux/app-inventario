// frontend/src/pages/MovementTypesAuditPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMovementTypes } from '../services/movementTypeService';
import PageHeader from '../components/PageHeader';
import styles from './AuditPages.module.css';

function MovementTypesAuditPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca todos os TPOs de uma vez para a lista
    getMovementTypes({ page_size: 200 })
      .then(data => setTypes(data.results || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loadingState">Carregando...</div>;

  return (
    <div>
      <PageHeader title="Auditoria por Tipo de Movimento" />
      <p>Selecione um Tipo de Movimento abaixo para ver seu histórico de transações.</p>
      <div className={styles.auditList}>
        {types.map(tpo => (
          <Link key={tpo.id} to={`/audit/movement-types/${tpo.id}`} className={styles.auditLink}>
            <strong>{tpo.code}</strong>
            <span>{tpo.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default MovementTypesAuditPage;