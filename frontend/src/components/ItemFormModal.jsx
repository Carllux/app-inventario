import React from 'react';
import classNames from 'classnames';
import { useItemForm } from '../hooks/useItemForm'; // Importa o hook
import styles from './ItemFormModal.module.css';

function ItemFormModal({ isOpen, onClose, onSuccess, itemId }) {
  // Chamamos o hook e pegamos tudo o que precisamos
  const {
    formData, error, isLoading, isSubmitting, categories, suppliers,
    isEditMode, handleChange, handleSubmit
  } = useItemForm(isOpen, itemId, onSuccess);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={classNames('card', styles.content)} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{isEditMode ? 'Editar Item' : 'Adicionar Novo Item ao Catálogo'}</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {isLoading && <p className="text-center text-muted">Carregando...</p>}
        
        {!isLoading && (
          <form onSubmit={(e) => handleSubmit(e, onSuccess, onClose)} className={styles.form}>
            <fieldset>
              <legend>Informações Principais</legend>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sku">SKU</label>
                  <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Nome do Item</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="short_description">Descrição Curta</label>
                <input type="text" id="short_description" name="short_description" value={formData.short_description} onChange={handleChange} />
              </div>
            </fieldset>

            <fieldset>
              <legend>Classificação</legend>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="category">Categoria</label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Selecione...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="supplier">Fornecedor</label>
                  <select id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} required>
                    <option value="">Selecione...</option>
                    {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend>Preços e Estoque</legend>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="purchase_price">Preço de Compra</label>
                  <input type="number" step="0.01" id="purchase_price" name="purchase_price" value={formData.purchase_price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sale_price">Preço de Venda</label>
                  <input type="number" step="0.01" id="sale_price" name="sale_price" value={formData.sale_price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="minimum_stock_level">Estoque Mínimo</label>
                  <input type="number" id="minimum_stock_level" name="minimum_stock_level" value={formData.minimum_stock_level} onChange={handleChange} required />
                </div>
              </div>
            </fieldset>
            
            <div className={styles.formActions}>
              <button type="button" className="button button-outline" onClick={onClose}>Cancelar</button>
              <button type="submit" className="button button-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Item'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ItemFormModal;