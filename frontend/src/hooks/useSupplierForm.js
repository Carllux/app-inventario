// frontend/src/hooks/useSupplierForm.js
import { useState, useEffect, useCallback } from 'react';
import { getSupplierById, createSupplier, updateSupplier } from '../services/supplierService';
import { handleApiError } from '../utils/errorUtils';
import toast from 'react-hot-toast';

// ✅ Agora já inicia com BR por padrão na criação
const createInitialState = () => ({
  name: '',
  country: 'BR', // ← valor padrão para criação
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
});

export function useSupplierForm(isOpen, supplierId) {
  const isEditMode = supplierId != null;
  const [formData, setFormData] = useState(createInitialState());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData(createInitialState());
      setErrors({});
      return;
    }

    if (isEditMode) {
      setIsLoading(true);
      const fetchSupplier = async () => {
        try {
          const data = await getSupplierById(supplierId);
          
          // Mapeia os dados da API para o formulário, extraindo .code quando necessário
          const initialData = {};
          Object.keys(createInitialState()).forEach(key => {
            // Para o campo country, usa itemData[key]?.code ou mantém o valor padrão
            if (key === 'country') {
              initialData[key] = data[key]?.code || data[key] || 'BR';
            } else {
              initialData[key] = data[key] || '';
            }
          });
          
          setFormData(initialData);
        } catch (error) {
          toast.error("Falha ao carregar dados do fornecedor.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSupplier();
    } else {
      setFormData(createInitialState());
    }
  }, [isOpen, supplierId, isEditMode]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((onSuccess, onClose) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      if (isEditMode) {
        await updateSupplier(supplierId, formData);
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await createSupplier(formData);
        toast.success("Fornecedor criado com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setErrors(error.response.data);
      }
      handleApiError(error, "Não foi possível salvar o fornecedor.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditMode, supplierId]);

  return {
    formData,
    isLoading,
    isSubmitting,
    isEditMode,
    errors,
    handleChange,
    handleSubmit,
  };
}