import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { createMovement } from '../services/inventoryService';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function MovementFormModal({ isOpen, onClose, onSuccess, selectedItem }) {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    item: '',
    location: '',
    quantity_change: 0,
    movement_type: 'ENTRY',
    notes: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Inicializa o formulário com o item selecionado (se existir)
      setFormData({
        item: selectedItem ? selectedItem.id : '',
        location: '',
        quantity_change: 0,
        movement_type: 'ENTRY',
        notes: ''
      });

      const fetchData = async () => {
        try {
          const [itemsResponse, locationsResponse] = await Promise.all([
            axios.get(`${API_URL}/api/items/`),
            axios.get(`${API_URL}/api/locations/`)
          ]);
          setItems(itemsResponse.data.results || itemsResponse.data);
          setLocations(locationsResponse.data.results || locationsResponse.data);
        } catch (err) {
          setError("Falha ao carregar dados para o formulário.");
          console.error(err);
        }
      };
      fetchData();
    }
  }, [isOpen, selectedItem]); // Adicionado selectedItem como dependência

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const dataToSend = {
        ...formData,
        item: parseInt(formData.item, 10),
        location: parseInt(formData.location, 10),
        quantity_change: parseInt(formData.quantity_change, 10)
      };
      
      await createMovement(dataToSend);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Movimentação</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        
        {error && <p className="login-error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="item">Item</label>
            <select 
              id="item" 
              name="item" 
              value={formData.item} 
              onChange={handleChange} 
              required
              disabled={!!selectedItem}
            >
              <option value="">Selecione um item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} (SKU: {item.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">Local</label>
            <select 
              id="location" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              required
            >
              <option value="">Selecione um local</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="movement_type">Tipo de Movimentação</label>
            <select 
              id="movement_type" 
              name="movement_type" 
              value={formData.movement_type} 
              onChange={handleChange} 
              required
            >
              <option value="ENTRY">Entrada (Compra)</option>
              <option value="EXIT">Saída (Venda)</option>
              <option value="INTERNAL">Uso Interno</option>
              <option value="ADJUSTMENT">Ajuste</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity_change">Quantidade</label>
            <input 
              id="quantity_change"
              name="quantity_change"
              type="number" 
              value={formData.quantity_change}
              onChange={handleChange}
              required 
            />
            <small>Use números positivos para entradas e negativos para saídas.</small>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas (Opcional)</label>
            <textarea 
              id="notes" 
              name="notes" 
              rows="3"
              value={formData.notes}
              onChange={handleChange}
            ></textarea>
          </div>

          <button type="submit" className="button button-primary">Registrar</button>
        </form>
      </div>
    </div>
  );
}

export default MovementFormModal;