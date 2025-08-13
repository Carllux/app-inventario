import { useState, useEffect } from 'react';
import axios from 'axios';
import { createMovement } from '../services/inventoryService';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function useMovementForm(isOpen, selectedItem) {
  const [formData, setFormData] = useState({
    item: '',
    location: '',
    movement_type: '',
    quantity: 1,
    notes: ''
  });
  const [operationType, setOperationType] = useState('ENTRY');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allMovementTypes, setAllMovementTypes] = useState([]);
  const [filteredMovementTypes, setFilteredMovementTypes] = useState([]);

  // Efeito para buscar todos os dados necessários quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError('');
      
      // ✅ A LÓGICA QUE VOCÊ PERGUNTOU ESTÁ AQUI DENTRO
      // Reseta o formulário para seu estado inicial
      setFormData({
        item: selectedItem ? selectedItem.id : '',
        location: '',
        movement_type: '',
        quantity: 1,
        notes: ''
      });
      setOperationType('ENTRY');
      
      const fetchData = async () => {
        try {
          const [itemsRes, locationsRes, moveTypesRes] = await Promise.all([
            axios.get(`${API_URL}/api/items/`),
            axios.get(`${API_URL}/api/locations/`),
            axios.get(`${API_URL}/api/movement-types/`)
          ]);
          setItems(itemsRes.data.results || itemsRes.data);
          setLocations(locationsRes.data.results || locationsRes.data);
          setAllMovementTypes(moveTypesRes.data.results || moveTypesRes.data);
        } catch (err) {
          setError("Falha ao carregar dados para o formulário.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, selectedItem]);

  // Efeito para filtrar os TPOs
  useEffect(() => {
    const factor = operationType === 'ENTRY' ? 1 : -1;
    const filtered = allMovementTypes.filter(type => type.factor === factor);
    setFilteredMovementTypes(filtered);
    setFormData(prev => ({ ...prev, movement_type: '' }));
  }, [operationType, allMovementTypes]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, onSuccess, onClose) => {
    e.preventDefault();
    setError('');
    // ... (sua lógica de handleSubmit que já tínhamos)
    try {
        const selectedTPO = allMovementTypes.find(t => t.id == formData.movement_type);
        const finalQuantity = (selectedTPO?.units_per_package || 1) * formData.quantity;
        const dataToSend = {
            item: parseInt(formData.item, 10),
            location: parseInt(formData.location, 10),
            movement_type: parseInt(formData.movement_type, 10),
            quantity: finalQuantity,
            notes: formData.notes
        };
        await createMovement(dataToSend);
        onSuccess();
        onClose();
    } catch (err) {
        setError(err.message);
    }
  };

  // O hook retorna um objeto com todos os estados e funções que o componente precisa
  return {
    formData, operationType, error, isLoading, items, locations,
    filteredMovementTypes, setOperationType, handleChange, handleSubmit
  };
}