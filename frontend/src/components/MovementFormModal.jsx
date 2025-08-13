import React from 'react';
import { useMovementForm } from '../hooks/useMovementForm';
// 1. Importe os estilos do módulo
import styles from './MovementFormModal.module.css';

function MovementFormModal({ isOpen, onClose, onSuccess, selectedItem }) {
  const {
    formData, operationType, error, isLoading, items, locations,
    filteredMovementTypes, setOperationType, handleChange, handleSubmit
  } = useMovementForm(isOpen, selectedItem);

  if (!isOpen) return null;

  const selectedTPO = filteredMovementTypes.find(t => t.id == formData.movement_type);
  const quantityLabel = selectedTPO?.units_per_package ? 'Número de Pacotes' : 'Quantidade';

  return (
    // 2. Aplique as classes do módulo
    <div className={styles.backdrop} onClick={onClose}>
      {/* Combinamos a classe global .card com a nossa classe local .content */}
      <div className={`card ${styles.content}`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Registrar Movimentação</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        
        {error && <p className={styles.error}>{error}</p>}
        {isLoading && <p>Carregando opções...</p>}
        
        {!isLoading && (
          <form onSubmit={(e) => handleSubmit(e, onSuccess, onClose)}>
            
            {/* Note que .form-group e .button são classes GLOBAIS do index.css */}
            <div className="form-group">
              <label className="form-label" htmlFor="item">Item</label>
              <select id="item" name="item" value={formData.item} onChange={handleChange} required disabled={!!selectedItem}>
                <option value="">Selecione um item</option>
                {items.map(item => <option key={item.id} value={item.id}>{item.name} (SKU: {item.sku})</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Natureza da Operação</label>
              <select value={operationType} onChange={(e) => setOperationType(e.target.value)}>
                <option value="ENTRY">Entrada</option>
                <option value="EXIT">Saída</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="movement_type">Tipo de Movimentação (TPO)</label>
              <select id="movement_type" name="movement_type" value={formData.movement_type} onChange={handleChange} required>
                <option value="">Selecione um tipo</option>
                {filteredMovementTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="quantity">{quantityLabel}</label>
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
              <label className="form-label" htmlFor="location">Local de Destino/Origem</label>
              <select id="location" name="location" value={formData.location} onChange={handleChange} required>
                <option value="">Selecione um local</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">Notas (Opcional)</label>
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