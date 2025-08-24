// frontend/src/components/CategoryFormModal.jsx
import React from 'react';
import { useCategoryForm } from '../hooks/useCategoryForm';
import Modal from './Modal';
import FormGroup from './FormGroup';

function CategoryFormModal({ isOpen, onClose, onSuccess, categoryId }) {
  const { formData, groups, isLoading, isSubmitting, isEditing, errors, handleChange, handleSubmit } = useCategoryForm(isOpen, categoryId);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Categoria" : "Adicionar Categoria"}>
      <form onSubmit={handleSubmit(onSuccess, onClose)}>
        {isLoading ? <div className="loadingState">Carregando...</div> : (
          <>
            <FormGroup label="Nome da Categoria" error={errors.name}>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </FormGroup>
            <FormGroup label="Grupo da Categoria (Opcional)" error={errors.group}>
              <select name="group" value={formData.group} onChange={handleChange}>
                <option value="">Nenhum</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
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

export default React.memo(CategoryFormModal);