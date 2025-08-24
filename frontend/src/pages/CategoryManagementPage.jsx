// frontend/src/pages/CategoryManagementPage.jsx
import React, { useState } from 'react';
import CategoriesTab from '../components/CategoriesTab';
import CategoryGroupsTab from '../components/CategoryGroupsTab';
import styles from './CategoryManagementPage.module.css';

function CategoryManagementPage() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div>
      <div className={styles.tabs}>
        <button
          className={activeTab === 'categories' ? styles.active : ''}
          onClick={() => setActiveTab('categories')}
        >
          Gerenciar Categorias
        </button>
        <button
          className={activeTab === 'groups' ? styles.active : ''}
          onClick={() => setActiveTab('groups')}
        >
          Gerenciar Grupos
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'groups' && <CategoryGroupsTab />}
      </div>
    </div>
  );
}

export default CategoryManagementPage;