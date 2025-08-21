// frontend/src/components/SupplierFormModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getSupplierById, createSupplier, updateSupplier } from '../services/supplierService';
import Modal from './Modal'; // Assumindo que você tem um componente Modal genérico
import FormGroup from './FormGroup';
import styles from './SupplierFormModal.module.css';
import formStyles from './FormGroup.module.css';
import toast from 'react-hot-toast';

const taxRegimeOptions = [
  { value: 'SIMPLE', label: 'Simples Nacional' },
  { value: 'MEI', label: 'MEI' },
  { value: 'REAL', label: 'Lucro Real' },
  { value: 'PRESUMED', label: 'Lucro Presumido' },
  { value: 'OTHER', label: 'Outro' },
];

const initialState = {
  name: '',
  country: 'BR',
  tax_regime: '',
  cnpj: '',
  ie: '',
  contact_person: '',
  phone_number: '',
  email: '',
  postal_code: '',
  address_line_1: '',
  city: '',
  state: '',
};

function SupplierFormModal({ isOpen, onClose, onSuccess, supplierId }) {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!supplierId;

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (isEditing) {
      const fetchSupplier = async () => {
        setIsLoading(true);
        try {
          const data = await getSupplierById(supplierId);
          setFormData({
            name: data.name || '',
            country: data.country || 'BR',
            tax_regime: data.tax_regime || '',
            cnpj: data.cnpj || '',
            ie: data.ie || '',
            contact_person: data.contact_person || '',
            phone_number: data.phone_number || '',
            email: data.email || '',
            postal_code: data.postal_code || '',
            address_line_1: data.address_line_1 || '',
            city: data.city || '',
            state: data.state || '',
          });
        } catch (error) {
          toast.error("Falha ao carregar dados do fornecedor.");
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      fetchSupplier();
    }
  }, [supplierId, isEditing, isOpen, onClose, resetForm]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (isEditing) {
        await updateSupplier(supplierId, formData);
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await createSupplier(formData);
        toast.success("Fornecedor criado com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Ocorreu um erro. Verifique os campos.");
      // Aqui você poderia tratar erros de validação da API, se houver
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Fornecedor" : "Adicionar Fornecedor"}>
      <form onSubmit={handleSubmit}>
        {isLoading && <p>Carregando...</p>}
        {!isLoading && (
          <>
            <FormGroup label="Nome / Razão Social" error={errors.name}>
              <input
                type="text" name="name" value={formData.name}
                onChange={handleChange} className={formStyles.input} required
              />
            </FormGroup>

            <FormGroup label="Regime Tributário" error={errors.tax_regime}>
              <select name="tax_regime" value={formData.tax_regime} onChange={handleChange} className={formStyles.select}>
                <option value="">Selecione...</option>
                {taxRegimeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="CNPJ" error={errors.cnpj}>
              <input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} className={formStyles.input} />
            </FormGroup>
            <FormGroup label="Inscrição Estadual" error={errors.cnpj}>
              <input type="text" name="ie" value={formData.ie} onChange={handleChange} className={formStyles.input} />
            </FormGroup>
            
            <FormGroup label="Contato (Pessoa)" error={errors.contact_person}>
              <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className={formStyles.input} />
            </FormGroup>

            <FormGroup label="E-mail" error={errors.email}>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={formStyles.input} />
            </FormGroup>

            {/* Adicione outros campos de endereço aqui conforme necessário */}

            <div className={styles.modalFooter}>
              <button type="button" className="button button-outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </button>
              <button type="submit" className="button button-primary" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

export default SupplierFormModal;