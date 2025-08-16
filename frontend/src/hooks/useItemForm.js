// frontend/src/hooks/useItemForm.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { createItem, updateItem, getItemById } from '../services/itemService';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Função geradora: Cria um objeto de formulário limpo e completo
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
  short_description: '',
  long_description: '',
  internal_code: '',
  manufacturer_code: '',
  weight: '',
  origin: '',
  cfop: '',
  // Adicione aqui quaisquer outros campos do formulário
});

export function useItemForm(isOpen, itemId, onSuccess) {
  const [formData, setFormData] = useState(createInitialFormState());
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const isEditMode = itemId != null;

  useEffect(() => {
    if (!isOpen) {
      // Limpa os estados quando o modal é fechado
      setFormData(createInitialFormState());
      setError('');
      setPhoto(null);
      setPhotoPreview('');
      return;
    }

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
          // Mapeamento dinâmico para preencher todos os campos
          const initialData = createInitialFormState();
          Object.keys(initialData).forEach(key => {
            if (key === 'category' || key === 'supplier') {
              initialData[key] = itemData[key]?.id || '';
            } else if (itemData[key] !== null && itemData[key] !== undefined) {
              initialData[key] = itemData[key];
            }
          });
          
          setFormData(initialData);
          if (itemData.photo) {
            setPhotoPreview(itemData.photo);
          }
        } else {
          setFormData(createInitialFormState()); // Reseta para o estado limpo
        }

      } catch (err) {
        setError("Falha ao carregar dados para o formulário.");
        console.error("Erro ao carregar dependências:", err);
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

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback((onSuccess, onClose) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Envia o campo apenas se não for nulo ou indefinido
        if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value);
        }
      });
      if (photo) {
        formDataToSend.append('photo', photo);
      }

      if (isEditMode) {
        await updateItem(itemId, formDataToSend);
      } else {
        await createItem(formDataToSend);
      }
      
      onSuccess(); // Chama o callback de sucesso da página
      onClose();   // Chama o callback para fechar o modal
      
    } catch (err) {
      setError(err.message || "Erro ao salvar o item");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, photo, isEditMode, itemId]); // onSuccess e onClose saem das dependências


  return {
    formData,
    error,
    isLoading,
    isSubmitting,
    categories,
    suppliers,
    isEditMode,
    photoPreview,
    handleChange,
    handlePhotoChange,
    handleSubmit
  };
}