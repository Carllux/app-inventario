// frontend/src/components/MovementTypeFormModal.jsx
import React from 'react';
import { useMovementTypeForm } from '../hooks/useMovementTypeForm';
import Modal from './Modal';
import FormGroup from './FormGroup';
import styles from './ItemFormModal.module.css'; // Reutilizando alguns estilos de layout

function MovementTypeFormModal({ isOpen, onClose, onSuccess, movementTypeId }) {
  const {
    formData,
    isLoading,
    isSubmitting,
    isEditing,
    errors,
    parentTypeOptions,
    groupOptions,
    handleChange,
    handleGroupsChange,
    handleSubmit,
  } = useMovementTypeForm(isOpen, movementTypeId);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Tipo de Movimento" : "Adicionar Tipo de Movimento"}>
      <form onSubmit={handleSubmit(onSuccess, onClose)} className={styles.form}>
        {isLoading ? <div className="loadingState">Carregando...</div> : (
          <>
            <fieldset>
              <legend>Informações Básicas</legend>
              <div className={styles.formRow}>
                <FormGroup label="Código" error={errors.code}>
                  <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="Ex: ENTRADA_NF" />
                </FormGroup>
                <FormGroup label="Nome" error={errors.name}>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Ex: Entrada por Nota Fiscal" />
                </FormGroup>
              </div>
              <FormGroup label="Descrição" error={errors.description}>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />
              </FormGroup>
            </fieldset>

            <fieldset>
              <legend>Configuração de Estoque</legend>
              <div className={styles.formRow}>
                <FormGroup label="Fator" error={errors.factor}>
                  <select name="factor" value={formData.factor} onChange={handleChange} required>
                    <option value="1">Adicionar ao Estoque (Entrada)</option>
                    <option value="-1">Subtrair do Estoque (Saída)</option>
                  </select>
                </FormGroup>
                <FormGroup label="Unidades por Pacote" error={errors.units_per_package}>
                  <input type="number" name="units_per_package" value={formData.units_per_package || ''} onChange={handleChange} placeholder="Deixe em branco se for 1" min="1" />
                </FormGroup>
                <FormGroup label="Categoria" error={errors.category}>
                  <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saída</option>
                    <option value="ADJ">Ajuste</option>
                  </select>
                </FormGroup>
              </div>
            </fieldset>
            
            <fieldset>
              <legend>Regras de Negócio e Acesso</legend>
              <div className={styles.formRow}>
                <FormGroup label="Tipo de Documento" error={errors.document_type}>
                  <select name="document_type" value={formData.document_type} onChange={handleChange} required>
                    <option value="NF">Nota Fiscal</option>
                    <option value="OS">Ordem de Serviço</option>
                    <option value="TKT">Ticket</option>
                    <option value="INT">Documento Interno</option>
                    <option value="N/A">Não Aplicável</option>
                  </select>
                </FormGroup>
                <FormGroup label="Grupos Permitidos" error={errors.allowed_for_groups}>
                  <select name="allowed_for_groups" value={formData.allowed_for_groups} onChange={handleGroupsChange} multiple style={{ height: '120px' }}>
                    {groupOptions.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </FormGroup>
              </div>
              <div className={styles.formRow}>
                <FormGroup>
                  <label className="checkbox-label">
                    <input type="checkbox" name="requires_approval" checked={formData.requires_approval} onChange={handleChange} />
                    Exige Aprovação
                  </label>
                </FormGroup>
                <FormGroup>
                  <label className="checkbox-label">
                    <input type="checkbox" name="affects_finance" checked={formData.affects_finance} onChange={handleChange} />
                    Afeta Financeiro
                  </label>
                </FormGroup>
                <FormGroup>
                  <label className="checkbox-label">
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                    Ativo
                  </label>
                </FormGroup>
              </div>
            </fieldset>

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

export default React.memo(MovementTypeFormModal);