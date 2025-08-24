// frontend/src/components/DataTable.jsx

import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

function DataTable({ 
  columns, 
  data, 
  onEdit,
  onDelete,
  highlightedId 
}) {
  if (!data || data.length === 0) {
    return <div className="empty-state">Nenhum registro encontrado.</div>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.accessor}>{col.header}</th>
            ))}
            {(onEdit || onDelete) && <th className="actions-header">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className={row.id === highlightedId ? 'highlighted-row' : ''}>
              {columns.map((col) => (
                <td key={`${row.id}-${col.accessor}`}>
                  {/* ✅ LÓGICA DE RENDERIZAÇÃO APRIMORADA */}
                  {/* Se a coluna tem uma função 'cell', usa ela para renderizar. */}
                  {col.cell
                    ? col.cell(row[col.accessor])
                    // Senão, usa o comportamento padrão que você já tinha.
                    : (row[col.accessor] || 'N/A')
                  }
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="actions-cell">
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