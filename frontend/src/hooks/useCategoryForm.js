// frontend/src/hooks/useCategoryForm.js
import { useState, useEffect, useCallback } from 'react';
import { getCategoryById, createCategory, updateCategory } from '../services/categoryService';
import { getCategoryGroups } from '../services/categoryGroupService'; // ✅ Importa o serviço de grupos
import { handleApiError } from '../utils/errorUtils';
import toast from 'react-hot-toast';

const createInitialState = () => ({
  name: '',
  description: '',
  group: '', // Armazenará o ID do grupo
});

export function useCategoryForm(isOpen, categoryId) {
  const [formData, setFormData] = useState(createInitialState());
  const [groups, setGroups] = useState([]); // ✅ Estado para a lista de grupos
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const isEditing = !!categoryId;

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    // Busca a lista de grupos para o dropdown
    getCategoryGroups()
      .then(data => setGroups(data.results || []))
      .catch(() => toast.error("Falha ao carregar grupos de categoria."));

    if (isEditing) {
      getCategoryById(categoryId)
        .then(data => setFormData({ 
            name: data.name || '', 
            description: data.description || '',
            group: data.group_id || '' // Assumindo que o serializer de edição retorne 'group_id'
        }))
        .catch(() => toast.error("Falha ao carregar dados da categoria."))
        .finally(() => setIsLoading(false));
    } else {
      setFormData(createInitialState());
      setIsLoading(false);
    }
  }, [isOpen, categoryId, isEditing]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((onSuccess, onClose) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      let savedItem; // ✅ 1. Declara a variável
      if (isEditing) {
        savedItem = await updateCategory(categoryId, formData);
      } else {
        savedItem = await createCategory(formData); // ✅ 2. Captura o retorno
      }
      toast.success(`Categoria salva com sucesso!`);
      onSuccess(savedItem); // ✅ 3. Passa o item salvo
      onClose();
    } catch (error) {
      if (error.response?.status === 400) setErrors(error.response.data);
      handleApiError(error, "Não foi possível salvar a categoria.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, categoryId]);

  return { formData, groups, isLoading, isSubmitting, isEditing, errors, handleChange, handleSubmit };
}