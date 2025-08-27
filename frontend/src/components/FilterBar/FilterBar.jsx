// src/components/FilterBar/FilterBar.jsx

import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Seu serviço de API
import styles from './FilterBar.module.css';

/**
 * Barra de filtros inteligente que busca e exibe apenas as opções relevantes
 * (categorias, fornecedores, status) com base nos itens disponíveis para o usuário.
 */
const FilterBar = ({ onFilterChange }) => {
  // Estado para armazenar as OPÇÕES que vêm da API
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    suppliers: [],
    statuses: []
  });

  // Estado para controlar os VALORES SELECIONADOS nos campos
  const [currentFilters, setCurrentFilters] = useState({
    search: '',
    category: '',
    supplier: '',
    status: ''
  });

  // Efeito para buscar as opções de filtro na montagem do componente
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Faz uma única chamada ao endpoint otimizado
        const response = await api.get('/filter-options/');
        setFilterOptions(response.data);
      } catch (error) {
        console.error("Erro ao carregar opções de filtro:", error);
        // Você pode adicionar um toast de erro aqui se desejar
      }
    };
    fetchFilterOptions();
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  // Manipulador de eventos unificado para todos os campos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Atualiza o estado interno para refletir a mudança na UI
    setCurrentFilters(prev => ({ ...prev, [name]: value }));
    
    // Notifica o componente pai (InventoryPage) sobre a mudança no filtro
    onFilterChange({ [name]: value });
  };

  return (
    <div className={styles.filterBar}>
      {/* Campo de busca geral */}
      <input
        type="text"
        name="search"
        placeholder="Buscar por SKU, nome, marca..."
        value={currentFilters.search}
        onChange={handleInputChange}
        className={styles.searchInput}
      />
      
      {/* Agrupador para os menus de seleção */}
      <div className={styles.filterGroup}>
        <select name="category" value={currentFilters.category} onChange={handleInputChange}>
          <option value="">Todas as Categorias</option>
          {filterOptions.categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select name="supplier" value={currentFilters.supplier} onChange={handleInputChange}>
          <option value="">Todos os Fornecedores</option>
          {filterOptions.suppliers.map(sup => (
            <option key={sup.id} value={sup.id}>{sup.name}</option>
          ))}
        </select>
        
        <select name="status" value={currentFilters.status} onChange={handleInputChange}>
          <option value="">Todos os Status</option>
          {filterOptions.statuses.map(st => (
            <option key={st.value} value={st.value}>{st.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;