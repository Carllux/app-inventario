// frontend/src/components/CategoryGroupFormModal.jsx
import React from 'react';
import { useCategoryGroupForm } from '../hooks/useCategoryGroupForm';
import Modal from './Modal';
import FormGroup from './FormGroup';

function CategoryGroupFormModal({ isOpen, onClose, onSuccess, groupId }) {
  const { formData, isLoading, isSubmitting, isEditing, errors, handleChange, handleSubmit } = useCategoryGroupForm(isOpen, groupId);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Grupo" : "Adicionar Grupo"}>
      <form onSubmit={handleSubmit(onSuccess, onClose)}>
        {isLoading ? <div className="loadingState">Carregando...</div> : (
          <>
            <FormGroup label="Nome do Grupo" error={errors.name}>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </FormGroup>
            <FormGroup label="Descrição" error={errors.description}>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />
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

export default React.memo(CategoryGroupFormModal);