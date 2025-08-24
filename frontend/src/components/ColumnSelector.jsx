import React, { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

function ColumnSelector({ columns, visibleColumns, onToggle, onReset }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="column-selector-container">
      <button
        className="button button-outline"
        onClick={() => setOpen((o) => !o)}
      >
        Colunas {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {open && (
        <div className="column-selector-panel">
          <div className="column-selector-list">
            {columns.map((col) => (
              <label key={col.accessor}>
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.accessor)}
                  onChange={(e) => onToggle(col.accessor, e.target.checked)}
                />
                {col.header}
              </label>
            ))}
          </div>
          <div className="column-selector-actions">
            <button className="button button-outline" onClick={onReset}>
              Resetar colunas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ColumnSelector;
