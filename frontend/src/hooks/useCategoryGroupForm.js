// frontend/src/hooks/useCategoryGroupForm.js
import { useState, useEffect, useCallback } from 'react';
import { getCategoryGroupById, createCategoryGroup, updateCategoryGroup } from '../services/categoryGroupService';
import { handleApiError } from '../utils/errorUtils';
import toast from 'react-hot-toast';

const createInitialState = () => ({
  name: '',
  description: '',
});

export function useCategoryGroupForm(isOpen, groupId) {
  const [formData, setFormData] = useState(createInitialState());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = groupId != null;

  useEffect(() => {
    if (!isOpen) return;

    if (isEditing) {
      setIsLoading(true);
      getCategoryGroupById(groupId)
        .then(data => setFormData({ name: data.name || '', description: data.description || '' }))
        .catch(() => toast.error("Falha ao carregar dados do grupo."))
        .finally(() => setIsLoading(false));
    } else {
      setFormData(createInitialState());
    }
  }, [isOpen, groupId, isEditing]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((onSuccess, onClose) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      let savedItem; // ✅ 1. Declara a variável para guardar o item salvo
      if (isEditing) {
        savedItem = await updateCategoryGroup(groupId, formData);
        toast.success(`Grupo de categoria salvo com sucesso!`);
      } else {
        savedItem = await createCategoryGroup(formData); // ✅ 2. Captura o retorno da criação
        toast.success(`Grupo de categoria salvo com sucesso!`);
      }
      onSuccess(savedItem); // ✅ 3. Passa o item salvo para a função de sucesso
      onClose();
    } catch (error) {
      if (error.response?.status === 400) setErrors(error.response.data);
      handleApiError(error, "Não foi possível salvar o grupo.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, groupId]);

  return { formData, isLoading, isSubmitting, isEditing, errors, handleChange, handleSubmit };
}