// frontend/src/components/CategoryGroupsTab.jsx
import React from 'react';
import CrudResourcePage from './CrudResourcePage';
import { getCategoryGroups, deleteCategoryGroup } from '../services/categoryGroupService';
import CategoryGroupFormModal from './CategoryGroupFormModal';

export default function CategoryGroupsTab() {
  const columns = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Descrição', accessor: 'description' },
  ];

  // Função customizada para mapear props
  const getFormProps = (baseProps, editingItemId) => {
    return {
      ...baseProps,
      groupId: editingItemId // Mapeia itemId para groupId
    };
  };

  return (
    <CrudResourcePage
      title="Grupos de Categoria"
      storageKey="category-groups-table"
      columns={columns}
      service={{
        getAll: getCategoryGroups,
        deleteById: deleteCategoryGroup
      }}
      FormComponent={CategoryGroupFormModal}
      itemLabel="name"
      getFormProps={getFormProps}
    />
  );
}