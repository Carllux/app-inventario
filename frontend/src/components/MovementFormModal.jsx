import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createMovement } from '../services/inventoryService';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function MovementFormModal({ isOpen, onClose, onSuccess, selectedItem }) {
  // --- ESTADOS DO COMPONENTE ---
  const [formData, setFormData] = useState({
    item: '',
    location: '',
    movement_type: '',
    quantity: 1,
    notes: ''
  });

  // Estados para popular os dropdowns
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allMovementTypes, setAllMovementTypes] = useState([]);
  
  // Estados para a lógica do formulário
  const [operationType, setOperationType] = useState('ENTRY'); // 'ENTRY' ou 'EXIT'
  const [filteredMovementTypes, setFilteredMovementTypes] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- EFEITOS (LÓGICA) ---

  // 1. Busca todos os dados necessários quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
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
      
      // Reseta o formulário com o item pré-selecionado, se houver
      setFormData({
        item: selectedItem ? selectedItem.id : '',
        location: '',
        movement_type: '',
        quantity: 1,
        notes: ''
      });
      setOperationType('ENTRY');
      setError('');
    }
  }, [isOpen, selectedItem]);

  // 2. Filtra os TPOs dinamicamente quando a operação (Entrada/Saída) muda
  useEffect(() => {
    const factor = operationType === 'ENTRY' ? 1 : -1;
    const filtered = allMovementTypes.filter(type => type.factor === factor);
    setFilteredMovementTypes(filtered);
    // Reseta o TPO selecionado ao mudar o filtro
    setFormData(prev => ({ ...prev, movement_type: '' }));
  }, [operationType, allMovementTypes]);

  // --- HANDLERS (AÇÕES) ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const selectedTPO = allMovementTypes.find(t => t.id == formData.movement_type);
    if (!selectedTPO) {
        setError('Por favor, selecione um tipo de movimentação válido.');
        return;
    }

    // Lógica do multiplicador!
    const finalQuantity = (selectedTPO.units_per_package || 1) * formData.quantity;

    const dataToSend = {
      item: parseInt(formData.item, 10),
      location: parseInt(formData.location, 10),
      movement_type: parseInt(formData.movement_type, 10),
      quantity: finalQuantity, // Enviamos a quantidade final calculada
      notes: formData.notes
    };

    try {
      await createMovement(dataToSend);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  // --- RENDERIZAÇÃO ---

  if (!isOpen) return null;

  const selectedTPO = allMovementTypes.find(t => t.id == formData.movement_type);
  const quantityLabel = selectedTPO?.units_per_package ? `Número de Pacotes/Caixas` : 'Quantidade';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Movimentação</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        
        {error && <p className="login-error">{error}</p>}
        {isLoading && <p>Carregando opções...</p>}
        
        {!isLoading && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="item">Item</label>
              <select id="item" name="item" value={formData.item} onChange={handleChange} required disabled={!!selectedItem}>
                <option value="">Selecione um item</option>
                {items.map(item => <option key={item.id} value={item.id}>{item.name} (SKU: {item.sku})</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Natureza da Operação</label>
              <select value={operationType} onChange={(e) => setOperationType(e.target.value)}>
                <option value="ENTRY">Entrada</option>
                <option value="EXIT">Saída</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="movement_type">Tipo de Movimentação (TPO)</label>
              <select id="movement_type" name="movement_type" value={formData.movement_type} onChange={handleChange} required>
                <option value="">Selecione um tipo</option>
                {filteredMovementTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">{quantityLabel}</label>
              <input 
                id="quantity"
                name="quantity"
                type="number" 
                value={formData.quantity}
                onChange={handleChange}
                required 
                min="1"
              />
              {selectedTPO?.units_per_package && (
                <small>
                  Total: {formData.quantity || 0} x {selectedTPO.units_per_package} = <strong>{(formData.quantity || 0) * selectedTPO.units_per_package} unidades</strong>
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="location">Local de Destino/Origem</label>
              <select id="location" name="location" value={formData.location} onChange={handleChange} required>
                <option value="">Selecione um local</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notas (Opcional)</label>
              <textarea id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange}></textarea>
            </div>

            <button type="submit" className="button button-primary">Registrar Movimentação</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default MovementFormModal;