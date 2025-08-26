// frontend/src/components/BranchGeneralTab.jsx
import React, { useState, useEffect } from 'react';
import { updateBranch } from '../services/branchService';
import { handleApiError } from '../utils/errorUtils';
import FormGroup from './FormGroup';
import toast from 'react-hot-toast';

// Este componente recebe os dados da filial da página pai
function BranchGeneralTab({ branch, onUpdate }) {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        description: branch.description || '',
      });
    }
  }, [branch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const updatedBranch = await updateBranch(branch.id, formData);
      toast.success("Dados da filial atualizados com sucesso!");
      onUpdate(updatedBranch); // Notifica a página pai sobre a atualização
    } catch (error) {
      if (error.response?.status === 400) setErrors(error.response.data);
      handleApiError(error, "Não foi possível atualizar a filial.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Informações da Filial</h2>
      </div>
      <form onSubmit={handleSubmit} className="card-body">
        <FormGroup label="Nome da Filial" error={errors.name}>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </FormGroup>
        <FormGroup label="Descrição (Opcional)" error={errors.description}>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
        </FormGroup>
        <div className="modal-footer" style={{marginTop: 0}}>
          <button type="submit" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BranchGeneralTab;