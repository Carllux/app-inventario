import React, { useMemo, useState, useEffect } from "react";
import { Link } from 'react-router-dom'; 
import { FiEdit2, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { FaGripVertical } from "react-icons/fa";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** ---------- Header dragável com botão de sort separado ---------- */
function SortableHeader({ column, sortConfig, onSort }) {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({
      id: column.accessor,
    });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const isSorted = sortConfig.key === column.accessor;
  const dir = isSorted ? sortConfig.direction : null;

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={`sortable ${dir === "asc" ? "sort-asc" : ""} ${
        dir === "desc" ? "sort-desc" : ""
      }`}
      aria-sort={
        isSorted ? (dir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <div className="th-content">
        {/* Botão de sort */}
        <button
          type="button"
          className="th-button button button-sm button-outline"
          onClick={() => onSort(column.accessor)}
          title="Ordenar"
          aria-label={`Ordenar por ${column.header}`}
        >
          {column.header}{" "}
          {isSorted ? (
            dir === "asc" ? (
              <FiArrowUp className="icon-button" />
            ) : (
              <FiArrowDown className="icon-button" />
            )
          ) : null}
        </button>

        {/* Handle de drag */}
        <span
          className="drag-handle"
          title="Reordenar coluna"
          {...attributes}
          {...listeners}
        >
          <FaGripVertical />
        </span>
      </div>
    </th>
  );
}

/** ---------- Utils de ordenação ---------- */
function getSortValue(row, key, columns) {
  const col = columns.find((c) => c.accessor === key);
  if (!col) return row[key];
  if (typeof col?.sortAccessor === "function") return col.sortAccessor(row);
  return row[col.accessor];
}

function defaultCompare(a, b, type) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (type === "number") {
    const na = Number(a),
      nb = Number(b);
    if (Number.isNaN(na) || Number.isNaN(nb)) {
      return String(a).localeCompare(String(b), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    }
    return na - nb;
  }

  if (type === "date") {
    const ta = a instanceof Date ? a.getTime() : Date.parse(a);
    const tb = b instanceof Date ? b.getTime() : Date.parse(b);
    if (Number.isNaN(ta) || Number.isNaN(tb)) {
      return String(a).localeCompare(String(b), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    }
    return ta - tb;
  }

  return String(a).localeCompare(String(b), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function compareRows(aRow, bRow, key, columns) {
  const col = columns.find((c) => c.accessor === key);
  const a = getSortValue(aRow, key, columns);
  const b = getSortValue(bRow, key, columns);

  if (typeof col?.sortFn === "function") return col.sortFn(a, b);
  return defaultCompare(a, b, col?.sortType);
}

/** --------------------- DataTable --------------------- */
function DataTable({ 
  columns, 
  data, 
  onEdit, 
  onDelete, 
  highlightedId, 
  storageKey = "default", // prop para identificar a tabela
  renderCustomActions 
}) {
  // Chaves únicas para cada tabela baseadas no storageKey
  const STORAGE_KEY_ORDER = `datatable_${storageKey}_column_order`;
  const STORAGE_KEY_VISIBLE = `datatable_${storageKey}_visible_columns`;

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const initialOrder = columns.map((c) => c.accessor);

  // ordem inicial de colunas
  const [columnOrder, setColumnOrder] = useState(
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ORDER);
        return stored ? JSON.parse(stored) : initialOrder;
      } catch (error) {
        console.warn("Erro ao carregar ordem de colunas do localStorage:", error);
        return initialOrder;
      }
    }
  );

  // colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState(
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_VISIBLE);
        return stored ? JSON.parse(stored) : initialOrder;
      } catch (error) {
        console.warn("Erro ao carregar colunas visíveis do localStorage:", error);
        return initialOrder;
      }
    }
  );

  // persistência no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(columnOrder));
      localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(visibleColumns));
    } catch (error) {
      console.warn("Erro ao salvar no localStorage:", error);
    }
  }, [columnOrder, visibleColumns, STORAGE_KEY_ORDER, STORAGE_KEY_VISIBLE]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // resetar colunas
  const handleResetColumns = () => {
    setColumnOrder(initialOrder);
    setVisibleColumns(initialOrder);
    try {
      localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(initialOrder));
      localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify(initialOrder));
    } catch (error) {
      console.warn("Erro ao resetar colunas no localStorage:", error);
    }
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) =>
      compareRows(a, b, sortConfig.key, columns)
    );
    return sortConfig.direction === "asc" ? sorted : sorted.reverse();
  }, [data, sortConfig, columns]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setColumnOrder((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((id) => columns.find((c) => c.accessor === id))
        .filter((c) => c && visibleColumns.includes(c.accessor)),
    [columnOrder, visibleColumns, columns]
  );

  if (!data || data.length === 0) {
    return <div className="empty-state">Nenhum registro encontrado.</div>;
  }

  return (
    <div className="table-container">
      {/* Seletor de colunas */}
      <div className="column-selector mb-3">
        <strong>Colunas </strong>
        {columns.map((col) => (
          <label key={col.accessor} className="mr-2">
            <input
              type="checkbox"
              checked={visibleColumns.includes(col.accessor)}
              onChange={(e) => {
                setVisibleColumns((prev) =>
                  e.target.checked
                    ? [...prev, col.accessor]
                    : prev.filter((id) => id !== col.accessor)
                );
              }}
            />
            {col.header}
          </label>
        ))}

        {/* Botão reset */}
        <button
          onClick={handleResetColumns}
          className="button button-outline ml-4"
        >
          Resetar colunas
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="data-table">
          <thead>
            <SortableContext
              items={orderedColumns.map(c => c.accessor)}
              strategy={horizontalListSortingStrategy}
            >
              <tr>
                {orderedColumns.map((col) => (
                  <SortableHeader
                    key={col.accessor}
                    column={col}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                ))}
                {(onEdit || onDelete || renderCustomActions) && (
                  <th className="actions-header">Ações</th>
                )}
              </tr>
            </SortableContext>
          </thead>

          <tbody>
            {sortedData.map((row) => (
              <tr
                key={row.id}
                className={row.id === highlightedId ? "highlighted-row" : ""}
              >
                {orderedColumns.map((col) => (
                  <td key={`${row.id}-${col.accessor}`}>
                    {col.cell
                      ? col.cell(row[col.accessor], row)
                      : row[col.accessor] ?? "N/A"}
                  </td>
                ))}

                {(onEdit || onDelete || renderCustomActions) && (
                  <td className="actions-cell">
                    {renderCustomActions && renderCustomActions(row)}

                    {onEdit && (
                      <button
                        className="button button-icon button-outline"
                        onClick={() => onEdit(row)}
                        title="Editar"
                        aria-label="Editar registro"
                      >
                        <FiEdit2 />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="button button-icon button-danger-outline"
                        onClick={() => onDelete(row)}
                        title="Deletar"
                        aria-label="Deletar registro"
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
      </DndContext>
    </div>
  );
}

export default DataTable;