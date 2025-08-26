// frontend/src/components/SectorFormModal.jsx
import React from 'react';
import { useSectorForm } from '../hooks/useSectorForm';
import Modal from './Modal';
import FormGroup from './FormGroup';

function SectorFormModal({ isOpen, onClose, onSuccess, sectorId, branchId }) {
  const { 
    formData, 
    isLoading, 
    isSubmitting, 
    isEditing, 
    errors, 
    handleChange, 
    handleSubmit 
  } = useSectorForm(isOpen, sectorId, branchId);

  // Não renderiza o modal se não estiver aberto
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Setor" : "Adicionar Novo Setor"}>
      <form onSubmit={handleSubmit(onSuccess, onClose)}>
        {isLoading ? (
          <div className="loadingState">Carregando...</div>
        ) : (
          <>
            <FormGroup label="Nome do Setor" error={errors.name}>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </FormGroup>

            <FormGroup label="Descrição (Opcional)" error={errors.description}>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows="4" 
              />
            </FormGroup>

            {/* O campo da filial é obrigatório mas não é editável pelo usuário neste formulário,
                pois o setor está sendo criado no contexto de uma filial específica. */}
            <input type="hidden" name="branch" value={formData.branch} />

            <div className="modal-footer">
              <button 
                type="button" 
                className="button button-outline" 
                onClick={onClose} 
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="button button-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default React.memo(SectorFormModal);