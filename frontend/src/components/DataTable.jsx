// frontend/src/components/DataTable.jsx

import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import styles from './DataTable.module.css';

function DataTable({ 
  columns, 
  data, 
  onEdit, // Função para ser chamada ao clicar em editar
  onDelete // Função para ser chamada ao clicar em deletar
}) {
  if (!data || data.length === 0) {
    return <div className={styles.emptyState}>Nenhum registro encontrado.</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.accessor}>{col.header}</th>
            ))}
            {(onEdit || onDelete) && <th className={styles.actionsHeader}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={`${row.id}-${col.accessor}`}>
                  {/* Lógica para renderizar booleano como Sim/Não */}
                  {typeof row[col.accessor] === 'boolean'
                    ? (row[col.accessor] ? 'Sim' : 'Não')
                    : (row[col.accessor] || 'N/A')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className={styles.actionsCell}>
                  {onEdit && (
                    <button 
                      className="button button-icon button-outline" 
                      onClick={() => onEdit(row)}
                      title="Editar"
                    >
                      <FiEdit2 />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      className="button button-icon button-danger-outline"
                      onClick={() => onDelete(row)}
                      title="Deletar"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;