// frontend/src/components/DataTable.jsx
import React, { useMemo, useState } from "react";
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
      <div
        className="th-content"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        {/* Botão de sort (livre do drag) */}
        <button
          type="button"
          className="th-button"
          onClick={() => onSort(column.accessor)}
          title="Ordenar"
          style={{ all: "unset", cursor: "pointer" }}
        >
          {column.header}{" "}
          {isSorted ? (
            dir === "asc" ? (
              <FiArrowUp style={{ verticalAlign: "middle" }} />
            ) : (
              <FiArrowDown style={{ verticalAlign: "middle" }} />
            )
          ) : null}
        </button>

        {/* Handle de drag (fica com os listeners do dnd-kit) */}
        <span
          className="drag-handle"
          title="Reordenar coluna"
          {...attributes}
          {...listeners}
          style={{ cursor: "grab", display: "inline-flex", lineHeight: 0 }}
        >
          <FaGripVertical />
        </span>
      </div>
    </th>
  );
}

/** ---------- Utilitários de ordenação ---------- */
// Permite definir por coluna: sortType: 'number' | 'string' | 'date'
// ou sortAccessor(row) e/ou sortFn(a, b).
function getSortValue(row, key, columns) {
  const col = columns.find((c) => c.accessor === key);
  if (!col) return row[key];
  if (typeof col?.sortAccessor === "function") return col.sortAccessor(row);
  return row[col.accessor];
}

function defaultCompare(a, b, type) {
  // nulos/undefined vão para o final
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

  // string (default) – case-insensitive e com comparação “natural”
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
function DataTable({ columns, data, onEdit, onDelete, highlightedId }) {
  // sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  // ordem de colunas
  const [columnOrder, setColumnOrder] = useState(
    columns.map((c) => c.accessor)
  );

  // sensores do dnd: só arrasta após mover 5px (evita “roubar” o clique)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // dados ordenados
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

  if (!data || data.length === 0) {
    return <div className="empty-state">Nenhum registro encontrado.</div>;
  }

  // aplica a ordem às colunas
  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((id) => columns.find((c) => c.accessor === id))
        .filter(Boolean),
    [columnOrder, columns]
  );

  return (
    <div className="table-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="data-table">
          <thead>
            <SortableContext
              items={columnOrder}
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
                {(onEdit || onDelete) && (
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
      </DndContext>
    </div>
  );
}

export default DataTable;
