import { useState, useEffect } from 'react';
import axios from 'axios';
import { createItem, updateItem, getItemById } from '../services/itemService';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const INITIAL_FORM_STATE = {
  sku: '', name: '', category: '', supplier: '', status: 'ACTIVE',
  purchase_price: '0.00', sale_price: '0.00', minimum_stock_level: 10,
};

export function useItemForm(isOpen, itemId, onSuccess) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = itemId != null;

  // Efeito 1: Busca dados dos dropdowns (categorias, fornecedores)
  useEffect(() => {
    if (isOpen) {
      const fetchDropdownData = async () => {
        setIsLoading(true);
        try {
          const [catRes, supRes] = await Promise.all([
            axios.get(`${API_URL}/api/categories/`),
            axios.get(`${API_URL}/api/suppliers/`),
          ]);
          setCategories(catRes.data.results || catRes.data);
          setSuppliers(supRes.data.results || supRes.data);
        } catch (err) {
          setError("Falha ao carregar opções do formulário.");
        }
        // Não definimos setIsLoading(false) aqui
      };
      fetchDropdownData();
    }
  }, [isOpen]);

  // Efeito 2: Busca os dados do item para edição OU reseta o formulário
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        const fetchItemData = async () => {
          try {
            const itemData = await getItemById(itemId);
            setFormData({
              sku: itemData.sku,
              name: itemData.name,
              category: itemData.category?.id || '',
              supplier: itemData.supplier?.id || '',
              status: itemData.status,
              purchase_price: itemData.purchase_price,
              sale_price: itemData.sale_price,
              minimum_stock_level: itemData.minimum_stock_level,
            });
          } catch (err) {
            setError("Falha ao carregar dados do item.");
          } finally {
            setIsLoading(false); // isLoading termina aqui
          }
        };
        fetchItemData();
      } else {
        // Modo de criação: apenas reseta e finaliza o loading
        setFormData(INITIAL_FORM_STATE);
        setIsLoading(false);
      }
    }
  }, [isOpen, itemId, isEditMode, categories, suppliers]); // Depende dos dados dos dropdowns

  const handleChange = (e) => { /* ... */ };
  const handleSubmit = async (e) => { /* ... */ };

  return {
    formData, error, isLoading, isSubmitting, categories, suppliers,
    isEditMode, handleChange, handleSubmit
  };
}