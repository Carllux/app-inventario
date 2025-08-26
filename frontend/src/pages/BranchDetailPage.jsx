// frontend/src/pages/BranchDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBranchById } from '../services/branchService';
import { FiArrowLeft } from 'react-icons/fi';
import SectorsTab from '../components/SectorsTab';
import BranchGeneralTab from '../components/BranchGeneralTab'; // ✅ 1. Importar a nova aba
import styles from './BranchDetailPage.module.css';

function BranchDetailPage() {
  const { id } = useParams();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  // ✅ 2. A aba padrão agora é a de informações gerais
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    getBranchById(id)
      .then(setBranch)
      .finally(() => setLoading(false));
  }, [id]);

  // Função para atualizar o nome da filial no título da página
  const handleBranchUpdate = (updatedBranch) => {
    setBranch(updatedBranch);
  };

  if (loading) {
    return <div className="loadingState">Carregando filial...</div>;
  }

  if (!branch) {
    return <div className="errorMessage">Filial não encontrada.</div>;
  }

  return (
    <div>
      <Link to="/settings/branches" className={styles.backLink}>
        <FiArrowLeft /> Voltar para todas as filiais
      </Link>
      
      <h1 className={styles.title}>Gerenciando Filial: {branch.name}</h1>

      {/* ✅ 3. Estrutura de abas idêntica à da página de Categorias */}
      <div className={styles.tabs}>
        <button
          className={activeTab === 'general' ? styles.active : ''}
          onClick={() => setActiveTab('general')}
        >
          Informações Gerais
        </button>
        <button
          className={activeTab === 'sectors' ? styles.active : ''}
          onClick={() => setActiveTab('sectors')}
        >
          Setores
        </button>
        {/* Novas abas (ex: Usuários da Filial) podem ser adicionadas aqui */}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'general' && <BranchGeneralTab branch={branch} onUpdate={handleBranchUpdate} />}
        {activeTab === 'sectors' && <SectorsTab branchId={id} />}
      </div>
    </div>
  );
}

export default BranchDetailPage;