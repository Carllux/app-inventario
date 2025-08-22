// frontend/src/components/SupplierFormModal.jsx
import React from 'react';
import { useSupplierForm } from '../hooks/useSupplierForm';
import Modal from './Modal';
import FormGroup from './FormGroup';
import CountrySelect from './CountrySelect';
import CnpjInput from './CnpjInput';
import styles from './SupplierFormModal.module.css';

const taxRegimeOptions = [
  { value: 'SIMPLE', label: 'Simples Nacional' },
  { value: 'MEI', label: 'MEI' },
  { value: 'REAL', label: 'Lucro Real' },
  { value: 'PRESUMED', label: 'Lucro Presumido' },
  { value: 'OTHER', label: 'Outro' },
];

function SupplierFormModal({ isOpen, onClose, onSuccess, supplierId }) {
  const {
    formData,
    isLoading,
    isSubmitting,
    isEditing,
    errors,
    handleChange,
    handleSubmit,
  } = useSupplierForm(isOpen, supplierId);

  // Debug para verificar os dados
  console.log('Dados do formulário:', formData);
  console.log('País no formulário:', formData.country);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Fornecedor" : "Adicionar Fornecedor"}
    >
      <form onSubmit={handleSubmit(onSuccess, onClose)}>
        {isLoading ? (
          <div className="loadingState">Carregando dados do fornecedor...</div>
        ) : (
          <>
            <FormGroup label="Nome / Razão Social" error={errors.name}>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup label="País" error={errors.country}>
              <CountrySelect
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                disabled={isSubmitting || isLoading}
              />
            </FormGroup>

            <FormGroup label="Regime Tributário" error={errors.tax_regime}>
              <select
                name="tax_regime"
                value={formData.tax_regime || ''}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">Selecione...</option>
                {taxRegimeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="CNPJ" error={errors.cnpj}>
              <CnpjInput
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </FormGroup>

            <FormGroup label="Inscrição Estadual" error={errors.ie}>
              <input
                type="text"
                name="ie"
                value={formData.ie || ''}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </FormGroup>

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

export default React.memo(SupplierFormModal);