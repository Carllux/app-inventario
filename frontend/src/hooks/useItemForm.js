// frontend/src/hooks/useItemForm.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; // ✅ 1. Importar a instância 'api'
import { createItem, updateItem, getItemById } from '../services/itemService';
import { toast } from 'react-hot-toast';

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
  origin: 'BR', // O valor inicial deve ser uma string vazia
  cfop: '',
  ean: '',
});

export function useItemForm(isOpen, itemId) { // onSuccess e onClose podem ser removidos dos argumentos diretos
  const isEditMode = itemId != null;
  const [formData, setFormData] = useState(createInitialFormState());
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');


  useEffect(() => {
    if (!isOpen) {
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
        // ✅ 1. Usar a instância 'api' para garantir a autenticação
        const [catRes, supRes] = await Promise.all([
          api.get('/categories/'),
          api.get('/suppliers/'),
        ]);
        setCategories(catRes.data.results || catRes.data);
        setSuppliers(supRes.data.results || supRes.data);

        if (isEditMode) {
          const itemData = await getItemById(itemId);
          const initialData = createInitialFormState();

          Object.keys(initialData).forEach(key => {
            if (itemData[key] === null || itemData[key] === undefined) return;

            // ✅ 2. Tratar todos os campos de relação e o campo de país
            if (key === 'category' || key === 'supplier' || key === 'branch') {
              initialData[key] = itemData[key]?.id || '';
            } else if (key === 'origin') {
              initialData[key] = itemData[key]?.code || ''; // Pega o .code para o país
            } else {
              initialData[key] = itemData[key];
            }
          });
          
          setFormData(initialData);
          if (itemData.photo) {
            setPhotoPreview(itemData.photo);
          }
        } else {
          setFormData(createInitialFormState());
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

  // ✅ 3. Otimizado: remove 'formData' e 'photo' das dependências
  const handleSubmit = useCallback((onSuccess, onClose) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value);
        }
      });

      if (photo) {
        formDataToSend.append('photo', photo);
      }

      let savedItem;
      if (isEditMode) {
        savedItem = await updateItem(itemId, formDataToSend);
        toast.success(`Item "${savedItem.name}" atualizado com sucesso!`);
      } else {
        savedItem = await createItem(formDataToSend);
        toast.success(`Item "${savedItem.name}" criado com sucesso!`);
      }
      
      onSuccess();
      onClose();
      
    } catch (err) {
      setError(err.message || "Erro ao salvar o item");
      toast.error(err.message || "Ocorreu um erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEditMode, itemId, photo]); // Dependências estáveis

  return {
    formData, error, isLoading, isSubmitting, categories, suppliers,
    isEditMode, photoPreview, handleChange, handlePhotoChange, handleSubmit
  };
}