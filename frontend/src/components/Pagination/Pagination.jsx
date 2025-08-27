// src/components/Pagination/Pagination.jsx

import React from "react";
import styles from "./Pagination.module.css";

const Pagination = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100], // flexível
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  // Função para gerar páginas com reticências
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // nº de páginas visíveis no meio

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(2, currentPage - 2);
      const endPage = Math.min(totalPages - 1, currentPage + 2);

      pages.push(1);

      if (startPage > 2) pages.push("...");

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={styles.paginationContainer}>
      {/* Seletor de Itens por Página */}
<div className={styles.pageSizeSelector}>
  <label htmlFor="pageSize" className={styles.pageSizeLabel}>
    Itens por página:
  </label>
  <select
    id="pageSize"
    name="pageSize"
    value={pageSize}
    onChange={(e) => onPageSizeChange(Number(e.target.value))}
    aria-label="Itens por página"
  >
    {pageSizeOptions.map((size) => (
      <option key={size} value={size}>
        {size}
      </option>
    ))}
  </select>
</div>

      {/* Controles de Navegação */}
      <div className={styles.pageControls}>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={styles.navButton}
          aria-label="Página anterior"
        >
          Anterior
        </button>

        <div className={styles.pageNumbers}>
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`${styles.pageButton} ${
                  currentPage === page ? styles.active : ""
                }`}
                aria-current={currentPage === page ? "page" : undefined}
                disabled={currentPage === page}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={styles.navButton}
          aria-label="Próxima página"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default Pagination;
