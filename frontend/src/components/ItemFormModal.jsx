// frontend\src\components\ItemFormModal.jsx
import React from 'react';
import classNames from 'classnames';
import { useItemForm } from '../hooks/useItemForm';
import styles from './ItemFormModal.module.css';
import CountrySelect from './CountrySelect';
import FormGroup from './FormGroup';

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

  const handleCountryChange = (value) => {
    handleChange({ target: { name: 'origin', value } });
  };

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
                <FormGroup label="Upload de Imagem">
                  <input 
                    type="file" 
                    name="photo" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                  />
                </FormGroup>
              </div>
            </fieldset>

            {/* Informações Principais */}
            <fieldset>
              <legend>Informações Principais</legend>
              <div className={styles.formRow}>
                <FormGroup label="SKU">
                  <input 
                    type="text" 
                    name="sku" 
                    value={formData.sku} 
                    onChange={handleChange} 
                    required 
                  />
                </FormGroup>
                <FormGroup label="Nome do Item">
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </FormGroup>
              </div>
              
              <div className={styles.formRow}>
                <FormGroup label="Status">
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                </FormGroup>
                <FormGroup label="Unidade de Medida">
                  <input 
                    type="text" 
                    name="unit_of_measure" 
                    value={formData.unit_of_measure} 
                    onChange={handleChange} 
                    required 
                  />
                </FormGroup>
              </div>

              <FormGroup label="Descrição Curta">
                <input 
                  type="text" 
                  name="short_description" 
                  value={formData.short_description} 
                  onChange={handleChange} 
                />
              </FormGroup>
              <FormGroup label="Descrição Longa">
                <textarea 
                  name="long_description" 
                  value={formData.long_description} 
                  onChange={handleChange} 
                  rows="3" 
                />
              </FormGroup>
            </fieldset>

            {/* Classificação e Códigos */}
            <fieldset>
              <legend>Classificação e Códigos</legend>
              <div className={styles.formRow}>
                <FormGroup label="Categoria">
                  <select 
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
                </FormGroup>
                <FormGroup label="Fornecedor">
                  <select 
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
                </FormGroup>
              </div>

              <div className={styles.formRow}>
                <FormGroup label="Marca">
                  <input 
                    type="text" 
                    name="brand" 
                    value={formData.brand} 
                    onChange={handleChange} 
                  />
                </FormGroup>
                <FormGroup label="Cód. Interno">
                  <input 
                    type="text" 
                    name="internal_code" 
                    value={formData.internal_code} 
                    onChange={handleChange} 
                  />
                </FormGroup>
              </div>

              <div className={styles.formRow}>
                <FormGroup label="Cód. Fabricante">
                  <input 
                    type="text" 
                    name="manufacturer_code" 
                    value={formData.manufacturer_code} 
                    onChange={handleChange} 
                  />
                </FormGroup>
                <FormGroup label="CFOP">
                  <input 
                    type="text" 
                    name="cfop" 
                    value={formData.cfop} 
                    onChange={handleChange} 
                  />
                </FormGroup>
              </div>
            </fieldset>

            {/* Informações Adicionais */}
            <fieldset>
              <legend>Informações Adicionais</legend>
              <div className={styles.formRow}>
                <FormGroup label="País de Origem">
                  <CountrySelect
                    // ✅ 1. Passe o 'name' correto correspondente ao campo do estado 'formData'
                    name="origin"           
                    value={formData.origin}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </FormGroup>
                <FormGroup label="Peso (kg)">
                  <input 
                    type="number" 
                    step="0.01" 
                    name="weight" 
                    value={formData.weight} 
                    onChange={handleChange} 
                  />
                </FormGroup>
              </div>
            </fieldset>

            {/* Preços e Estoque */}
            <fieldset>
              <legend>Preços e Estoque</legend>
              <div className={styles.formRow}>
                <FormGroup label="Preço de Compra">
                  <input 
                    type="number" 
                    step="0.01" 
                    name="purchase_price" 
                    value={formData.purchase_price} 
                    onChange={handleChange} 
                    required 
                  />
                </FormGroup>
                <FormGroup label="Preço de Venda">
                  <input 
                    type="number" 
                    step="0.01" 
                    name="sale_price" 
                    value={formData.sale_price} 
                    onChange={handleChange} 
                    required 
                  />
                </FormGroup>
                <FormGroup label="Estoque Mínimo">
                  <input 
                    type="number" 
                    name="minimum_stock_level" 
                    value={formData.minimum_stock_level} 
                    onChange={handleChange} 
                    required 
                  />
                </FormGroup>
              </div>
            </fieldset>

            {/* Ações do Formulário */}
            <div className="modal-footer">
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