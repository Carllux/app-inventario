// frontend/src/hooks/useBranchForm.js
import { useState, useEffect, useCallback } from 'react';
import { getBranchById, createBranch, updateBranch } from '../services/branchService';
import { handleApiError } from '../utils/errorUtils';
import toast from 'react-hot-toast';

const createInitialState = () => ({
  name: '',
  description: '',
});

export function useBranchForm(isOpen, branchId) {
  const [formData, setFormData] = useState(createInitialState());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!branchId;

  useEffect(() => {
    if (!isOpen) return;

    if (isEditing) {
      setIsLoading(true);
      getBranchById(branchId)
        .then(data => setFormData({ name: data.name || '', description: data.description || '' }))
        .catch(() => toast.error("Falha ao carregar dados da filial."))
        .finally(() => setIsLoading(false));
    } else {
      setFormData(createInitialState());
    }
  }, [isOpen, branchId, isEditing]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((onSuccess, onClose) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const action = isEditing ? updateBranch(branchId, formData) : createBranch(formData);
      const savedItem = await action;
      toast.success(`Filial salva com sucesso!`);
      onSuccess(savedItem);
      onClose();
    } catch (error) {
      if (error.response?.status === 400) setErrors(error.response.data);
      handleApiError(error, "Não foi possível salvar a filial.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, branchId]);

  return { formData, isLoading, isSubmitting, isEditing, errors, handleChange, handleSubmit };
}