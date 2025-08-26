// frontend/src/pages/BranchDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBranchById } from '../services/branchService'; // Precisaremos desta função
import { FiArrowLeft } from 'react-icons/fi';
// import SectorsTab from '../components/SectorsTab'; // (Vamos criar a seguir)
import styles from './BranchDetailPage.module.css'; // (Vamos criar a seguir)

function BranchDetailPage() {
  const { id } = useParams(); // Pega o ID da filial da URL
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sectors');

  useEffect(() => {
    getBranchById(id)
      .then(setBranch)
      .finally(() => setLoading(false));
  }, [id]);

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

      <div className={styles.tabs}>
        <button
          className={activeTab === 'sectors' ? styles.active : ''}
          onClick={() => setActiveTab('sectors')}
        >
          Setores
        </button>
        {/* Outras abas de configuração da filial podem ser adicionadas aqui no futuro */}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'sectors' && <div>Conteúdo da Aba de Setores em breve...</div>}
        {/* {activeTab === 'sectors' && <SectorsTab branchId={id} />} */}
      </div>
    </div>
  );
}

export default BranchDetailPage;