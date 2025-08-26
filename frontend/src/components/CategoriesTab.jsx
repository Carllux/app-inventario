// frontend/src/components/CategoriesTab.jsx
import React from 'react';
import CrudResourcePage from './CrudResourcePage';
import { getCategories, deleteCategory } from '../services/categoryService';
import CategoryFormModal from './CategoryFormModal';

export default function CategoriesTab() {
  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Grupo', accessor: 'group' },
    { header: 'Descrição', accessor: 'description' },
  ];

  // Função customizada para mapear props
  const getFormProps = (baseProps, editingItemId) => {
    return {
      ...baseProps,
      categoryId: editingItemId // Mapeia itemId para categoryId
    };
  };

  return (
    <CrudResourcePage
      title="Categorias de Itens"
      storageKey="categories-table"
      columns={columns}
      service={{
        getAll: getCategories,
        deleteById: deleteCategory
      }}
      FormComponent={CategoryFormModal}
      itemLabel="name"
      getFormProps={getFormProps}
    />
  );
}