// frontend/src/components/BranchFormModal.jsx
import React from 'react';
import { useBranchForm } from '../hooks/useBranchForm';
import Modal from './Modal';
import FormGroup from './FormGroup';

function BranchFormModal({ isOpen, onClose, onSuccess, branchId }) {
  const { formData, isLoading, isSubmitting, isEditing, errors, handleChange, handleSubmit } = useBranchForm(isOpen, branchId);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Filial" : "Adicionar Filial"}>
      <form onSubmit={handleSubmit(onSuccess, onClose)}>
        {isLoading ? <div className="loadingState">Carregando...</div> : (
          <>
            <FormGroup label="Nome da Filial" error={errors.name}>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </FormGroup>
            <FormGroup label="Descrição (Opcional)" error={errors.description}>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
            </FormGroup>
            <div className="modal-footer">
              <button type="button" className="button button-outline" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
              <button type="submit" className="button button-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default React.memo(BranchFormModal);