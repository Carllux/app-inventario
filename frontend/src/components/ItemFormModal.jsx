import React from 'react';
import classNames from 'classnames';
import { useItemForm } from '../hooks/useItemForm';
import styles from './ItemFormModal.module.css';

function ItemFormModal({ isOpen, onClose, onSuccess, itemId }) {
  const {
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
  } = useItemForm(isOpen, itemId);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={classNames('card', styles.content)} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{isEditMode ? 'Editar Item' : 'Adicionar Novo Item'}</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {isLoading && <div className="text-center text-muted">Carregando...</div>}

        {!isLoading && (
          <form onSubmit={handleSubmit(onSuccess, onClose)} className={styles.form}>
            {/* Seção de Foto */}
            <fieldset>
              <legend>Imagem do Produto</legend>
              <div className={styles.photoSection}>
                {photoPreview && (
                  <div className={styles.photoPreview}>
                    <img src={photoPreview} alt="Preview" className={styles.photoImage} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="photo">Upload de Imagem</label>
                  <input 
                    type="file" 
                    id="photo" 
                    name="photo" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                  />
                </div>
              </div>
            </fieldset>

            {/* Informações Principais */}
            <fieldset>
              <legend>Informações Principais</legend>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sku">SKU</label>
                  <input 
                    type="text" 
                    id="sku" 
                    name="sku" 
                    value={formData.sku} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Nome do Item</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="status">Status</label>
                  <select 
                    id="status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="unit_of_measure">Unidade de Medida</label>
                  <input 
                    type="text" 
                    id="unit_of_measure" 
                    name="unit_of_measure" 
                    value={formData.unit_of_measure} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="short_description">Descrição Curta</label>
                <input 
                  type="text" 
                  id="short_description" 
                  name="short_description" 
                  value={formData.short_description} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="long_description">Descrição Longa</label>
                <textarea 
                  id="long_description" 
                  name="long_description" 
                  value={formData.long_description} 
                  onChange={handleChange} 
                  rows="3" 
                />
              </div>
            </fieldset>

            {/* Classificação e Códigos */}
            <fieldset>
              <legend>Classificação e Códigos</legend>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="category">Categoria</label>
                  <select 
                    id="category" 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="supplier">Fornecedor</label>
                  <select 
                    id="supplier" 
                    name="supplier" 
                    value={formData.supplier} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">Selecione...</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="brand">Marca</label>
                  <input 
                    type="text" 
                    id="brand" 
                    name="brand" 
                    value={formData.brand} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="internal_code">Cód. Interno</label>
                  <input 
                    type="text" 
                    id="internal_code" 
                    name="internal_code" 
                    value={formData.internal_code} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="manufacturer_code">Cód. Fabricante</label>
                  <input 
                    type="text" 
                    id="manufacturer_code" 
                    name="manufacturer_code" 
                    value={formData.manufacturer_code} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cfop">CFOP</label>
                  <input 
                    type="text" 
                    id="cfop" 
                    name="cfop" 
                    value={formData.cfop} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </fieldset>

            {/* Informações Adicionais */}
            <fieldset>
              <legend>Informações Adicionais</legend>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="origin">País de Origem</label>
                  <input 
                    type="text" 
                    id="origin" 
                    name="origin" 
                    value={formData.origin} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="weight">Peso (kg)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    id="weight" 
                    name="weight" 
                    value={formData.weight} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </fieldset>

            {/* Preços e Estoque */}
            <fieldset>
              <legend>Preços e Estoque</legend>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="purchase_price">Preço de Compra</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    id="purchase_price" 
                    name="purchase_price" 
                    value={formData.purchase_price} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sale_price">Preço de Venda</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    id="sale_price" 
                    name="sale_price" 
                    value={formData.sale_price} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="minimum_stock_level">Estoque Mínimo</label>
                  <input 
                    type="number" 
                    id="minimum_stock_level" 
                    name="minimum_stock_level" 
                    value={formData.minimum_stock_level} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            </fieldset>

            {/* Ações do Formulário */}
            <div className={styles.formActions}>
              <button 
                type="button" 
                className="button button-outline" 
                onClick={onClose} 
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="button button-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Item')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default React.memo(ItemFormModal);