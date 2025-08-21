// frontend/src/components/BranchFilter.jsx

import React from 'react';
import { useAuth } from '../hooks/useAuth';
import styles from './BranchFilter.module.css';

function BranchFilter() {
  const { branches, selectedBranch, changeBranch } = useAuth();

  // Não renderiza nada se o usuário não tiver filiais ou tiver apenas uma
  if (!branches || branches.length <= 1) {
    return null;
  }

  const handleBranchChange = (event) => {
    const branchId = event.target.value;
    const branch = branches.find(b => b.id === branchId);
    changeBranch(branch);
  };

  return (
    <div className={styles.filterContainer}>
      <label htmlFor="branch-filter" className={styles.label}>Filial:</label>
      <select
        id="branch-filter"
        className={styles.select}
        value={selectedBranch?.id || ''}
        onChange={handleBranchChange}
      >
        {/* Adicione uma opção para ver "Todas as Filiais" se o usuário for admin */}
        {/* <option value="">Todas as Filiais</option> */}
        {branches.map(branch => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default BranchFilter;