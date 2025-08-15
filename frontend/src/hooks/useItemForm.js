// frontend/src/hooks/useItemForm.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { createItem, updateItem, getItemById } from '../services/itemService';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ✅ FUNÇÃO GERADORA: Cria um objeto de formulário limpo e completo.
const createInitialFormState = () => ({
  sku: '',
  name: '',
  category: '',
  supplier: '',
  status: 'ACTIVE',
  brand: '',
  purchase_price: '0.00',
  sale_price: '0.00',
  unit_of_measure: 'Peça',
  minimum_stock_level: 10,
  short_description: '', // Garante que todos os campos estejam presentes
  // Adicione aqui quaisquer outros campos do formulário
});

export function useItemForm(isOpen, itemId, onSuccess) {
  // ✅ USA A FUNÇÃO GERADORA
  const [formData, setFormData] = useState(createInitialFormState());
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = itemId != null;

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setError('');

    const fetchDependencies = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          axios.get(`${API_URL}/api/categories/`),
          axios.get(`${API_URL}/api/suppliers/`),
        ]);
        setCategories(catRes.data.results || catRes.data);
        setSuppliers(supRes.data.results || supRes.data);

        if (isEditMode) {
          const itemData = await getItemById(itemId);
          // ✅ MAPEAMENTO DINÂMICO: Preenche o formulário apenas com as chaves que ele já conhece.
          const initialData = createInitialFormState();
          Object.keys(initialData).forEach(key => {
            if (key === 'category' || key === 'supplier') {
              initialData[key] = itemData[key]?.id || '';
            } else if (itemData[key] !== null && itemData[key] !== undefined) {
              initialData[key] = itemData[key];
            }
          });
          setFormData(initialData);
        } else {
          setFormData(createInitialFormState()); // Reseta para o estado limpo
        }

      } catch (err) {
        setError("Falha ao carregar dados para o formulário.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDependencies();
  }, [isOpen, itemId, isEditMode]);
  
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("2. Tentando enviar os seguintes dados:", formData); // PONTO DE DEBUG 2

    setError('');
    try {
      if (isEditMode) {
        await updateItem(itemId, formData);
      } else {
        await createItem(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditMode, itemId, onSuccess]);

  return {
    formData, error, isLoading, isSubmitting, categories, suppliers,
    isEditMode, handleChange, handleSubmit
  };
}