// frontend/src/hooks/useMovementTypeForm.js
import { useState, useEffect, useCallback } from 'react';
import { getMovementTypeById, createMovementType, updateMovementType, getMovementTypes } from '../services/movementTypeService';
import api from '../services/api'; // Usaremos para buscar os grupos de usuários
import { handleApiError } from '../utils/errorUtils';
import toast from 'react-hot-toast';

// Estado inicial completo baseado no models.py
const createInitialState = () => ({
  code: '',
  name: '',
  description: '',
  factor: 1, // Padrão: Adicionar ao Estoque
  units_per_package: null,
  category: 'IN', // Padrão: Entrada
  document_type: 'NF', // Padrão: Nota Fiscal
  parent_type: '',
  requires_approval: false,
  affects_finance: true,
  is_locked: false,
  is_active: true,
  allowed_for_groups: [], // Armazenará os IDs dos grupos
});

export function useMovementTypeForm(isOpen, movementTypeId) {
  const [formData, setFormData] = useState(createInitialState());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const isEditing = !!movementTypeId;

  // Estados para os dados dos dropdowns
  const [parentTypeOptions, setParentTypeOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    // Busca os dados para os dropdowns em paralelo
    const fetchDropdownData = async () => {
      try {
        const [tposResponse, groupsResponse] = await Promise.all([
          getMovementTypes(), // Lista de TPOs para o campo "Tipo Pai"
          api.get('/groups/') // Endpoint genérico do DRF para grupos
        ]);
        setParentTypeOptions(tposResponse.results || []);
        setGroupOptions(groupsResponse.data || []);
      } catch {
        toast.error("Falha ao carregar opções para o formulário.");
      }
    };

    const fetchMovementType = async () => {
      if (isEditing) {
        try {
          const data = await getMovementTypeById(movementTypeId);
          setFormData({
            code: data.code || '',
            name: data.name || '',
            description: data.description || '',
            factor: data.factor || 1,
            units_per_package: data.units_per_package || '',
            category: data.category || 'IN',
            document_type: data.document_type || 'NF',
            parent_type: data.parent_type_id || '', // Assumindo que o serializer retorne o ID
            requires_approval: data.requires_approval || false,
            affects_finance: data.affects_finance || true,
            is_locked: data.is_locked || false,
            is_active: data.is_active || true,
            allowed_for_groups: data.allowed_for_groups || [],
          });
        } catch {
          toast.error("Falha ao carregar dados do Tipo de Movimento.");
        }
      } else {
        setFormData(createInitialState());
      }
    };

    // Executa tudo e finaliza o loading
    Promise.all([fetchDropdownData(), fetchMovementType()]).finally(() => setIsLoading(false));

  }, [isOpen, movementTypeId, isEditing]);

  // Handler de mudança genérico que funciona para inputs, selects e checkboxes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  // Handler específico para o multi-select de grupos
  const handleGroupsChange = useCallback((e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, allowed_for_groups: selectedOptions }));
  }, []);

  const handleSubmit = useCallback((onSuccess, onClose) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const payload = { ...formData, units_per_package: formData.units_per_package || null };
      const action = isEditing ? updateMovementType(movementTypeId, payload) : createMovementType(payload);
      const savedItem = await action;
      toast.success(`Tipo de Movimento salvo com sucesso!`);
      onSuccess(savedItem);
      onClose();
    } catch (error) {
      if (error.response?.status === 400) setErrors(error.response.data);
      handleApiError(error, "Não foi possível salvar o Tipo de Movimento.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditing, movementTypeId]);

  return {
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
  };
}