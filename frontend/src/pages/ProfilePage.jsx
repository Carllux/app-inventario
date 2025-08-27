// frontend/src/pages/ProfilePage.jsx

import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import PageHeader from '../components/PageHeader';
import FormGroup from '../components/FormGroup';
import Spinner from '../components/Spinner';
import styles from './ProfilePage.module.css';
import ProfileCard from '../components/ProfileCard/ProfileCard';


// --- Sub-componente para a Aba de Detalhes (Props ajustadas) ---
const ProfileDetailsTab = ({ formData, errors, handleChange, handleSubmitProfile, isSubmitting }) => (
  <div className="card">
    <form onSubmit={handleSubmitProfile} className="card-body">
      <h3 className="card-header">Informações Pessoais</h3>
      {/* 1. ADICIONADO: Wrapper para o grid do formulário */}
      <div className={styles.formGrid}>
        <FormGroup label="Nome" error={errors?.first_name}>
          <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} />
        </FormGroup>
        <FormGroup label="Sobrenome" error={errors?.last_name}>
          <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} />
        </FormGroup>
        <FormGroup label="E-mail" error={errors?.email}>
          <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
        </FormGroup>
        <FormGroup label="Telefone" error={errors?.phone_number}>
          <input type="tel" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} />
        </FormGroup>
        <FormGroup label="Cargo" error={errors?.job_title}>
            <input type="text" name="job_title" value={formData.job_title || ''} onChange={handleChange} />
        </FormGroup>
      </div>
      <div className="modal-footer">
        <button type="submit" className="button button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  </div>
);

// --- Sub-componente para a Aba de Segurança (Props removidas) ---
const ProfileSecurityTab = () => {
    return (
        <div className="card">
            <form onSubmit={(e) => e.preventDefault()} className="card-body">
                <h3 className="card-header">Alterar Senha</h3>
                <p className="text-muted">Esta funcionalidade será implementada em uma futura versão.</p>
                <div className={styles.formGrid}>
                  <FormGroup label="Senha Atual">
                      <input type="password" name="current_password" disabled />
                  </FormGroup>
                  <FormGroup label="Nova Senha">
                      <input type="password" name="new_password" disabled />
                  </FormGroup>
                  <FormGroup label="Confirmar Nova Senha">
                      <input type="password" name="re_new_password" disabled />
                  </FormGroup>
                </div>
                <div className="modal-footer">
                    <button type="submit" className="button button-primary" disabled>
                        Alterar Senha
                    </button>
                </div>
            </form>
        </div>
    );
};

const ProfilePreferencesTab = ({ formData, handleChange, handleSubmitProfile, isSubmitting }) => (
    <div className="card">
        <form onSubmit={handleSubmitProfile} className="card-body">
            <h3 className="card-header">Preferências de Exibição</h3>
            <div className={styles.formGrid}>
                <FormGroup label="Tema da Interface">
                    <select name="preferred_theme" value={formData.preferred_theme} onChange={handleChange}>
                        <option value="SYSTEM">Padrão do Sistema</option>
                        <option value="LIGHT">Claro</option>
                        <option value="DARK">Escuro</option>
                    </select>
                </FormGroup>
                <FormGroup label="Itens por Página">
                    <input type="number" name="default_items_per_page" value={formData.default_items_per_page} onChange={handleChange} />
                </FormGroup>
                <FormGroup label="Densidade da Tabela">
                    <select name="table_density" value={formData.table_density} onChange={handleChange}>
                        <option value="COMFORTABLE">Confortável</option>
                        <option value="COMPACT">Compacto</option>
                    </select>
                </FormGroup>
            </div>
            <div className="modal-footer">
                <button type="submit" className="button button-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Preferências'}
                </button>
            </div>
        </form>
    </div>
);

function ProfilePage() {
  const [activeTab, setActiveTab] = useState('details');
  
  // 2. Desestruturação explícita de todas as props do hook
  const { userProfile, isLoading, avatarPreview, handleAvatarChange, ...formProps } = useProfile();


  if (isLoading) {
    return <div className="loadingState"><Spinner size="large" /></div>;
  }

  if (!userProfile) {
    return <div className="errorMessage">Não foi possível carregar os dados do perfil.</div>;
  }
  
  const displayName = userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : userProfile.username;

  return (
    <div>
      <PageHeader title={`Perfil de ${displayName}`} />
      
      {/* NOVO: Renderiza o Cartão de Visita */}
      <ProfileCard 
        user={userProfile} 
        avatarPreview={avatarPreview} 
        onAvatarChange={handleAvatarChange}
      />

      <div className={styles.tabs}>
        <button className={activeTab === 'details' ? styles.active : ''} onClick={() => setActiveTab('details')}>
          Dados Pessoais
        </button>
        {/* NOVO: Aba de Preferências */}
        <button className={activeTab === 'preferences' ? styles.active : ''} onClick={() => setActiveTab('preferences')}>
          Preferências
        </button>
        <button className={activeTab === 'security' ? styles.active : ''} onClick={() => setActiveTab('security')}>
          Segurança
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'details' && <ProfileDetailsTab {...formProps} />}
        {activeTab === 'preferences' && <ProfilePreferencesTab {...formProps} />}
        {activeTab === 'security' && <ProfileSecurityTab />}
      </div>
    </div>
  );
}

export default ProfilePage;