// frontend/src/hooks/useSectorForm.js
import { useState, useEffect, useCallback } from 'react';
import { getSectorById, createSector, updateSector } from '../services/sectorService';
import { handleApiError } from '../utils/errorUtils';
import toast from 'react-hot-toast';

// O estado inicial agora inclui o branchId, que é obrigatório.
const createInitialState = (branchId) => ({
  name: '',
  description: '',
  branch: branchId || '', // Pré-define a filial
});

export function useSectorForm(isOpen, sectorId, branchId) {
  const [formData, setFormData] = useState(createInitialState(branchId));
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!sectorId;

  useEffect(() => {
    // Reseta o formulário com o branchId correto sempre que o modal abre
    if (!isOpen) {
      return;
    }
    
    // Garante que o branchId esteja sempre no estado do formulário
    setFormData(createInitialState(branchId));

    if (isEditing) {
      setIsLoading(true);
      getSectorById(sectorId)
        .then(data => {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            branch: data.branch_id || branchId, // Garante que a filial seja mantida
          });
        })
        .catch(() => toast.error("Falha ao carregar dados do setor."))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, sectorId, isEditing, branchId]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((onSuccess, onClose) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const action = isEditing ? updateSector(sectorId, formData) : createSector(formData);
      const savedItem = await action;
      toast.success(`Setor salvo com sucesso!`);
      onSuccess(savedItem);
      onClose();
    } catch (error) {
      if (error.response?.status === 400) {
        setErrors(error.response.data);
      }
      handleApiError(error, "Não foi possível salvar o setor.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, sectorId]);

  return { formData, isLoading, isSubmitting, isEditing, errors, handleChange, handleSubmit };
}