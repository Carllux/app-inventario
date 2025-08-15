import React, { useState, useEffect } from 'react';
import axios from 'axios';
import classNames from 'classnames'; // Importe a biblioteca
import styles from './ItemFormModal.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function ItemFormModal({ isOpen, onClose, onSuccess }) {
  // --- A LÓGICA INTERNA (useState, useEffect, handlers) CONTINUA A MESMA ---
  const [formData, setFormData] = useState({
    sku: '', name: '', category: '', supplier: '', status: 'ACTIVE',
    brand: '', purchase_price: '0.00', sale_price: '0.00',
    unit_of_measure: 'Peça', minimum_stock_level: 10,
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        } finally {
          setIsLoading(false);
        }
      };
      fetchDropdownData();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Enviando dados do item:", formData);
    // onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={classNames('card', styles.content)} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Adicionar Novo Item ao Catálogo</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {isLoading && <p className="text-center text-muted">Carregando...</p>}
        
        {!isLoading && (
          <form onSubmit={handleSubmit} className={styles.form}>
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
              <button type="submit" className="button button-primary">Salvar Item</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ItemFormModal;